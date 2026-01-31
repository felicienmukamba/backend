import { Injectable } from '@nestjs/common';
import { SyncPayloadDto } from './sync.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SyncService {
    constructor(private readonly prisma: PrismaService) { }

    async processSync(dto: SyncPayloadDto) {
        const { lastSyncTime, companyId, data } = dto;
        const serverTime = new Date();

        await this.prisma.$transaction(async (tx) => {
            // 1. Process Branches
            if (data.branches) {
                for (const branch of data.branches) {
                    const { id, companyId: _, ...branchData } = branch; // Use server's companyId
                    if (branch.backendId) {
                        await tx.branch.update({
                            where: { id: Number(branch.backendId) },
                            data: branchData,
                        });
                    } else {
                        await tx.branch.create({
                            data: { ...branchData, companyId },
                        });
                    }
                }
            }

            // 2. Process Products
            if (data.products) {
                for (const product of data.products) {
                    const { id, companyId: _, ...productData } = product;
                    if (product.backendId) {
                        await tx.product.update({
                            where: { id: Number(product.backendId) },
                            data: productData,
                        });
                    } else {
                        await tx.product.create({
                            data: { ...productData, companyId },
                        });
                    }
                }
            }

            // 3. Process Third Parties
            if (data.thirdParties) {
                for (const tp of data.thirdParties) {
                    const { id, companyId: _, ...tpData } = tp;
                    if (tp.backendId) {
                        await tx.thirdParty.update({
                            where: { id: Number(tp.backendId) },
                            data: tpData,
                        });
                    } else {
                        await tx.thirdParty.create({
                            data: { ...tpData, companyId },
                        });
                    }
                }
            }

            // 4. Process Invoices
            if (data.invoices) {
                for (const inv of data.invoices) {
                    const { id, companyId: _, invoiceLines, ...invData } = inv;

                    // Format specific fields for Prisma if needed (e.g. issuedAt)
                    const formattedInvData = {
                        ...invData,
                        issuedAt: new Date(invData.issuedAt),
                        exchangeRate: Number(invData.exchangeRate),
                        totalAmountExclTax: Number(invData.totalAmountExclTax),
                        totalVAT: Number(invData.totalVAT),
                        totalAmountInclTax: Number(invData.totalAmountInclTax),
                    };

                    if (inv.backendId) {
                        // Complex update for invoices might be needed, but for now simple update
                        await tx.invoice.update({
                            where: { id: BigInt(inv.backendId) },
                            data: formattedInvData,
                        });
                        // Handle lines separately if needed...
                    } else {
                        await tx.invoice.create({
                            data: {
                                ...formattedInvData,
                                companyId,
                                invoiceLines: {
                                    create: invoiceLines.map((line) => {
                                        const { id, companyId: _, ...lineData } = line;
                                        return {
                                            ...lineData,
                                            unitPrice: Number(lineData.unitPrice),
                                            netAmountExclTax: Number(lineData.netAmountExclTax),
                                            vatAmount: Number(lineData.vatAmount),
                                            totalAmountInclTax: Number(lineData.totalAmountInclTax),
                                            companyId,
                                        };
                                    }),
                                },
                            },
                        });
                    }
                }
            }

            // 5. Accounting Entries (Simplified)
            if (data.accountingEntries) {
                for (const entry of data.accountingEntries) {
                    const { id, companyId: _, entryLines, ...entryData } = entry;
                    if (entry.backendId) {
                        await tx.accountingEntry.update({
                            where: { id: BigInt(entry.backendId) },
                            data: { ...entryData, entryDate: new Date(entryData.entryDate) }
                        });
                    } else {
                        await tx.accountingEntry.create({
                            data: {
                                ...entryData,
                                entryDate: new Date(entryData.entryDate),
                                companyId,
                                entryLines: {
                                    create: entryLines.map(line => ({ ...line, id: undefined, companyId }))
                                }
                            }
                        })
                    }
                }
            }
        });

        // Fetch Deltas (Pull)
        const since = new Date(lastSyncTime);

        // Using simple findMany with updatedAt > since
        const deltas = {
            branches: await this.prisma.branch.findMany({ where: { companyId, updatedAt: { gt: since } } }),
            products: await this.prisma.product.findMany({ where: { companyId, updatedAt: { gt: since } } }),
            thirdParties: await this.prisma.thirdParty.findMany({ where: { companyId, updatedAt: { gt: since } } }),
            invoices: await this.prisma.invoice.findMany({
                where: { companyId, updatedAt: { gt: since } },
                include: { invoiceLines: true }
            }),
            accountingEntries: await this.prisma.accountingEntry.findMany({
                where: { companyId, updatedAt: { gt: since } },
                include: { entryLines: true }
            })
        };

        return {
            serverTime: serverTime.toISOString(),
            deltas,
        };
    }
}
