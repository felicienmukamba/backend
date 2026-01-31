import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PurchaseOrderStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {
    @ApiPropertyOptional({ enum: PurchaseOrderStatus, description: 'Order status' })
    @IsOptional()
    @IsEnum(PurchaseOrderStatus)
    status?: PurchaseOrderStatus;
}
