import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
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
    ApiConsumes
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('📋 Accounting - Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer un compte comptable',
        description: 'Ajoute un nouveau compte au Plan Comptable Général (PCG) SYSCOHADA.',
    })
    @ApiBody({ type: CreateAccountDto })
    @ApiCreatedResponse({ description: 'Compte créé avec succès.' })
    @ApiBadRequestResponse({ description: 'Numéro de compte invalide ou déjà existant.' })
    create(@Body() createDto: CreateAccountDto) {
        return this.accountsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Plan Comptable',
        description: 'Récupère la liste hiérarchique de tous les comptes du plan comptable.',
    })
    @ApiOkResponse({ description: 'Liste des comptes récupérée.' })
    findAll() {
        return this.accountsService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un compte',
        description: 'Récupère les informations d\'un compte spécifique par son ID.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Compte trouvé.' })
    @ApiNotFoundResponse({ description: 'Compte introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.accountsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un compte',
        description: 'Met à jour le libellé ou les propriétés d\'un compte existant.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateAccountDto })
    @ApiOkResponse({ description: 'Compte mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAccountDto) {
        return this.accountsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer un compte',
        description: 'Supprime un compte du plan comptable (si aucune écriture n\'y est liée).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Compte supprimé.' })
    @ApiBadRequestResponse({ description: 'Impossible de supprimer un compte mouvementé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.accountsService.remove(id);
    }
    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Importer des comptes (Excel/CSV)',
        description: 'Importe une liste de comptes depuis un fichier Excel ou CSV. Trie automatiquement par hiérarchie.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiCreatedResponse({ description: 'Importation réussie.' })
    @ApiBadRequestResponse({ description: 'Fichier invalide.' })
    uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
        const companyId = Number(req.user?.companyId);
        if (isNaN(companyId) || companyId <= 0) {
            throw new BadRequestException("ID Société invalide ou manquant dans le token.");
        }
        return this.accountsService.importAccounts(file.buffer, file.originalname, companyId);
    }
}
