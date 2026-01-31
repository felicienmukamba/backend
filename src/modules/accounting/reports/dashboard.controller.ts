import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Accounting - Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('accounting/reports/dashboard')
export class DashboardController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('stats')
    @ApiOperation({
        summary: 'Get consolidated dashboard statistics',
        description: 'Returns key financial KPIs: Net Result, Cash Flow, Pending Invoices, etc.'
    })
    @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
    async getStats(
        @Query('fiscalYearId') fiscalYearId: string,
        @Query('companyId') companyId: string,
    ) {
        return this.reportsService.getDashboardStats(
            parseInt(fiscalYearId),
            parseInt(companyId),
        );
    }

    @Get('performance')
    @ApiOperation({
        summary: 'Get monthly performance trends',
        description: 'Returns revenue vs expenses for the last 6 months'
    })
    @ApiResponse({ status: 200, description: 'Performance trends retrieved successfully' })
    async getPerformance(
        @Query('fiscalYearId') fiscalYearId: string,
    ) {
        return this.reportsService.getPerformanceStats(
            parseInt(fiscalYearId),
        );
    }
}
