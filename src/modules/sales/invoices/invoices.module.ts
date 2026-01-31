import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { DgiModule } from '../../dgi/dgi.module';
import { StockMovementsModule } from '../../resources/stock-movements/stock-movements.module';
import { AccountingModule } from '../../accounting/accounting.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [
        DgiModule,
        AccountingModule,
        StockMovementsModule,
        PaymentsModule
    ],
    controllers: [InvoicesController],
    providers: [InvoicesService],
    exports: [InvoicesService],
})
export class InvoicesModule { }
