import { Injectable } from '@nestjs/common';

/**
 * Invoice PDF Generator
 * Generates PDF invoices following DGI normalized format requirements
 */
@Injectable()
export class InvoicePdfService {
    /**
     * Generate PDF for an invoice
     * Returns base64 encoded PDF or buffer
     */
    async generateInvoicePdf(invoiceData: any): Promise<{ pdf: string; filename: string }> {
        // TODO: Implement actual PDF generation using:
        // - pdfmake, puppeteer, or similar library
        // - Include all required elements:
        //   * Company header with logo
        //   * Client information
        //   * Invoice lines table
        //   * TVA breakdown
        //   * Totals
        //   * QR code
        //   * MCF signature info
        //   * DEF device info

        const filename = `facture_${invoiceData.invoiceNumber}.pdf`;

        // Mock implementation for now
        return {
            pdf: 'BASE64_PDF_DATA_HERE',
            filename,
        };
    }

    /**
     * Generate HTML template for invoice
     * Can be used for preview or PDF generation
     */
    generateInvoiceHtml(invoiceData: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture ${invoiceData.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info, .client-info { margin: 20px 0; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .invoice-table th { background-color: #f2f2f2; }
        .totals { text-align: right; margin: 20px 0; }
        .qr-code { text-align: center; margin: 30px 0; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURE NORMALISÉE</h1>
        <h2>N° ${invoiceData.invoiceNumber}</h2>
    </div>

    <div class="company-info">
        <h3>Émetteur</h3>
        <p><strong>${invoiceData.company?.companyName}</strong></p>
        <p>NIF: ${invoiceData.company?.taxId}</p>
        <p>RCCM: ${invoiceData.company?.rccm}</p>
        <p>Adresse: ${invoiceData.company?.headquartersAddress}</p>
    </div>

    <div class="client-info">
        <h3>Client</h3>
        <p><strong>${invoiceData.client?.name}</strong></p>
        <p>NIF: ${invoiceData.client?.taxId || 'N/A'}</p>
        <p>Adresse: ${invoiceData.client?.address || 'N/A'}</p>
    </div>

    <table class="invoice-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Désignation</th>
                <th>Qté</th>
                <th>Prix Unit.</th>
                <th>Remise</th>
                <th>Montant HT</th>
                <th>TVA</th>
                <th>Montant TTC</th>
            </tr>
        </thead>
        <tbody>
            ${invoiceData.invoiceLines?.map((line: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${line.description}</td>
                    <td>${line.quantity}</td>
                    <td>${line.unitPrice} ${invoiceData.currency}</td>
                    <td>${line.discountAmount}</td>
                    <td>${line.netAmountExclTax} ${invoiceData.currency}</td>
                    <td>${line.vatAmount}</td>
                    <td>${line.totalAmountInclTax} ${invoiceData.currency}</td>
                </tr>
            `).join('') || ''}
        </tbody>
    </table>

    <div class="totals">
        <p><strong>Total HT:</strong> ${invoiceData.totalAmountExclTax} ${invoiceData.currency}</p>
        <p><strong>Total TVA:</strong> ${invoiceData.totalVAT} ${invoiceData.currency}</p>
        <p><strong>Total TTC:</strong> ${invoiceData.totalAmountInclTax} ${invoiceData.currency}</p>
    </div>

    <div class="qr-code">
        ${invoiceData.qrCodeData ? `<img src="data:image/png;base64,${invoiceData.qrCodeData}" alt="QR Code" />` : ''}
        <p><small>Code QR - Signature Électronique</small></p>
    </div>

    <div class="footer">
        <p>Dispositif Électronique Fiscal: ${invoiceData.deviceId || 'N/A'}</p>
        <p>Signature MCF: ${invoiceData.mcfSignature || 'En attente'}</p>
        <p>Date de signature: ${invoiceData.mcfSignatureDate || 'N/A'}</p>
    </div>
</body>
</html>
        `.trim();
    }
}
