import { IsNotEmpty, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockMovementDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsEnum(StockMovementType)
    type: StockMovementType;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    weightedAverageCost: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    thirdPartyId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    documentReference?: string;

    @IsNotEmpty()
    @IsInt()
    productId: number;
}
