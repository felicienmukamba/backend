import { Controller, Get, Post, Body, Query, Delete, Patch, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollPeriodDto, CreatePayslipDto, RecordSalaryPaymentDto } from './dto/payroll.dto';
import { CreatePayslipLineDto } from './dto/payslip-line.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';

@ApiTags('HR - Payroll Management')
@ApiBearerAuth('JWT-auth')
@Controller('hr/payroll')
export class PayrollController {
    constructor(
        private readonly payrollService: PayrollService,
        private readonly cls: ClsService,
    ) { }

    @Post('periods')
    @ApiOperation({ summary: 'Open a new payroll period' })
    createPeriod(@Body() dto: CreatePayrollPeriodDto) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.createPeriod(dto, companyId);
    }

    @Get('periods')
    @ApiOperation({ summary: 'List payroll periods' })
    findAllPeriods() {
        const companyId = this.cls.get('companyId');
        return this.payrollService.findAllPeriods(companyId);
    }

    @Post('payslips')
    @ApiOperation({ summary: 'Create a payslip (Draft)' })
    createPayslip(@Body() dto: CreatePayslipDto) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.createPayslip(dto, companyId);
    }

    @Get('payslips')
    @ApiOperation({ summary: 'List payslips' })
    findAllPayslips(@Query('periodId') periodId?: string) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.findAllPayslips(companyId, periodId);
    }

    @Delete('payslips/:id')
    @ApiOperation({ summary: 'Delete a draft payslip' })
    removePayslip(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.removePayslip(id, companyId);
    }

    @Delete('periods/:id')
    @ApiOperation({ summary: 'Delete a payroll period' })
    removePeriod(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.removePeriod(id, companyId);
    }

    @Patch('periods/:id/close')
    @ApiOperation({ summary: 'Close a payroll period' })
    closePeriod(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.closePeriod(id, companyId);
    }

    @Post('lines')
    @ApiOperation({ summary: 'Add a manual line to payslip' })
    addLine(@Body() dto: CreatePayslipLineDto) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.addPayslipLine(dto, companyId);
    }

    @Delete('lines/:id')
    @ApiOperation({ summary: 'Remove a line from payslip' })
    removeLine(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.payrollService.removePayslipLine(id, companyId);
    }
    @Post('payslips/:id/validate')
    @ApiOperation({ summary: 'Validate a payslip and generate accounting entries' })
    validatePayslip(@Param('id') id: string) {
        return this.payrollService.processPayslip(id);
    }

    @Post('payslips/:id/pay')
    @ApiOperation({ summary: 'Record salary payment' })
    recordPayment(@Param('id') id: string, @Body() dto: RecordSalaryPaymentDto) {
        const userId = this.cls.get('user')?.id;
        return this.payrollService.recordSalaryPayment(id, { ...dto, userId });
    }
}
