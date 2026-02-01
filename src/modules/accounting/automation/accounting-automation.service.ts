import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EntriesService } from '../entries/entries.service';
import { Invoice, Payment, InvoiceType, PaymentMethod } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AccountingAutomationService {
    private readonly logger = new Logger(AccountingAutomationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly entriesService: EntriesService,
        private readonly cls: ClsService,
    ) { }

    /**
     * Generate accounting entry for a validated Invoice
     */
    async handleInvoiceValidation(invoiceId: number | bigint) {
        try {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: BigInt(invoiceId) },
                include: { client: true }
            });

            if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

            // 1. Determine Journal (Journal de Vente)
            const salesJournal = await this.prisma.journal.findFirst({
                where: {
                    companyId: invoice.companyId,
                    code: 'VT' // Convention: VT for Ventes
                }
            });

            if (!salesJournal) {
                this.logger.warn(`Sales Journal (VT) not found for company ${invoice.companyId}. Skipping automation.`);
                return;
            }

            // 2. Identify Accounts
            // Client Account (411)
            const clientAccount = await this.findOrCreateClientAccount(invoice.clientId, invoice.companyId);

            // Sales Account (701 - Ventes de marchandises)
            // TODO: In future, this should come from Product Category or Invoice Line
            const salesAccount = await this.prisma.account.findFirst({
                where: { companyId: invoice.companyId, accountNumber: { startsWith: '701' } }
            });

            // VAT Account (443 - État, TVA facturée)
            const vatAccount = await this.prisma.account.findFirst({
                where: { companyId: invoice.companyId, accountNumber: { startsWith: '443' } }
            });

            if (!clientAccount || !salesAccount || !vatAccount) {
                this.logger.error(`Missing base accounts for automation. Client: ${!!clientAccount}, Sales: ${!!salesAccount}, VAT: ${!!vatAccount}`);
                return;
            }

            // 3. Prepare Entry Lines
            const entryLines: any[] = [];

            // Debit: Client (TTC)
            entryLines.push({
                accountId: clientAccount.id,
                debit: Number(invoice.totalAmountInclTax),
                credit: 0,
                description: `Facture N° ${invoice.invoiceNumber} - ${invoice.client.name}`,
                thirdPartyId: invoice.clientId,
            });

            // Credit: Sales (HT)
            entryLines.push({
                accountId: salesAccount.id,
                debit: 0,
                credit: Number(invoice.totalAmountExclTax),
                description: `Vente Marchandises - ${invoice.invoiceNumber}`,
            });

            // Credit: VAT (TVA)
            if (Number(invoice.totalVAT) > 0) {
                entryLines.push({
                    accountId: vatAccount.id,
                    debit: 0,
                    credit: Number(invoice.totalVAT),
                    description: `TVA Facturée - ${invoice.invoiceNumber}`,
                });
            }

            // 4. Create Entry
            await this.entriesService.create({
                companyId: invoice.companyId,
                journalId: salesJournal.id,
                fiscalYearId: await this.getCurrentFiscalYearId(invoice.companyId),
                entryDate: invoice.issuedAt,
                description: `Facture de vente N° ${invoice.invoiceNumber}`,
                currency: invoice.currency,
                exchangeRate: Number(invoice.exchangeRate),
                invoiceId: Number(invoice.id),
                status: 'VALIDATED',
                createdById: invoice.createdById,
                entryLines: entryLines
            } as any);

            this.logger.log(`Generated accounting entry for Invoice #${invoice.invoiceNumber}`);

        } catch (error: any) {
            this.logger.error(`Failed to generate invoice entry: ${error.message}`, error.stack);
            // Rethrow error to allow the caller (InvoicesService) to handle it and rollback if necessary
            throw new Error(`Erreur d'automatisation comptable : ${error.message}`);
        }
    }

    /**
     * Generate accounting entry for a Payment
     */
    async handlePaymentCreation(paymentId: number | bigint) {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id: BigInt(paymentId) },
                include: { invoice: { include: { client: true } } }
            });

            if (!payment) throw new Error(`Payment ${paymentId} not found`);

            // 1. Determine Journal (Journal de Trésorerie usually, or OD)
            // For now, let's look for a generic "Bank" or "Cash" journal depending on method
            const journalCode = payment.method === 'CASH' ? 'CA' : 'bq'; // CA=Caisse, BQ=Banque
            const treasuryJournal = await this.prisma.journal.findFirst({
                where: {
                    companyId: payment.companyId,
                    code: { startsWith: journalCode }
                }
            });

            if (!treasuryJournal) {
                this.logger.warn(`Treasury Journal (${journalCode}) not found. Skipping automation.`);
                return;
            }

            // 2. Identify Accounts
            // Client Account (411) - To be Credited (reduced debt)
            const clientAccount = await this.findOrCreateClientAccount(payment.invoice.clientId, payment.companyId);

            // Treasury Account (521 - Banque or 571 - Caisse)
            const treasuryAccountRoot = payment.method === 'CASH' ? '57' : '52';
            const treasuryAccount = await this.prisma.account.findFirst({
                where: { companyId: payment.companyId, accountNumber: { startsWith: treasuryAccountRoot } }
            });

            if (!clientAccount || !treasuryAccount) {
                this.logger.error(`Missing accounts. Client: ${!!clientAccount}, Treasury: ${!!treasuryAccount}`);
                return;
            }

            // 3. Create Entry
            const entryLines = [
                // Debit: Treasury (Money coming in)
                {
                    accountId: treasuryAccount.id,
                    debit: Number(payment.amountPaid),
                    credit: 0,
                    description: `Encaissement - ${payment.invoice.invoiceNumber}`,
                },
                // Credit: Client (Debt reduction)
                {
                    accountId: clientAccount.id,
                    debit: 0,
                    credit: Number(payment.amountPaid),
                    description: `Règlement Facture ${payment.invoice.invoiceNumber}`,
                    thirdPartyId: payment.invoice.clientId,
                }
            ];

            await this.entriesService.create({
                companyId: payment.companyId,
                journalId: treasuryJournal.id,
                fiscalYearId: await this.getCurrentFiscalYearId(payment.companyId),
                entryDate: payment.paidAt,
                description: `Règlement Client - ${payment.invoice.client.name}`,
                currency: 'USD', // TODO: payment.currency if available
                exchangeRate: 1, // TODO
                paymentId: Number(payment.id),
                status: 'VALIDATED',
                createdById: payment.invoice.createdById, // Or current user?
                entryLines: entryLines
            } as any);

            this.logger.log(`Generated accounting entry for Payment #${payment.id}`);

        } catch (error) {
            this.logger.error(`Failed to generate payment entry: ${error.message}`);
        }
    }

    /**
     * Generate accounting entry for a Purchase Order (treated as Bill/Invoice)
     */
    async handlePurchaseOrderBill(purchaseOrderId: string) {
        try {
            const po = await this.prisma.purchaseOrder.findUnique({
                where: { id: purchaseOrderId },
                include: { supplier: true, lines: true }
            });

            if (!po) throw new Error(`PurchaseOrder ${purchaseOrderId} not found`);

            // 1. Determine Journal (Journal des Achats)
            const purchaseJournal = await this.prisma.journal.findFirst({
                where: {
                    companyId: po.companyId,
                    code: 'HA' // Convention: HA for Achats
                }
            });

            if (!purchaseJournal) {
                this.logger.warn(`Purchase Journal (HA) not found for company ${po.companyId}. Skipping automation.`);
                return;
            }

            // 2. Identify Accounts
            // Supplier Account (401)
            const supplierAccount = await this.findOrCreateSupplierAccount(po.supplierId, po.companyId);

            // Purchase Account (601 - Achats de marchandises)
            // TODO: Refine based on product type
            const purchaseAccount = await this.prisma.account.findFirst({
                where: { companyId: po.companyId, accountNumber: { startsWith: '601' } }
            });

            // VAT Account (445 - État, TVA Récupérable)
            const vatAccount = await this.prisma.account.findFirst({
                where: { companyId: po.companyId, accountNumber: { startsWith: '445' } }
            });

            if (!supplierAccount || !purchaseAccount) {
                this.logger.error(`Missing base accounts for purchase automation. Supplier: ${!!supplierAccount}, Purchase: ${!!purchaseAccount}`);
                return;
            }

            // 3. Calculate Amounts (Simple assumption: PO Amount is HT, apply VAT if supplier has VAT)
            const amountExclTax = Number(po.totalAmount);
            let vatAmount = 0;
            if (po.supplier.isVatSubject) {
                vatAmount = amountExclTax * 0.16; // Fixed 16% for main rate
            }
            const amountInclTax = amountExclTax + vatAmount;

            // 4. Prepare Entry Lines
            const entryLines: any[] = [];

            // Debit: Purchase (HT)
            entryLines.push({
                accountId: purchaseAccount.id,
                debit: amountExclTax,
                credit: 0,
                description: `Achat Marchandises - ${po.orderNumber}`,
            });

            // Debit: VAT (TVA)
            if (vatAmount > 0 && vatAccount) {
                entryLines.push({
                    accountId: vatAccount.id,
                    debit: vatAmount,
                    credit: 0,
                    description: `TVA Récupérable - ${po.orderNumber}`,
                });
            }

            // Credit: Supplier (TTC)
            entryLines.push({
                accountId: supplierAccount.id,
                debit: 0,
                credit: amountInclTax,
                description: `Facture Fournisseur - ${po.supplier.name}`,
                thirdPartyId: po.supplierId,
            });

            // 5. Create Entry
            await this.entriesService.create({
                companyId: po.companyId,
                journalId: purchaseJournal.id,
                fiscalYearId: await this.getCurrentFiscalYearId(po.companyId),
                entryDate: po.orderDate, // usage date of order as inv date for now
                description: `Facture d'achat N° ${po.orderNumber}`,
                currency: po.currency,
                exchangeRate: 1, // Default
                // TODO: Link to PO if schema allows, or use description
                status: 'VALIDATED',
                createdById: this.cls.get('user')?.id, // Current user
                entryLines: entryLines
            } as any);

            this.logger.log(`Generated accounting entry for Purchase Order #${po.orderNumber}`);

        } catch (error) {
            this.logger.error(`Failed to generate purchase entry: ${error.message}`, error.stack);
        }
    }

    private async findOrCreateSupplierAccount(supplierId: number, companyId: number) {
        return this.prisma.account.findFirst({
            where: { companyId, accountNumber: { startsWith: '401' } }
        });
    }

    // --- Helpers ---

    private async findOrCreateClientAccount(clientId: number, companyId: number) {
        // Try to find specific auxiliary account
        // Logic: Check if ThirdParty has accountId linked? 
        // For now, return the Collective Account 4111 ("Clients")
        return this.prisma.account.findFirst({
            where: { companyId, accountNumber: { startsWith: '411' } }
        });
    }

    private async getCurrentFiscalYearId(companyId: number): Promise<number> {
        const today = new Date();
        const fy = await this.prisma.fiscalYear.findFirst({
            where: {
                companyId,
                startDate: { lte: today },
                endDate: { gte: today }
            }
        });
        return fy ? fy.id : 0; // 0 will likely fail foreign key, but handled by service error
    }
}
