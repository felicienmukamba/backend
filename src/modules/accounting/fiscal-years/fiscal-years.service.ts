import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';

@Injectable()
export class FiscalYearsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create new fiscal year and auto-activate it (deactivates others)
     * Company-isolated
     */
    async create(createDto: CreateFiscalYearDto, companyId: number) {
        return this.prisma.$transaction(async (prisma) => {
            // Deactivate (close) all other fiscal years for this company
            await prisma.fiscalYear.updateMany({
                where: { companyId },
                data: { isClosed: true }
            });

            // Create the new fiscal year (active by default)
            return prisma.fiscalYear.create({
                data: {
                    ...createDto,
                    companyId,
                    isClosed: false
                } as any,
            });
        });
    }

    /**
     * Get all fiscal years for a company
     */
    async findAll(companyId: number) {
        return this.prisma.fiscalYear.findMany({
            where: { companyId },
            orderBy: { startDate: 'desc' }
        });
    }

    /**
     * Get active fiscal year for a company
     */
    async findActive(companyId: number) {
        return this.prisma.fiscalYear.findFirst({
            where: {
                companyId,
                isClosed: false
            },
            orderBy: { startDate: 'desc' }
        });
    }

    /**
     * Get single fiscal year (company-isolated)
     */
    async findOne(id: number, companyId: number) {
        return this.prisma.fiscalYear.findFirst({
            where: { id, companyId }
        });
    }

    /**
     * Update fiscal year (company-isolated)
     */
    async update(id: number, updateDto: UpdateFiscalYearDto, companyId: number) {
        // Verify it belongs to the company
        const fiscalYear = await this.findOne(id, companyId);
        if (!fiscalYear) {
            throw new Error('Fiscal year not found or does not belong to this company');
        }

        return this.prisma.fiscalYear.update({
            where: { id },
            data: updateDto,
        });
    }

    /**
     * Activate a fiscal year (deactivates others for the same company)
     */
    async activate(id: number, companyId: number) {
        return this.prisma.$transaction(async (prisma) => {
            // Verify the fiscal year belongs to this company
            const fiscalYear = await prisma.fiscalYear.findFirst({
                where: { id, companyId }
            });

            if (!fiscalYear) {
                throw new Error('Fiscal year not found or does not belong to this company');
            }

            // Deactivate all fiscal years for this company
            await prisma.fiscalYear.updateMany({
                where: { companyId },
                data: { isClosed: true }
            });

            // Activate the specified fiscal year
            return prisma.fiscalYear.update({
                where: { id },
                data: { isClosed: false }
            });
        });
    }

    /**
     * Deactivate (close) a fiscal year
     */
    async deactivate(id: number, companyId: number) {
        const fiscalYear = await this.findOne(id, companyId);
        if (!fiscalYear) {
            throw new Error('Fiscal year not found or does not belong to this company');
        }

        return this.prisma.fiscalYear.update({
            where: { id },
            data: { isClosed: true }
        });
    }

    /**
     * Close fiscal year with validation (company-isolated)
     */
    async closeFiscalYear(id: number, companyId: number) {
        // 1. Verify existence
        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id },
            include: {
                entries: {
                    where: { status: 'PROVISIONAL' },
                    select: { id: true, referenceNumber: true }
                }
            }
        });

        if (!fiscalYear || fiscalYear.companyId !== companyId) {
            throw new Error('Fiscal Year not found or access denied');
        }

        if (fiscalYear.isClosed) {
            throw new Error('Fiscal Year is already closed');
        }

        // 2. Verify all entries are validated
        if (fiscalYear.entries.length > 0) {
            const pending = fiscalYear.entries.map(e => e.referenceNumber).join(', ');
            throw new Error(`Cannot close fiscal year. The following entries are still PROVISIONAL: ${pending}`);
        }

        // 3. Mark as closed
        // TODO: In a real system, we would:
        // - Calculate Net Result (Class 7 - Class 6)
        // - Generate 'Result Entry' (Debit 13 or Credit 13)
        // - Generate 'Opening Entries' for the next fiscal year (Class 1-5)

        return this.prisma.fiscalYear.update({
            where: { id },
            data: { isClosed: true },
        });
    }

    /**
     * Delete fiscal year (company-isolated)
     */
    async remove(id: number, companyId: number) {
        const fiscalYear = await this.findOne(id, companyId);
        if (!fiscalYear) {
            throw new Error('Fiscal year not found or does not belong to this company');
        }

        return this.prisma.fiscalYear.delete({
            where: { id },
        });
    }
}
