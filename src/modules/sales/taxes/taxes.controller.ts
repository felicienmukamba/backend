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
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@ApiTags('📊 Sales - Taxes')
@ApiBearerAuth('JWT-auth')
@Controller('taxes')
export class TaxesController {
    constructor(private readonly taxesService: TaxesService) { }

    @Post()
    @ApiOperation({
        summary: 'Configurer une taxe',
        description: 'Crée un nouveau taux de taxe (ex: TVA 16%).',
    })
    @ApiBody({ type: CreateTaxDto })
    @ApiCreatedResponse({ description: 'Taxe créée.' })
    create(@Body() createDto: CreateTaxDto) {
        return this.taxesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des taxes',
        description: 'Récupère toutes les taxes configurées dans le système.',
    })
    @ApiOkResponse({ description: 'Liste des taxes récupérée.' })
    findAll() {
        return this.taxesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'une taxe',
        description: 'Récupère les informations d\'une taxe spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Taxe trouvée.' })
    @ApiNotFoundResponse({ description: 'Taxe introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.taxesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier une taxe',
        description: 'Met à jour le taux ou le libellé d\'une taxe.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateTaxDto })
    @ApiOkResponse({ description: 'Taxe mise à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateTaxDto) {
        return this.taxesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer une taxe',
        description: 'Supprime une configuration de taxe (si non utilisée dans des factures).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Taxe supprimée.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer une taxe utilisée.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.taxesService.remove(id);
    }
}
