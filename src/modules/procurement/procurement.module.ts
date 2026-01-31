import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';
import { StockReceptionsController } from './stock-receptions/stock-receptions.controller';
import { StockReceptionsService } from './stock-receptions/stock-receptions.service';
import { ClsModule } from 'nestjs-cls';
import { AuditTrailService } from '../../common/services/audit-trail.service';
import { StockMovementsModule } from '../resources/stock-movements/stock-movements.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
    imports: [
        PrismaModule,
        ClsModule,
        StockMovementsModule,
        AccountingModule,
    ],
    controllers: [PurchaseOrdersController, StockReceptionsController],
    providers: [PurchaseOrdersService, StockReceptionsService, AuditTrailService],
    exports: [PurchaseOrdersService, StockReceptionsService],
})
export class ProcurementModule { }
