import { IsNumber, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class RecordPaymentDto {
    @ApiProperty({ example: 12000.50 })
    @IsNumber()
    amountPaid: number;

    @ApiProperty({ example: '2025-12-25T10:00:00Z' })
    @IsDateString()
    paidAt: string;

    @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @ApiProperty({ example: 'CHQ-123456', required: false })
    @IsOptional()
    @IsString()
    externalReference?: string;

    @ApiProperty({ example: 'Premier acompte', required: false })
    @IsOptional()
    @IsString()
    observation?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    companyId: number;
}
