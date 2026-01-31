import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { DgiService } from '../../dgi/application/dgi.service';
import { EntriesService } from '../../accounting/entries/entries.service';
import { StockMovementsService } from '../../resources/stock-movements/stock-movements.service';
import { EntryStatus, Prisma } from '@prisma/client';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';

import { AccountingAutomationService } from '../../accounting/automation/accounting-automation.service';
import { PaymentsService } from '../../sales/payments/payments.service';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly dgiService: DgiService,
        private readonly entriesService: EntriesService,
        private readonly stockMovementsService: StockMovementsService,
        private readonly auditTrailService: AuditTrailService,
        private readonly cls: ClsService,
        private readonly accountingAutomation: AccountingAutomationService,
        private readonly paymentsService: PaymentsService
    ) { }

    async create(createDto: CreateInvoiceDto) {
        try {
            const {
                invoiceLines,
                companyId: dtoCompanyId,
                clientId,
                createdById,
                ...invoiceData
            } = createDto;

            const rawCompanyId = this.cls.get('companyId') || dtoCompanyId;
            const companyId = rawCompanyId ? Number(rawCompanyId) : null;

            if (!companyId) throw new BadRequestException('Company ID is required');

            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { companyName: true, headquartersAddress: true, taxId: true, rccm: true, phone: true }
            });

            const linesToConfigs: Prisma.InvoiceLineCreateWithoutInvoiceInput[] = invoiceLines.map(line => ({
                quantity: new Prisma.Decimal(line.quantity),
                unitPrice: new Prisma.Decimal(line.unitPrice),
                discountRate: line.discountRate ?? 0,
                discountAmount: new Prisma.Decimal(line.discountAmount ?? 0),
                netAmountExclTax: new Prisma.Decimal(line.netAmountExclTax),
                vatAmount: new Prisma.Decimal(line.vatAmount),
                totalAmountInclTax: new Prisma.Decimal(line.totalAmountInclTax),
                description: line.description,
                product: { connect: { id: line.productId } },
                tax: { connect: { id: line.taxId } },
                company: { connect: { id: companyId } },
            }));

            const dataToCreate: Prisma.InvoiceCreateInput = {
                invoiceNumber: String(invoiceData.invoiceNumber),
                internalReference: invoiceData.internalReference,
                issuedAt: new Date(invoiceData.issuedAt),
                issuedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: invoiceData.type || 'NORMAL',
                currency: String(invoiceData.currency),
                exchangeRate: new Prisma.Decimal(invoiceData.exchangeRate),
                totalAmountExclTax: new Prisma.Decimal(invoiceLines.reduce((s, l) => s + Number(l.netAmountExclTax), 0)),
                totalVAT: new Prisma.Decimal(invoiceLines.reduce((s, l) => s + Number(l.vatAmount), 0)),
                totalAmountInclTax: new Prisma.Decimal(invoiceLines.reduce((s, l) => s + Number(l.totalAmountInclTax), 0)),
                status: invoiceData.status || 'DRAFT',
                observation: invoiceData.observation,
                sellerLegalName: String(company?.companyName || ''),
                sellerAddress: String(company?.headquartersAddress || ''),
                sellerNif: String(company?.taxId || ''),
                sellerRccm: company?.rccm || '',
                sellerPhone: String(company?.phone || ''),
                client: { connect: { id: Number(clientId) } },
                createdBy: { connect: { id: Number(createdById) } },
                company: { connect: { id: companyId } },
                branch: this.cls.get('branchId') ? { connect: { id: Number(this.cls.get('branchId')) } } : undefined,
                invoiceLines: { create: linesToConfigs }
            };

            return await this.prisma.invoice.create({
                data: dataToCreate,
                include: { invoiceLines: true }
            });
        } catch (error: any) {
            this.logger.error(`[InvoicesService] Create failed: ${error.message}`, error.stack);

            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (Array.isArray(target) && target.includes('numero_facture')) {
                    throw new BadRequestException(`Une facture avec ce numéro existe déjà.`);
                }
                throw new BadRequestException(`Violation de contrainte unique: ${target}`);
            }

            if (error.code === 'P2003') {
                throw new BadRequestException(`Données invalides : Référence introuvable (Client, Produit ou Taxe). Détails: ${error.meta?.field_name}`);
            }

            throw error;
        }
    }

    async validate(id: number) {
        try {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: BigInt(id) },
                include: { invoiceLines: { include: { product: true, tax: true } }, client: true }
            });

            if (!invoice) throw new BadRequestException('Facture non trouvée');
            if (invoice.status !== 'DRAFT') throw new BadRequestException('Seule une facture au statut BROUILLON peut être validée');

            const companyId = invoice.companyId;

            return await this.prisma.$transaction(async (tx) => {
                // 1. Update status
                console.log('Validating Invoice: Updating Status...');
                const updatedInvoice = await tx.invoice.update({
                    where: { id: BigInt(id) },
                    data: { status: 'VALIDATED' }
                });

                // 2. Generate OHADA Accounting Entry
                console.log('Validating Invoice: Accounting Automation...');
                // Delegated to AccountingAutomationService
                // Ensure this does not throw. If it does, catch it here to identify.
                try {
                    await this.accountingAutomation.handleInvoiceValidation(invoice.id);
                } catch (e) {
                    console.error('Accounting Automation Failed:', e);
                    // Decide if we validte anyway or throw. For now, strict mode:
                    throw new BadRequestException(`Erreur automatisation comptable: ${e.message}`);
                }

                // 3. Update Stock
                console.log('Validating Invoice: Stock Movement...');
                for (const line of invoice.invoiceLines) {
                    if (line.productId && line.product.type === 'GOODS') {
                        console.log(`Creating stock movement for product ${line.productId}`);
                        await tx.stockMovement.create({
                            data: {
                                productId: line.productId,
                                quantity: Number(line.quantity),
                                type: 'OUT',
                                reason: `Vente Facture ${invoice.invoiceNumber}`,
                                movementDate: new Date(),
                                companyId,
                                weightedAverageCost: Number(line.product.purchasePriceExclTax ?? 0)
                            }
                        });
                    }
                }

                // 4. Traceability
                console.log('Validating Invoice: Audit Trail...');
                const userId = this.cls.get('user')?.id;
                if (userId) await this.auditTrailService.logValidate('Invoice', invoice.id, userId, companyId);

                console.log('Validating Invoice: Done.');
                return updatedInvoice;
            });
        } catch (error: any) {
            this.logger.error(`[InvoicesService] Validate failed: ${error.message}`, error.stack);
            if (error.response && error.status) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Erreur lors de la validation de la facture');
        }
    }

    async findAll() {
        const companyId = this.cls.get('companyId');
        return this.prisma.invoice.findMany({
            where: { deletedAt: null, companyId: companyId ? Number(companyId) : undefined },
            include: { client: true, invoiceLines: true, payments: true }
        });
    }

    async findOne(id: number) {
        return this.prisma.invoice.findUnique({
            where: { id: BigInt(id), deletedAt: null },
            include: { client: true, invoiceLines: true, payments: true }
        });
    }

    async recordPayment(id: number, paymentDto: any) {
        const invoice = await this.findOne(id);
        if (!invoice) throw new BadRequestException('Facture non trouvée');
        if (invoice.status === 'DRAFT') throw new BadRequestException('Veuillez valider la facture avant d\'encaisser un paiement');

        // Delegate to PaymentsService which handles creation, status update, and automation
        return this.paymentsService.create({
            ...paymentDto,
            invoiceId: id,
            amountPaid: paymentDto.amount || paymentDto.amountPaid, // Handle generic dto mapping
            paidAt: paymentDto.date || paymentDto.paidAt || new Date().toISOString()
        } as any);
    }

    async update(id: number, updateDto: UpdateInvoiceDto) {
        const invoiceId = BigInt(id);
        const existingInvoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { invoiceLines: true }
        });

        if (!existingInvoice) throw new BadRequestException('Facture non trouvée');
        if (existingInvoice.status !== 'DRAFT') throw new BadRequestException('Seule une facture BROUILLON peut être modifiée');

        const { invoiceLines, ...invoiceData } = updateDto as any;
        const companyId = existingInvoice.companyId;

        return this.prisma.$transaction(async (tx) => {
            if (invoiceLines && invoiceLines.length > 0) {
                await tx.invoiceLine.deleteMany({ where: { invoiceId } });

                for (const line of invoiceLines) {
                    await tx.invoiceLine.create({
                        data: {
                            quantity: new Prisma.Decimal(line.quantity),
                            unitPrice: new Prisma.Decimal(line.unitPrice),
                            discountRate: line.discountRate ?? 0,
                            discountAmount: new Prisma.Decimal(line.discountAmount ?? 0),
                            netAmountExclTax: new Prisma.Decimal(line.netAmountExclTax),
                            vatAmount: new Prisma.Decimal(line.vatAmount),
                            totalAmountInclTax: new Prisma.Decimal(line.totalAmountInclTax),
                            description: line.description,
                            productId: line.productId,
                            taxId: line.taxId,
                            invoiceId,
                            companyId
                        }
                    });
                }
            }

            // Clean undefined fields
            const dataToUpdate: Prisma.InvoiceUpdateInput = {
                ...invoiceData,
                totalAmountExclTax: invoiceData.totalAmountExclTax ? new Prisma.Decimal(invoiceData.totalAmountExclTax) : undefined,
                totalVAT: invoiceData.totalVAT ? new Prisma.Decimal(invoiceData.totalVAT) : undefined,
                totalAmountInclTax: invoiceData.totalAmountInclTax ? new Prisma.Decimal(invoiceData.totalAmountInclTax) : undefined,
                exchangeRate: invoiceData.exchangeRate ? new Prisma.Decimal(invoiceData.exchangeRate) : undefined,
            };

            Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);

            return tx.invoice.update({
                where: { id: invoiceId },
                data: dataToUpdate,
                include: { invoiceLines: true }
            });
        });
    }

    async softDelete(id: number) {
        return this.prisma.invoice.update({
            where: { id: BigInt(id) },
            data: { deletedAt: new Date() }
        });
    }

    async findTrashed() {
        const companyId = this.cls.get('companyId');
        return this.prisma.invoice.findMany({
            where: {
                deletedAt: { not: null },
                companyId: companyId ? Number(companyId) : undefined
            },
            include: { client: true, invoiceLines: true }
        });
    }

    async restoreFromTrash(id: number) {
        return this.prisma.invoice.update({
            where: { id: BigInt(id) },
            data: { deletedAt: null }
        });
    }

    async remove(id: number) {
        return this.prisma.invoice.delete({ where: { id: BigInt(id) } });
    }

    async permanentDelete(id: number) {
        await this.prisma.creditNote.deleteMany({ where: { invoiceId: BigInt(id) } });
        return this.prisma.invoice.delete({ where: { id: BigInt(id) } });
    }
}
