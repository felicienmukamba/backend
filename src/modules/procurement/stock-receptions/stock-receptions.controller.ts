import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { StockReceptionsService } from './stock-receptions.service';
import { CreateStockReceptionDto } from './dto/create-stock-reception.dto';

@ApiTags('📦 Procurement - Stock Receptions')
@ApiBearerAuth('JWT-auth')
@Controller('stock-receptions')
export class StockReceptionsController {
    constructor(private readonly stockReceptionsService: StockReceptionsService) { }

    @Post()
    @ApiOperation({
        summary: 'Create stock reception',
        description: 'Receives goods from supplier, updates stock, and generates accounting entries'
    })
    @ApiCreatedResponse({ description: 'Stock reception created successfully' })
    create(@Body() createDto: CreateStockReceptionDto) {
        return this.stockReceptionsService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'List stock receptions',
        description: 'Get all stock receptions with optional filters'
    })
    @ApiOkResponse({ description: 'Stock receptions retrieved successfully' })
    findAll(@Query('supplierId') supplierId?: number, @Query('purchaseOrderId') purchaseOrderId?: string) {
        return this.stockReceptionsService.findAll({ supplierId, purchaseOrderId });
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get stock reception details',
        description: 'Retrieve a single stock reception with all details'
    })
    @ApiOkResponse({ description: 'Stock reception found' })
    findOne(@Param('id') id: string) {
        return this.stockReceptionsService.findOne(id);
    }
}
