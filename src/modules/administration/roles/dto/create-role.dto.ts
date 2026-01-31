import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ required: false, example: 'ACCOUNTANT', description: 'Code unique du rôle (auto-généré par défaut)' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ example: 'Comptable', description: 'Libellé du rôle' })
    @IsNotEmpty()
    @IsString()
    label: string;

    @ApiProperty({ required: false, example: '["READ_INVOICES", "CREATE_INVOICES"]', description: 'Liste des permissions' })
    @IsOptional()
    permissions?: any; // Using any for JSON for now, can be typed later
}
