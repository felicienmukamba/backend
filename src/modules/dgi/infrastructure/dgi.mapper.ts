import { Injectable } from '@nestjs/common';
import { Invoice, InvoiceLine, ThirdParty, Company } from '@prisma/client';

/**
 * DGI Mapper - Maps invoice data to DGI normalized format
 * Based on "Facture Normalisée" requirements from DGI
 */
@Injectable()
export class DgiMapper {
    toDgiInvoicePayload(
        invoice: Invoice & { client: ThirdParty; invoiceLines: InvoiceLine[] },
        company?: Company
    ) {
        // Calculate TVA breakdown by rate
        const tvaBreakdown = this.calculateTvaBreakdown(invoice.invoiceLines);

        return {
            // Company information (Seller/Emitter)
            emetteur: {
                nif: company?.taxId || '',
                rccm: company?.rccm || '',
                raisonSociale: company?.companyName || '',
                adresse: company?.headquartersAddress || '',
                telephone: company?.phone || '',
                email: company?.email || '',
                regimeFiscal: company?.taxRegime || '',
            },

            // Client information (Buyer)
            contribuable: {
                type: invoice.client.type === 'CUSTOMER' ? 'CLIENT' : 'FOURNISSEUR',
                nif: invoice.client.taxId || '',
                rccm: invoice.client.rccm || '',
                nom: invoice.client.name,
                adresse: invoice.client.address || '',
                telephone: invoice.client.phone || '',
                email: invoice.client.email || '',
                assujetti_tva: invoice.client.isVatSubject,
            },

            // Invoice details
            facture: {
                numeroFacture: invoice.invoiceNumber,
                referenceInterne: invoice.internalReference || '',
                dateEmission: invoice.issuedAt.toISOString(),
                typeFacture: invoice.type === 'NORMAL' ? 'VENTE' : 'AVOIR',
                devise: invoice.currency,
                tauxChange: Number(invoice.exchangeRate),

                // Device information (DEF)
                dispositif: {
                    idDispositif: (company?.mcfConfig as any)?.deviceId || invoice.deviceId || '',
                    signature: invoice.mcfSignature || '',
                    dateSignature: invoice.mcfSignatureDate || '',
                    compteurSignature: invoice.mcfSignatureCounter || '',
                },

                // Invoice lines
                lignes: invoice.invoiceLines.map((line, index) => ({
                    numero: index + 1,
                    designation: line.description,
                    quantite: line.quantity,
                    prixUnitaire: Number(line.unitPrice),
                    tauxRemise: line.discountRate,
                    montantRemise: Number(line.discountAmount),
                    montantHT: Number(line.netAmountExclTax),
                    tauxTVA: this.extractTvaRate(line),
                    montantTVA: Number(line.vatAmount),
                    montantTTC: Number(line.totalAmountInclTax),
                })),

                // Totals
                totaux: {
                    montantHT: Number(invoice.totalAmountExclTax),
                    montantTVA: Number(invoice.totalVAT),
                    montantTTC: Number(invoice.totalAmountInclTax),

                    // TVA breakdown by rate
                    detailsTVA: tvaBreakdown,
                },

                // Payment method (simplified - should be linked to actual payment if exists)
                modePaiement: 'ESPECES', // Default, should be from Payment table

                // Additional fields
                observation: invoice.observation || '',
            },
        };
    }

    /**
     * Extract TVA rate from invoice line
     * In production, this should fetch from Tax entity
     */
    private extractTvaRate(line: InvoiceLine): number {
        if (Number(line.vatAmount) === 0) return 0;

        // Calculate rate from amounts
        const netAmount = Number(line.netAmountExclTax);
        const vatAmount = Number(line.vatAmount);

        if (netAmount > 0) {
            return Math.round((vatAmount / netAmount) * 100);
        }

        return 16; // Default TVA rate in DRC
    }

    /**
     * Calculate TVA breakdown by rate
     */
    private calculateTvaBreakdown(lines: InvoiceLine[]) {
        const breakdown = new Map<number, { baseHT: number; montantTVA: number }>();

        lines.forEach((line) => {
            const rate = this.extractTvaRate(line);
            const existing = breakdown.get(rate) || { baseHT: 0, montantTVA: 0 };

            breakdown.set(rate, {
                baseHT: existing.baseHT + Number(line.netAmountExclTax),
                montantTVA: existing.montantTVA + Number(line.vatAmount),
            });
        });

        return Array.from(breakdown.entries()).map(([taux, montants]) => ({
            tauxTVA: taux,
            baseHT: montants.baseHT,
            montantTVA: montants.montantTVA,
        }));
    }

    /**
     * Map DGI response back to invoice update data
     */
    fromDgiResponse(dgiResponse: any) {
        return {
            mcfSignature: dgiResponse.idFactureDGI || dgiResponse.signature,
            mcfSignatureDate: dgiResponse.dateSignature || new Date().toISOString(),
            mcfSignatureCounter: dgiResponse.compteurSignature || '',
            cnfCode: dgiResponse.codeCNF || '',
            qrCodeData: dgiResponse.codeQR || '',
        };
    }
}
