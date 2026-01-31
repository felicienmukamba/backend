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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('🎭 Administration - Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un rôle',
        description: 'Définit un nouveau profil de permissions (ex: Comptable, Auditeur).',
    })
    @ApiBody({ type: CreateRoleDto })
    @ApiCreatedResponse({ description: 'Rôle créé.' })
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des rôles',
        description: 'Récupère tous les rôles disponibles et leurs permissions associées.',
    })
    @ApiOkResponse({ description: 'Liste des rôles récupérée.' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un rôle',
        description: 'Affiche les permissions détaillées d\'un rôle spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Rôle trouvé.' })
    @ApiNotFoundResponse({ description: 'Rôle introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un rôle',
        description: 'Met à jour les permissions ou le nom d\'un rôle.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateRoleDto })
    @ApiOkResponse({ description: 'Rôle mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer un rôle',
        description: 'Supprime un rôle (si aucun utilisateur ne l\'utilise).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Rôle supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un rôle assigné à des utilisateurs.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.remove(id);
    }

    @Post(':id/duplicate')
    @ApiOperation({
        summary: 'Dupliquer un rôle',
        description: 'Crée une copie d\'un rôle existant.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Rôle dupliqué.' })
    duplicate(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.duplicate(id);
    }
}
