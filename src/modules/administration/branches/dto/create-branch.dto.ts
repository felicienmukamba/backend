import { IsString, IsNotEmpty, IsOptional, IsEmail, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
    @ApiProperty({ example: 'Succursale Kinshasa' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'KIN-01', required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ example: '123 Boulevard du 30 Juin', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: '+243 000 000 000', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'kinshasa@milele.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'Kinshasa', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    isMain?: boolean;
}
