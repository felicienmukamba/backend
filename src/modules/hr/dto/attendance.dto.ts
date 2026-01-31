import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: 'Date of attendance' })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Arrival time (ISO string)' })
    @IsNotEmpty()
    @IsDateString()
    arrivalTime: string;

    @ApiProperty({ description: 'Departure time (ISO string)' })
    @IsNotEmpty()
    @IsDateString()
    departureTime: string;

    @ApiProperty({ description: 'Worked hours via manual input', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    workedHours?: number;
}

export class UpdateAttendanceDto {
    @ApiProperty({ description: 'Arrival time (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    arrivalTime?: string;

    @ApiProperty({ description: 'Departure time (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    departureTime?: string;

    @ApiProperty({ description: 'Status', required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ description: 'Worked hours', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    workedHours?: number;
}
