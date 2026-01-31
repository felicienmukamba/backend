import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';
import { EntryStatus } from '@prisma/client';
import {
    UnbalancedEntryError,
    EntryNotFoundError,
    InvalidEntryStatusError
} from '../../../common/exceptions';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';
import { OhadaValidationService } from '../ohada-validation.service';

@Injectable()
export class EntriesService {
    private readonly logger = new Logger(EntriesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrailService: AuditTrailService,
        private readonly cls: ClsService,
        private readonly ohadaValidationService: OhadaValidationService
    ) { }

    async generateReference(journalId: number, companyId: number): Promise<string> {
        const journal = await this.prisma.journal.findUnique({ where: { id: journalId } });
        if (!journal) throw new Error('Journal not found');

        const date = new Date();
        const year = date.getFullYear();
        const prefix = `${journal.code}-${year}`;

        const lastEntry = await this.prisma.accountingEntry.findFirst({
            where: {
                journalId,
                companyId,
                referenceNumber: { startsWith: prefix }
            },
            orderBy: { referenceNumber: 'desc' }
        });

        let nextNum = 1;
        if (lastEntry) {
            const lastNumStr = lastEntry.referenceNumber.split('-').pop();
            if (lastNumStr && !isNaN(parseInt(lastNumStr))) {
                nextNum = parseInt(lastNumStr) + 1;
            }
        }

        return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
    }

