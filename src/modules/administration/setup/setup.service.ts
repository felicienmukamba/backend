import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InitializeDto } from './dto/initialize.dto';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLES } from '../../auth/permissions';

@Injectable()
export class SetupService {
    constructor(private readonly prisma: PrismaService) { }

    async initialize(dto: InitializeDto) {
        // In a SaaS model, we don't block registration if a company exists.
        // Instead, this method serves as a dedicated Registration for new tenants.

        return this.prisma.$transaction(async (tx) => {
            // 2. Create Company (Inactive by default)
            const company = await tx.company.create({
                data: {
                    companyName: dto.companyName,
                    taxId: dto.taxId,
                    nationalId: dto.nationalId,
                    rccm: dto.rccm,
                    headquartersAddress: dto.address,
                    phone: dto.phone,
                    email: dto.email,
                    taxRegime: dto.taxRegime,
                    taxCenter: dto.taxCenter,
                    isActive: false, // SaaS Pending Activation
                }
            });

            // 3. Create Main Branch (Inactive by default)
            const mainBranch = await tx.branch.create({
                data: {
                    name: dto.mainBranchName,
                    code: dto.mainBranchCode,
                    isMain: true,
                    isActive: false, // SaaS Pending Activation
                    companyId: company.id,
                } as any
            });

            // 4. Create Standard Roles
            const roleEntries = Object.entries(DEFAULT_ROLES).filter(([key]) => key !== 'SUPERADMIN');

            let adminRoleId: number | null = null;

            for (const [code, role] of roleEntries) {
                const createdRole = await tx.role.create({
                    data: {
                        companyId: company.id,
                        code: code,
                        label: role.label,
                        permissions: JSON.stringify(role.permissions),
                    },
                });

                if (code === 'ADMIN_COMPANY') {
                    adminRoleId = createdRole.id;
                }
            }

            if (!adminRoleId) {
                throw new Error('ADMIN_COMPANY role not created');
            }

            // 5. Create Super Admin User (Company Level, branchId: null)
            const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
            const user = await tx.user.create({
                data: {
                    firstName: dto.adminFirstName,
                    lastName: dto.adminLastName,
                    email: dto.adminEmail,
                    username: dto.adminEmail.split('@')[0],
                    passwordHash: passwordHash,
                    roles: { connect: { id: adminRoleId } },
                    companyId: company.id,
                    branchId: null, // Global access
                    isActive: true
                }
            });

            // 6. Create Default Fiscal Year
            await tx.fiscalYear.create({
                data: {
                    code: new Date().getFullYear().toString(),
                    startDate: new Date(new Date().getFullYear(), 0, 1),
                    endDate: new Date(new Date().getFullYear(), 11, 31),
                    companyId: company.id
                }
            });

            return {
                message: 'System initialized successfully',
                companyId: company.id,
                mainBranchId: mainBranch.id,
                userId: user.id
            };
        });
    }

    async getStatus() {
        const companyCount = await this.prisma.company.count();
        return {
            initialized: companyCount > 0
        };
    }
}
