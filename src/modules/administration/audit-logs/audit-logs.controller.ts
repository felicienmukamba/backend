import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiOkResponse,
    ApiNotFoundResponse
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('📜 Administration - Audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    @ApiOperation({
        summary: 'Consulter l\'audit trail',
        description: 'Récupère la liste chronologique de toutes les actions sensibles effectuées dans le système.',
    })
    @ApiOkResponse({
        description: 'Logs récupérés.',
        schema: {
            example: [
                {
                    id: 1,
                    action: 'CREATE_INVOICE',
                    userId: 1,
                    resourceId: 'INV-001',
                    details: 'Création facture F2024001',
                    ipAddress: '192.168.1.1',
                    createdAt: '2024-01-01T10:00:00Z'
                }
            ]
        }
    })
    async findAll(@Req() req) {
        const companyId = req.user?.companyId;
        if (!companyId) {
            // For safety, though Guard should handle it
            return [];
        }
        return this.auditLogsService.findAll(Number(companyId));
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un log',
        description: 'Récupère les détails techniques complets d\'une entrée d\'audit.',
    })
    @ApiParam({ name: 'id', example: 1 })
    @ApiOkResponse({ description: 'Log trouvé.' })
    @ApiNotFoundResponse({ description: 'Log introuvable.' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.auditLogsService.findOne(id);
    }
}
