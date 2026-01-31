import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculates a payslip according to DRC laws.
     */
    async processPayslip(payslipId: string) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id: payslipId },
            include: {
                employee: true,
                company: true
            }
        });

        if (!payslip) throw new NotFoundException(`Payslip ${payslipId} not found`);

        const baseSalary = payslip.employee.baseSalary;

        // 1. Social Contributions
        const cnssEmployee = this.calculateCNSS(baseSalary, 'EMPLOYEE');
        const cnssEmployer = this.calculateCNSS(baseSalary, 'EMPLOYER');

        // 2. Taxable Basis for IPR = Gross - CNSS Employee
        const taxableBase = baseSalary.minus(cnssEmployee);
        const ipr = this.calculateIPR(taxableBase);

        // 3. Other Patronal Charges (DRC)
        const onem = baseSalary.times(0.002); // 0.2%
        const inpp = baseSalary.times(0.03);  // 3% (Standard)

        // 4. Update Lines
        await this.prisma.payslipLine.deleteMany({ where: { payslipId } });

        await this.prisma.payslipLine.createMany({
            data: [
                { label: 'Salaire de Base', type: 'EARNING', category: 'SALARY', amount: baseSalary, payslipId, companyId: payslip.companyId },
                { label: 'CNSS (3.5%)', type: 'DEDUCTION', category: 'CNSS', amount: cnssEmployee, baseAmount: baseSalary, rate: 3.5, payslipId, companyId: payslip.companyId },
                { label: 'IPR (Impôt sur le Revenu)', type: 'DEDUCTION', category: 'IPR', amount: new Decimal(ipr), baseAmount: taxableBase, payslipId, companyId: payslip.companyId },
                { label: 'CNSS Patronale (13%)', type: 'EMPLOYER_CONTRIBUTION', category: 'CNSS', amount: cnssEmployer, baseAmount: baseSalary, rate: 13, payslipId, companyId: payslip.companyId },
                { label: 'ONEM (0.2%)', type: 'EMPLOYER_CONTRIBUTION', category: 'ONEM', amount: onem, baseAmount: baseSalary, rate: 0.2, payslipId, companyId: payslip.companyId },
                { label: 'INPP (3%)', type: 'EMPLOYER_CONTRIBUTION', category: 'INPP', amount: inpp, baseAmount: baseSalary, rate: 3, payslipId, companyId: payslip.companyId }
            ]
        });

        const netSalary = baseSalary.minus(cnssEmployee).minus(ipr);

        const updatedPayslip = await this.prisma.payslip.update({
            where: { id: payslipId },
            data: {
                grossSalary: baseSalary,
                netSalary: netSalary,
                status: 'VALIDATED'
            }
        });

        // Trigger Automated Accounting Entry
        const currentUserId = 1; // System or specific user ID 
        await this.generateAccountingEntry(payslipId, currentUserId).catch(err => {
            console.error('Failed to auto-generate accounting entry for payslip:', err);
        });

        return updatedPayslip;
    }

    /**
     * Generates Accounting Entry for a validated payslip (Backend).
     */
    async generateAccountingEntry(payslipId: string, userId: number) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id: payslipId },
            include: { lines: true, employee: true, period: true }
        });

        if (!payslip || payslip.status !== 'VALIDATED') {
            throw new Error(`Le bulletin ${payslipId} doit être validé avant la comptabilisation`);
        }

        const journal = await this.prisma.journal.findFirst({
            where: { code: 'PA', companyId: payslip.companyId }
        });
        if (!journal) throw new Error('Journal de Paie (PA) non configuré');

        const fiscalYear = await this.prisma.fiscalYear.findFirst({
            where: { companyId: payslip.companyId, isClosed: false },
            orderBy: { startDate: 'desc' }
        });
        if (!fiscalYear) throw new Error('Aucun exercice fiscal ouvert trouvé');

        const [accSalaries, accChargesSoc, accOrgSoc, accIPR, accNetPay] = await Promise.all([
            this.findAccount('641', payslip.companyId), // Rémunérations directes du personnel
            this.findAccount('646', payslip.companyId), // Charges sociales patronales
            this.findAccount('431', payslip.companyId),  // Sécurité Sociale (CNSS)
            this.findAccount('442', payslip.companyId), // Etat, Impôts et taxes (IPR)
            this.findAccount('422', payslip.companyId)  // Personnel - Rémunérations dues
        ]);

        const gross = payslip.grossSalary;
        const net = payslip.netSalary;
        const cnssEmployee = payslip.lines.find(l => l.category === 'CNSS' && l.type === 'DEDUCTION')?.amount || new Decimal(0);
        const ipr = payslip.lines.find(l => l.category === 'IPR')?.amount || new Decimal(0);

        const employerCharges = payslip.lines
            .filter(l => l.type === 'EMPLOYER_CONTRIBUTION')
            .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));

        const totalSoc = cnssEmployee.plus(employerCharges);

        return await this.prisma.$transaction(async (tx) => {
            const entry = await tx.accountingEntry.create({
                data: {
                    referenceNumber: `PA-${payslip.employee.lastName.slice(0, 3).toUpperCase()}-${payslip.period.name}`,
                    entryDate: new Date(),
                    description: `Engagement Paie ${payslip.period.name} - ${payslip.employee.firstName} ${payslip.employee.lastName}`,
                    status: 'VALIDATED',
                    journalId: journal.id,
                    fiscalYearId: fiscalYear.id,
                    payslipId: payslip.id,
                    companyId: payslip.companyId,
                    createdById: userId
                }
            });

            // DEBIT 661: Gross (Brut)
            await tx.entryLine.create({
                data: {
                    debit: gross,
                    credit: 0,
                    description: `Salaire Brut - ${payslip.employee.lastName}`,
                    accountId: accSalaries.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // DEBIT 664: Employer Charges (Patronales)
            await tx.entryLine.create({
                data: {
                    debit: employerCharges,
                    credit: 0,
                    description: `Charges Patronales - ${payslip.employee.lastName}`,
                    accountId: accChargesSoc.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // CREDIT 43: Total Social (Cotisations totales)
            await tx.entryLine.create({
                data: {
                    debit: 0,
                    credit: totalSoc,
                    description: `Cotisations Sociales (Salariales + Patronales)`,
                    accountId: accOrgSoc.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // CREDIT 447: IPR (Etat)
            await tx.entryLine.create({
                data: {
                    debit: 0,
                    credit: ipr,
                    description: `Impôt IPR retenu`,
                    accountId: accIPR.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // CREDIT 422: Net Pay (Dû au personnel)
            await tx.entryLine.create({
                data: {
                    debit: 0,
                    credit: net,
                    description: `Net à payer - ${payslip.employee.lastName}`,
                    accountId: accNetPay.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            return entry;
        });
    }

    async recordSalaryPayment(payslipId: string, paymentData: {
        method: 'BANK' | 'CASH';
        paymentDate: Date;
        reference?: string;
        userId: number;
    }) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id: payslipId },
            include: { employee: true, period: true }
        });

        if (!payslip || payslip.status !== 'VALIDATED') {
            throw new Error('Seuls les bulletins validés peuvent être payés');
        }

        const journalCode = paymentData.method === 'CASH' ? 'CA' : 'BQ';
        const journal = await this.prisma.journal.findFirst({
            where: { code: journalCode, companyId: payslip.companyId }
        });
        if (!journal) throw new Error(`Journal ${journalCode} non trouvé`);

        const fiscalYear = await this.prisma.fiscalYear.findFirst({
            where: { companyId: payslip.companyId, isClosed: false },
            orderBy: { startDate: 'desc' }
        });
        if (!fiscalYear) throw new Error('Aucun exercice fiscal actif');

        const [accPersonnelDues, accCashOrBank] = await Promise.all([
            this.findAccount('422', payslip.companyId),
            this.findAccount(paymentData.method === 'CASH' ? '57' : '52', payslip.companyId)
        ]);

        return await this.prisma.$transaction(async (tx) => {
            const entry = await tx.accountingEntry.create({
                data: {
                    referenceNumber: `PAY-${payslip.employee.lastName.slice(0, 3).toUpperCase()}-${payslip.period.name}`,
                    entryDate: paymentData.paymentDate,
                    description: `Paiement Salaire ${payslip.period.name} - ${payslip.employee.lastName}`,
                    status: 'VALIDATED',
                    journalId: journal.id,
                    fiscalYearId: fiscalYear.id,
                    payslipId: payslip.id,
                    companyId: payslip.companyId,
                    createdById: paymentData.userId
                }
            });

            // Dr: 422 (Dettes annulées)
            await tx.entryLine.create({
                data: {
                    debit: payslip.netSalary,
                    credit: 0,
                    description: 'Règlement net à payer',
                    accountId: accPersonnelDues.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // Cr: 52/57 (Sortie Trésorerie)
            await tx.entryLine.create({
                data: {
                    debit: 0,
                    credit: payslip.netSalary,
                    description: `Paiement par ${paymentData.method}`,
                    accountId: accCashOrBank.id,
                    entryId: entry.id,
                    companyId: payslip.companyId
                }
            });

            // Update payslip status to reflect payment? (Schema might need a field, for now we assume entry is enough)
            return entry;
        });
    }

    private async findAccount(number: string, companyId: number) {
        const account = await this.prisma.account.findFirst({
            where: { accountNumber: { startsWith: number }, companyId }
        });
        if (!account) throw new Error(`Account starting with ${number} not found in Chart of Accounts`);
        return account;
    }

    private calculateIPR(taxableBase: Decimal): number {
        const income = taxableBase.toNumber();
        let tax = 0;
        if (income > 540000) {
            tax = (income - 540000) * 0.30 + (540000 - 161325) * 0.15;
        } else if (income > 161325) {
            tax = (income - 161325) * 0.15;
        }
        return Math.min(tax, income * 0.30);
    }

    private calculateCNSS(base: Decimal, type: 'EMPLOYEE' | 'EMPLOYER'): Decimal {
        const ceiling = 2500000;
        const basis = Math.min(base.toNumber(), ceiling);
        const rate = type === 'EMPLOYEE' ? 0.035 : 0.13;
        return new Decimal(basis * rate);
    }

    // --- Management Methods ---

    async createPeriod(dto: any, companyId: number) {
        const code = `${dto.month}-${dto.year}`;
        const name = dto.name || `Paie ${dto.month}/${dto.year}`;

        return this.prisma.payrollPeriod.create({
            data: {
                ...dto,
                company: { connect: { id: companyId } },
                code,
                name,
                status: 'OPEN'
            }
        });
    }

    async findAllPeriods(companyId: number) {
        return this.prisma.payrollPeriod.findMany({
            where: { companyId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async createPayslip(dto: any, companyId: number) {
        // Check if payslip already exists for this employee in this period
        const existing = await this.prisma.payslip.findFirst({
            where: {
                employeeId: dto.employeeId,
                periodId: dto.periodId,
                companyId
            }
        });
        if (existing) throw new BadRequestException('Payslip already exists for this employee in this period');

        const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
        if (!employee) throw new NotFoundException('Employee not found');

        return this.prisma.payslip.create({
            data: {
                employee: { connect: { id: dto.employeeId } },
                period: { connect: { id: dto.periodId } },
                company: { connect: { id: companyId } },
                grossSalary: employee.baseSalary, // Initial draft uses base salary
                status: 'DRAFT'
            }
        });
    }

    async findAllPayslips(companyId: number, periodId?: string) {
        const where: any = { companyId };
        if (periodId) where.periodId = periodId;

        return this.prisma.payslip.findMany({
            where,
            include: { employee: true, period: true }
        });
    }

    async removePayslip(id: string, companyId: number) {
        const payslip = await this.prisma.payslip.findFirst({ where: { id, companyId } });
        if (!payslip) throw new NotFoundException('Payslip not found');
        if (payslip.status === 'VALIDATED') throw new BadRequestException('Cannot delete a validated payslip');

        await this.prisma.payslipLine.deleteMany({ where: { payslipId: id } });
        return this.prisma.payslip.delete({ where: { id } });
    }

    // --- Period Management ---
    async removePeriod(id: string, companyId: number) {
        return this.prisma.payrollPeriod.delete({ where: { id, companyId } });
    }

    async closePeriod(id: string, companyId: number) {
        return this.prisma.payrollPeriod.update({
            where: { id, companyId },
            data: { status: 'CLOSED' }
        });
    }

    // --- Payslip Lines ---
    async addPayslipLine(dto: any, companyId: number) {
        // TODO: Ensure validation
        return this.prisma.payslipLine.create({
            data: { ...dto, companyId }
        });
    }

    async removePayslipLine(id: string, companyId: number) {
        return this.prisma.payslipLine.delete({ where: { id, companyId } });
    }
}
