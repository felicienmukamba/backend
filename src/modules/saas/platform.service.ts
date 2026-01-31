import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllCompanies() {
        const companies = await this.prisma.company.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        branches: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return companies;
    }

    async createCompany(dto: any) {
        return this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    ...dto,
                    isActive: false, // Default to inactive for security
                }
            });

            // Create initial main branch
            await tx.branch.create({
                data: {
                    name: 'Siège Social',
                    code: 'HQ-01',
                    isMain: true,
                    isActive: false,
                    companyId: company.id
                }
            });

            return company;
        });
    }

    async toggleCompanyActivation(id: number, active: boolean) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Entreprise non trouvée');

        return this.prisma.$transaction(async (tx) => {
            // Update company
            const updated = await tx.company.update({
                where: { id },
                data: { isActive: active }
            });

            // If activating, activate all branches too? Or just main?
            // Usually we activate all branches if the company is activated
            await tx.branch.updateMany({
                where: { companyId: id },
                data: { isActive: active }
            });

            return updated;
        });
    }

    async getStats() {
        const [totalCompanies, activeCompanies, totalUsers] = await Promise.all([
            this.prisma.company.count(),
            this.prisma.company.count({ where: { isActive: true } }),
            this.prisma.user.count()
        ]);

        return {
            totalCompanies,
            activeCompanies,
            pendingCompanies: totalCompanies - activeCompanies,
            totalUsers
        };
    }
}
