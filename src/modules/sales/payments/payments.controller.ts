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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('💳 Sales - Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @ApiOperation({
        summary: 'Enregistrer un paiement global',
        description: 'Enregistre un paiement pouvant être lié à une ou plusieurs factures, ou comme acompte.',
    })
    @ApiBody({ type: CreatePaymentDto })
    @ApiCreatedResponse({ description: 'Paiement enregistré avec succès.' })
    create(@Body() createDto: CreatePaymentDto) {
        return this.paymentsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Historique des paiements',
        description: 'Liste tous les paiements reçus (comptant, virement, chèque, etc.).',
    })
    @ApiOkResponse({ description: 'Historique récupéré.' })
    findAll() {
        return this.paymentsService.findAll(); // Note: BigInt serialization issue may occur here, needs global interceptor or specific handling
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un paiement',
        description: 'Récupère les informations d\'un paiement spécifique.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Paiement trouvé.' })
    @ApiNotFoundResponse({ description: 'Paiement introuvable.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Modifier un paiement',
        description: 'Met à jour les informations d\'un paiement (reférence, date) si non lettré/validé.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({ type: UpdatePaymentDto })
    @ApiOkResponse({ description: 'Paiement mis à jour.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePaymentDto) {
        return this.paymentsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Annuler un paiement',
        description: 'Supprime un enregistrement de paiement.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Paiement supprimé.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.paymentsService.remove(id);
    }
}
