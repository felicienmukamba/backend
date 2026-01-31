import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetingController } from './budgeting.controller';

@Module({
    providers: [BudgetService],
    controllers: [BudgetingController],
    exports: [BudgetService]
})
export class BudgetingModule { }
