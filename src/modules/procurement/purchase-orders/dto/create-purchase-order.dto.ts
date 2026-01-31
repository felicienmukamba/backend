import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseOrderLineDto {
    @ApiProperty({ description: 'Product ID', example: 1 })
    @IsNumber()
    productId: number;

    @ApiProperty({ description: 'Quantity ordered', example: 100 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit price', example: 50.99 })
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiPropertyOptional({ description: 'Line description' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreatePurchaseOrderDto {
    @ApiProperty({ description: 'Supplier ID', example: 1 })
    @IsNumber()
    supplierId: number;

    @ApiPropertyOptional({ description: 'Expected delivery date' })
    @IsOptional()
    @IsDateString()
    expectedDate?: string;

    @ApiPropertyOptional({ description: 'Order date', example: '2024-01-25T10:00:00Z' })
    @IsOptional()
    @IsDateString()
    orderDate?: string;

    @ApiProperty({ description: 'Currency code', example: 'USD', default: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: 'Purchase order lines', type: [CreatePurchaseOrderLineDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseOrderLineDto)
    lines: CreatePurchaseOrderLineDto[];
}
