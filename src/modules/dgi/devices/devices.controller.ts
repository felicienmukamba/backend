import { Controller, Get, Post, Body, Param, Patch, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DefStatus, DefType } from '@prisma/client';

@ApiTags('DGI - Devices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dgi/devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Post('register')
    @ApiOperation({
        summary: 'Enregistrer un nouveau dispositif fiscal',
        description: 'Enregistre un DEF (Dispositif Électronique Fiscal) auprès de la DGI',
    })
    @ApiResponse({
        status: 201,
        description: 'Dispositif enregistré avec succès',
    })
    registerDevice(
        @Body() body: { defNid: string; serialNumber?: string; type: DefType; apiEndpoint?: string; apiKey?: string },
        @Req() req
    ) {
        return this.devicesService.registerDevice(req.user.companyId, body);
    }

    @Get()
    @ApiOperation({
        summary: 'Liste des dispositifs fiscaux',
        description: 'Récupère tous les dispositifs électroniques fiscaux enregistrés pour l\'entreprise',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des dispositifs',
    })
    getAllDevices(@Req() req) {
        return this.devicesService.getAllDevices(req.user.companyId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Détails d\'un dispositif',
        description: 'Récupère les informations d\'un dispositif fiscal',
    })
    @ApiResponse({
        status: 200,
        description: 'Dispositif trouvé',
    })
    @ApiResponse({
        status: 404,
        description: 'Dispositif non trouvé',
    })
    getDevice(@Param('id', ParseIntPipe) id: number) {
        return this.devicesService.getDevice(id);
    }

    @Patch(':id/status')
    @ApiOperation({
        summary: 'Mettre à jour le statut d\'un dispositif',
        description: 'Change le statut (ACTIVE, INACTIVE, SUSPENDED) d\'un dispositif',
    })
    updateDeviceStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { status: DefStatus }
    ) {
        return this.devicesService.updateDeviceStatus(id, body.status);
    }
}
