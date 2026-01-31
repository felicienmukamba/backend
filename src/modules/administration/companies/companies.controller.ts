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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('🏢 Administration - Companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer une société',
        description: 'Enregistre une nouvelle entité légale (pour configuration multi-sociétés).',
    })
    @ApiBody({ type: CreateCompanyDto })
    @ApiCreatedResponse({ description: 'Société créée.' })
    create(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companiesService.create(createCompanyDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des sociétés',
        description: 'Récupère toutes les sociétés gérées.',
    })
    @ApiOkResponse({ description: 'Liste des sociétés récupérée.' })
    findAll() {
        return this.companiesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'une société',
        description: 'Récupère les informations légales (RCCM, Id. Nat, NIF) d\'une société.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Société trouvée.' })
    @ApiNotFoundResponse({ description: 'Société introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.companiesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier une société',
        description: 'Met à jour les informations légales ou l\'adresse d\'une société.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateCompanyDto })
    @ApiOkResponse({ description: 'Société mise à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCompanyDto: UpdateCompanyDto) {
        return this.companiesService.update(id, updateCompanyDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer une société',
        description: 'Supprime une société (si aucune donnée critique n\'y est liée).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Société supprimée.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.companiesService.remove(id);
    }
}
