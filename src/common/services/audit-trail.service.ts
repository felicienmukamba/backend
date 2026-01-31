import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditTrailService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Log creation of an entity
     */
    async logCreate(
        entityType: string,
        entityId: bigint | number,
        userId: number,
        companyId: number,
        data: any,
        branchId?: number,
        metadata?: { ipAddress?: string; userAgent?: string }
    ) {
        return this.prisma.auditLog.create({
            data: {
                entityType,
                entityId: BigInt(entityId),
                action: 'CREATE',
                changes: { new: this.serialize(data) },
                userId,
                companyId,
                branchId,
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            } as any,
        });
    }

    /**
     * Log update of an entity (with before/after values)
     */
    async logUpdate(
        entityType: string,
        entityId: bigint | number,
        userId: number,
        companyId: number,
        before: any,
        after: any,
        branchId?: number,
        metadata?: { ipAddress?: string; userAgent?: string }
    ) {
        // Calculate diff between before and after
        const changes = this.calculateDiff(before, after);

        if (Object.keys(changes).length === 0) {
            // No actual changes, skip logging
            return null;
        }

        return this.prisma.auditLog.create({
            data: {
                entityType,
                entityId: BigInt(entityId),
                action: 'UPDATE',
                changes: {
                    before: this.serialize(before),
                    after: this.serialize(after),
                    diff: this.serialize(changes),
                },
                userId,
                companyId,
                branchId,
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            } as any,
        });
    }

    /**
     * Log deletion of an entity
     */
    async logDelete(
        entityType: string,
        entityId: bigint | number,
        userId: number,
        companyId: number,
        data: any,
        branchId?: number,
        metadata?: { ipAddress?: string; userAgent?: string }
    ) {
        return this.prisma.auditLog.create({
            data: {
                entityType,
                entityId: BigInt(entityId),
                action: 'DELETE',
                changes: { deleted: this.serialize(data) },
                userId,
                companyId,
                branchId,
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            } as any,
        });
    }

    /**
     * Log validation of an entity (e.g., accounting entry, invoice)
     */
    async logValidate(
        entityType: string,
        entityId: bigint | number,
        userId: number,
        companyId: number,
        branchId?: number,
        metadata?: { ipAddress?: string; userAgent?: string }
    ) {
        return this.prisma.auditLog.create({
            data: {
                entityType,
                entityId: BigInt(entityId),
                action: 'VALIDATE',
                changes: {},
                userId,
                companyId,
                branchId,
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            } as any,
        });
    }

    /**
     * Get audit trail for a specific entity
     */
    async getAuditTrail(
        entityType: string,
        entityId: bigint | number,
        options?: {
            limit?: number;
            offset?: number;
            userId?: number;
            action?: string;
        }
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                entityType,
                entityId: BigInt(entityId),
                ...(options?.userId && { userId: options.userId }),
                ...(options?.action && { action: options.action }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    }

    /**
     * Get all audit logs for a company (admin view)
     */
    async getCompanyAuditLogs(
        companyId: number,
        options?: {
            limit?: number;
            offset?: number;
            entityType?: string;
            userId?: number;
            startDate?: Date;
            endDate?: Date;
        }
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                companyId,
                ...(options?.entityType && { entityType: options.entityType }),
                ...(options?.userId && { userId: options.userId }),
                ...(options?.startDate && {
                    timestamp: { gte: options.startDate },
                }),
                ...(options?.endDate && {
                    timestamp: { lte: options.endDate },
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        });
    }

    /**
     * Calculate differences between two objects
     */
    private calculateDiff(before: any, after: any): Record<string, any> {
        const diff: Record<string, any> = {};

        // Check for changed or new fields
        for (const key in after) {
            if (JSON.stringify(before[key], (k, v) => typeof v === 'bigint' ? v.toString() : v) !==
                JSON.stringify(after[key], (k, v) => typeof v === 'bigint' ? v.toString() : v)) {
                diff[key] = {
                    before: before[key],
                    after: after[key],
                };
            }
        }

        // Check for deleted fields
        for (const key in before) {
            if (!(key in after)) {
                diff[key] = {
                    before: before[key],
                    after: null,
                };
            }
        }

        return diff;
    }

    /**
     * Deeply serialize an object, converting BigInt and Prisma Decimals to safe equivalents
     */
    private serialize(data: any): any {
        if (data === null || data === undefined) return data;

        // BigInt support
        if (typeof data === 'bigint') {
            return data.toString();
        }

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.serialize(item));
        }

        // Handle objects
        if (typeof data === 'object') {
            // Handle Prisma Decimal
            if (data.constructor?.name === 'Decimal' || (data.d && Array.isArray(data.d) && typeof data.s === 'number')) {
                return Number(data.toString());
            }

            // Handle standard objects
            const serialized: any = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    serialized[key] = this.serialize(data[key]);
                }
            }
            return serialized;
        }

        return data;
    }
}
