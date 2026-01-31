import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.AuditLogCreateInput) {
        return this.prisma.auditLog.create({
            data,
        });
    }

    async findAll(companyId: number) {
        return this.prisma.auditLog.findMany({
            where: { companyId },
            include: { user: { select: { username: true, firstName: true, lastName: true } } },
            orderBy: { timestamp: 'desc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.auditLog.findUnique({
            where: { id: BigInt(id) },
            include: { user: true },
        });
    }
}
