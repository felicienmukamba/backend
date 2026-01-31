import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';

@Injectable()
export class FiscalYearsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateFiscalYearDto) {
        return this.prisma.fiscalYear.create({
            data: createDto as any,
        });
    }

    async findAll() {
        return this.prisma.fiscalYear.findMany();
    }

    async findOne(id: number) {
        return this.prisma.fiscalYear.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateFiscalYearDto) {
        return this.prisma.fiscalYear.update({
            where: { id },
            data: updateDto,
        });
    }

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

    async remove(id: number) {
        return this.prisma.fiscalYear.delete({
            where: { id },
        });
    }
}
