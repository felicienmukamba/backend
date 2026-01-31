import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RolesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
    ) { }

    async create(createRoleDto: CreateRoleDto) {
        const companyId = this.cls.get('companyId');

        // Check for duplicate label
        const existingLabel = await this.prisma.role.findFirst({
            where: {
                label: createRoleDto.label,
                companyId,
            },
        });

        if (existingLabel) {
            throw new ConflictException('Ce rôle est déjà défini.');
        }

        // Auto-generate unique code if not provided or override user input for consistency
        const code = await this.generateUniqueRoleCode(companyId);

        const role = await this.prisma.role.create({
            data: {
                ...createRoleDto,
                code, // Always use generated code
                permissions: createRoleDto.permissions ?? {}, // Default to empty object if null
                companyId,
            } as any,
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logCreate('Role', role.id, currentUserId, companyId, role);
        }

        return role;
    }

    /**
     * Generates a unique role code in format ROLE-XXXX
     */
    private async generateUniqueRoleCode(companyId: number): Promise<string> {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
            const code = `ROLE-${randomNum}`;

            // Check if code exists for this company
            const existing = await this.prisma.role.findFirst({
                where: { code, companyId }
            });

            if (!existing) {
                return code;
            }

            attempts++;
        }

        // Fallback to timestamp-based code if random generation fails
        return `ROLE-${Date.now().toString().slice(-6)}`;
    }

    async findAll() {
        return this.prisma.role.findMany();
    }

    async findOne(id: number) {
        return this.prisma.role.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateRoleDto: UpdateRoleDto) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        // Check for duplicate label if it's being updated
        if (updateRoleDto.label) {
            const existingLabel = await this.prisma.role.findFirst({
                where: {
                    label: updateRoleDto.label,
                    companyId,
                    id: { not: id },
                },
            });

            if (existingLabel) {
                throw new ConflictException('Ce rôle est déjà défini.');
            }
        }

        const updatedRole = await this.prisma.role.update({
            where: { id },
            data: {
                ...updateRoleDto,
                permissions: updateRoleDto.permissions ?? undefined, // Handle optional JSON update
            },
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logUpdate('Role', id, currentUserId, companyId, before, updatedRole);
        }

        return updatedRole;
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        // Check if role is assigned to any user
        const assignedUsersCount = await this.prisma.user.count({
            where: {
                roles: { some: { id } },
            },
        });

        if (assignedUsersCount > 0) {
            throw new BadRequestException('Impossible de supprimer ce rôle car il est déjà attribué à un utilisateur.');
        }

        const result = await this.prisma.role.delete({
            where: { id },
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logDelete('Role', id, currentUserId, companyId, before);
        }

        return result;
    }

    async duplicate(id: number) {
        const role = await this.findOne(id);
        if (!role) throw new BadRequestException('Rôle introuvable');

        const companyId = this.cls.get('companyId');
        const code = await this.generateUniqueRoleCode(companyId);

        const duplicatedRole = await this.prisma.role.create({
            data: {
                label: `${role.label} (Copie)`,
                code,
                permissions: role.permissions,
                companyId,
            },
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logCreate('Role', duplicatedRole.id, currentUserId, companyId, duplicatedRole);
        }

        return duplicatedRole;
    }
}
