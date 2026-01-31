import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ClsService } from 'nestjs-cls';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { AccountingAutomationService } from '../../accounting/automation/accounting-automation.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService,
        private readonly auditTrail: AuditTrailService,
        private readonly accountingAutomation: AccountingAutomationService,
    ) { }

    async create(createDto: CreatePurchaseOrderDto) {
        const companyId = this.cls.get('companyId');
        const currentUser = this.cls.get('user');

        // Generate unique order number
        const count = await this.prisma.purchaseOrder.count({ where: { companyId } });
        const orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;

        // Calculate total amount
        const totalAmount = createDto.lines.reduce(
            (sum, line) => sum + line.quantity * line.unitPrice,
            0
        );

        const purchaseOrder = await this.prisma.purchaseOrder.create({
            data: {
                orderNumber,
                supplierId: createDto.supplierId,
                orderDate: createDto.orderDate ? new Date(createDto.orderDate) : new Date(),
                expectedDate: createDto.expectedDate ? new Date(createDto.expectedDate) : null,
                currency: createDto.currency || 'USD',
                notes: createDto.notes,
                totalAmount,
                companyId,
                lines: {
                    create: createDto.lines.map(line => ({
                        productId: line.productId,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        description: line.description,
                    })),
                },
            },
            include: {
                lines: {
                    include: {
                        product: true,
                    },
                },
                supplier: true,
            },
        });

        // Audit log
        if (currentUser?.id) {
            await this.auditTrail.logCreate(
                'PurchaseOrder',
                BigInt(0), // PurchaseOrder uses UUID, audit trail expects BigInt
                currentUser.id,
                companyId,
                purchaseOrder
            );
        }

        return purchaseOrder;
    }

    async findAll(query?: { status?: string; supplierId?: number }) {
        const companyId = this.cls.get('companyId');

        const where: any = { companyId, deletedAt: null };
        if (query?.status) {
            where.status = query.status;
        }
        if (query?.supplierId) {
            where.supplierId = query.supplierId;
        }

        return this.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                lines: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { orderDate: 'desc' },
        });
    }

    async findOne(id: string) {
        const companyId = this.cls.get('companyId');

        const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                supplier: true,
                lines: {
                    include: {
                        product: true,
                    },
                },
                receptions: {
                    include: {
                        movements: true,
                    },
                },
            },
        });

        if (!purchaseOrder) {
            throw new NotFoundException('Purchase order not found');
        }

        return purchaseOrder;
    }

    async update(id: string, updateDto: UpdatePurchaseOrderDto) {
        const companyId = this.cls.get('companyId');
        const currentUser = this.cls.get('user');

        const before = await this.findOne(id);

        const updateData: any = {};
        if (updateDto.status) updateData.status = updateDto.status;
        if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
        if (updateDto.expectedDate) updateData.expectedDate = new Date(updateDto.expectedDate);

        const updated = await this.prisma.purchaseOrder.update({
            where: { id },
            data: updateData,
            include: {
                supplier: true,
                lines: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Trigger Accounting if status changed to RECEIVED
        if (updateData.status === 'RECEIVED' && before.status !== 'RECEIVED') {
            await this.accountingAutomation.handlePurchaseOrderBill(id);
        }

        // Audit log
        if (currentUser?.id) {
            await this.auditTrail.logUpdate(
                'PurchaseOrder',
                BigInt(0), // PurchaseOrder uses UUID, audit trail expects BigInt
                currentUser.id,
                companyId,
                before,
                updated
            );
        }

        return updated;
    }

    async cancel(id: string) {
        return this.update(id, { status: 'CANCELLED' } as UpdatePurchaseOrderDto);
    }

    async remove(id: string) {
        const companyId = this.cls.get('companyId');
        const currentUser = this.cls.get('user');

        const before = await this.findOne(id);

        const deleted = await this.prisma.purchaseOrder.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Audit log
        if (currentUser?.id) {
            await this.auditTrail.logDelete(
                'PurchaseOrder',
                BigInt(0), // PurchaseOrder uses UUID, audit trail expects BigInt
                currentUser.id,
                companyId,
                before
            );
        }

        return deleted;
    }
}
