import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('HR - Departments')
@Controller('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new department' })
    @ApiResponse({ status: 201, description: 'The department has been successfully created.' })
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        // In a real app, companyId might come from the logged-in user's context
        return this.departmentService.create(createDepartmentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all departments for a company' })
    findAll(@Query('companyId', ParseIntPipe) companyId: number) {
        return this.departmentService.findAll(companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a department by ID' })
    findOne(@Param('id') id: string) {
        return this.departmentService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a department' })
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a department' })
    remove(@Param('id') id: string) {
        return this.departmentService.remove(id);
    }
}
