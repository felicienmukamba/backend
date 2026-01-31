import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiConflictResponse
} from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { InitializeDto } from './dto/initialize.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('⚙️ Administration - Setup')
@Controller('admin')
export class SetupController {
    constructor(private readonly setupService: SetupService) { }

    @Public()
    @Post('initialize')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Initialisation Système (Onboarding)',
        description: 'Configure le super-admin et l\'entreprise par défaut lors du premier lancement. Accessible uniquement si le système est vierge.',
    })
    @ApiBody({ type: InitializeDto })
    @ApiOkResponse({ description: 'Système initialisé avec succès.' })
    @ApiConflictResponse({ description: 'Le système est déjà initialisé.' })
    async initialize(@Body() dto: InitializeDto) {
        return this.setupService.initialize(dto);
    }

    @Public()
    @Get('status')
    @ApiOperation({
        summary: 'Vérifier statut d\'initialisation',
        description: 'Indique si le système a déjà été configuré ou si l\'assistant d\'installation doit être affiché.',
    })
    @ApiOkResponse({
        description: 'Statut du système.',
        schema: {
            example: { initialized: false }
        }
    })
    async getStatus() {
        return this.setupService.getStatus();
    }
}
