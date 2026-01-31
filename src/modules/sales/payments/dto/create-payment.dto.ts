import { IsNotEmpty, IsDate, IsNumber, IsEnum, IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    paidAt: Date;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    amountPaid: number;

    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsOptional()
    @IsString()
    externalReference?: string;

    @IsOptional()
    @IsString()
    observation?: string;

    // Since Invoice ID is BigInt, we expect it as string or number in JSON, handled by BigInt transformation in service or validation could be tricky.
    // For simplicity here, we assume it's passed as a number or string that can be parsed.
    @IsNotEmpty()
    invoiceId: number | string;
}
