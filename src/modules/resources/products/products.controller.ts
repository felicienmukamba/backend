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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';

@ApiTags('🛍️ Resources - Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un produit/service',
        description: 'Ajoute une nouvelle référence au catalogue (Bien ou Service).',
    })
    @ApiBody({ type: CreateProductDto })
    @ApiCreatedResponse({ description: 'Produit créé.' })
    create(@Body() createDto: CreateProductDto) {
        return this.productsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Catalogue produits',
        description: 'Récupère la liste des produits et services avec pagination.',
    })
    @ApiOkResponse({ description: 'Catalogue récupéré.' })
    findAll(@Query() query: FindAllProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails produit',
        description: 'Fiche détaillée d\'un produit (prix, stock, description).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Produit trouvé.' })
    @ApiNotFoundResponse({ description: 'Produit introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Mettre à jour un produit',
        description: 'Modifie les informations d\'un produit (prix, libellé).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateProductDto })
    @ApiOkResponse({ description: 'Produit mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductDto) {
        return this.productsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Archiver un produit',
        description: 'Suppression logique du catalogue (soft delete).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Produit archivé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }

    // =================================================================================================
    // 🗑️ TRASH & RESTORE MANAGEMENT
    // =================================================================================================

    @Get('trash/list')
    @ApiOperation({
        summary: 'Corbeille : Produits supprimés',
        description: 'Liste des produits/services supprimés logiquement.',
    })
    @ApiOkResponse({ description: 'Liste récupérée.' })
    findTrashed() {
        return this.productsService.findTrashed();
    }

    @Post(':id/trash')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mettre à la corbeille',
        description: 'Alternative à DELETE : Soft Delete explicite.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Produit déplacé vers la corbeille.' })
    softDelete(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.softDelete(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restaurer un produit',
        description: 'Réintègre un produit supprimé dans le catalogue actif.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Produit restauré.' })
    restoreProduct(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.restoreFromTrash(id);
    }

    @Delete(':id/purge')
    @ApiOperation({
        summary: 'Suppression définitive',
        description: 'Supprime physiquement le produit. Irréversible.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Produit définitivement supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un produit déjà facturé ou mouvementé.' })
    permanentDelete(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.permanentDelete(id);
    }
}
