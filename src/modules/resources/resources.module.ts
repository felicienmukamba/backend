import { Module } from '@nestjs/common';
import { ThirdPartiesModule } from './third-parties/third-parties.module';
import { ProductsModule } from './products/products.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';

@Module({
    imports: [ThirdPartiesModule, ProductsModule, StockMovementsModule],
    providers: [],
    controllers: [],
    exports: [ThirdPartiesModule, ProductsModule, StockMovementsModule],
})
export class ResourcesModule { }
