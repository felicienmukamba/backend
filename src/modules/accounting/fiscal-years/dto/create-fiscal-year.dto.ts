import { IsNotEmpty, IsString, IsBoolean, IsDate, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFiscalYearDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    startDate: Date;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    endDate: Date;

    @IsOptional()
    @IsBoolean()
    isClosed?: boolean;
}