    async create(createDto: CreateAccountingEntryDto) {
        const { entryLines, invoiceId, paymentId, invoice, payment, ...entryData } = createDto as any;
        const rate = Number(entryData.exchangeRate || 1);

        // Logic: Validate Equilibrium
        const totalDebit = entryLines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = entryLines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (entryData.status === EntryStatus.VALIDATED && Math.abs(totalDebit - totalCredit) > 0.01) {
            this.logger.warn(`Attempt to create unbalanced VALIDATED entry. Debit: ${totalDebit}, Credit: ${totalCredit}`);
            throw new UnbalancedEntryError(totalDebit, totalCredit);
        }

        // OHADA Validation
        const validation = await this.ohadaValidationService.validateEntry(createDto);
        if (!validation.isValid) {
            this.logger.error('OHADA validation failed', validation.errors);
            throw new Error(`OHADA validation failed: ${validation.errors.join(', ')}`);
        }
        if (validation.warnings.length > 0) {
            this.logger.warn('OHADA validation warnings:', validation.warnings);
        }

        try {
            const ctxCompanyId = this.cls.get('companyId');
            const effectiveCompanyId = (entryData as any).companyId || ctxCompanyId || 1;

            // Auto-generate reference if missing
            if (!entryData.referenceNumber) {
                entryData.referenceNumber = await this.generateReference(entryData.journalId, effectiveCompanyId);
            }

            const createData: any = {
                ...entryData,
                companyId: effectiveCompanyId,
                currency: entryData.currency || 'FC',
                exchangeRate: rate,
                entryLines: {
                    create: entryLines.map(line => ({
                        debit: line.debit ?? 0,
                        credit: line.credit ?? 0,
                        debitLocal: (line.debit ?? 0) * rate,
                        creditLocal: (line.credit ?? 0) * rate,
                        description: line.description,
                        matchingCode: line.matchingCode,
                        matchingDate: line.matchingDate,
                        account: { connect: { id: line.accountId } },
                        thirdParty: line.thirdPartyId ? { connect: { id: line.thirdPartyId } } : undefined,
                        costCenter: line.costCenterId ? { connect: { id: line.costCenterId } } : undefined,
                        company: { connect: { id: effectiveCompanyId } }
                    }))
                }
            };

            if (invoiceId) {
                createData.invoiceId = BigInt(invoiceId);
            }
            if (paymentId) {
                createData.paymentId = BigInt(paymentId);
            }

            const entry = await this.prisma.accountingEntry.create({
                data: createData,
                include: { entryLines: true }
            });

            this.logger.log(`Accounting Entry created: ${entryData.referenceNumber} (ID: ${entry.id})`);

            // Audit Trail: Log creation
            const userId = this.cls.get('user')?.id;
            if (userId && effectiveCompanyId) {
                await this.auditTrailService.logCreate(
                    'AccountingEntry',
                    entry.id,
                    userId,
                    effectiveCompanyId,
                    entry,
                    Number(this.cls.get('branchId')) || undefined
                ).catch(err => this.logger.error('Failed to log audit trail', err));
            }

            // Convert BigInt to string for response
            return {
                ...entry,
                id: entry.id.toString(),
                invoiceId: entry.invoiceId?.toString(),
                paymentId: entry.paymentId?.toString(),
                entryLines: entry.entryLines.map(l => ({
                    ...l,
                    id: l.id.toString(),
                    entryId: l.entryId.toString()
                }))
            };
        } catch (error) {
            this.logger.error(`Failed to create accounting entry: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll() {
        return this.prisma.accountingEntry.findMany({
            include: { entryLines: true, journal: true, fiscalYear: true }
        });
    }

    async findOne(id: number) {
        return this.prisma.accountingEntry.findUnique({
            where: { id: BigInt(id) },
            include: { entryLines: true }
        });
    }

    async update(id: number, updateDto: UpdateAccountingEntryDto) {
        const { entryLines, invoiceId, paymentId, invoice, payment, ...entryData } = updateDto as any;

        if (invoiceId) entryData.invoiceId = BigInt(invoiceId);
        if (paymentId) entryData.paymentId = BigInt(paymentId);

        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: entryData,
            include: { entryLines: true }
        });
    }

    async remove(id: number) {
        // Fetch entry before deletion for audit log
        const entry = await this.prisma.accountingEntry.findUnique({
            where: { id: BigInt(id) },
            include: { entryLines: true }
        });

        const deleted = await this.prisma.accountingEntry.delete({
            where: { id: BigInt(id) },
        });

        // Audit Trail: Log deletion
        const userId = this.cls.get('user')?.id;
        const companyId = this.cls.get('companyId');
        if (userId && companyId && entry) {
            await this.auditTrailService.logDelete(
                'AccountingEntry',
                BigInt(id),
                userId,
                companyId,
                entry,
                Number(this.cls.get('branchId')) || undefined
            ).catch(err => this.logger.error('Failed to log audit trail', err));
        }

        return deleted;
    }

    async validate(id: number) {
        const entry = await this.prisma.accountingEntry.findUnique({
            where: { id: BigInt(id) }
        });

        if (!entry) {
            throw new EntryNotFoundError(BigInt(id));
        }

        if (entry.status !== EntryStatus.PROVISIONAL) {
            throw new InvalidEntryStatusError(entry.status, EntryStatus.PROVISIONAL);
        }

        const updatedEntry = await this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { status: EntryStatus.VALIDATED }
        });

        this.logger.log(`Accounting Entry validated: ${entry.referenceNumber} (ID: ${id})`);

        // Audit Trail: Log validation
        const userId = this.cls.get('user')?.id;
        const companyId = this.cls.get('companyId');
        if (userId && companyId) {
            await this.auditTrailService.logValidate(
                'AccountingEntry',
                BigInt(id),
                userId,
                companyId,
                Number(this.cls.get('branchId')) || undefined
            ).catch(err => this.logger.error('Failed to log audit trail', err));
        }

        return updatedEntry;
    }

    // Soft Delete Methods

    async softDelete(id: number) {
        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { deletedAt: new Date() },
        });
    }

    async findTrashed() {
        return this.prisma.accountingEntry.findMany({
            where: {
                deletedAt: { not: null },
            },
            include: { entryLines: true, journal: true },
        });
    }

    async restoreFromTrash(id: number) {
        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { deletedAt: null },
        });
    }

    async permanentDelete(id: number) {
        // Delete entry lines first
        await this.prisma.entryLine.deleteMany({
            where: { entryId: BigInt(id) },
        });

        return this.prisma.accountingEntry.delete({
            where: { id: BigInt(id) },
        });
    }
}
