import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsHexColor } from 'class-validator';

export class UpdateSystemSetupDto {
    @ApiPropertyOptional({ example: 'MILELE SARL' })
    @IsString()
    @IsOptional()
    companyName?: string;

    @ApiPropertyOptional({ example: 'contact@milele.cd' })
    @IsEmail()
    @IsOptional()
    companyEmail?: string;

    @ApiPropertyOptional({ example: '+243000000000' })
    @IsString()
    @IsOptional()
    companyPhone?: string;

    @ApiPropertyOptional({ example: 'USD' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiPropertyOptional({ example: 'Africa/Kinshasa' })
    @IsString()
    @IsOptional()
    timezone?: string;

    @ApiPropertyOptional({ example: 'DD/MM/YYYY' })
    @IsString()
    @IsOptional()
    dateFormat?: string;

    @ApiPropertyOptional({ example: '01-01' })
    @IsString()
    @IsOptional()
    fiscalYearStart?: string;

    @ApiPropertyOptional({ example: 'A1234567B' })
    @IsString()
    @IsOptional()
    taxNumber?: string;

    @ApiPropertyOptional({ example: '#8b5cf6' })
    @IsHexColor()
    @IsOptional()
    primaryColor?: string;

    @ApiPropertyOptional({ example: '#06b6d4' })
    @IsHexColor()
    @IsOptional()
    secondaryColor?: string;

    @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
    @IsString()
    @IsOptional()
    logo?: string;
}
