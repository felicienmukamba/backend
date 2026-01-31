import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    rate: number;

    @IsNotEmpty()
    @IsString()
    label: string;

    @IsOptional()
    @IsBoolean()
    isDeductible?: boolean;
}
