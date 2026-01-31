import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiProduces
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('💰 Sales - Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer une nouvelle facture',
        description: 'Enregistre une nouvelle facture client. Par défaut, le statut est BROUILLON (DRAFT).',
    })
    @ApiBody({ type: CreateInvoiceDto })
    @ApiCreatedResponse({ description: 'Facture créée avec succès.' })
    @ApiBadRequestResponse({ description: 'Données invalides (client manquant, lignes vides, etc.).' })
    create(@Body() createDto: CreateInvoiceDto) {
        return this.invoicesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des factures',
        description: 'Récupère toutes les factures actives (non supprimées), triées par date décroissante.',
    })
    @ApiOkResponse({ description: 'Liste des factures récupérée.' })
    findAll() {
        return this.invoicesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'une facture',
        description: 'Récupère les informations complètes d\'une facture (lignes, paiements, taxes, client).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Facture trouvée.' })
    @ApiNotFoundResponse({ description: 'Facture introuvable.' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const invoice = await this.invoicesService.findOne(id);
        if (!invoice) return null;

        // Convert BigInts manually if service didn't
        return {
            ...invoice,
            id: invoice.id.toString(),
            invoiceLines: invoice.invoiceLines?.map(l => ({ ...l, id: l.id.toString(), invoiceId: l.invoiceId.toString() })),
            payments: invoice.payments?.map(p => ({ ...p, id: p.id.toString(), invoiceId: p.invoiceId.toString() }))
        };
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Mettre à jour une facture',
        description: 'Met à jour les informations d\'une facture en brouillon.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateInvoiceDto })
    @ApiOkResponse({ description: 'Facture mise à jour.' })
    @ApiNotFoundResponse({ description: 'Facture introuvable.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateInvoiceDto) {
        return this.invoicesService.update(id, updateDto);
    }

    @Post(':id/validate')
    @ApiOperation({
        summary: 'Valider une facture',
        description: 'Valide fiscalement une facture et génère les écritures comptables.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Facture validée.' })
    @ApiNotFoundResponse({ description: 'Facture introuvable.' })
    validate(@Param('id', ParseIntPipe) id: number) {
        return this.invoicesService.validate(id);
    }

    @Post(':id/payments')
    @ApiOperation({
        summary: 'Enregistrer un paiement',
        description: 'Ajoute un règlement partiel ou total sur une facture existante.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                amount: { type: 'number', example: 500.00 },
                paymentMethod: { type: 'string', example: 'CASH', enum: ['CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_MONEY'] },
                reference: { type: 'string', example: 'VIR-123456' },
                date: { type: 'string', format: 'date-time' }
            }
        }
    })
    @ApiCreatedResponse({ description: 'Paiement enregistré.' })
    @ApiBadRequestResponse({ description: 'Montant invalide ou dépasse le reste à payer.' })
    recordPayment(@Param('id', ParseIntPipe) id: number, @Body() paymentDto: any) {
        return this.invoicesService.recordPayment(id, paymentDto);
    }

    @Get(':id/pdf')
    @ApiOperation({
        summary: 'Télécharger le PDF',
        description: 'Génère le document PDF officiel de la facture (avec QR Code MCF si validée).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiProduces('application/pdf')
    @ApiOkResponse({
        description: 'Fichier PDF généré.',
        content: {
            'application/pdf': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    generatePDF(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement PDF generation in service
        return {
            message: 'Génération PDF (à implémenter)',
            id,
        };
    }

    // =================================================================================================
    // 🗑️ TRASH & RESTORE MANAGEMENT
    // =================================================================================================

    @Get('trash/list')
    @ApiOperation({
        summary: 'Corbeille : Factures supprimées',
        description: 'Liste des factures qui ont été soft-deleted.',
    })
    @ApiOkResponse({ description: 'Liste des factures supprimées.' })
    findTrashed() {
        return this.invoicesService.findTrashed();
    }

    @Post(':id/trash')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mettre à la corbeille',
        description: 'Supprime logiquement une facture (récupérable). Uniquement si statut BROUILLON.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Facture déplacée vers la corbeille.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer une facture validée.' })
    softDelete(@Param('id', ParseIntPipe) id: number) {
        return this.invoicesService.softDelete(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restaurer une facture',
        description: 'Récupère une facture depuis la corbeille.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Facture restaurée.' })
    restoreInvoice(@Param('id', ParseIntPipe) id: number) {
        return this.invoicesService.restoreFromTrash(id);
    }

    @Delete(':id/purge')
    @ApiOperation({
        summary: 'Supprimer définitivement',
        description: 'Supprime physiquement la facture et ses lignes. Irréversible.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Facture définitivement effacée.' })
    permanentDelete(@Param('id', ParseIntPipe) id: number) {
        return this.invoicesService.permanentDelete(id);
    }
}
