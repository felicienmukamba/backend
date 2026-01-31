import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { DuplicateEntryError, UserNotFoundError } from '../../../common/exceptions';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
    ) { }

    async create(createUserDto: CreateUserDto) {
        // Enforce companyId from context if not provided
        const companyId = createUserDto.companyId || this.cls.get('companyId');
        if (!companyId) {
            throw new BadRequestException('Company ID is required to create a user');
        }

        // Check for existing user
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            this.logger.warn(`Failed to create user: Email ${createUserDto.email} already exists`);
            throw new DuplicateEntryError('email', createUserDto.email);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.passwordHash, 12);

        try {
            const { roleIds, ...userData } = createUserDto;
            const user = await this.prisma.user.create({
                data: {
                    ...userData,
                    companyId,
                    passwordHash: hashedPassword,
                    roles: roleIds ? {
                        connect: roleIds.map(id => ({ id }))
                    } : undefined,
                } as any,
            });

            // Log Audit
            const currentUserId = this.cls.get('user')?.id;
            if (currentUserId) {
                await this.auditTrail.logCreate('User', user.id, currentUserId, companyId, user);
            }

            this.logger.log(`User created: ${user.email} (ID: ${user.id})`);
            return user;
        } catch (error) {
            this.logger.error(`Failed to create user: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll() {
        return this.prisma.user.findMany({
            include: {
                company: true,
                branch: true,
                roles: true,
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                company: true,
                branch: true,
                roles: true,
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ID ${id}`);
            throw new UserNotFoundError(id.toString());
        }

        return user;
    }

    async update(id: number, updateUserDto: any) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        if (updateUserDto.passwordHash) {
            updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.passwordHash, 12);
        }

        const { roleIds, ...userData } = updateUserDto;

        try {
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    ...userData,
                    roles: roleIds ? {
                        set: roleIds.map((id: number) => ({ id }))
                    } : undefined,
                } as any,
            });

            // Log Audit
            const currentUserId = this.cls.get('user')?.id;
            if (currentUserId && companyId) {
                await this.auditTrail.logUpdate('User', id, currentUserId, companyId, before, updatedUser);
            }

            this.logger.log(`User updated: ID ${id}`);
            return updatedUser;
        } catch (error) {
            this.logger.error(`Failed to update user ${id}: ${error.message}`);
            throw error;
        }
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id); // Ensure exists

        try {
            const result = await this.prisma.user.delete({
                where: { id },
            });

            // Log Audit
            const currentUserId = this.cls.get('user')?.id;
            if (currentUserId && companyId) {
                await this.auditTrail.logDelete('User', id, currentUserId, companyId, before);
            }

            this.logger.log(`User deleted: ID ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete user ${id}: ${error.message}`);
            throw error;
        }
    }
}
