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
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';

@ApiTags('📦 Resources - Stock')
@ApiBearerAuth('JWT-auth')
@Controller('stock-movements')
export class StockMovementsController {
    constructor(private readonly stockMovementsService: StockMovementsService) { }

    @Post()
    @ApiOperation({
        summary: 'Enregistrer un mouvement de stock',
        description: 'Crée une entrée, sortie ou transfert de stock manuel.',
    })
    @ApiBody({ type: CreateStockMovementDto })
    @ApiCreatedResponse({ description: 'Mouvement enregistré.' })
    @ApiBadRequestResponse({ description: 'Stock insuffisant ou produit invalide.' })
    create(@Body() createDto: CreateStockMovementDto) {
        return this.stockMovementsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Historique des mouvements',
        description: 'Récupère tous les mouvements de stock (automatiques et manuels).',
    })
    @ApiOkResponse({ description: 'Historique récupéré.' })
    findAll() {
        return this.stockMovementsService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un mouvement',
        description: 'Récupère les informations d\'un mouvement de stock spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Mouvement trouvé.' })
    @ApiNotFoundResponse({ description: 'Mouvement introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.stockMovementsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Corriger un mouvement',
        description: 'Modifie un mouvement de stock (uniquement si c\'est une erreur de saisie récente).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateStockMovementDto })
    @ApiOkResponse({ description: 'Mouvement corrigé.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStockMovementDto) {
        return this.stockMovementsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Annuler un mouvement',
        description: 'Supprime un mouvement de stock (attention aux incohérences de stock).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Mouvement annulé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.stockMovementsService.remove(id);
    }
}
