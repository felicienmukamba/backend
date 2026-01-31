import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculates execution for each line of a budget.
     */
    async getBudgetExecution(budgetId: string) {
        const budget = await this.prisma.budget.findUnique({
            where: { id: budgetId },
            include: {
                lines: { include: { account: true } },
                fiscalYear: true
            }
        });

        if (!budget) throw new NotFoundException(`Budget ${budgetId} not found`);

        const refinedLines = await Promise.all(budget.lines.map(async (line) => {
            // Aggregate accounting entries
            const aggregate = await this.prisma.entryLine.aggregate({
                where: {
                    accountId: line.accountId,
                    entry: {
                        fiscalYearId: budget.fiscalYearId,
                        status: 'VALIDATED'
                    }
                },
                _sum: {
                    debit: true,
                    credit: true
                }
            });

            const debit = Number(aggregate._sum.debit || 0);
            const credit = Number(aggregate._sum.credit || 0);
            const accountClass = line.account.accountClass;

            let realized = 0;
            if (accountClass === 6) realized = debit - credit;
            else if (accountClass === 7) realized = credit - debit;
            else realized = Math.abs(debit - credit);

            const forecast = Number(line.forecastAmount);

            return {
                ...line,
                realizedAmount: realized,
                gap: forecast - realized,
                executionRate: forecast > 0 ? (realized / forecast) * 100 : 0
            };
        }));

        return {
            ...budget,
            lines: refinedLines
        };
    }

    // --- CRUD ---

    async create(dto: any, companyId: number) {
        return this.prisma.budget.create({
            data: {
                ...dto,
                company: { connect: { id: companyId } },
                fiscalYear: { connect: { id: dto.fiscalYearId } }
            }
        });
    }

    async findAll(companyId: number) {
        return this.prisma.budget.findMany({
            where: { companyId },
            include: { fiscalYear: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string, companyId: number) {
        const budget = await this.prisma.budget.findFirst({
            where: { id, companyId },
            include: { lines: { include: { account: true } } }
        });
        if (!budget) throw new NotFoundException('Budget not found');
        return budget;
    }

    async addLine(dto: any, companyId: number) {
        return this.prisma.budgetLine.create({
            data: {
                forecastAmount: dto.forecastAmount,
                budget: { connect: { id: dto.budgetId } },
                account: { connect: { id: dto.accountId } },
                company: { connect: { id: companyId } }
            }
        });
    }

    async update(id: string, dto: any, companyId: number) {
        await this.findOne(id, companyId);
        return this.prisma.budget.update({
            where: { id },
            data: dto
        });
    }

    async remove(id: string, companyId: number) {
        await this.findOne(id, companyId);
        return this.prisma.budget.delete({ where: { id } });
    }

    // --- Line Management ---

    async updateLine(id: string, dto: any, companyId: number) {
        const line = await this.prisma.budgetLine.findFirst({ where: { id, companyId } });
        if (!line) throw new NotFoundException('Budget line not found');

        return this.prisma.budgetLine.update({
            where: { id },
            data: dto
        });
    }

    async removeLine(id: string, companyId: number) {
        const line = await this.prisma.budgetLine.findFirst({ where: { id, companyId } });
        if (!line) throw new NotFoundException('Budget line not found');

        return this.prisma.budgetLine.delete({ where: { id } });
    }
}
