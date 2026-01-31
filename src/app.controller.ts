import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('🏠 App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({
    summary: 'Message de bienvenue',
    description: 'Endpoint racine retournant un message de bienvenue simple. Utile pour vérifier que l\'API répond.',
  })
  @ApiOkResponse({ description: 'Message de bienvenue récupéré.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Santé du système (Health Check)',
    description: 'Retourne le statut de l\'API, l\'uptime et le timestamp serveur. Utilisé par les load balancers.',
  })
  @ApiOkResponse({
    description: 'Statut système.',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-01-08T10:00:00.000Z',
        uptime: 3600,
        environment: 'development'
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('version')
  @ApiOperation({
    summary: 'Version de l\'API',
    description: 'Retourne la version actuelle déployée du backend MILELE.',
  })
  @ApiOkResponse({
    description: 'Info version.',
    schema: {
      example: {
        version: '1.0.0',
        name: 'MILELE Accounting API',
        build: '20250101-RC1'
      },
    },
  })
  getVersion() {
    return {
      version: '1.0.0',
      name: 'MILELE Accounting API',
      build: '20250101-RC1'
    };
  }
}
