import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ClsService } from 'nestjs-cls';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from '../../common/import/import.service';


@ApiTags('💼 HR - Employees')
@ApiBearerAuth('JWT-auth')
@Controller('hr/employees')
export class EmployeesController {
    constructor(
        private employeesService: EmployeesService,
        private cls: ClsService,
        private importService: ImportService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Liste des employés' })
    async findAll(@Query() pagination: PaginationDto) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.findAll(pagination, companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Détails d\'un employé' })
    async findOne(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.findOne(id, companyId);
    }

    @Post()
    @Throttle({ medium: { ttl: 60000, limit: 10 } }) // 10 creations per minute
    @ApiOperation({ summary: 'Créer un employé' })
    async create(@Body() data: CreateEmployeeDto) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.create(data, companyId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Modifier un employé' })
    async update(@Param('id') id: string, @Body() data: UpdateEmployeeDto) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.update(id, data, companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un employé (soft delete)' })
    async remove(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.remove(id, companyId);
    }

    @Post('import')
    @Throttle({ short: { ttl: 60000, limit: 2 } }) // 2 imports per minute (heavy op)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Importer des employés via CSV/Excel' })
    async import(
        @UploadedFile() file: Express.Multer.File,
        @Body('mapping') mappingStr: string,
    ) {
        const companyId = this.cls.get('companyId');
        const mapping = mappingStr ? JSON.parse(mappingStr) : null;

        if (!file) {
            throw new BadRequestException('Fichier requis');
        }

        const rawData = await this.importService.parseFile(file.buffer, file.originalname);
        const mappedData = mapping ? this.importService.mapData(rawData, mapping) : rawData;

        return this.employeesService.importEmployees(mappedData, companyId);
    }

    @Post('bulk-delete')
    @ApiOperation({ summary: 'Supprimer plusieurs employés' })
    async bulkDelete(@Body('ids') ids: string[]) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.bulkRemove(ids, companyId);
    }

    @Post('bulk-status')
    @ApiOperation({ summary: 'Changer le statut de plusieurs employés' })
    async bulkStatus(@Body('ids') ids: string[], @Body('isActive') isActive: boolean) {
        const companyId = this.cls.get('companyId');
        return this.employeesService.bulkUpdateStatus(ids, isActive, companyId);
    }
}


