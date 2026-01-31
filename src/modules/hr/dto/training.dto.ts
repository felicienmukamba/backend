import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainingDomainDto {
    @ApiProperty({ description: 'Name of the training domain' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateTrainingDto {
    @ApiProperty({ description: 'Name of the training' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Number of hours' })
    @IsInt()
    @Min(1)
    numberHours: number;
}

export class CreateParticipationDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: 'Training ID' })
    @IsUUID()
    trainingId: string;
}
