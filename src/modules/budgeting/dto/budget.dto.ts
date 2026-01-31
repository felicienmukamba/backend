import { IsNotEmpty, IsOptional, IsString, IsInt, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
    @ApiProperty({ description: 'Name of the budget' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Fiscal Year ID' })
    @IsInt()
    fiscalYearId: number;
}

export class UpdateBudgetDto {
    @ApiProperty({ description: 'Name of the budget', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateBudgetLineDto {
    @ApiProperty({ description: 'Budget ID' })
    @IsUUID()
    budgetId: string;

    @ApiProperty({ description: 'Account ID' })
    @IsInt()
    accountId: number;

    @ApiProperty({ description: 'Forecast Amount' })
    @IsNumber()
    @Min(0)
    forecastAmount: number;
}

export class UpdateBudgetLineDto {
    @ApiProperty({ description: 'Forecast Amount', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    forecastAmount?: number;
}
