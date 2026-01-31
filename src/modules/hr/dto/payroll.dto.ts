import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollPeriodDto {
    @ApiProperty({ description: 'Month (1-12)' })
    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    @IsInt()
    @Min(2000)
    year: number;

    @ApiProperty({ description: 'Name/Label', required: false })
    @IsOptional()
    @IsString()
    name?: string;
}

export class CreatePayslipDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: 'Payroll Period ID' })
    @IsUUID()
    periodId: string;
}

export class RecordSalaryPaymentDto {
    @ApiProperty({ enum: ['CASH', 'BANK'], description: 'Payment Method' })
    @IsEnum(['CASH', 'BANK'])
    method: 'CASH' | 'BANK';

    @ApiProperty({ description: 'Date of payment' })
    @IsDateString()
    paymentDate: Date;

    @ApiProperty({ required: false, description: 'External reference (Check # etc)' })
    @IsOptional()
    @IsString()
    reference?: string;
}
