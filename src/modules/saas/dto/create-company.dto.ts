import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlatformCompanyDto {
    @ApiProperty({ example: 'Nouvelle Entreprise SARL' })
    @IsNotEmpty()
    @IsString()
    companyName: string;

    @ApiProperty({ example: 'NIF-123-456-789' })
    @IsNotEmpty()
    @IsString()
    taxId: string;

    @ApiProperty({ example: 'CD/KNG/RCCM/24-B-0000' })
    @IsOptional()
    @IsString()
    rccm?: string;

    @ApiProperty({ example: 'admin@nouvelle.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+243900000000' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'Gombe, Kinshasa, RDC' })
    @IsNotEmpty()
    @IsString()
    headquartersAddress: string;

    @ApiProperty({ example: 'REEL' })
    @IsOptional()
    @IsString()
    taxRegime?: string;

    @ApiProperty({ example: 'DGE' })
    @IsOptional()
    @IsString()
    taxCenter?: string;
}
