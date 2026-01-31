import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';

@ApiTags('HR - Attendance')
@Controller('attendances')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly cls: ClsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Log attendance' })
    create(@Body() createAttendanceDto: CreateAttendanceDto) {
        const companyId = this.cls.get('companyId');
        return this.attendanceService.create(createAttendanceDto, companyId);
    }

    @Get()
    @ApiOperation({ summary: 'Get attendance records' })
    findAll(@Query('employeeId') employeeId?: string, @Query('date') date?: string) {
        const companyId = this.cls.get('companyId');
        return this.attendanceService.findAll(companyId, employeeId, date);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get attendance record by ID' })
    findOne(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.attendanceService.findOne(id, companyId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update attendance record' })
    update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
        const companyId = this.cls.get('companyId');
        return this.attendanceService.update(id, updateAttendanceDto, companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete attendance record' })
    remove(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.attendanceService.remove(id, companyId);
    }
}
