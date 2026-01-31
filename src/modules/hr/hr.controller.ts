import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';

@ApiTags('💼 HR - Payroll')
@ApiBearerAuth('JWT-auth')
@Controller('hr')
export class HRController {
    constructor(private payrollService: PayrollService) { }

    @Post('payslip/:id/process')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Calculer un bulletin de paie',
        description: 'Lance le calcul des éléments de paie (brut, cotisations, net) pour un bulletin spécifique.',
    })
    @ApiParam({ name: 'id', example: 'PAY-2024-001' })
    @ApiOkResponse({ description: 'Bulletin calculé avec succès.' })
    async processPayslip(@Param('id') id: string) {
        return this.payrollService.processPayslip(id);
    }

    @Post('payslip/:id/accounting')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Comptabiliser la paie',
        description: 'Génère les écritures comptables (OD de paie) pour un bulletin validé.',
    })
    @ApiParam({ name: 'id', example: 'PAY-2024-001' })
    @ApiBody({ schema: { example: { userId: 1 } } })
    @ApiOkResponse({ description: 'Écritures comptables générées.' })
    async generateAccounting(@Param('id') id: string, @Body('userId') userId: number) {
        return this.payrollService.generateAccountingEntry(id, userId || 1);
    }
}
