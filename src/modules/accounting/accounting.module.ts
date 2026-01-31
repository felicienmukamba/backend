import { Module } from '@nestjs/common';
import { FiscalYearsModule } from './fiscal-years/fiscal-years.module';
import { JournalsModule } from './journals/journals.module';
import { AccountsModule } from './accounts/accounts.module';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { EntriesModule } from './entries/entries.module';
import { AccountingAutomationService } from './automation/accounting-automation.service';

@Module({
    imports: [
        FiscalYearsModule,
        JournalsModule,
        AccountsModule,
        CostCentersModule,
        EntriesModule,
    ],
    providers: [AccountingAutomationService],
    controllers: [],
    exports: [
        FiscalYearsModule,
        JournalsModule,
        AccountsModule,
        CostCentersModule,
        EntriesModule,
        AccountingAutomationService,
    ],
})
export class AccountingModule { }
