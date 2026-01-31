import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { StockMovementType, EntryStatus } from '@prisma/client';
import { EntriesService } from '../../accounting/entries/entries.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class StockMovementsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly entriesService: EntriesService,
        private readonly cls: ClsService
    ) { }

    async create(createDto: CreateStockMovementDto) {
        const { thirdPartyId, documentReference, ...movementData } = createDto as any;

        return this.prisma.$transaction(async (prisma) => {
            const product = await prisma.product.findUnique({ where: { id: movementData.productId } });
            if (!product) throw new Error('Produit non trouvé');

            let currentWac = Number(product.purchasePriceExclTax);
            let currentStock = product.currentStock;
            let newWac = currentWac;
            let newStock = currentStock;

            if (movementData.type === StockMovementType.IN) {
                const incomingPrice = Number(movementData.weightedAverageCost) || currentWac;
                const totalValue = (currentStock * currentWac) + (movementData.quantity * incomingPrice);
                newStock = currentStock + movementData.quantity;
                newWac = newStock > 0 ? totalValue / newStock : incomingPrice;
            } else {
                newStock = currentStock - movementData.quantity;
            }

            // 1. Create the movement
            const movement = await prisma.stockMovement.create({
                data: {
                    ...movementData,
                    weightedAverageCost: newWac,
                    branch: this.cls.get('branchId') ? { connect: { id: Number(this.cls.get('branchId')) } } : undefined,
                },
            });

            // 2. Update the product stock and WAC
            await prisma.product.update({
                where: { id: movementData.productId },
                data: {
                    currentStock: newStock,
                    purchasePriceExclTax: newWac
                }
            });

            // 3. OHADA Stock Variation Accounting
            // Account 31: Stocks de marchandises
            // Account 603: Variation des stocks de marchandises
            // Stock IN: Dr 31 / Cr 603 (increase stock asset, reduce expense)
            // Stock OUT: Dr 603 / Cr 31 (increase expense, reduce stock asset)
            try {
                const companyId = this.cls.get('companyId') || movementData.companyId;
                const userId = this.cls.get('user')?.id;

                // Find appropriate journal (ST for Stock movements)
                const journal = await prisma.journal.findFirst({
                    where: { code: 'ST', companyId: Number(companyId) }
                }) || await prisma.journal.findFirst({
                    where: { type: 'STOCK', companyId: Number(companyId) }
                });

                const fiscalYear = await prisma.fiscalYear.findFirst({
                    where: { isClosed: false, companyId: Number(companyId) },
                    orderBy: { code: 'desc' }
                });

                const [stockAccount, variationAccount] = await Promise.all([
                    prisma.account.findFirst({
                        where: { accountNumber: { startsWith: '31' }, companyId: Number(companyId) }
                    }),
                    prisma.account.findFirst({
                        where: { accountNumber: { startsWith: '603' }, companyId: Number(companyId) }
                    })
                ]);

                if (journal && fiscalYear && stockAccount && variationAccount && userId) {
                    const movementValue = movementData.quantity * newWac;
                    const isStockIn = movementData.type === StockMovementType.IN;

                    await this.entriesService.create({
                        referenceNumber: documentReference || `STOCK-${movement.id}`,
                        entryDate: movementData.movementDate || new Date(),
                        description: `${isStockIn ? 'Entrée' : 'Sortie'} stock: ${product.name} (${movementData.reason || 'Mouvement'})`,
                        status: EntryStatus.PROVISIONAL,
                        journalId: journal.id,
                        fiscalYearId: fiscalYear.id,
                        companyId: Number(companyId),
                        createdById: userId,
                        entryLines: isStockIn ? [
                            // Stock IN: Dr 31 (Stock increases)
                            {
                                accountId: stockAccount.id,
                                description: `Entrée stock: ${product.name}`,
                                debit: movementValue,
                                credit: 0,
                            },
                            // Cr 603 (Stock variation - reduces expense)
                            {
                                accountId: variationAccount.id,
                                description: `Variation stock: ${product.name}`,
                                debit: 0,
                                credit: movementValue,
                            }
                        ] : [
                            // Stock OUT: Dr 603 (Expense increases)
                            {
                                accountId: variationAccount.id,
                                description: `Sortie stock: ${product.name}`,
                                debit: movementValue,
                                credit: 0,
                            },
                            // Cr 31 (Stock decreases)
                            {
                                accountId: stockAccount.id,
                                description: `Sortie stock: ${product.name}`,
                                debit: 0,
                                credit: movementValue,
                            }
                        ]
                    } as any);
                }
            } catch (error) {
                console.error('Failed to create stock variation accounting entry:', error);
                // Continue even if accounting fails
            }

            return {
                ...movement,
                id: movement.id.toString(),
                productId: movement.productId.toString()
            };
        });
    }

    async findAll() {
        return this.prisma.stockMovement.findMany({
            include: { product: true },
        });
    }

    async findOne(id: number) {
        return this.prisma.stockMovement.findUnique({
            where: { id },
            include: { product: true },
        });
    }

    async update(id: number, updateDto: UpdateStockMovementDto) {
        return this.prisma.stockMovement.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: number) {
        return this.prisma.stockMovement.delete({
            where: { id },
        });
    }
}
