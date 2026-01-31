import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountingEntryDto } from './entries/dto/create-accounting-entry.dto';

/**
 * Custom exceptions for OHADA validation errors
 */
export class InvalidAccountClassError extends Error {
    constructor(accountNumber: string, accountClass: number) {
        super(`Invalid account class ${accountClass} for account ${accountNumber}. OHADA allows classes 1-8 only.`);
        this.name = 'InvalidAccountClassError';
    }
}

export class ClosedPeriodError extends Error {
    constructor(fiscalYearId: number) {
        super(`Cannot create entries in closed fiscal year ${fiscalYearId}`);
        this.name = 'ClosedPeriodError';
    }
}

export class OutOfPeriodError extends Error {
    constructor(entryDate: Date, fiscalYearStart: Date, fiscalYearEnd: Date) {
        super(`Entry date ${entryDate.toISOString()} is outside fiscal year period (${fiscalYearStart.toISOString()} - ${fiscalYearEnd.toISOString()})`);
        this.name = 'OutOfPeriodError';
    }
}

export class InvalidAccountCombinationWarning {
    constructor(
        public debitAccount: string,
        public creditAccount: string,
        public message: string
    ) { }
}

@Injectable()
export class OhadaValidationService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Validate OHADA account class (1-8)
     */
    validateAccountClass(accountNumber: string): boolean {
        const accountClass = this.getAccountClass(accountNumber);
        if (accountClass < 1 || accountClass > 8) {
            throw new InvalidAccountClassError(accountNumber, accountClass);
        }
        return true;
    }

    /**
     * Extract account class from account number
     * OHADA: First digit = class (1-8)
     */
    private getAccountClass(accountNumber: string): number {
        return parseInt(accountNumber.charAt(0));
    }

    /**
     * Validate that fiscal period is open and entry date is within period
     */
    async validatePeriodOpen(fiscalYearId: number, entryDate: Date): Promise<void> {
        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId }
        });

        if (!fiscalYear) {
            throw new Error(`Fiscal year ${fiscalYearId} not found`);
        }

        if (fiscalYear.isClosed) {
            throw new ClosedPeriodError(fiscalYearId);
        }

        const entryDateOnly = new Date(entryDate.toDateString());
        const startDateOnly = new Date(fiscalYear.startDate.toDateString());
        const endDateOnly = new Date(fiscalYear.endDate.toDateString());

        if (entryDateOnly < startDateOnly || entryDateOnly > endDateOnly) {
            throw new OutOfPeriodError(entryDate, fiscalYear.startDate, fiscalYear.endDate);
        }
    }

    /**
     * Validate account combinations according to OHADA rules
     * Returns warnings for unusual but allowed combinations
     */
    validateAccountCombinations(entryLines: any[]): InvalidAccountCombinationWarning[] {
        const warnings: InvalidAccountCombinationWarning[] = [];

        for (let i = 0; i < entryLines.length; i++) {
            for (let j = i + 1; j < entryLines.length; j++) {
                const line1 = entryLines[i];
                const line2 = entryLines[j];

                // Check if one is debit and other is credit
                if (line1.debit > 0 && line2.credit > 0) {
                    const warning = this.checkCombination(
                        line1.account?.accountNumber || '',
                        line2.account?.accountNumber || ''
                    );
                    if (warning) warnings.push(warning);
                } else if (line1.credit > 0 && line2.debit > 0) {
                    const warning = this.checkCombination(
                        line2.account?.accountNumber || '',
                        line1.account?.accountNumber || ''
                    );
                    if (warning) warnings.push(warning);
                }
            }
        }

        return warnings;
    }

    /**
     * Check specific debit/credit combination
     */
    private checkCombination(debitAccount: string, creditAccount: string): InvalidAccountCombinationWarning | null {
        const debitClass = this.getAccountClass(debitAccount);
        const creditClass = this.getAccountClass(creditAccount);

        // Warning: Direct movement from balance sheet to income statement
        // (Should usually go through closing entries)
        if ((debitClass <= 5 && creditClass >= 6 && creditClass <= 7) ||
            (debitClass >= 6 && debitClass <= 7 && creditClass <= 5)) {
            return new InvalidAccountCombinationWarning(
                debitAccount,
                creditAccount,
                'Mouvement direct entre bilan et gestion (classes 1-5 et 6-7). Vérifiez que ce n\'est pas une écriture de clôture.'
            );
        }

        return null;
    }

    /**
     * Validate VAT logic in entry
     * Checks that revenue/expense entries have corresponding VAT entries when applicable
     */
    validateVatLogic(entryLines: any[]): string[] {
        const warnings: string[] = [];

        // Check for revenue without VAT
        const hasRevenue = entryLines.some(line => {
            const accountClass = this.getAccountClass(line.account?.accountNumber || '');
            return accountClass === 7 && (line.credit > 0);
        });

        const hasVatCollected = entryLines.some(line => {
            const accountNumber = line.account?.accountNumber || '';
            return accountNumber.startsWith('443') && (line.credit > 0);
        });

        if (hasRevenue && !hasVatCollected) {
            warnings.push('Écriture de produit sans TVA collectée (443). Vérifiez que le tiers n\'est pas assujetti à la TVA.');
        }

        // Check for expense without deductible VAT
        const hasExpense = entryLines.some(line => {
            const accountClass = this.getAccountClass(line.account?.accountNumber || '');
            return accountClass === 6 && (line.debit > 0);
        });

        const hasVatDeductible = entryLines.some(line => {
            const accountNumber = line.account?.accountNumber || '';
            return accountNumber.startsWith('445') && (line.debit > 0);
        });

        if (hasExpense && !hasVatDeductible) {
            warnings.push('Écriture de charge sans TVA déductible (445). Vérifiez que l\'achat est soumis à TVA.');
        }

        return warnings;
    }

    /**
     * Comprehensive validation of an accounting entry
     * Returns object with isValid flag and array of errors/warnings
     */
    async validateEntry(createDto: CreateAccountingEntryDto): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // 1. Validate account classes
            for (const line of createDto.entryLines) {
                if (line.accountId) {
                    const account = await this.prisma.account.findUnique({
                        where: { id: line.accountId }
                    });
                    if (account) {
                        try {
                            this.validateAccountClass(account.accountNumber);
                        } catch (error) {
                            errors.push(error.message);
                        }
                    }
                }
            }

            // 2. Validate period
            try {
                await this.validatePeriodOpen(createDto.fiscalYearId, createDto.entryDate);
            } catch (error) {
                errors.push(error.message);
            }

            // 3. Validate account combinations (warnings only)
            const entryLinesWithAccounts = await Promise.all(
                createDto.entryLines.map(async (line) => ({
                    ...line,
                    account: await this.prisma.account.findUnique({
                        where: { id: line.accountId }
                    })
                }))
            );

            const combinationWarnings = this.validateAccountCombinations(entryLinesWithAccounts);
            warnings.push(...combinationWarnings.map(w => w.message));

            // 4. Validate VAT logic (warnings only)
            const vatWarnings = this.validateVatLogic(entryLinesWithAccounts);
            warnings.push(...vatWarnings);

        } catch (error) {
            errors.push(`Unexpected validation error: ${error.message}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Quick validation for account number format
     */
    isValidOhadaAccountNumber(accountNumber: string): boolean {
        // OHADA account numbers are typically 6-7 digits
        // First digit is class (1-8)
        if (!/^\d{6,7}$/.test(accountNumber)) {
            return false;
        }

        const accountClass = this.getAccountClass(accountNumber);
        return accountClass >= 1 && accountClass <= 8;
    }
}
