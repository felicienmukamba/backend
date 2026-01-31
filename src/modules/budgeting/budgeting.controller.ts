import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto, CreateBudgetLineDto, UpdateBudgetDto, UpdateBudgetLineDto } from './dto/budget.dto';
import { ClsService } from 'nestjs-cls';

@ApiTags('💵 Budgeting')
@ApiBearerAuth('JWT-auth')
@Controller('budgeting')
export class BudgetingController {
    constructor(
        private readonly budgetService: BudgetService,
        private readonly cls: ClsService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new budget' })
    create(@Body() dto: CreateBudgetDto) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.create(dto, companyId);
    }

    @Get()
    @ApiOperation({ summary: 'List all budgets' })
    findAll() {
        const companyId = this.cls.get('companyId');
        return this.budgetService.findAll(companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get budget details' })
    findOne(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.findOne(id, companyId);
    }

    @Post('lines')
    @ApiOperation({ summary: 'Add a line to a budget' })
    addLine(@Body() dto: CreateBudgetLineDto) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.addLine(dto, companyId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update budget details' })
    update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.update(id, dto, companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a budget' })
    remove(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.remove(id, companyId);
    }

    @Patch('lines/:id')
    @ApiOperation({ summary: 'Update budget line' })
    updateLine(@Param('id') id: string, @Body() dto: UpdateBudgetLineDto) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.updateLine(id, dto, companyId);
    }

    @Delete('lines/:id')
    @ApiOperation({ summary: 'Delete budget line' })
    removeLine(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.budgetService.removeLine(id, companyId);
    }

    @Get(':id/execution')
    @ApiOperation({
        summary: 'Suivi exécution budgétaire',
        description: 'Compare le budget prévisionnel avec les dépenses réelles (Based on Accounting Entries).',
    })
    @ApiParam({ name: 'id', example: 'BUDGET-2024-Q1' })
    @ApiOkResponse({
        description: 'Rapport d\'exécution.',
        schema: {
            example: {
                budgetId: 'BUDGET-2024-Q1',
                totalPlanned: 10000,
                totalActual: 4500,
                variance: 5500,
                details: []
            }
        }
    })
    async getExecution(@Param('id') id: string) {
        return this.budgetService.getBudgetExecution(id);
    }
}
