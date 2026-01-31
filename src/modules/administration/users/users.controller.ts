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
    ApiBadRequestResponse,
    ApiConflictResponse
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('👥 Administration - Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un utilisateur',
        description: 'Crée un nouveau compte utilisateur. Un email d\'invitation/vérification sera envoyé.',
    })
    @ApiBody({ type: CreateUserDto })
    @ApiCreatedResponse({ description: 'Utilisateur créé avec succès.' })
    @ApiConflictResponse({ description: 'Email ou nom d\'utilisateur déjà utilisé.' })
    @ApiBadRequestResponse({ description: 'Format d\'email invalide ou mot de passe trop faible.' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des utilisateurs',
        description: 'Récupère tous les utilisateurs de l\'entreprise courante.',
    })
    @ApiOkResponse({ description: 'Liste des utilisateurs récupérée.' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un utilisateur',
        description: 'Récupère les informations complètes d\'un utilisateur (rôle, activité, etc.).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Utilisateur trouvé.' })
    @ApiNotFoundResponse({ description: 'Utilisateur introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un utilisateur',
        description: 'Met à jour les informations d\'un utilisateur (rôle, statut, détails).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateUserDto })
    @ApiOkResponse({ description: 'Utilisateur mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Désactiver un utilisateur',
        description: 'Désactive l\'accès d\'un utilisateur (Soft Delete en réalité, pour préserver l\'audit trail).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Utilisateur désactivé/supprimé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }
}
