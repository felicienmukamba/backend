import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCompanyDto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: {
                companyName: createCompanyDto.companyName,
                rccm: createCompanyDto.rccm,
                nationalId: createCompanyDto.nationalId,
                taxId: createCompanyDto.taxId,
                headquartersAddress: createCompanyDto.headquartersAddress,
                phone: createCompanyDto.phone,
                email: createCompanyDto.email,
                taxRegime: createCompanyDto.taxRegime,
                taxCenter: createCompanyDto.taxCenter,
                mcfConfig: createCompanyDto.mcfConfig ?? Prisma.JsonNull,
            },
        });
    }

    async findAll() {
        return this.prisma.company.findMany();
    }

    async findOne(id: number) {
        return this.prisma.company.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateCompanyDto: UpdateCompanyDto) {
        const { mcfConfig, ...rest } = updateCompanyDto;

        const currentCompany = await this.prisma.company.findUnique({ where: { id } });
        const updatedCompany = await this.prisma.company.update({
            where: { id },
            data: {
                ...rest,
                mcfConfig: mcfConfig ?? undefined,
            },
        });

        // Check if activation just happened
        if (updateCompanyDto.isActive === true && currentCompany?.isActive === false) {
            await this.bootstrapCompany(id);
        }

        return updatedCompany;
    }

    async remove(id: number) {
        return this.prisma.company.delete({
            where: { id },
        });
    }

    /**
     * Bootstrap a company with initial data:
     * - Fiscal Year (Current Year)
     * - OHADA Chart of Accounts
     * - Standard Journals
     */
    async bootstrapCompany(companyId: number) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId }, include: { branches: true } });
        if (!company) return;

        const mainBranch = company.branches.find(b => b.isMain);
        if (!mainBranch) return; // Should not happen

        // 1. Create Current Fiscal Year
        const currentYear = new Date().getFullYear();
        const existingFY = await this.prisma.fiscalYear.findFirst({
            where: { companyId, code: String(currentYear) }
        });

        if (!existingFY) {
            await this.prisma.fiscalYear.create({
                data: {
                    code: String(currentYear),
                    startDate: new Date(currentYear, 0, 1),
                    endDate: new Date(currentYear, 11, 31),
                    companyId,
                    isClosed: false
                }
            });
        }

        // 2. Create Standard Journals
        const { STANDARD_JOURNALS } = await import('../../../common/constants/ohada-plan.js');
        for (const j of STANDARD_JOURNALS) {
            const exists = await this.prisma.journal.findFirst({
                where: { companyId, code: j.code }
            });
            if (!exists) {
                await this.prisma.journal.create({
                    data: {
                        code: j.code,
                        label: j.label,
                        type: j.type as any, // Enum casing might need adjustment if strict
                        companyId,
                        branchId: mainBranch.id
                    }
                });
            }
        }

        // 3. Create OHADA Accounts
        const { OHADA_ACCOUNTS } = await import('../../../common/constants/ohada-plan.js');
        const accountMap: Record<string, number> = {};

        // Helper to find ID of parent
        const getParentId = (number: string): number | null => {
            const parentNum = number.substring(0, number.length - 1);
            return accountMap[parentNum] || null;
        };

        // We assume OHADA_ACCOUNTS is sorted by length implicitely or we make multiple passes?
        // Actually, sorting by length ensures parents come first usually, but let's just loop carefully
        // Or upsert.
        // For simplicity, we just create if not exists

        // Let's sort to ensure parents are created before children
        const sortedAccounts = [...OHADA_ACCOUNTS].sort((a, b) => a.number.length - b.number.length);

        for (const acc of sortedAccounts) {
            const exists = await this.prisma.account.findFirst({
                where: { companyId, accountNumber: acc.number }
            });

            if (!exists) {
                const parentId = getParentId(acc.number);

                // If it's a sub-account (length > 2) and we found no parent in map,
                // we might want to fetch from DB in case it was created in previous run?
                // For now, assume map is enough for this batch.

                const created = await this.prisma.account.create({
                    data: {
                        accountNumber: acc.number,
                        label: acc.label,
                        accountClass: acc.class,
                        type: acc.type as any,
                        level: acc.number.length,
                        normalBalance: acc.normalBalance as any || ((acc.type === 'ASSET' || acc.type === 'EXPENSE') ? 'DEBIT' : 'CREDIT'),
                        companyId,
                        parentAccountId: parentId
                    }
                });
                accountMap[acc.number] = created.id;
            } else {
                accountMap[acc.number] = exists.id;
            }
        }
    }
}
