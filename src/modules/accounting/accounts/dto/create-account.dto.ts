import { IsNotEmpty, IsString, IsInt, IsEnum, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { AccountType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ example: '411100' })
    @IsNotEmpty()
    @IsString()
    accountNumber: string;

    @ApiProperty({ example: 'Clients - Ventes de biens' })
    @IsNotEmpty()
    @IsString()
    label: string;

    @ApiProperty({ example: 4, description: 'Classe du compte (1-9)' })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(9)
    accountClass: number;

    @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
    @IsNotEmpty()
    @IsEnum(AccountType)
    type: AccountType;

    @ApiProperty({ required: false, example: true, description: 'Peut être lettré ?' })
    @IsOptional()
    @IsBoolean()
    isReconcilable?: boolean;

    @ApiProperty({ required: false, example: true, description: 'Compte auxiliaire ?' })
    @IsOptional()
    @IsBoolean()
    isAuxiliary?: boolean;

    @ApiProperty({ required: false, description: 'ID du compte parent' })
    @IsOptional()
    @IsInt()
    parentAccountId?: number;

    @ApiProperty({ required: false, description: 'Niveau (calculé automatiquement si absent)' })
    @IsOptional()
    @IsInt()
    level?: number;
}
