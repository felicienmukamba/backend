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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('🏪 Administration - Branches')
@ApiBearerAuth('JWT-auth')
@Controller('administration/branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer une succursale',
        description: 'Crée un nouveau point de vente ou agence rattaché à l\'entreprise.',
    })
    @ApiBody({ type: CreateBranchDto })
    @ApiCreatedResponse({ description: 'Succursale créée.' })
    create(@Body() createDto: CreateBranchDto) {
        return this.branchesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des succursales',
        description: 'Récupère toutes les succursales de l\'entreprise.',
    })
    @ApiOkResponse({ description: 'Liste des succursales récupérée.' })
    findAll() {
        return this.branchesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'une succursale',
        description: 'Récupère les informations détaillées d\'une succursale.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Succursale trouvée.' })
    @ApiNotFoundResponse({ description: 'Succursale introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.branchesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier une succursale',
        description: 'Met à jour les informations d\'une succursale.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateBranchDto })
    @ApiOkResponse({ description: 'Mise à jour effectuée.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateBranchDto) {
        return this.branchesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer une succursale',
        description: 'Supprime une succursale.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Succursale supprimée.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.branchesService.remove(id);
    }
}
