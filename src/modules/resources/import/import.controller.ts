import { Controller, Post, UploadedFile, UseInterceptors, Body, Req, UseGuards, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ImportService } from '../../../common/services/import.service';
import type { EntityType } from '../../../common/services/import.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Data Import')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post(':entityType/validate')
    @ApiOperation({ summary: 'Valider un fichier d\'import' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async validateImport(
        @Param('entityType') entityType: EntityType,
        @UploadedFile() file: Express.Multer.File,
        @Req() req
    ) {
        return this.importService.validateImport(entityType, file, req.user.companyId);
    }

    @Post(':entityType/execute')
    @ApiOperation({ summary: 'Exécuter un import validé' })
    async executeImport(
        @Param('entityType') entityType: EntityType,
        @Body() body: { data: any[] },
        @Req() req
    ) {
        return this.importService.executeImport(
            entityType,
            body.data,
            req.user.companyId,
            req.user.sub
        );
    }
}
