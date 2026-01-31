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
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@ApiTags('🎯 Accounting - Cost Centers')
@ApiBearerAuth('JWT-auth')
@Controller('cost-centers')
export class CostCentersController {
    constructor(private readonly costCentersService: CostCentersService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un centre de coût',
        description: 'Crée une nouvelle section analytique pour le suivi des coûts par département ou projet.',
    })
    @ApiBody({ type: CreateCostCenterDto })
    @ApiCreatedResponse({ description: 'Centre de coût créé.' })
    create(@Body() createDto: CreateCostCenterDto) {
        return this.costCentersService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des centres de coûts',
        description: 'Récupère la structure analytique de l\'entreprise.',
    })
    @ApiOkResponse({ description: 'Liste récupérée.' })
    findAll() {
        return this.costCentersService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails centre de coût',
        description: 'Récupère les informations d\'un centre de coût spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Centre de coût trouvé.' })
    @ApiNotFoundResponse({ description: 'Centre de coût introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.costCentersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un centre de coût',
        description: 'Met à jour le libellé ou le code d\'un centre de coût.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateCostCenterDto })
    @ApiOkResponse({ description: 'Mise à jour effectuée.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCostCenterDto) {
        return this.costCentersService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer un centre de coût',
        description: 'Supprime un centre de coût analytique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Suppression effectuée.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.costCentersService.remove(id);
    }
}
