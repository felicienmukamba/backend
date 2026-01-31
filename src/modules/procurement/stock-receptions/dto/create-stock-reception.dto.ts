import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockReceptionLineDto {
    @ApiProperty({ description: 'Product ID', example: 1 })
    @IsNumber()
    productId: number;

    @ApiProperty({ description: 'Quantity received', example: 50 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit cost', example: 45.50 })
    @IsNumber()
    @Min(0)
    unitCost: number;
}

export class CreateStockReceptionDto {
    @ApiProperty({ description: 'Supplier ID', example: 1 })
    @IsNumber()
    supplierId: number;

    @ApiPropertyOptional({ description: 'Related purchase order ID' })
    @IsOptional()
    @IsString()
    purchaseOrderId?: string;

    @ApiPropertyOptional({ description: 'Supplier document reference' })
    @IsOptional()
    @IsString()
    documentReference?: string;

    @ApiPropertyOptional({ description: 'Reception notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: 'Stock reception lines', type: [CreateStockReceptionLineDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStockReceptionLineDto)
    lines: CreateStockReceptionLineDto[];
}
