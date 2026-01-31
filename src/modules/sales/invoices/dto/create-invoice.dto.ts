import {
    IsNotEmpty, IsString, IsDate, IsEnum, IsNumber,
    IsOptional, ValidateNested, IsInt, Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, InvoiceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceLineDto {
    @ApiProperty({ example: 2, description: 'Quantité vendue' })
    @IsNotEmpty()
    @IsNumber() // Plus flexible que IsInt pour le commerce
    @Type(() => Number)
    quantity: number;

    @ApiProperty({ example: 1500, description: 'Prix unitaire HT' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    unitPrice: number;

    @ApiProperty({ example: 5, description: 'Taux de remise en %', required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    discountRate?: number;

    @ApiProperty({ example: 150, description: 'Montant de la remise', required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    discountAmount?: number;

    @ApiProperty({ example: 2850, description: 'Montant Net HT' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    netAmountExclTax: number;

    @ApiProperty({ example: 456, description: 'Montant de la TVA' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    vatAmount: number;

    @ApiProperty({ example: 3306, description: 'Total TTC' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    totalAmountInclTax: number;

    @ApiProperty({ example: 'Licence Logiciel', description: 'Description de la ligne' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ example: 1, description: 'ID du produit' })
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    productId: number;

    @ApiProperty({ example: 1, description: 'ID de la taxe (TVA)' })
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    taxId: number;
}

export class CreateInvoiceDto {
    @ApiProperty({ example: 1, description: 'ID de la société', required: false })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    companyId?: number;

    @ApiProperty({ example: 'FAC-2026-0001', description: 'Numéro de facture' })
    @IsNotEmpty()
    @IsString()
    invoiceNumber: string;

    @ApiProperty({ example: 'REF/123', description: 'Référence interne', required: false })
    @IsOptional()
    @IsString()
    internalReference?: string;

    @ApiProperty({ example: '2026-01-02', description: 'Date d\'émission' })
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date) // Crucial pour transformer la string ISO en objet Date JS
    issuedAt: Date;

    @ApiProperty({ enum: InvoiceType, example: 'NORMAL' })
    @IsNotEmpty()
    @IsEnum(InvoiceType)
    type: InvoiceType;

    @ApiProperty({ example: 'FC', description: 'Devise (FC, USD, EUR)' })
    @IsNotEmpty()
    @IsString()
    currency: string;

    @ApiProperty({ example: 1, description: 'Taux de change' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    exchangeRate: number;

    @ApiProperty({ example: 10000, description: 'Total HT' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    totalAmountExclTax: number;

    @ApiProperty({ example: 1600, description: 'Total TVA' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    totalVAT: number;

    @ApiProperty({ example: 11600, description: 'Total TTC' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    totalAmountInclTax: number;

    @ApiProperty({ enum: InvoiceStatus, example: 'DRAFT', required: false })
    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @ApiProperty({ example: 'Condition de paiement: 30 jours', required: false })
    @IsOptional()
    @IsString()
    observation?: string;

    @ApiProperty({ example: 'MCF-DEVICE-01', description: 'ID du dispositif fiscal', required: false })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({ example: 1, description: 'ID du client (Tiers)' })
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    clientId: number;

    @ApiProperty({ type: [CreateInvoiceLineDto], description: 'Lignes de la facture' })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceLineDto) // Indispensable pour valider les objets dans le tableau
    invoiceLines: CreateInvoiceLineDto[];

    @ApiProperty({ example: 1, description: 'ID de l\'utilisateur créateur' })
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    createdById: number;
}