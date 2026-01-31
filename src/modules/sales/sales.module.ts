import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { TaxesModule } from './taxes/taxes.module';
import { PaymentsModule } from './payments/payments.module';
import { CreditNotesModule } from './credit-notes/credit-notes.module';

@Module({
    imports: [InvoicesModule, TaxesModule, PaymentsModule, CreditNotesModule],
    providers: [],
    controllers: [],
    exports: [InvoicesModule, TaxesModule, PaymentsModule, CreditNotesModule],
})
export class SalesModule { }
