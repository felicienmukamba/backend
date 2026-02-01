import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountType } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate Balance Sheet (Bilan OHADA)
     * Assets vs Liabilities based on Account Classes 1-5
     */
    async getBalanceSheet(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        // Get all accounts with their balances for the fiscal year
        const accounts = await this.prisma.account.findMany({
            where: {
                accountClass: { in: [1, 2, 3, 4, 5] },
            },
            include: {
                entryLines: {
                    where: {
                        entry: {
                            fiscalYearId,
                            status: 'VALIDATED', // Only validated entries
                        },
                    },
                },
            },
        });

        // 1. Calculate balances for each account
        const accountBalances = accounts.map(account => {
            const debit = account.entryLines.reduce((sum, line) => sum + Number(line[debitField]), 0);
            const credit = account.entryLines.reduce((sum, line) => sum + Number(line[creditField]), 0);
            const signedBalance = debit - credit;

            return {
                ...account,
                debit,
                credit,
                signedBalance,
                absoluteBalance: Math.abs(signedBalance),
            };
        });

        // 2. Categorize into OHADA Sections
        const assets = {
            fixedAssets: [] as any[], // Class 2
            currentAssets: [] as any[], // Class 3 & Class 4 (Debit)
            cashAssets: [] as any[], // Class 5 (Debit)
            totalFixedAssets: 0,
            totalCurrentAssets: 0,
            totalCashAssets: 0,
            grandTotal: 0,
        };

        const liabilities = {
            equity: [] as any[], // Class 1 (Equity range)
            longTermDebt: [] as any[], // Class 1 (Debt range)
            currentLiabilities: [] as any[], // Class 4 (Credit)
            cashLiabilities: [] as any[], // Class 5 (Credit)
            totalEquity: 0,
            totalLongTermDebt: 0,
            totalCurrentLiabilities: 0,
            totalCashLiabilities: 0,
            grandTotal: 0,
        };

        for (const account of accountBalances) {
            if (account.absoluteBalance === 0) continue; // Skip zero balances

            // Class 2: Fixed Assets (Actif Immobilisé)
            if (account.accountClass === 2) {
                assets.fixedAssets.push(account);
                assets.totalFixedAssets += account.signedBalance; // Usually debit (+)
            }
            // Class 3: Stocks (Actif Circulant)
            else if (account.accountClass === 3) {
                assets.currentAssets.push(account);
                assets.totalCurrentAssets += account.signedBalance;
            }
            // Class 1: Equity & Long Term Debt
            else if (account.accountClass === 1) {
                // Heuristic: Accounts 10-15 are typically Equity, 16+ are Liabilities/Debt
                // Adjust strict ranges as per specific plan
                if (account.accountNumber.startsWith('16') || account.accountNumber.startsWith('17')) {
                    liabilities.longTermDebt.push(account);
                    liabilities.totalLongTermDebt += Math.abs(account.signedBalance);
                } else {
                    liabilities.equity.push(account);
                    // Equity is usually Credit (-), so we take absolute for presentation or specialized logic
                    // Conventionally presented as positive in Liabilities section
                    liabilities.totalEquity += Math.abs(account.signedBalance);
                }
            }
            // Class 4: Third Parties
            else if (account.accountClass === 4) {
                // Class 4 can be Asset or Liability depending on balance
                if (account.signedBalance > 0) {
                    // Debit Balance -> Asset (Receivables)
                    assets.currentAssets.push(account);
                    assets.totalCurrentAssets += account.signedBalance;
                } else {
                    // Credit Balance -> Liability (Payables)
                    liabilities.currentLiabilities.push(account);
                    liabilities.totalCurrentLiabilities += Math.abs(account.signedBalance);
                }
            }
            // Class 5: Cash (Trésorerie)
            else if (account.accountClass === 5) {
                if (account.signedBalance > 0) {
                    assets.cashAssets.push(account);
                    assets.totalCashAssets += account.signedBalance;
                } else {
                    liabilities.cashLiabilities.push(account);
                    liabilities.totalCashLiabilities += Math.abs(account.signedBalance);
                }
            }
        }

        // Calculate Grand Totals
        // Assets are naturally positive (Debits)
        assets.grandTotal = assets.totalFixedAssets + assets.totalCurrentAssets + assets.totalCashAssets;

        // Liabilities are sum of parts (all normalized to positive for display)
        liabilities.grandTotal = liabilities.totalEquity + liabilities.totalLongTermDebt + liabilities.totalCurrentLiabilities + liabilities.totalCashLiabilities;

        return {
            fiscalYearId,
            generatedAt: new Date(),
            assets,
            liabilities,
            isBalanced: Math.abs(assets.grandTotal - liabilities.grandTotal) < 1.0 // Tolerance
        };
    }

    /**
     * Generate Income Statement (Compte de Résultat OHADA)
     * Revenue vs Expenses (Classes 6, 7, 8)
     */
    async getProfitAndLoss(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        const accounts = await this.prisma.account.findMany({
            where: {
                accountClass: { in: [6, 7, 8] },
            },
            include: {
                entryLines: {
                    where: {
                        entry: {
                            fiscalYearId,
                            status: 'VALIDATED',
                        },
                    },
                },
            },
        });

        const accountBalances = accounts.map(account => {
            const debit = account.entryLines.reduce((sum, line) => sum + Number(line[debitField]), 0);
            const credit = account.entryLines.reduce((sum, line) => sum + Number(line[creditField]), 0);
            const signedBalance = credit - debit; // Revenue/Profit logic: Credit is positive

            return {
                ...account,
                debit,
                credit,
                signedBalance,
                absoluteBalance: Math.abs(signedBalance),
            };
        });

        const report = {
            revenue: [] as any[], // Class 7
            expenses: [] as any[], // Class 6
            haoRevenue: [] as any[], // Class 8 (Credit)
            haoExpenses: [] as any[], // Class 8 (Debit)

            totalRevenue: 0,
            totalExpenses: 0,
            totalHaoRevenue: 0,
            totalHaoExpenses: 0,

            operatingResult: 0, // Résultat d'Exploitation
            haoResult: 0, // Résultat HAO
            netResult: 0, // Résultat Net
        };

        for (const account of accountBalances) {
            if (account.absoluteBalance === 0) continue;

            if (account.accountClass === 7) {
                report.revenue.push(account);
                report.totalRevenue += account.signedBalance;
            } else if (account.accountClass === 6) {
                report.expenses.push(account);
                report.totalExpenses += Math.abs(account.signedBalance); // Expenses are negative in signed, make positive for list
            } else if (account.accountClass === 8) {
                if (account.signedBalance >= 0) {
                    report.haoRevenue.push(account);
                    report.totalHaoRevenue += account.signedBalance;
                } else {
                    report.haoExpenses.push(account);
                    report.totalHaoExpenses += Math.abs(account.signedBalance);
                }
            }
        }

        report.operatingResult = report.totalRevenue - report.totalExpenses;
        report.haoResult = report.totalHaoRevenue - report.totalHaoExpenses;
        report.netResult = report.operatingResult + report.haoResult;

        return {
            fiscalYearId,
            generatedAt: new Date(),
            data: report,
        };
    }

    /**
     * Generate Trial Balance
     */
    async getTrialBalance(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        const accounts = await this.prisma.account.findMany({
            include: {
                entryLines: {
                    where: {
                        entry: {
                            fiscalYearId,
                            status: 'VALIDATED',
                        },
                    },
                },
            },
            orderBy: { accountNumber: 'asc' }
        });

        const balances = accounts.map((account) => {
            const totalDebit = account.entryLines.reduce((sum, line) => sum + Number(line[debitField]), 0);
            const totalCredit = account.entryLines.reduce((sum, line) => sum + Number(line[creditField]), 0);

            return {
                id: account.id,
                accountNumber: account.accountNumber,
                label: account.label,
                accountClass: account.accountClass,
                totalDebit,
                totalCredit,
                balance: totalDebit - totalCredit, // Debit +, Credit -
                balanceType: (totalDebit - totalCredit) >= 0 ? 'DEBIT' : 'CREDIT'
            };
        });

        // Filter out zero lines if needed or keep them
        const activeBalances = balances.filter(b => b.totalDebit !== 0 || b.totalCredit !== 0);

        const grandTotalDebit = activeBalances.reduce((sum, b) => sum + b.totalDebit, 0);
        const grandTotalCredit = activeBalances.reduce((sum, b) => sum + b.totalCredit, 0);

        return {
            fiscalYearId,
            generatedAt: new Date(),
            accounts: activeBalances,
            grandTotalDebit,
            grandTotalCredit,
            isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.1,
        };
    }

    /**
     * VAT Report Logic 
     */
    async getVATReport(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        const vatAccounts = await this.prisma.account.findMany({
            where: {
                accountNumber: { startsWith: '44' } // Broad search for State/Tax accounts
            },
            include: { entryLines: { where: { entry: { fiscalYearId, status: 'VALIDATED' } } } }
        });

        const collected = vatAccounts.filter(a => a.accountNumber.startsWith('443') || a.accountNumber.startsWith('444'));
        const deductible = vatAccounts.filter(a => a.accountNumber.startsWith('445'));

        const totalCollected = collected.reduce((sum, acc) =>
            sum + acc.entryLines.reduce((s, l) => s + Number(l[creditField]) - Number(l[debitField]), 0), 0);

        const totalDeductible = deductible.reduce((sum, acc) =>
            sum + acc.entryLines.reduce((s, l) => s + Number(l[debitField]) - Number(l[creditField]), 0), 0);

        const vatToPay = totalCollected - totalDeductible;

        return {
            fiscalYearId,
            generatedAt: new Date(),
            vatCollected: totalCollected,
            vatDeductible: totalDeductible,
            vatToPay,
            status: vatToPay >= 0 ? 'TO_PAY' : 'CREDIT'
        };
    }

    /**
     * Generate Cash Flow Statement (Tableau des Flux de Trésorerie - TFT)
     * OHADA Compliant Categorization
     */
    async getCashFlowStatement(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        // 1. Get all Class 5 Accounts
        const cashAccounts = await this.prisma.account.findMany({
            where: { accountClass: 5 },
            include: {
                entryLines: {
                    where: { entry: { fiscalYearId, status: 'VALIDATED' } },
                    include: { entry: { include: { entryLines: { include: { account: true } }, journal: true } } }
                }
            }
        });

        let cashBegin = 0;
        let totalOperating = 0;
        let totalInvesting = 0;
        let totalFinancing = 0;
        const flows: any[] = [];

        cashAccounts.forEach(account => {
            account.entryLines.forEach(line => {
                const amount = Number(line[debitField]) - Number(line[creditField]);
                const entry = line.entry;
                const isOpening = entry.journal?.type === 'BALANCE';

                if (isOpening) {
                    cashBegin += amount;
                    return; // Opening balance doesn't count as a flow but as start cash
                }

                if (amount === 0) return;

                const isInflow = Number(line[debitField]) > 0;
                const otherLines = entry.entryLines.filter(l => l.id !== line.id);

                // Heuristic for OHADA TFT
                let category = 'OPERATING';
                const hasInvesting = otherLines.some(l => (l as any).account?.accountNumber?.startsWith('2'));
                const hasFinancing = otherLines.some(l => ((l as any).account?.accountNumber?.startsWith('1') && !(l as any).account?.accountNumber?.startsWith('13')) || (l as any).account?.accountNumber?.startsWith('16'));

                if (hasInvesting) category = 'INVESTING';
                else if (hasFinancing) category = 'FINANCING';

                const signedAmount = isInflow ? Math.abs(amount) : -Math.abs(amount);

                if (category === 'OPERATING') totalOperating += signedAmount;
                else if (category === 'INVESTING') totalInvesting += signedAmount;
                else if (category === 'FINANCING') totalFinancing += signedAmount;

                flows.push({
                    date: entry.entryDate,
                    description: line.description || entry.description,
                    amount: Math.abs(amount),
                    type: isInflow ? 'INFLOW' : 'OUTFLOW',
                    category,
                    accountNumber: account.accountNumber,
                    reference: entry.referenceNumber
                });
            });
        });

        const netVariation = totalOperating + totalInvesting + totalFinancing;
        const cashEnd = cashBegin + netVariation;

        return {
            fiscalYearId,
            generatedAt: new Date(),
            cashBegin,
            cashEnd,
            operating: totalOperating,
            investing: totalInvesting,
            financing: totalFinancing,
            netVariation,
            reconciliationGap: 0, // Placeholder for advanced reconciliation
            flows: flows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };
    }

    /**
     * Generate Equity Changes Statement (Tableau de Variation des Capitaux Propres - TVCP)
     */
    async getEquityChangesStatement(fiscalYearId: number, useLocal = true) {
        const debitField = useLocal ? 'debitLocal' : 'debit';
        const creditField = useLocal ? 'creditLocal' : 'credit';

        // 1. Get Class 1 Accounts
        const accounts = await this.prisma.account.findMany({
            where: { accountClass: 1 },
            include: {
                entryLines: {
                    where: {
                        entry: { fiscalYearId, status: 'VALIDATED' }
                    },
                    include: { entry: { include: { journal: true } } }
                }
            }
        });

        // 2. Define Standard OHADA Categories for TVCP
        const standardMapping = [
            { label: 'Capital', prefix: '10', key: 'capital' },
            { label: 'Réserves', prefix: '11', key: 'reserves' },
            { label: 'Report à Nouveau', prefix: '12', key: 'retainedEarnings' },
            { label: 'Résultat Net', prefix: '13', key: 'netResult' },
            { label: 'Autres Capitaux Propres', prefix: '1', key: 'others' }, // Fallback for other class 1
        ];

        const reportData = standardMapping.map(m => ({ ...m, initial: 0, increases: 0, decreases: 0, final: 0 }));

        accounts.forEach(account => {
            // Find specific mapping or fallback to 'others'
            let mapping = reportData.find(m => account.accountNumber.startsWith(m.prefix) && m.key !== 'others');
            if (!mapping) mapping = reportData.find(m => m.key === 'others');
            if (!mapping) return;

            account.entryLines.forEach(line => {
                const amount = Number(line[creditField]) - Number(line[debitField]); // Equity is Credit positive
                const isOpening = (line.entry as any).journal?.type === 'BALANCE';

                if (isOpening) {
                    mapping.initial += amount;
                } else {
                    if (amount > 0) mapping.increases += amount;
                    else mapping.decreases += Math.abs(amount);
                }
            });
        });

        // Calculate Final for each category
        reportData.forEach(m => {
            m.final = m.initial + m.increases - m.decreases;
        });

        return {
            fiscalYearId,
            generatedAt: new Date(),
            categories: reportData,
            totalInitial: reportData.reduce((sum, m) => sum + m.initial, 0),
            totalFinal: reportData.reduce((sum, m) => sum + m.final, 0)
        };
    }

    /**
     * PERSISTENCE METHODS
     */

    async saveBalanceSheet(fiscalYearId: number, companyId: number) {
        const data = await this.getBalanceSheet(fiscalYearId);

        // Mapping Logic (Simplified for brevity)
        // In a real app, you'd check Account IDs to split Incorp/Corp/Fin

        const assets = data.assets;
        const liabilities = data.liabilities;

        return this.prisma.balanceSheet.upsert({
            where: {
                fiscalYearId_companyId: {
                    fiscalYearId,
                    companyId
                }
            },
            update: {
                // Update logic...
                totalActifImmobilise: assets.totalFixedAssets,
                totalActifCirculant: assets.totalCurrentAssets,
                tresorerieActif: assets.totalCashAssets,
                totalActif: assets.grandTotal,

                totalCapitauxPropres: liabilities.totalEquity,
                totalDettesFinancieres: liabilities.totalLongTermDebt,
                totalPassifCirculant: liabilities.totalCurrentLiabilities,
                tresoreriePassif: liabilities.totalCashLiabilities,
                totalPassif: liabilities.grandTotal,
                updatedAt: new Date()
            },
            create: {
                fiscalYearId,
                companyId,
                totalActifImmobilise: assets.totalFixedAssets,
                totalActifCirculant: assets.totalCurrentAssets,
                tresorerieActif: assets.totalCashAssets,
                totalActif: assets.grandTotal,

                totalCapitauxPropres: liabilities.totalEquity,
                totalDettesFinancieres: liabilities.totalLongTermDebt,
                totalPassifCirculant: liabilities.totalCurrentLiabilities,
                tresoreriePassif: liabilities.totalCashLiabilities,
                totalPassif: liabilities.grandTotal,
            }
        });
    }

    async saveIncomeStatement(fiscalYearId: number, companyId: number) {
        const result = await this.getProfitAndLoss(fiscalYearId);
        const data = result.data;

        return this.prisma.incomeStatement.upsert({
            where: {
                fiscalYearId_companyId: {
                    fiscalYearId,
                    companyId
                }
            },
            update: {
                // Revenue (Class 7)
                chiffreAffaires: data.totalRevenue,
                totalProduitsAO: data.totalRevenue,

                // Expenses (Class 6)
                achatsConsommes: data.totalExpenses, // Simplified

                // HAO
                produitsHAO: data.totalHaoRevenue,
                chargesHAO: data.totalHaoExpenses,
                resultatHAO: data.haoResult,

                // Totals
                resultatExploitation: data.operatingResult,
                resultatActivitesOrdinaires: data.operatingResult, // Assuming no financial result for now
                resultatNet: data.netResult,
                updatedAt: new Date()
            },
            create: {
                fiscalYearId,
                companyId,
                chiffreAffaires: data.totalRevenue,
                totalProduitsAO: data.totalRevenue,
                achatsConsommes: data.totalExpenses,
                produitsHAO: data.totalHaoRevenue,
                chargesHAO: data.totalHaoExpenses,
                resultatHAO: data.haoResult,
                resultatExploitation: data.operatingResult,
                resultatActivitesOrdinaires: data.operatingResult,
                resultatNet: data.netResult,
            }
        });
    }

    async saveCashFlowStatement(fiscalYearId: number, companyId: number) {
        const data = await this.getCashFlowStatement(fiscalYearId);

        return this.prisma.cashFlowStatement.upsert({
            where: {
                fiscalYearId_companyId: {
                    fiscalYearId,
                    companyId
                }
            },
            update: {
                variationTresorerie: data.netVariation,
                fluxTresorerieActivite: data.operating,
                fluxTresorerieInvestissement: data.investing,
                fluxTresorerieFinancement: data.financing,
                updatedAt: new Date()
            },
            create: {
                fiscalYearId,
                companyId,
                variationTresorerie: data.netVariation,
                fluxTresorerieActivite: data.operating,
                fluxTresorerieInvestissement: data.investing,
                fluxTresorerieFinancement: data.financing,
            }
        });
    }

    /**
     * Dashboard Statistics
     */
    async getDashboardStats(fiscalYearId: number, companyId: number) {
        const [income, balance, vat, cashFlow] = await Promise.all([
            this.getProfitAndLoss(fiscalYearId, false),
            this.getBalanceSheet(fiscalYearId, false),
            this.getVATReport(fiscalYearId, false),
            this.getCashFlowStatement(fiscalYearId, false)
        ]);

        // Calculate Liquidity Ratio (Current Assets / Current Liabilities)
        const currentAssets = balance.assets.totalCurrentAssets + balance.assets.totalCashAssets;
        const currentLiabilities = balance.liabilities.totalCurrentLiabilities + balance.liabilities.totalCashLiabilities;
        const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 9.99 : 0);

        // Net Margin
        const netMargin = income.data.totalRevenue > 0 ? (income.data.netResult / income.data.totalRevenue) * 100 : 0;

        // Group expenses by category (Class 6 - First 3 digits)
        const expenseBreakdown = income.data.expenses.reduce((acc: any, exp: any) => {
            const category = exp.accountNumber.substring(0, 3);
            if (!acc[category]) {
                acc[category] = { label: exp.label.split(' ')[0], amount: 0 };
            }
            acc[category].amount += exp.absoluteBalance;
            return acc;
        }, {});

        return {
            revenue: income.data.totalRevenue,
            netIncome: income.data.netResult,
            cashOnHand: balance.assets.totalCashAssets,
            vatToPay: vat.vatToPay,
            ratios: {
                currentRatio: parseFloat(currentRatio.toFixed(2)),
                netMargin: parseFloat(netMargin.toFixed(2)),
                debtRatio: balance.liabilities.totalLongTermDebt > 0 ?
                    parseFloat((balance.liabilities.totalLongTermDebt / balance.liabilities.totalEquity * 100).toFixed(2)) : 0
            },
            expenseBreakdown: Object.values(expenseBreakdown).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5),
            trends: {
                revenue: income.data.revenue.map(r => ({ label: r.label, amount: r.signedBalance })),
                expenses: income.data.expenses.map(e => ({ label: e.label, amount: e.absoluteBalance }))
            },
            generatedAt: new Date()
        };
    }

    /**
     * Grand Livre (General Ledger) - OHADA Compliant
     * Detailed movements for a specific account
     */
    async getGeneralLedger(
        accountId: number,
        fiscalYearId: number,
        startDate?: Date,
        endDate?: Date
    ) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId }
        });

        if (!fiscalYear) {
            throw new Error('Fiscal year not found');
        }

        const entries = await this.prisma.entryLine.findMany({
            where: {
                accountId,
                entry: {
                    fiscalYearId,
                    status: 'VALIDATED',
                    entryDate: {
                        gte: startDate || fiscalYear.startDate,
                        lte: endDate || fiscalYear.endDate
                    }
                }
            },
            include: {
                entry: {
                    include: {
                        journal: true
                    }
                }
            },
            orderBy: {
                entry: {
                    entryDate: 'asc'
                }
            }
        });

        let balance = 0;
        const movements = entries.map(line => {
            balance += Number(line.debitLocal) - Number(line.creditLocal);
            return {
                date: line.entry.entryDate,
                reference: line.entry.referenceNumber,
                journal: line.entry.journal.code,
                label: line.description || line.entry.description,
                debit: Number(line.debitLocal),
                credit: Number(line.creditLocal),
                balance
            };
        });

        return {
            account: {
                code: account.accountNumber,
                label: account.label
            },
            fiscalYear: {
                code: fiscalYear.code,
                startDate: fiscalYear.startDate,
                endDate: fiscalYear.endDate
            },
            movements,
            totals: {
                debit: movements.reduce((sum, m) => sum + m.debit, 0),
                credit: movements.reduce((sum, m) => sum + m.credit, 0),
                balanceFinal: balance
            }
        };
    }

    /**
     * Journal Auxiliaire - Sales Journal (VT)
     */
    async getSalesJournal(fiscalYearId: number, month?: number) {
        return this.getAuxiliaryJournal(fiscalYearId, 'VT', month);
    }

    /**
     * Journal Auxiliaire - Purchase Journal (HA)
     */
    async getPurchaseJournal(fiscalYearId: number, month?: number) {
        return this.getAuxiliaryJournal(fiscalYearId, 'HA', month);
    }

    /**
     * Journal Auxiliaire - Bank Journal (BQ)
     */
    async getBankJournal(fiscalYearId: number, month?: number) {
        return this.getAuxiliaryJournal(fiscalYearId, 'BQ', month);
    }

    /**
     * Journal Auxiliaire - Cash Journal (CA)
     */
    async getCashJournal(fiscalYearId: number, month?: number) {
        return this.getAuxiliaryJournal(fiscalYearId, 'CA', month);
    }

    /**
     * Generic method to get auxiliary journal by type
     */
    private async getAuxiliaryJournal(
        fiscalYearId: number,
        journalCode: string,
        month?: number
    ) {
        const journal = await this.prisma.journal.findFirst({
            where: { code: journalCode }
        });

        if (!journal) {
            throw new Error(`Journal ${journalCode} not found`);
        }

        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId }
        });

        if (!fiscalYear) {
            throw new Error('Fiscal year not found');
        }

        const whereClause: any = {
            fiscalYearId,
            journalId: journal.id,
            status: 'VALIDATED'
        };

        if (month) {
            const year = fiscalYear.startDate.getFullYear();
            whereClause.entryDate = {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1)
            };
        }

        const entries = await this.prisma.accountingEntry.findMany({
            where: whereClause,
            include: {
                entryLines: {
                    include: {
                        account: true,
                        thirdParty: true
                    }
                }
            },
            orderBy: {
                entryDate: 'asc'
            }
        });

        return {
            journal: {
                code: journal.code,
                label: journal.label
            },
            fiscalYear: {
                code: fiscalYear.code
            },
            period: month ? `Mois ${month}/${fiscalYear.startDate.getFullYear()}` : 'Exercice complet',
            entries: entries.map(entry => ({
                date: entry.entryDate,
                reference: entry.referenceNumber,
                label: entry.description,
                lines: entry.entryLines.map(line => ({
                    account: line.account.accountNumber,
                    accountLabel: line.account.label,
                    thirdParty: line.thirdParty?.name,
                    debit: Number(line.debitLocal),
                    credit: Number(line.creditLocal),
                    label: line.description
                })),
                total: {
                    debit: entry.entryLines.reduce((sum, l) => sum + Number(l.debitLocal), 0),
                    credit: entry.entryLines.reduce((sum, l) => sum + Number(l.creditLocal), 0)
                }
            })),
            totals: {
                debit: entries.reduce((sum, e) =>
                    sum + e.entryLines.reduce((s, l) => s + Number(l.debitLocal), 0), 0),
                credit: entries.reduce((sum, e) =>
                    sum + e.entryLines.reduce((s, l) => s + Number(l.creditLocal), 0), 0)
            }
        };
    }

    /**
     * Balance à 6 Colonnes - OHADA Compliant
     * Shows: Initial Balance | Period Movements | Final Balance (all in Debit/Credit columns)
     */
    async getSixColumnBalance(fiscalYearId: number) {
        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId }
        });

        if (!fiscalYear) {
            throw new Error('Fiscal year not found');
        }

        const accounts = await this.prisma.account.findMany({
            where: {
                companyId: fiscalYear.companyId
            },
            include: {
                entryLines: {
                    where: {
                        entry: {
                            fiscalYearId,
                            status: 'VALIDATED'
                        }
                    }
                }
            },
            orderBy: {
                accountNumber: 'asc'
            }
        });

        const balanceLines = accounts
            .filter(account => account.entryLines.length > 0)
            .map(account => {
                // Calculate initial balance (for now, assume 0 - would need previous year data)
                const initialBalance = 0;

                // Calculate period movements
                const movements = account.entryLines.reduce((acc, line) => {
                    acc.debit += Number(line.debitLocal);
                    acc.credit += Number(line.creditLocal);
                    return acc;
                }, { debit: 0, credit: 0 });

                // Calculate final balance
                const finalBalance = initialBalance + movements.debit - movements.credit;

                return {
                    accountNumber: account.accountNumber,
                    accountLabel: account.label,
                    initialBalanceDebit: initialBalance > 0 ? initialBalance : 0,
                    initialBalanceCredit: initialBalance < 0 ? Math.abs(initialBalance) : 0,
                    movementsDebit: movements.debit,
                    movementsCredit: movements.credit,
                    finalBalanceDebit: finalBalance > 0 ? finalBalance : 0,
                    finalBalanceCredit: finalBalance < 0 ? Math.abs(finalBalance) : 0
                };
            });

        const totals = balanceLines.reduce((acc, line) => ({
            initialDebit: acc.initialDebit + line.initialBalanceDebit,
            initialCredit: acc.initialCredit + line.initialBalanceCredit,
            movementsDebit: acc.movementsDebit + line.movementsDebit,
            movementsCredit: acc.movementsCredit + line.movementsCredit,
            finalDebit: acc.finalDebit + line.finalBalanceDebit,
            finalCredit: acc.finalCredit + line.finalBalanceCredit
        }), {
            initialDebit: 0,
            initialCredit: 0,
            movementsDebit: 0,
            movementsCredit: 0,
            finalDebit: 0,
            finalCredit: 0
        });

        return {
            fiscalYear: {
                code: fiscalYear.code,
                startDate: fiscalYear.startDate,
                endDate: fiscalYear.endDate
            },
            lines: balanceLines,
            totals
        };
    }

    async getPerformanceStats(fiscalYearId: number) {
        const months: { month: number; year: number; label: string }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                label: d.toLocaleString('fr-FR', { month: 'short' })
            });
        }

        const performance = await Promise.all(months.map(async (m) => {
            const startDate = new Date(m.year, m.month - 1, 1);
            const endDate = new Date(m.year, m.month, 0);

            const lines = await this.prisma.entryLine.findMany({
                where: {
                    entry: {
                        fiscalYearId,
                        status: 'VALIDATED',
                        entryDate: { gte: startDate, lte: endDate }
                    },
                    account: { accountClass: { in: [6, 7] } }
                },
                include: { account: true }
            });

            const revenue = lines
                .filter(l => l.account.accountClass === 7)
                .reduce((sum, l) => sum + Number(l.creditLocal) - Number(l.debitLocal), 0);
            const expenses = lines
                .filter(l => l.account.accountClass === 6)
                .reduce((sum, l) => sum + Number(l.debitLocal) - Number(l.creditLocal), 0);

            return {
                ...m,
                revenue: Math.max(0, revenue),
                expenses: Math.max(0, expenses),
                margin: revenue - expenses
            };
        }));

        return performance;
    }

    /**
     * getNotesAnnexes - Returns structural and financial notes (OHADA)
     */
    async getNotesAnnexes(fiscalYearId: number) {
        const fy = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId },
            include: { company: { include: { branches: true } } }
        });

        if (!fy) throw new Error('Fiscal Year not found');

        const company = fy.company;

        return {
            fiscalYear: {
                code: fy.code,
                startDate: fy.startDate,
                endDate: fy.endDate
            },
            notes: [
                {
                    id: 1,
                    title: "IDENTIFICATION DE L'ENTITÉ ET CARACTÉRISTIQUES DE L'ACTIVITÉ",
                    content: {
                        name: company.companyName,
                        rccm: company.rccm,
                        idNat: company.nationalId,
                        nif: company.taxId,
                        address: company.headquartersAddress,
                        phone: company.phone,
                        email: company.email,
                        taxRegime: company.taxRegime,
                        taxCenter: company.taxCenter,
                        branches: company.branches.map(b => ({
                            name: b.name,
                            city: b.city,
                            isMain: b.isMain
                        }))
                    }
                },
                {
                    id: 2,
                    title: "RÉFÉRENTIEL COMPTABLE ET ÉTAT DE CONFORMITÉ",
                    content: "Les présents états financiers sont établis et présentés conformément aux dispositions de l'Acte Uniforme relatif au Droit Comptable et à l'Information Financière (AUDCIF) et au Système Comptable OHADA (SYSCOHADA)."
                },
                {
                    id: 3,
                    title: "MÉTHODES COMPTABLES ET RÈGLES D'ÉVALUATION",
                    content: [
                        "Dévise de tenue de comptabilité : " + company.currency,
                        "Méthode d'évaluation des stocks : FIFO / PEPS (Premier Entré, Premier Sorti)",
                        "Convention de coût historique respectée pour l'ensemble des postes du bilan.",
                        "Traitement des opérations en devises : Conversion au cours du jour de l'opération."
                    ]
                }
            ]
        };
    }
}
