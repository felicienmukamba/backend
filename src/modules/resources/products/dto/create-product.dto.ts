import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ example: 1, description: 'ID de la société' })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ example: 'PRD-001', description: 'Code unique de l\'article (SKU)' })
    @IsNotEmpty()
    @IsString()
    sku: string;

    @ApiProperty({ example: 'Ordinateur Portable HP', description: 'Désignation de l\'article' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'GOODS', description: 'Type de produit (BIEN/GOODS ou SERVICE)' })
    @IsNotEmpty()
    @IsString()
    type: any;

    @ApiProperty({ example: 1200000, description: 'Prix de vente unitaire HT' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    salesPriceExclTax: number;

    @ApiProperty({ example: 950000, description: 'Prix d\'achat unitaire HT' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    purchasePriceExclTax: number;

    @ApiProperty({ example: 50, description: 'Stock actuel en magasin', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    currentStock?: number;

    @ApiProperty({ example: 5, description: 'Seuil d\'alerte stock', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    alertStock?: number;

    @ApiProperty({ example: '6901234567890', description: 'Code barre (EAN13/QR)', required: false })
    @IsOptional()
    @IsString()
    barcode?: string;
}
