import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStockReceptionDto } from './dto/create-stock-reception.dto';
import { ClsService } from 'nestjs-cls';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { EntriesService } from '../../accounting/entries/entries.service';
import { EntryStatus } from '@prisma/client';

@Injectable()
export class StockReceptionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService,
        private readonly auditTrail: AuditTrailService,
        private readonly entriesService: EntriesService,
    ) { }

    async create(createDto: CreateStockReceptionDto) {
        const companyId = this.cls.get('companyId');
        const currentUser = this.cls.get('user');

        // Generate unique reception number
        const count = await this.prisma.stockReception.count({ where: { companyId } });
        const receptionNumber = `REC-${String(count + 1).padStart(6, '0')}`;

        // If linked to PO, validate and update received quantities
        let purchaseOrder: any = null;
        if (createDto.purchaseOrderId) {
            purchaseOrder = await this.prisma.purchaseOrder.findFirst({
                where: { id: createDto.purchaseOrderId, companyId },
                include: { lines: true },
            });

            if (!purchaseOrder) {
                throw new NotFoundException('Purchase order not found');
            }

            if (purchaseOrder.status === 'CANCELLED') {
                throw new BadRequestException('Cannot receive against cancelled purchase order');
            }
        }

        // Create reception with stock movements
        const stockReception = await this.prisma.stockReception.create({
            data: {
                receptionNumber,
                supplierId: createDto.supplierId,
                purchaseOrderId: createDto.purchaseOrderId,
                documentReference: createDto.documentReference,
                notes: createDto.notes,
                companyId,
                movements: {
                    create: createDto.lines.map(line => ({
                        type: 'IN',
                        productId: line.productId,
                        quantity: line.quantity,
                        weightedAverageCost: line.unitCost,
                        thirdPartyId: createDto.supplierId,
                        documentReference: createDto.documentReference,
                        reason: `Réception ${receptionNumber} - ${createDto.documentReference || ''}`,
                        companyId,
                    })),
                },
            },
            include: {
                movements: {
                    include: {
                        product: true,
                    },
                },
                supplier: true,
                purchaseOrder: true,
            },
        });

        // Update product stock quantities
        for (const line of createDto.lines) {
            await this.prisma.product.update({
                where: { id: line.productId },
                data: {
                    currentStock: {
                        increment: line.quantity,
                    },
                },
            });
        }

        // Update purchase order if linked
        if (purchaseOrder) {
            for (const line of createDto.lines) {
                const poLine = purchaseOrder.lines.find((l: any) => l.productId === line.productId);
                if (poLine) {
                    await this.prisma.purchaseOrderLine.update({
                        where: { id: poLine.id },
                        data: {
                            receivedQuantity: {
                                increment: line.quantity,
                            },
                        },
                    });
                }
            }

            // Update PO status based on received quantities
            const updatedPO = await this.prisma.purchaseOrder.findFirst({
                where: { id: createDto.purchaseOrderId },
                include: { lines: true },
            });

            const allReceived = updatedPO!.lines.every(l => l.receivedQuantity >= l.quantity);
            const someReceived = updatedPO!.lines.some(l => l.receivedQuantity > 0);

            if (allReceived) {
                await this.prisma.purchaseOrder.update({
                    where: { id: createDto.purchaseOrderId! },
                    data: { status: 'RECEIVED' },
                });
            } else if (someReceived) {
                await this.prisma.purchaseOrder.update({
                    where: { id: createDto.purchaseOrderId! },
                    data: { status: 'PARTIALLY_RECEIVED' },
                });
            }
        }

        // Generate accounting entry for the purchase (OHADA compliant)
        try {
            // Calculate amounts with VAT (assuming 16% standard rate)
            const totalHT = createDto.lines.reduce(
                (sum, line) => sum + line.quantity * line.unitCost,
                0
            );
            const vatRate = 0.16; // Standard VAT rate in DRC
            const vatAmount = totalHT * vatRate;
            const totalTTC = totalHT + vatAmount;

            // Fetch HA Journal (Purchases)
            const journal = await this.prisma.journal.findFirst({
                where: { code: 'HA', companyId },
            });

            // Fetch Active Fiscal Year
            const fiscalYear = await this.prisma.fiscalYear.findFirst({
                where: {
                    companyId,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                },
            });

            if (journal && fiscalYear) {
                const [purchaseAccount, vatDeductibleAccount, supplierAccount] = await Promise.all([
                    this.getAccountId('601', Number(companyId)), // Achats de marchandises
                    this.getAccountId('445', Number(companyId)), // TVA déductible
                    this.getAccountId('401', Number(companyId)), // Fournisseurs
                ]);

                await this.entriesService.create({
                    companyId: Number(companyId),
                    entryDate: new Date(),
                    currency: 'USD',
                    exchangeRate: 1,
                    journalId: journal.id,
                    fiscalYearId: fiscalYear.id,
                    referenceNumber: receptionNumber,
                    description: `Achat - Réception ${receptionNumber} - Fournisseur ${createDto.supplierId}`,
                    status: EntryStatus.PROVISIONAL,
                    createdById: Number(currentUser?.id || 0),
                    entryLines: [
                        // Dr: Purchases account (601) - HT
                        {
                            accountId: purchaseAccount,
                            description: 'Achats de marchandises HT',
                            debit: totalHT,
                            credit: 0,
                        },
                        // Dr: VAT Deductible (445)
                        {
                            accountId: vatDeductibleAccount,
                            description: 'TVA déductible sur achats',
                            debit: vatAmount,
                            credit: 0,
                        },
                        // Cr: Supplier account (401) - TTC
                        {
                            accountId: supplierAccount,
                            description: `Fournisseur - ${receptionNumber}`,
                            debit: 0,
                            credit: totalTTC,
                            thirdPartyId: createDto.supplierId,
                        },
                    ],
                });
            } else {
                console.error('Missing Journal HA or Active Fiscal Year for accounting entry');
            }
        } catch (error) {
            console.error('Failed to create accounting entry for reception:', error);
            // Continue even if accounting fails
        }

        // Audit log
        if (currentUser?.id) {
            await this.auditTrail.logCreate(
                'StockReception',
                BigInt(0), // StockReception uses UUID, audit trail expects BigInt
                currentUser.id,
                companyId,
                stockReception
            );
        }

        return stockReception;
    }

    async findAll(query?: { supplierId?: number; purchaseOrderId?: string }) {
        const companyId = this.cls.get('companyId');

        const where: any = { companyId, deletedAt: null };
        if (query?.supplierId) {
            where.supplierId = query.supplierId;
        }
        if (query?.purchaseOrderId) {
            where.purchaseOrderId = query.purchaseOrderId;
        }

        return this.prisma.stockReception.findMany({
            where,
            include: {
                supplier: true,
                purchaseOrder: true,
                movements: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { receptionDate: 'desc' },
        });
    }

    async findOne(id: string) {
        const companyId = this.cls.get('companyId');
        return this.prisma.stockReception.findUnique({
            where: { id, companyId },
            include: {
                supplier: true,
                purchaseOrder: true,
                movements: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    private async getAccountId(accountNumber: string, companyId: number): Promise<number> {
        const account = await this.prisma.account.findFirst({
            where: { accountNumber: { startsWith: accountNumber }, companyId },
        });
        return account ? account.id : 0;
    }
}
