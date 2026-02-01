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
    create(@Body() createDto: CreateFiscalYearDto, @Req() req) {
        return this.fiscalYearsService.create(createDto, req.user.companyId);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des exercices',
        description: 'Récupère l\'historique de tous les exercices fiscaux (ouverts et clôturés).',
    })
    @ApiOkResponse({ description: 'Historique récupéré.' })
    findAll(@Req() req) {
        return this.fiscalYearsService.findAll(req.user.companyId);
    }

    @Get('active')
    @ApiOperation({
        summary: 'Exercice fiscal actif',
        description: 'Récupère l\'exercice fiscal actuellement actif pour la société.',
    })
    @ApiOkResponse({ description: 'Exercice actif récupéré.' })
    findActive(@Req() req) {
        return this.fiscalYearsService.findActive(req.user.companyId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un exercice',
        description: 'Récupère les informations d\'un exercice (dates, statut, solde).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice trouvé.' })
    @ApiNotFoundResponse({ description: 'Exercice introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.fiscalYearsService.findOne(id, req.user.companyId);
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
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFiscalYearDto, @Req() req) {
        return this.fiscalYearsService.update(id, updateDto, req.user.companyId);
    }

    @Patch(':id/activate')
    @ApiOperation({
        summary: 'Activer un exercice fiscal',
        description: 'Active un exercice fiscal et désactive tous les autres pour cette société.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice activé avec succès.' })
    activate(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.fiscalYearsService.activate(id, req.user.companyId);
    }

    @Patch(':id/deactivate')
    @ApiOperation({
        summary: 'Désactiver un exercice fiscal',
        description: 'Désactive (clôture) un exercice fiscal.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Exercice désactivé avec succès.' })
    deactivate(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.fiscalYearsService.deactivate(id, req.user.companyId);
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
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.fiscalYearsService.remove(id, req.user.companyId);
    }
}
