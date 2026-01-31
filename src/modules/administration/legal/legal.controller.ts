import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { LegalService } from './legal.service';

@ApiTags('⚖️ Administration - Legal')
@Controller('administration/legal')
export class LegalController {
    constructor(private readonly legalService: LegalService) { }

    @Get('facture-normalisee/info')
    @ApiOperation({
        summary: 'Informations légales facturation',
        description: 'Récupère les mentions obligatoires et paramètres légaux pour la Facture Normalisée en RDC.',
    })
    @ApiOkResponse({
        description: 'Informations légales récupérées.',
        schema: {
            example: {
                country: 'CD',
                taxSystem: 'TVA',
                mandatoryMentions: ['RCCM', 'Id. Nat.', 'NIF'],
                currency: 'CDF/USD'
            }
        }
    })
    getFactureNormaliseeInfo() {
        return this.legalService.getFactureNormaliseeInfo();
    }
}
