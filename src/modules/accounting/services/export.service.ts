import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { Readable } from 'stream';

export type ReportType =
    | 'balance-sheet'
    | 'profit-loss'
    | 'trial-balance'
    | 'cash-flow'
    | 'vat'
    | 'general-ledger'
    | 'balance-6-columns';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reportsService: ReportsService,
    ) { }

    /**
     * Main export method - delegates to format-specific generators
     */
    async exportReport(
        reportType: ReportType,
        fiscalYearId: number,
        format: ExportFormat,
        companyId: number
    ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
        this.logger.log(`Exporting ${reportType} for fiscal year ${fiscalYearId} in ${format} format`);

        // Fetch the report data
        const reportData = await this.getReportData(reportType, fiscalYearId, companyId);
        const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });

        switch (format) {
            case 'pdf':
                return this.generatePDF(reportType, reportData, fiscalYear, company);
            case 'excel':
                return this.generateExcel(reportType, reportData, fiscalYear, company);
            case 'csv':
                return this.generateCSV(reportType, reportData, fiscalYear, company);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Fetch report data from ReportsService
     */
    private async getReportData(reportType: ReportType, fiscalYearId: number, companyId: number): Promise<any> {
        switch (reportType) {
            case 'balance-sheet':
                return this.reportsService.getBalanceSheet(fiscalYearId, false);
            case 'profit-loss':
                return this.reportsService.getProfitAndLoss(fiscalYearId, false);
            case 'trial-balance':
                return this.reportsService.getTrialBalance(fiscalYearId, false);
            case 'cash-flow':
                return this.reportsService.getCashFlowStatement(fiscalYearId, false);
            case 'vat':
                return this.reportsService.getVATReport(fiscalYearId, false);
            case 'balance-6-columns':
                return this.reportsService.getSixColumnBalance(fiscalYearId);
            default:
                throw new Error(`Unsupported report type: ${reportType}`);
        }
    }

    /**
     * Generate PDF using pdfkit
     */
    private async generatePDF(
        reportType: ReportType,
        data: any,
        fiscalYear: any,
        company: any
    ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = new Readable({
            read() {
                // no-op
            }
        });

        doc.pipe(stream as any);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text(company.companyName, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(company.headquartersAddress || '', { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold').text(this.getReportTitle(reportType), { align: 'center' });
        doc.fontSize(10).text(`Exercice Fiscal: ${fiscalYear.code}`, { align: 'center' });
        doc.moveDown(2);

        // Report-specific rendering
        switch (reportType) {
            case 'balance-sheet':
                this.renderBalanceSheetPDF(doc, data);
                break;
            case 'profit-loss':
                this.renderProfitLossPDF(doc, data);
                break;
            case 'trial-balance':
                this.renderTrialBalancePDF(doc, data);
                break;
            case 'cash-flow':
                this.renderCashFlowPDF(doc, data);
                break;
            case 'vat':
                this.renderVATPDF(doc, data);
                break;
            case 'balance-6-columns':
                this.renderSixColumnBalancePDF(doc, data);
                break;
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').text(
            `Généré le ${new Date().toLocaleString('fr-FR')} par MILELE Accounting`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        doc.end();

        const filename = `${reportType}_${fiscalYear.code}_${Date.now()}.pdf`;
        return { stream, filename, mimeType: 'application/pdf' };
    }

    /**
     * Generate Excel using exceljs
     */
    private async generateExcel(
        reportType: ReportType,
        data: any,
        fiscalYear: any,
        company: any
    ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'MILELE Accounting';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(this.getReportTitle(reportType));

        // Header
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = company.companyName;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:D2');
        worksheet.getCell('A2').value = this.getReportTitle(reportType);
        worksheet.getCell('A2').font = { size: 14, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A3:D3');
        worksheet.getCell('A3').value = `Exercice Fiscal: ${fiscalYear.code}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };

        // Report-specific rendering
        let startRow = 5;
        switch (reportType) {
            case 'balance-sheet':
                startRow = this.renderBalanceSheetExcel(worksheet, data, startRow);
                break;
            case 'profit-loss':
                startRow = this.renderProfitLossExcel(worksheet, data, startRow);
                break;
            case 'trial-balance':
                startRow = this.renderTrialBalanceExcel(worksheet, data, startRow);
                break;
            case 'cash-flow':
                startRow = this.renderCashFlowExcel(worksheet, data, startRow);
                break;
            case 'vat':
                startRow = this.renderVATExcel(worksheet, data, startRow);
                break;
            case 'balance-6-columns':
                startRow = this.renderSixColumnBalanceExcel(worksheet, data, startRow);
                break;
        }

        // Auto-size columns
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const filename = `${reportType}_${fiscalYear.code}_${Date.now()}.xlsx`;

        return { stream, filename, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }

    /**
     * Generate CSV (simplified version)
     */
    private async generateCSV(
        reportType: ReportType,
        data: any,
        fiscalYear: any,
        company: any
    ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
        let csvContent = '';
        csvContent += `${company.companyName}\n`;
        csvContent += `${this.getReportTitle(reportType)}\n`;
        csvContent += `Exercice Fiscal: ${fiscalYear.code}\n\n`;

        // Report-specific CSV rendering
        switch (reportType) {
            case 'balance-sheet':
                csvContent += this.renderBalanceSheetCSV(data);
                break;
            case 'profit-loss':
                csvContent += this.renderProfitLossCSV(data);
                break;
            case 'trial-balance':
                csvContent += this.renderTrialBalanceCSV(data);
                break;
            case 'cash-flow':
                csvContent += this.renderCashFlowCSV(data);
                break;
            case 'vat':
                csvContent += this.renderVATCSV(data);
                break;
            case 'balance-6-columns':
                csvContent += this.renderSixColumnBalanceCSV(data);
                break;
        }

        const stream = Readable.from(csvContent);
        const filename = `${reportType}_${fiscalYear.code}_${Date.now()}.csv`;

        return { stream, filename, mimeType: 'text/csv' };
    }

    // ========== HELPER METHODS ==========

    private getReportTitle(reportType: ReportType): string {
        const titles = {
            'balance-sheet': 'Bilan Comptable OHADA',
            'profit-loss': 'Compte de Résultat',
            'trial-balance': 'Balance de Vérification',
            'cash-flow': 'Tableau de Flux de Trésorerie (TAFIRE)',
            'vat': 'Déclaration de TVA',
            'general-ledger': 'Grand Livre',
            'balance-6-columns': 'Balance à 6 Colonnes'
        };
        return titles[reportType] || reportType;
    }

    // ========== PDF RENDERERS ==========

    private renderBalanceSheetPDF(doc: typeof PDFDocument, data: any) {
        doc.fontSize(12).font('Helvetica-Bold').text('ACTIF', { underline: true });
        doc.moveDown(0.5);

        // Render assets
        doc.fontSize(10).font('Helvetica-Bold').text('Actif Immobilisé');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.assets.totalFixedAssets)}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('Actif Circulant');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.assets.totalCurrentAssets)}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('PASSIF', { underline: true });
        doc.moveDown(0.5);

        // Render liabilities
        doc.fontSize(10).font('Helvetica-Bold').text('Capitaux Propres');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.liabilities.totalEquity)}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('Dettes');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.liabilities.totalLongTermDebt)}`);
    }

    private renderProfitLossPDF(doc: typeof PDFDocument, data: any) {
        doc.fontSize(12).font('Helvetica-Bold').text('PRODUITS');
        doc.fontSize(10).font('Helvetica').text(`Total: ${this.formatCurrency(data.data.totalRevenue)}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('CHARGES');
        doc.fontSize(10).font('Helvetica').text(`Total: ${this.formatCurrency(data.data.totalExpenses)}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('RÉSULTAT NET');
        doc.fontSize(12).font('Helvetica').text(this.formatCurrency(data.data.netResult), { continued: false });
    }

    private renderTrialBalancePDF(doc: typeof PDFDocument, data: any) {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('N° Compte', 50, doc.y, { width: 80, continued: true });
        doc.text('Libellé', 130, doc.y, { width: 150, continued: true });
        doc.text('Débit', 280, doc.y, { width: 80, align: 'right', continued: true });
        doc.text('Crédit', 360, doc.y, { width: 80, align: 'right' });
        doc.moveDown();

        doc.font('Helvetica').fontSize(9);
        data.balances.slice(0, 20).forEach((line: any) => {
            const y = doc.y;
            doc.text(line.accountNumber, 50, y, { width: 80, continued: true });
            doc.text(line.label.substring(0, 25), 130, y, { width: 150, continued: true });
            doc.text(this.formatCurrency(line.totalDebit), 280, y, { width: 80, align: 'right', continued: true });
            doc.text(this.formatCurrency(line.totalCredit), 360, y, { width: 80, align: 'right' });
            doc.moveDown(0.5);
        });
    }

    private renderCashFlowPDF(doc: typeof PDFDocument, data: any) {
        doc.fontSize(10).font('Helvetica-Bold').text('Flux de trésorerie des activités opérationnelles');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.operatingActivities || 0)}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('Flux de trésorerie des activités d\'investissement');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.investingActivities || 0)}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('Flux de trésorerie des activités de financement');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.financingActivities || 0)}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Variation nette de trésorerie');
        doc.fontSize(10).font('Helvetica').text(this.formatCurrency(data.netCashFlow || 0));
    }

    private renderVATPDF(doc: typeof PDFDocument, data: any) {
        doc.fontSize(10).font('Helvetica-Bold').text('TVA Collectée');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.vatCollected)}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('TVA Déductible');
        doc.fontSize(9).font('Helvetica').text(`Total: ${this.formatCurrency(data.vatDeductible)}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('TVA à Payer');
        doc.fontSize(10).font('Helvetica').text(this.formatCurrency(data.vatToPay));
    }

    private renderSixColumnBalancePDF(doc: typeof PDFDocument, data: any) {
        // Simplified 6-column balance rendering
        doc.fontSize(8).font('Helvetica-Bold');
        const headers = ['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Déb.', 'Solde Cr.'];
        const colWidth = 80;
        headers.forEach((header, i) => {
            doc.text(header, 50 + i * colWidth, doc.y, { width: colWidth, align: 'center', continued: i < headers.length - 1 });
        });
        doc.moveDown();

        doc.font('Helvetica').fontSize(7);
        data.balanceLines.slice(0, 15).forEach((line: any) => {
            const y = doc.y;
            doc.text(line.accountNumber, 50, y, { width: colWidth, continued: true });
            doc.text(line.label.substring(0, 12), 50 + colWidth, y, { width: colWidth, continued: true });
            doc.text(this.formatCurrency(line.totalDebit), 50 + 2 * colWidth, y, { width: colWidth, align: 'right', continued: true });
            doc.text(this.formatCurrency(line.totalCredit), 50 + 3 * colWidth, y, { width: colWidth, align: 'right', continued: true });
            doc.text(this.formatCurrency(line.balanceDebit), 50 + 4 * colWidth, y, { width: colWidth, align: 'right', continued: true });
            doc.text(this.formatCurrency(line.balanceCredit), 50 + 5 * colWidth, y, { width: colWidth, align: 'right' });
            doc.moveDown(0.3);
        });
    }

    // ========== EXCEL RENDERERS ==========

    private renderBalanceSheetExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        // Assets
        worksheet.getCell(`A${row}`).value = 'ACTIF';
        worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        row++;

        worksheet.getCell(`A${row}`).value = 'Actif Immobilisé';
        worksheet.getCell(`B${row}`).value = data.assets.totalFixedAssets;
        row++;

        worksheet.getCell(`A${row}`).value = 'Actif Circulant';
        worksheet.getCell(`B${row}`).value = data.assets.totalCurrentAssets;
        row += 2;

        // Liabilities
        worksheet.getCell(`A${row}`).value = 'PASSIF';
        worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        row++;

        worksheet.getCell(`A${row}`).value = 'Capitaux Propres';
        worksheet.getCell(`B${row}`).value = data.liabilities.totalEquity;
        row++;

        worksheet.getCell(`A${row}`).value = 'Dettes';
        worksheet.getCell(`B${row}`).value = data.liabilities.totalLongTermDebt;

        return row + 2;
    }

    private renderProfitLossExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        worksheet.getCell(`A${row}`).value = 'PRODUITS';
        worksheet.getCell(`B${row}`).value = data.data.totalRevenue;
        row += 2;

        worksheet.getCell(`A${row}`).value = 'CHARGES';
        worksheet.getCell(`B${row}`).value = data.data.totalExpenses;
        row += 2;

        worksheet.getCell(`A${row}`).value = 'RÉSULTAT NET';
        worksheet.getCell(`A${row}`).font = { bold: true };
        worksheet.getCell(`B${row}`).value = data.data.netResult;
        worksheet.getCell(`B${row}`).font = { bold: true };

        return row + 2;
    }

    private renderTrialBalanceExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        // Headers
        worksheet.getCell(`A${row}`).value = 'N° Compte';
        worksheet.getCell(`B${row}`).value = 'Libellé';
        worksheet.getCell(`C${row}`).value = 'Débit';
        worksheet.getCell(`D${row}`).value = 'Crédit';
        worksheet.getRow(row).font = { bold: true };
        row++;

        // Data
        data.balances.forEach((line: any) => {
            worksheet.getCell(`A${row}`).value = line.accountNumber;
            worksheet.getCell(`B${row}`).value = line.label;
            worksheet.getCell(`C${row}`).value = line.totalDebit;
            worksheet.getCell(`D${row}`).value = line.totalCredit;
            row++;
        });

        return row + 2;
    }

    private renderCashFlowExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        worksheet.getCell(`A${row}`).value = 'Flux de trésorerie opérationnels';
        worksheet.getCell(`B${row}`).value = data.operatingActivities || 0;
        row++;

        worksheet.getCell(`A${row}`).value = 'Flux de trésorerie d\'investissement';
        worksheet.getCell(`B${row}`).value = data.investingActivities || 0;
        row++;

        worksheet.getCell(`A${row}`).value = 'Flux de trésorerie de financement';
        worksheet.getCell(`B${row}`).value = data.financingActivities || 0;
        row += 2;

        worksheet.getCell(`A${row}`).value = 'Variation nette de trésorerie';
        worksheet.getCell(`A${row}`).font = { bold: true };
        worksheet.getCell(`B${row}`).value = data.netCashFlow || 0;
        worksheet.getCell(`B${row}`).font = { bold: true };

        return row + 2;
    }

    private renderVATExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        worksheet.getCell(`A${row}`).value = 'TVA Collectée';
        worksheet.getCell(`B${row}`).value = data.vatCollected;
        row++;

        worksheet.getCell(`A${row}`).value = 'TVA Déductible';
        worksheet.getCell(`B${row}`).value = data.vatDeductible;
        row++;

        worksheet.getCell(`A${row}`).value = 'TVA à Payer';
        worksheet.getCell(`A${row}`).font = { bold: true };
        worksheet.getCell(`B${row}`).value = data.vatToPay;
        worksheet.getCell(`B${row}`).font = { bold: true };

        return row + 2;
    }

    private renderSixColumnBalanceExcel(worksheet: ExcelJS.Worksheet, data: any, startRow: number): number {
        let row = startRow;

        // Headers
        const headers = ['N° Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Débit', 'Solde Crédit'];
        headers.forEach((header, i) => {
            const colLetter = String.fromCharCode(65 + i); // A, B, C, ...
            worksheet.getCell(`${colLetter}${row}`).value = header;
        });
        worksheet.getRow(row).font = { bold: true };
        row++;

        // Data
        data.balanceLines.forEach((line: any) => {
            worksheet.getCell(`A${row}`).value = line.accountNumber;
            worksheet.getCell(`B${row}`).value = line.label;
            worksheet.getCell(`C${row}`).value = line.totalDebit;
            worksheet.getCell(`D${row}`).value = line.totalCredit;
            worksheet.getCell(`E${row}`).value = line.balanceDebit;
            worksheet.getCell(`F${row}`).value = line.balanceCredit;
            row++;
        });

        return row + 2;
    }

    // ========== CSV RENDERERS ==========

    private renderBalanceSheetCSV(data: any): string {
        let csv = 'Section,Libellé,Montant\n';
        csv += `ACTIF,Actif Immobilisé,${data.assets.totalFixedAssets}\n`;
        csv += `ACTIF,Actif Circulant,${data.assets.totalCurrentAssets}\n`;
        csv += `PASSIF,Capitaux Propres,${data.liabilities.totalEquity}\n`;
        csv += `PASSIF,Dettes,${data.liabilities.totalLongTermDebt}\n`;
        return csv;
    }

    private renderProfitLossCSV(data: any): string {
        let csv = 'Section,Montant\n';
        csv += `Produits,${data.data.totalRevenue}\n`;
        csv += `Charges,${data.data.totalExpenses}\n`;
        csv += `Résultat Net,${data.data.netResult}\n`;
        return csv;
    }

    private renderTrialBalanceCSV(data: any): string {
        let csv = 'N° Compte,Libellé,Débit,Crédit\n';
        data.balances.forEach((line: any) => {
            csv += `${line.accountNumber},"${line.label}",${line.totalDebit},${line.totalCredit}\n`;
        });
        return csv;
    }

    private renderCashFlowCSV(data: any): string {
        let csv = 'Flux de Trésorerie,Montant\n';
        csv += `Flux opérationnels,${data.operatingActivities || 0}\n`;
        csv += `Flux d'investissement,${data.investingActivities || 0}\n`;
        csv += `Flux de financement,${data.financingActivities || 0}\n`;
        csv += `Variation nette,${data.netCashFlow || 0}\n`;
        return csv;
    }

    private renderVATCSV(data: any): string {
        let csv = 'Type,Montant\n';
        csv += `TVA Collectée,${data.vatCollected}\n`;
        csv += `TVA Déductible,${data.vatDeductible}\n`;
        csv += `TVA à Payer,${data.vatToPay}\n`;
        return csv;
    }

    private renderSixColumnBalanceCSV(data: any): string {
        let csv = 'N° Compte,Libellé,Débit,Crédit,Solde Débit,Solde Crédit\n';
        data.balanceLines.forEach((line: any) => {
            csv += `${line.accountNumber},"${line.label}",${line.totalDebit},${line.totalCredit},${line.balanceDebit},${line.balanceCredit}\n`;
        });
        return csv;
    }

    private formatCurrency(value: number): string {
        return new Intl.NumberFormat('fr-CD', {
            style: 'currency',
            currency: 'CDF'
        }).format(value);
    }
}
