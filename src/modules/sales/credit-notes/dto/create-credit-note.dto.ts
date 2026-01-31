import { IsNotEmpty, IsString, IsDate, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditNoteDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @IsNotEmpty()
    @IsString()
    creditNoteNumber: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    issuedAt?: Date;

    @IsNotEmpty()
    @IsString()
    cancellationReason: string;

    @IsOptional()
    @IsString()
    mcfCancellationSignature?: string;

    @IsNotEmpty()
    invoiceId: string | number;
}
