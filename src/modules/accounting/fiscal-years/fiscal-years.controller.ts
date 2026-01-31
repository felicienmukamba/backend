import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
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
    ApiConflictResponse
} from '@nestjs/swagger';
import { FiscalYearsService } from './fiscal-years.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('📅 Accounting - Fiscal Years')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('fiscal-years')
export class FiscalYearsController {
    constructor(private readonly fiscalYearsService: FiscalYearsService) { }

    @Post()
    @ApiOperation({
        summary: 'Ouvrir un nouvel exercice fiscal',
        description: 'Crée un nouvel exercice comptable (ex: 2024). Un seul exercice peut être actif à la fois.',
    })
    @ApiBody({ type: CreateFiscalYearDto })
    @ApiCreatedResponse({ description: 'Exercice ouvert avec succès.' })
    @ApiConflictResponse({ description: 'Un exercice existe déjà pour cette période ou chevauchement de dates.' })
    create(@Body() createDto: CreateFiscalYearDto) {
        return this.fiscalYearsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des exercices',
        description: 'Récupère l\'historique de tous les exercices fiscaux (ouverts et clôturés).',
    })
    @ApiOkResponse({ description: 'Historique récupéré.' })
    findAll() {
        return this.fiscalYearsService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un exercice',
        description: 'Récupère les informations d\'un exercice (dates, statut, solde).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice trouvé.' })
    @ApiNotFoundResponse({ description: 'Exercice introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.fiscalYearsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un exercice',
        description: 'Met à jour les dates ou le libellé d\'un exercice (si non clôturé).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateFiscalYearDto })
    @ApiOkResponse({ description: 'Exercice mis à jour.' })
    @ApiBadRequestResponse({ description: 'Impossible de modifier un exercice clôturé.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFiscalYearDto) {
        return this.fiscalYearsService.update(id, updateDto);
    }

    @Post(':id/close')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Clôturer un exercice fiscal',
        description: 'Effectue la clôture annuelle : génération du résultat, blocage des écritures, report à nouveau.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice clôturé avec succès.' })
    @ApiBadRequestResponse({ description: 'L\'exercice contient des écritures non validées ou est déjà clos.' })
    close(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.fiscalYearsService.closeFiscalYear(id, req.user.companyId);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer un exercice',
        description: 'Supprime un exercice fiscal (uniquement s\'il ne contient aucune écriture).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un exercice contenant des écritures.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.fiscalYearsService.remove(id);
    }
}
