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
    ApiQuery
} from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

@ApiTags('📖 Accounting - Entries')
@ApiBearerAuth('JWT-auth')
@Controller('entries')
export class EntriesController {
    constructor(private readonly entriesService: EntriesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer une écriture comptable',
        description: 'Enregistre une nouvelle écriture comptable équilibrée avec ses lignes. Vérifie automatiquement l\'équilibre Débit/Crédit.',
    })
    @ApiBody({ type: CreateAccountingEntryDto, description: 'Détails de l\'écriture et lignes' })
    @ApiCreatedResponse({
        description: 'Écriture créée avec succès.',
        schema: {
            example: {
                id: 123,
                journalId: 1,
                date: '2025-01-15T00:00:00.000Z',
                reference: 'OD-2025-001',
                label: 'Régularisation charges',
                status: 'PROVISIONAL',
                entryLines: [
                    { accountId: 601, debit: 1000, credit: 0 },
                    { accountId: 401, debit: 0, credit: 1000 }
                ]
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Écriture déséquilibrée, compte inexistant ou exercice fermé.' })
    create(@Body() createDto: CreateAccountingEntryDto) {
        return this.entriesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des écritures',
        description: 'Récupère toutes les écritures comptables avec pagination (optionnelle)',
    })
    @ApiOkResponse({
        description: 'Liste des écritures récupérée.',
    })
    findAll() {
        return this.entriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'une écriture',
        description: 'Récupère les informations complètes d\'une écriture, y compris ses lignes et le journal associé.',
    })
    @ApiParam({ name: 'id', description: 'Identifiant unique de l\'écriture', example: 123 })
    @ApiOkResponse({ description: 'Écriture trouvée.' })
    @ApiNotFoundResponse({ description: 'Écriture introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier une écriture',
        description: 'Met à jour les informations d\'une écriture. **Attention** : modifiable uniquement si statut = PROVISIONAL.',
    })
    @ApiParam({ name: 'id', description: 'Identifiant de l\'écriture à modifier', example: 123 })
    @ApiBody({ type: UpdateAccountingEntryDto })
    @ApiOkResponse({ description: 'Écriture mise à jour avec succès.' })
    @ApiBadRequestResponse({ description: 'Impossible de modifier une écriture validée ou clôturée.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAccountingEntryDto) {
        return this.entriesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer une écriture (Soft Delete)',
        description: 'Marque une écriture comme supprimée (corbeille). Récupérable plus tard. Uniquement si PROVISIONAL.',
    })
    @ApiParam({ name: 'id', description: 'Identifiant de l\'écriture', example: 123 })
    @ApiOkResponse({ description: 'Écriture mise à la corbeille.' })
    @ApiBadRequestResponse({ description: 'Les écritures validées ne peuvent pas être supprimées, seulement contre-passées.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.remove(id);
    }

    @Post(':id/validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Valider une écriture (Irréversible)',
        description: 'Change le statut de l\'écriture de PROVISIONAL à VALIDATED. \n\n⚠️ **Action irréversible** : une fois validée, une écriture ne peut plus être modifiée ni supprimée, conformément aux normes OHADA.',
    })
    @ApiParam({ name: 'id', description: 'ID de l\'écriture', example: 123 })
    @ApiOkResponse({
        description: 'Écriture validée avec succès.',
        schema: {
            example: {
                message: 'Écriture validée avec succès',
                entry: { id: 123, reference: 'OD-2025-001', status: 'VALIDATED' },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Écriture déjà validée ou déséquilibrée.' })
    validateEntry(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.validate(id);
    }

    // =================================================================================================
    // 🗑️ TRASH & RESTORE MANAGEMENT
    // =================================================================================================

    @Get('trash/list')
    @ApiOperation({
        summary: 'Corbeille : Liste des écritures supprimées',
        description: 'Affiche toutes les écritures qui ont été soft-deleted.',
    })
    @ApiOkResponse({ description: 'Liste des écritures dans la corbeille.' })
    findTrashed() {
        return this.entriesService.findTrashed();
    }

    @Post(':id/trash')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mettre à la corbeille',
        description: 'Alias pour la suppression soft (même effet que DELETE).',
    })
    @ApiParam({ name: 'id', example: 123 })
    @ApiOkResponse({ description: 'Écriture déplacée vers la corbeille.' })
    softDelete(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.softDelete(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restaurer une écriture',
        description: 'Récupère une écriture depuis la corbeille et la remet en statut actif (PROVISIONAL).',
    })
    @ApiParam({ name: 'id', example: 123 })
    @ApiOkResponse({ description: 'Écriture restaurée avec succès.' })
    restoreEntry(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.restoreFromTrash(id);
    }

    @Delete(':id/purge')
    @ApiOperation({
        summary: 'Suppression définitive (Admin)',
        description: 'Supprime physiquement l\'écriture de la base de données. ⚠️ À utiliser avec précaution.',
    })
    @ApiParam({ name: 'id', example: 123 })
    @ApiOkResponse({ description: 'Écriture définitivement effacée.' })
    permanentDelete(@Param('id', ParseIntPipe) id: number) {
        return this.entriesService.permanentDelete(id);
    }
}
