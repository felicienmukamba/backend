import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, DefStatus, DefType } from '@prisma/client';

@Injectable()
export class DevicesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Register a new fiscal device (DEF)
     */
    async registerDevice(companyId: number, deviceData: {
        defNid: string;
        serialNumber?: string;
        type: DefType;
        apiEndpoint?: string;
        apiKey?: string;
    }) {
        return this.prisma.electronicFiscalDevice.create({
            data: {
                ...deviceData,
                companyId,
                status: DefStatus.ACTIVE,
                activatedAt: new Date(),
            }
        });
    }

    /**
     * Get all registered devices for a company
     */
    async getAllDevices(companyId: number) {
        return this.prisma.electronicFiscalDevice.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get device by ID
     */
    async getDevice(id: number) {
        const device = await this.prisma.electronicFiscalDevice.findUnique({
            where: { id },
        });
        if (!device) throw new NotFoundException('Dispositif non trouvé');
        return device;
    }

    /**
     * Update device status
     */
    async updateDeviceStatus(
        id: number,
        status: DefStatus
    ) {
        return this.prisma.electronicFiscalDevice.update({
            where: { id },
            data: { status }
        });
    }

    /**
     * Record device usage (e.g. update stats)
     */
    async recordDeviceUsage(id: number) {
        return this.prisma.electronicFiscalDevice.update({
            where: { id },
            data: {
                // lastUsedAt? schema has 'lastInvoiceDate'
                lastInvoiceDate: new Date(),
                totalInvoices: { increment: 1 }
            }
        });
    }
}
