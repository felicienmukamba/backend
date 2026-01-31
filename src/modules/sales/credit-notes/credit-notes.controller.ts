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
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';

@ApiTags('📝 Sales - Credit Notes')
@ApiBearerAuth('JWT-auth')
@Controller('credit-notes')
export class CreditNotesController {
    constructor(private readonly creditNotesService: CreditNotesService) { }

    @Post()
    @ApiOperation({
        summary: 'Créer une note de crédit',
        description: 'Émet un avoir pour un client (remboursement ou annulation de facture).',
    })
    @ApiBody({ type: CreateCreditNoteDto })
    @ApiCreatedResponse({ description: 'Note de crédit créée.' })
    create(@Body() createDto: CreateCreditNoteDto) {
        return this.creditNotesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des notes de crédit',
        description: 'Récupère tous les avoirs émis.',
    })
    @ApiOkResponse({ description: 'Liste récupérée.' })
    findAll() {
        return this.creditNotesService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails note de crédit',
        description: 'Récupère les détails d\'un avoir spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Avoir trouvé.' })
    @ApiNotFoundResponse({ description: 'Avoir introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.creditNotesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier une note de crédit',
        description: 'Modifie un avoir (si statut BROUILLON).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdateCreditNoteDto })
    @ApiOkResponse({ description: 'Mise à jour effectuée.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCreditNoteDto) {
        return this.creditNotesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Supprimer une note de crédit',
        description: 'Supprime un avoir (si statut BROUILLON).',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Suppression effectuée.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.creditNotesService.remove(id);
    }
}
