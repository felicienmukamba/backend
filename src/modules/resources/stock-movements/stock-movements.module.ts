import { Module } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsController } from './stock-movements.controller';

import { EntriesModule } from '../../accounting/entries/entries.module';
import { ClsModule } from 'nestjs-cls';

@Module({
    imports: [EntriesModule, ClsModule],
    controllers: [StockMovementsController],
    providers: [StockMovementsService],
    exports: [StockMovementsService],
})
export class StockMovementsModule { }
