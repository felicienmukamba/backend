import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { SaaSAdminGuard } from '../../common/guards/saas-admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🚀 SaaS Platform Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SaaSAdminGuard)
@Controller('platform')
export class PlatformController {
    constructor(private readonly platformService: PlatformService) { }

    @Get('companies')
    @ApiOperation({ summary: 'Liste toutes les entreprises enregistrées sur la plateforme' })
    async getCompanies() {
        return this.platformService.findAllCompanies();
    }

    @Post('companies')
    @ApiOperation({ summary: 'Créer une nouvelle entreprise sur la plateforme' })
    async createCompany(@Body() dto: any) {
        return this.platformService.createCompany(dto);
    }

    @Patch('companies/:id/activation')
    @ApiOperation({ summary: 'Activer ou désactiver une entreprise' })
    async toggleActivation(
        @Param('id') id: string,
        @Body() body: { active: boolean }
    ) {
        return this.platformService.toggleCompanyActivation(Number(id), body.active);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Statistiques globales de la plateforme SaaS' })
    async getStats() {
        return this.platformService.getStats();
    }
}
