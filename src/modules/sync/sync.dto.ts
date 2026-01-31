import { IsNumber, IsString, IsObject, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncDataDto {
    @IsOptional()
    @IsArray()
    invoices?: any[];

    @IsOptional()
    @IsArray()
    products?: any[];

    @IsOptional()
    @IsArray()
    thirdParties?: any[];

    @IsOptional()
    @IsArray()
    accountingEntries?: any[];

    @IsOptional()
    @IsArray()
    branches?: any[];
}

export class SyncPayloadDto {
    @IsDateString()
    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    lastSyncTime: string;

    @IsNumber()
    @ApiProperty({ example: 1 })
    companyId: number;

    @IsObject()
    @ApiProperty()
    data: SyncDataDto;
}
