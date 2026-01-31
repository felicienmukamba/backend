import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
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
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@ApiTags('📓 Accounting - Journals')
@ApiBearerAuth('JWT-auth')
@Controller('journals')
export class JournalsController {
    constructor(private readonly journalsService: JournalsService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un journal comptable',
        description: 'Crée un nouveau journal auxiliaire (ex: Journal des Ventes, Journal de Banque).',
    })
    @ApiBody({ type: CreateJournalDto })
    @ApiCreatedResponse({ description: 'Journal créé avec succès.' })
    @ApiBadRequestResponse({ description: 'Code journal déjà existant.' })
    create(@Body() createDto: CreateJournalDto) {
        return this.journalsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des journaux',
        description: 'Récupère tous les journaux auxiliaires configurés.',
    })
    @ApiOkResponse({ description: 'Liste des journaux récupérée.' })
    findAll() {
        return this.journalsService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un journal',
        description: 'Récupère les informations d\'un journal spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Journal trouvé.' })
    @ApiNotFoundResponse({ description: 'Journal introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.journalsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un journal',
        description: 'Met à jour les paramètres d\'un journal.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateJournalDto })
    @ApiOkResponse({ description: 'Journal mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateJournalDto) {
        return this.journalsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer un journal',
        description: 'Supprime un journal (uniquement si aucune écriture n\'y est associée).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Journal supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un journal contenant des écritures.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.journalsService.remove(id);
    }
}
