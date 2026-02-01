import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

    private getCompanyId(): number {
        const companyId = this.cls.get('companyId');
        if (!companyId) throw new BadRequestException('Company context missing');
        return companyId;
    }

    async generateReference(journalId: number, companyId: number): Promise<string> {
        const journal = await this.prisma.journal.findFirst({
            where: { id: journalId, companyId }
        });
        if (!journal) throw new Error('Journal not found or access denied');

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
        const companyId = this.getCompanyId();
        const { entryLines, invoiceId, paymentId, invoice, payment, ...entryData } = createDto as any;
        const rate = Number(entryData.exchangeRate || 1);

        // 1. Validate Fiscal Year
        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: entryData.fiscalYearId }
        });

        if (!fiscalYear || fiscalYear.companyId !== companyId) {
            throw new BadRequestException('Invalid Fiscal Year');
        }
        if (fiscalYear.isClosed) {
            throw new BadRequestException('Cannot create entry in a closed fiscal year');
        }

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

        try {
            // Auto-generate reference if missing
            if (!entryData.referenceNumber) {
                entryData.referenceNumber = await this.generateReference(entryData.journalId, companyId);
            }

            const createData: any = {
                ...entryData,
                companyId, // Enforce companyId from token
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
                        account: { connect: { id: line.accountId } }, // Note: We rely on DB constraint or should validate account ownership too
                        thirdParty: line.thirdPartyId ? { connect: { id: line.thirdPartyId } } : undefined,
                        costCenter: line.costCenterId ? { connect: { id: line.costCenterId } } : undefined,
                        company: { connect: { id: companyId } }
                    }))
                }
            };

            if (invoiceId) createData.invoiceId = BigInt(invoiceId);
            if (paymentId) createData.paymentId = BigInt(paymentId);

            const entry = await this.prisma.accountingEntry.create({
                data: createData,
                include: { entryLines: true }
            });

            this.logger.log(`Accounting Entry created: ${entryData.referenceNumber} (ID: ${entry.id})`);

            // Audit Trail
            const userId = this.cls.get('user')?.id;
            if (userId) {
                await this.auditTrailService.logCreate(
                    'AccountingEntry',
                    entry.id,
                    userId,
                    companyId,
                    entry,
                    Number(this.cls.get('branchId')) || undefined
                ).catch(err => this.logger.error('Failed to log audit trail', err));
            }

            return this.formatResponse(entry);
        } catch (error) {
            this.logger.error(`Failed to create accounting entry: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll() {
        const companyId = this.getCompanyId();
        return this.prisma.accountingEntry.findMany({
            where: { companyId, deletedAt: null },
            include: { entryLines: true, journal: true, fiscalYear: true },
            orderBy: { entryDate: 'desc' }
        });
    }

    async findOne(id: number) {
        const companyId = this.getCompanyId();
        const entry = await this.prisma.accountingEntry.findFirst({
            where: { id: BigInt(id), companyId, deletedAt: null },
            include: { entryLines: true }
        });

        if (!entry) throw new EntryNotFoundError(BigInt(id));
        return entry;
    }

    async update(id: number, updateDto: UpdateAccountingEntryDto) {
        const companyId = this.getCompanyId();

        // Check existence and ownership
        const currentEntry = await this.findOne(id);

        if (currentEntry.status === EntryStatus.VALIDATED) {
            throw new BadRequestException('Cannot update a validated entry');
        }

        // Validate Fiscal Year (if changing) or use current
        const fiscalYearId = updateDto.fiscalYearId || currentEntry.fiscalYearId;
        const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });

        if (fiscalYear?.isClosed) {
            throw new BadRequestException('Target fiscal year is closed');
        }

        const { entryLines, invoiceId, paymentId, invoice, payment, ...entryData } = updateDto as any;
        const updateData: any = { ...entryData };

        if (invoiceId) updateData.invoiceId = BigInt(invoiceId);
        if (paymentId) updateData.paymentId = BigInt(paymentId);

        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) }, // Prisma handles the id check, but we know it's ours from findOne
            data: updateData,
            include: { entryLines: true }
        });
    }

    async remove(id: number) {
        const companyId = this.getCompanyId();
        // Check existence and ownership
        const entry = await this.findOne(id); // Will throw if not found/owned

        if (entry.status === EntryStatus.VALIDATED) {
            throw new BadRequestException('Cannot delete a validated entry');
        }

        // Check fiscal year status
        const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: entry.fiscalYearId } });
        if (fiscalYear?.isClosed) {
            throw new BadRequestException('Cannot delete entry from a closed fiscal year');
        }

        const deleted = await this.prisma.accountingEntry.delete({
            where: { id: BigInt(id) },
        });

        // Audit Trail
        const userId = this.cls.get('user')?.id;
        if (userId) {
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
        const companyId = this.getCompanyId();
        const entry = await this.findOne(id); // Ensures ownership

        if (entry.status !== EntryStatus.PROVISIONAL) {
            throw new InvalidEntryStatusError(entry.status, EntryStatus.PROVISIONAL);
        }

        const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: entry.fiscalYearId } });
        if (fiscalYear?.isClosed) {
            throw new BadRequestException('Cannot validate entry in a closed fiscal year');
        }

        const updatedEntry = await this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { status: EntryStatus.VALIDATED }
        });

        this.logger.log(`Accounting Entry validated: ${entry.referenceNumber} (ID: ${id})`);

        // Audit Trail
        const userId = this.cls.get('user')?.id;
        if (userId) {
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
        const companyId = this.getCompanyId();
        await this.findOne(id); // Ensure ownership

        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { deletedAt: new Date() },
        });
    }

    async findTrashed() {
        const companyId = this.getCompanyId();
        return this.prisma.accountingEntry.findMany({
            where: {
                companyId,
                deletedAt: { not: null },
            },
            include: { entryLines: true, journal: true },
        });
    }

    async restoreFromTrash(id: number) {
        const companyId = this.getCompanyId();
        const entry = await this.prisma.accountingEntry.findFirst({
            where: { id: BigInt(id), companyId, deletedAt: { not: null } }
        });

        if (!entry) throw new EntryNotFoundError(BigInt(id));

        return this.prisma.accountingEntry.update({
            where: { id: BigInt(id) },
            data: { deletedAt: null },
        });
    }

    async permanentDelete(id: number) {
        const companyId = this.getCompanyId();
        const entry = await this.prisma.accountingEntry.findFirst({
            where: { id: BigInt(id), companyId }
        });

        if (!entry) throw new EntryNotFoundError(BigInt(id));

        // Delete entry lines first
        await this.prisma.entryLine.deleteMany({
            where: { entryId: BigInt(id) },
        });

        return this.prisma.accountingEntry.delete({
            where: { id: BigInt(id) },
        });
    }

    private formatResponse(entry: any) {
        return {
            ...entry,
            id: entry.id.toString(),
            invoiceId: entry.invoiceId?.toString(),
            paymentId: entry.paymentId?.toString(),
            entryLines: entry.entryLines.map((l: any) => ({
                ...l,
                id: l.id.toString(),
                entryId: l.entryId.toString()
            }))
        };
    }
}
