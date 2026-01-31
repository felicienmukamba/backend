import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SoftDeleteService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Soft delete a record by setting deletedAt timestamp
     */
    async softDelete(model: string, where: any): Promise<any> {
        return (this.prisma as any)[model].update({
            where,
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Restore a soft-deleted record
     */
    async restore(model: string, where: any): Promise<any> {
        return (this.prisma as any)[model].update({
            where,
            data: { deletedAt: null },
        });
    }

    /**
     * Permanently delete a record
     */
    async permanentDelete(model: string, where: any): Promise<any> {
        return (this.prisma as any)[model].delete({ where });
    }

    /**
     * Get all soft-deleted records
     */
    async findTrashed(model: string): Promise<any[]> {
        return (this.prisma as any)[model].findMany({
            where: {
                deletedAt: { not: null },
            },
        });
    }

    /**
     * Check if a record is soft-deleted
     */
    async isTrashed(model: string, where: any): Promise<boolean> {
        const record = await (this.prisma as any)[model].findUnique({ where });
        return record && record.deletedAt !== null;
    }
}
