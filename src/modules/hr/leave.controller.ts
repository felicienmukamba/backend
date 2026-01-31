import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';

@ApiTags('HR - Leaves')
@Controller('leaves')
export class LeaveController {
    constructor(
        private readonly leaveService: LeaveService,
        private readonly cls: ClsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Request a leave' })
    create(@Body() createLeaveDto: CreateLeaveDto) {
        const companyId = this.cls.get('companyId');
        return this.leaveService.create(createLeaveDto, companyId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all leave requests' })
    findAll(@Query('employeeId') employeeId?: string) {
        const companyId = this.cls.get('companyId');
        return this.leaveService.findAll(companyId, employeeId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a leave request by ID' })
    findOne(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.leaveService.findOne(id, companyId);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Approve or Reject a leave request' })
    updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateLeaveStatusDto) {
        const companyId = this.cls.get('companyId');
        return this.leaveService.updateStatus(id, updateStatusDto, companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a pending leave request' })
    remove(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.leaveService.remove(id, companyId);
    }
}
