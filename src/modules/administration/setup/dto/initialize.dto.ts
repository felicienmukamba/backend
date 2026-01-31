import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class InitializeDto {
    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty()
    adminFirstName: string;

    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty()
    adminLastName: string;

    @ApiProperty({ example: 'admin@milele.cd' })
    @IsEmail()
    adminEmail: string;

    @ApiProperty({ example: 'Password123' })
    @IsString()
    @MinLength(8)
    adminPassword: string;

    @ApiProperty({ example: 'MILELE SARL' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiProperty({ example: 'Siège Social' })
    @IsString()
    @IsNotEmpty()
    mainBranchName: string;

    @ApiProperty({ example: 'HQ-01' })
    @IsString()
    @IsNotEmpty()
    mainBranchCode: string;

    @ApiProperty({ example: 'A1234567B' })
    @IsString()
    @IsNotEmpty()
    taxId: string;

    @ApiProperty({ example: 'NAT-123-456' })
    @IsString()
    @IsNotEmpty()
    nationalId: string;

    @ApiProperty({ example: 'CD/KNG/RCCM/...' })
    @IsString()
    @IsNotEmpty()
    rccm: string;

    @ApiProperty({ example: 'Kinshasa, Gombe' })
    @IsString()
    address: string;

    @ApiProperty({ example: '+243000000000' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'contact@milele.cd' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'REEL' })
    @IsString()
    taxRegime: string;

    @ApiProperty({ example: 'DGE' })
    @IsString()
    taxCenter: string;
}
