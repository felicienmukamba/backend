import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExportService } from '../services/export.service';
import type { ReportType, ExportFormat } from '../services/export.service';
import type { Response } from 'express';

@ApiTags('Accounting - Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('accounting/reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly exportService: ExportService
    ) { }

    @Get('dashboard/stats')
    @ApiOperation({
        summary: 'Statistiques du tableau de bord',
        description: 'Retourne les KPIs principaux pour le dashboard'
    })
    @ApiQuery({ name: 'fiscalYearId', required: true, type: Number, example: 1 })
    @ApiResponse({ status: 200, description: 'Stats générées avec succès' })
    getDashboardStats(
        @Query('fiscalYearId', ParseIntPipe) fiscalYearId: number,
    ) {
        return this.reportsService.getDashboardStats(fiscalYearId);
    }

    @Get('dashboard/performance')
    @ApiOperation({
        summary: 'Performance mensuelle',
        description: 'Retourne les revenus et charges des 6 derniers mois'
    })
    @ApiResponse({ status: 200, description: 'Performance générée avec succès' })
    async getPerformance(
        @Query('fiscalYearId', ParseIntPipe) fiscalYearId: number,
    ) {
        return this.reportsService.getPerformanceStats(fiscalYearId);
    }

    @Get('balance-sheet/:fiscalYearId')
    @ApiOperation({
        summary: 'Bilan comptable',
        description: 'Génère le bilan (actif/passif) pour un exercice fiscal',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Bilan généré avec succès',
    })
    getBalanceSheet(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getBalanceSheet(fiscalYearId);
    }

    @Post('balance-sheet/:fiscalYearId/save')
    @ApiOperation({ summary: 'Sauvegarder le Bilan' })
    async saveBalanceSheet(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number, @Req() req) {
        return this.reportsService.saveBalanceSheet(fiscalYearId, req.user.companyId);
    }

    @Get('profit-loss/:fiscalYearId')
    @ApiOperation({
        summary: 'Compte de résultat',
        description: 'Génère le compte de résultat (produits/charges) pour un exercice fiscal',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Compte de résultat généré avec succès',
    })
    getProfitAndLoss(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getProfitAndLoss(fiscalYearId);
    }

    @Post('profit-loss/:fiscalYearId/save')
    @ApiOperation({ summary: 'Sauvegarder le Compte de Résultat' })
    async saveProfitAndLoss(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number, @Req() req) {
        return this.reportsService.saveIncomeStatement(fiscalYearId, req.user.companyId);
    }

    @Get('trial-balance/:fiscalYearId')
    @ApiOperation({
        summary: 'Balance de vérification',
        description: 'Génère la balance de tous les comptes pour un exercice fiscal',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Balance générée avec succès',
    })
    getTrialBalance(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getTrialBalance(fiscalYearId);
    }

    @Get('vat/:fiscalYearId')
    @ApiOperation({
        summary: 'Rapport TVA',
        description: 'Génère le rapport de TVA collectée/déductible pour un exercice fiscal',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Rapport TVA généré avec succès',
    })
    getVATReport(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getVATReport(fiscalYearId);
    }

    @Get('cash-flow/:fiscalYearId')
    @ApiOperation({
        summary: 'Flux de Trésorerie',
        description: 'Génère le tableau des flux de trésorerie (simplifié)',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Flux de trésorerie générés avec succès',
    })
    getCashFlowStatement(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getCashFlowStatement(fiscalYearId);
    }

    @Post('cash-flow/:fiscalYearId/save')
    @ApiOperation({ summary: 'Sauvegarder les Flux de Trésorerie' })
    async saveCashFlowStatement(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number, @Req() req) {
        return this.reportsService.saveCashFlowStatement(fiscalYearId, req.user.companyId);
    }

    @Get('equity-changes/:fiscalYearId')
    @ApiOperation({
        summary: 'Tableau de variation des capitaux propres (TVCP)',
        description: 'Génère le TVCP pour un exercice fiscal',
    })
    @ApiParam({
        name: 'fiscalYearId',
        description: "ID de l'exercice fiscal",
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'TVCP généré avec succès',
    })
    getEquityChangesStatement(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getEquityChangesStatement(fiscalYearId);
    }

    @Get('general-ledger/:accountId/:fiscalYearId')
    @ApiOperation({
        summary: 'Grand Livre (General Ledger)',
        description: 'Retourne le grand livre détaillé pour un compte'
    })
    @ApiParam({ name: 'accountId', description: 'ID du compte', type: Number })
    @ApiParam({ name: 'fiscalYearId', description: "ID de l'exercice", type: Number })
    @ApiResponse({ status: 200, description: 'Grand livre généré' })
    getGeneralLedger(
        @Param('accountId', ParseIntPipe) accountId: number,
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number
    ) {
        return this.reportsService.getGeneralLedger(accountId, fiscalYearId);
    }

    @Get('journals/sales/:fiscalYearId')
    @ApiOperation({ summary: 'Journal des Ventes (VT)' })
    @ApiQuery({ name: 'month', required: false, type: Number })
    getSalesJournal(
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number,
        @Query('month', ParseIntPipe) month?: number
    ) {
        return this.reportsService.getSalesJournal(fiscalYearId, month);
    }

    @Get('journals/purchases/:fiscalYearId')
    @ApiOperation({ summary: 'Journal des Achats (HA)' })
    @ApiQuery({ name: 'month', required: false, type: Number })
    getPurchaseJournal(
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number,
        @Query('month', ParseIntPipe) month?: number
    ) {
        return this.reportsService.getPurchaseJournal(fiscalYearId, month);
    }

    @Get('journals/bank/:fiscalYearId')
    @ApiOperation({ summary: 'Journal de Banque (BQ)' })
    @ApiQuery({ name: 'month', required: false, type: Number })
    getBankJournal(
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number,
        @Query('month', ParseIntPipe) month?: number
    ) {
        return this.reportsService.getBankJournal(fiscalYearId, month);
    }

    @Get('journals/cash/:fiscalYearId')
    @ApiOperation({ summary: 'Journal de Caisse (CA)' })
    @ApiQuery({ name: 'month', required: false, type: Number })
    getCashJournal(
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number,
        @Query('month', ParseIntPipe) month?: number
    ) {
        return this.reportsService.getCashJournal(fiscalYearId, month);
    }

    @Get('balance-6-columns/:fiscalYearId')
    @ApiOperation({
        summary: 'Balance à 6 Colonnes',
        description: 'Balance OHADA avec soldes initiaux, mouvements et soldes finaux'
    })
    @ApiParam({ name: 'fiscalYearId', description: "ID de l'exercice", type: Number })
    @ApiResponse({ status: 200, description: 'Balance générée' })
    getSixColumnBalance(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getSixColumnBalance(fiscalYearId);
    }

    @Get('notes-annexes/:fiscalYearId')
    @ApiOperation({
        summary: 'Notes Annexes (OHADA)',
        description: 'Génère les notes structurelles et explicatives (Note 1, 2, 3)'
    })
    @ApiParam({ name: 'fiscalYearId', description: "ID de l'exercice", type: Number })
    @ApiResponse({ status: 200, description: 'Notes générées' })
    getNotesAnnexes(@Param('fiscalYearId', ParseIntPipe) fiscalYearId: number) {
        return this.reportsService.getNotesAnnexes(fiscalYearId);
    }

    // ========== EXPORT ENDPOINTS ==========

    @Get('export/:reportType/:format/:fiscalYearId')
    @ApiOperation({
        summary: 'Export comptable (PDF/Excel/CSV)',
        description: 'Exporte un rapport dans le format spécifié'
    })
    @ApiParam({ name: 'reportType', enum: ['balance-sheet', 'profit-loss', 'trial-balance', 'cash-flow', 'vat', 'balance-6-columns'] })
    @ApiParam({ name: 'format', enum: ['pdf', 'excel', 'csv'] })
    @ApiParam({ name: 'fiscalYearId', type: Number })
    @ApiResponse({ status: 200, description: 'Fichier exporté avec succès' })
    async exportReport(
        @Param('reportType') reportType: ReportType,
        @Param('format') format: ExportFormat,
        @Param('fiscalYearId', ParseIntPipe) fiscalYearId: number,
        @Req() req,
        @Res() res: Response
    ) {
        const { stream, filename, mimeType } = await this.exportService.exportReport(
            reportType,
            fiscalYearId,
            format,
            req.user.companyId
        );

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        stream.pipe(res);
    }
}
