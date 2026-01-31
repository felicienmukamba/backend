import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaveDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: 'Start date of the leave' })
    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'End date of the leave' })
    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @ApiProperty({ description: 'Reason for the leave' })
    @IsNotEmpty()
    @IsString()
    reason: string;
}

export class UpdateLeaveStatusDto {
    @ApiProperty({ description: 'Status of the leave (APPROVED, REJECTED)', enum: ['APPROVED', 'REJECTED'] })
    @IsNotEmpty()
    @IsString()
    status: string;

    @ApiProperty({ description: 'Reason for rejection (if applicable)', required: false })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
