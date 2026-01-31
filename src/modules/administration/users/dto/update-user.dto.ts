import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsInt, MinLength, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({
        description: 'Nom de famille',
        example: 'Dupont',
        required: false,
    })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({
        description: 'Prénom',
        example: 'Jean',
        required: false,
    })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({
        description: 'Nom d\'utilisateur',
        example: 'jdupont',
        required: false,
    })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({
        description: 'Email',
        example: 'jean.dupont@example.com',
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'Nouveau mot de passe (minimum 6 caractères)',
        example: 'NewPassword123!',
        required: false,
        minLength: 6,
    })
    @IsOptional()
    @IsString()
    @MinLength(6)
    passwordHash?: string;

    @ApiProperty({
        description: 'Statut actif de l\'utilisateur',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'IDs des rôles',
        example: [1, 2],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    roleIds?: number[];

    @ApiProperty({
        description: 'ID de l\'entreprise',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    companyId?: number;
}
