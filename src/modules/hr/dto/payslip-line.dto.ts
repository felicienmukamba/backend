import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayslipLineDto {
    @ApiProperty({ description: 'Payslip ID' })
    @IsUUID()
    payslipId: string;

    @ApiProperty({ description: 'Label' })
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty({ description: 'Type', enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'INFO'] })
    @IsEnum(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'INFO'])
    type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'INFO';

    @ApiProperty({ description: 'Category', required: false })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({ description: 'Amount' })
    @IsNumber()
    amount: number;
}
