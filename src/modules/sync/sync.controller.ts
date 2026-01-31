import { Controller, Post, Body, UseInterceptors, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPayloadDto } from './sync.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { BigIntInterceptor } from '../../common/interceptors/bigint.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🔄 Sync - Offline Mobile/Desktop')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(BigIntInterceptor)
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Synchronisation Bidirectionnelle',
        description: 'Synchronise les données locales (App Mobile/Desktop) avec le serveur central. Gère les conflits et la déduplication.',
    })
    @ApiBody({ type: SyncPayloadDto })
    @ApiOkResponse({ description: 'Synchronisation réussie. Retourne les données mises à jour.' })
    @ApiInternalServerErrorResponse({ description: 'Erreur critique lors de la synchronisation.' })
    async sync(@Body() dto: SyncPayloadDto) {
        return this.syncService.processSync(dto);
    }
}
