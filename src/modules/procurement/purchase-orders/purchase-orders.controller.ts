import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@ApiTags('🛒 Procurement - Purchase Orders')
@ApiBearerAuth('JWT-auth')
@Controller('purchase-orders')
export class PurchaseOrdersController {
    constructor(private readonly purchaseOrdersService: PurchaseOrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new purchase order', description: 'Creates a new purchase order with line items' })
    @ApiCreatedResponse({ description: 'Purchase order created successfully' })
    create(@Body() createDto: CreatePurchaseOrderDto) {
        return this.purchaseOrdersService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List purchase orders', description: 'Get all purchase orders with optional filters' })
    @ApiOkResponse({ description: 'Purchase orders retrieved successfully' })
    findAll(@Query('status') status?: string, @Query('supplierId') supplierId?: number) {
        return this.purchaseOrdersService.findAll({ status, supplierId });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get purchase order details', description: 'Retrieve a single purchase order with all details' })
    @ApiOkResponse({ description: 'Purchase order found' })
    findOne(@Param('id') id: string) {
        return this.purchaseOrdersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update purchase order', description: 'Update purchase order status or details' })
    @ApiOkResponse({ description: 'Purchase order updated' })
    update(@Param('id') id: string, @Body() updateDto: UpdatePurchaseOrderDto) {
        return this.purchaseOrdersService.update(id, updateDto);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel purchase order', description: 'Cancel a purchase order' })
    @ApiOkResponse({ description: 'Purchase order cancelled' })
    cancel(@Param('id') id: string) {
        return this.purchaseOrdersService.cancel(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete purchase order', description: 'Soft delete a purchase order' })
    @ApiOkResponse({ description: 'Purchase order deleted' })
    remove(@Param('id') id: string) {
        return this.purchaseOrdersService.remove(id);
    }
}
