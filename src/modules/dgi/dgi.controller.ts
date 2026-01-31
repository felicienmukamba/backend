import { Controller, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { DgiService } from './application/dgi.service';

@ApiTags('🏛️ DGI/MCF')
@Controller('administration/dgi')
export class DgiController {
    constructor(private readonly dgiService: DgiService) { }

    @Post('trigger/:invoiceId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Soumission manuelle DGI',
        description: 'Force l\'envoi d\'une facture à la DGI (Direction Générale des Impôts) via le Module de Contrôle Fiscal (MCF). Utile en cas d\'échec de la transmission automatique.',
    })
    @ApiParam({ name: 'invoiceId', example: 1 })
    @ApiOkResponse({ description: 'Soumission déclenchée avec succès.' })
    @ApiNotFoundResponse({ description: 'Facture introuvable.' })
    @ApiBadRequestResponse({ description: 'La facture n\'est pas validée ou a déjà été signée.' })
    @ApiInternalServerErrorResponse({ description: 'Erreur de communication avec le périphérique MCF.' })
    async triggerSubmission(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
        // Cast number to bigint for internal usage
        await this.dgiService.processInvoice(BigInt(invoiceId));
        return { message: 'Soumission DGI déclenchée.' };
    }
}
