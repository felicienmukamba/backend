import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { JournalType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJournalDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    label: string;

    @IsNotEmpty()
    @IsEnum(JournalType)
    type: JournalType;
}
