import { IsNotEmpty, IsString, IsEnum, IsEmail, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';
import { ThirdPartyType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThirdPartyDto {
    @ApiProperty({ example: 1, description: 'ID de la société' })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ example: 'CUSTOMER', description: 'Type de tiers (CUSTOMER ou SUPPLIER)', enum: ThirdPartyType })
    @IsNotEmpty()
    @IsEnum(ThirdPartyType)
    type: ThirdPartyType;

    @ApiProperty({ example: 'SARL GLOBAL TECH', description: 'Raison sociale ou Nom complet' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: '1234567A', description: 'Numéro d\'Identification Fiscale (NIF)', required: false })
    @IsOptional()
    @IsString()
    taxId?: string;

    @ApiProperty({ example: 'CD/KNG/RCCM/22-B-00123', description: 'Registre du Commerce', required: false })
    @IsOptional()
    @IsString()
    rccm?: string;

    @ApiProperty({ example: '12 Av. de la Justice, Gombe, Kinshasa', description: 'Adresse physique', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: '+243812345678', description: 'Contact téléphonique', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'contact@globaltech.cd', description: 'Adresse email', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: true, description: 'Assujetti à la TVA', default: false })
    @IsOptional()
    @IsBoolean()
    isVatSubject?: boolean;

    @ApiProperty({ example: 5000, description: 'Limite de crédit autorisée', required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    creditLimit?: number;
}
