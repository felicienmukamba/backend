import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCostCenterDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;
}
