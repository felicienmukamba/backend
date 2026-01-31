import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpCode, HttpStatus } from '@nestjs/common';
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
    ApiBadRequestResponse
} from '@nestjs/swagger';
import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { FindAllThirdPartiesDto } from './dto/find-all-third-parties.dto';

@ApiTags('👤 Resources - Third Parties')
@ApiBearerAuth('JWT-auth')
@Controller('third-parties')
export class ThirdPartiesController {
    constructor(private readonly thirdPartiesService: ThirdPartiesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un tiers',
        description: 'Ajoute un nouveau client, fournisseur ou prospect.',
    })
    @ApiBody({ type: CreateThirdPartyDto })
    @ApiCreatedResponse({ description: 'Tiers créé avec succès.' })
    @ApiBadRequestResponse({ description: 'Données invalides (email dupliqué, etc.).' })
    create(@Body() createDto: CreateThirdPartyDto) {
        return this.thirdPartiesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des tiers',
        description: 'Récupère la liste des tiers (clients/fournisseurs) avec pagination.',
    })
    @ApiOkResponse({ description: 'Liste paginée récupérée.' })
    findAll(@Query() query: FindAllThirdPartiesDto) {
        return this.thirdPartiesService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un tiers',
        description: 'Récupère les informations complètes d\'un tiers.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Tiers trouvé.' })
    @ApiNotFoundResponse({ description: 'Tiers introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un tiers',
        description: 'Met à jour les coordonnées ou informations d\'un tiers.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateThirdPartyDto })
    @ApiOkResponse({ description: 'Tiers mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateThirdPartyDto) {
        return this.thirdPartiesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Archiver un tiers',
        description: 'Supprime logiquement un tiers (soft delete).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Tiers archivé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.remove(id);
    }

    @Get(':id/history')
    @ApiOperation({
        summary: 'Historique des opérations',
        description: 'Récupère l\'historique des factures/commandes pour ce tiers.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Historique récupéré.' })
    getHistory(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.getHistory(id);
    }

    // =================================================================================================
    // 🗑️ TRASH & RESTORE MANAGEMENT
    // =================================================================================================

    @Get('trash/list')
    @ApiOperation({
        summary: 'Corbeille : Tiers supprimés',
        description: 'Liste des tiers supprimés logiquement.',
    })
    @ApiOkResponse({ description: 'Liste récupérée.' })
    findTrashed() {
        return this.thirdPartiesService.findTrashed();
    }

    @Post(':id/trash')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mettre à la corbeille',
        description: 'Alternative à DELETE : Soft Delete explicite.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Tiers déplacé vers la corbeille.' })
    softDelete(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.softDelete(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restaurer un tiers',
        description: 'Réactive un tiers présent dans la corbeille.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Tiers restauré.' })
    restoreThirdParty(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.restoreFromTrash(id);
    }

    @Delete(':id/purge')
    @ApiOperation({
        summary: 'Suppression définitive',
        description: 'Supprime physiquement le tiers de la base de données. Irréversible.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Tiers définitivement supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un tiers lié à des factures ou écritures.' })
    permanentDelete(@Param('id', ParseIntPipe) id: number) {
        return this.thirdPartiesService.permanentDelete(id);
    }
}
