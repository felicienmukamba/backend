import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { SystemSetupService } from './system-setup.service';
import { UpdateSystemSetupDto } from './dto/update-system-setup.dto';
import { PERMISSIONS } from '../../auth/permissions';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';

@ApiTags('⚙️ Administration - Setup')
@ApiBearerAuth('JWT-auth')
@Controller('system-setup')
@UseGuards(PermissionsGuard)
export class SystemSetupController {
    constructor(private readonly systemSetupService: SystemSetupService) { }

    @Get()
    @RequirePermissions(PERMISSIONS.COMPANY_SETTINGS)
    @ApiOperation({
        summary: 'Récupérer les paramètres système',
        description: 'Retourne les configurations de l\'entreprise courante (branding, devise, etc.).',
    })
    @ApiOkResponse({ description: 'Paramètres récupérés avec succès.' })
    getSystemSetup() {
        return this.systemSetupService.getSystemSetup();
    }

    @Patch()
    @RequirePermissions(PERMISSIONS.COMPANY_SETTINGS)
    @ApiOperation({
        summary: 'Mettre à jour les paramètres système',
        description: 'Modifie les configurations de l\'entreprise courante.',
    })
    @ApiOkResponse({ description: 'Paramètres mis à jour avec succès.' })
    updateSystemSetup(@Body() dto: UpdateSystemSetupDto) {
        return this.systemSetupService.updateSystemSetup(dto);
    }
}
