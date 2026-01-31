import { IsEmail, IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'Doe' })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'John' })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'jdoe' })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123!', description: 'Mot de passe initial' })
    @IsNotEmpty()
    @IsString()
    passwordHash: string; // In a real app, this would be a plain password to be hashed in the service

    @ApiProperty({ example: [1, 2], description: 'IDs des rôles' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    roleIds?: number[];

    @ApiProperty({ required: false, example: 1, description: 'ID de l\'entreprise' })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ required: false, example: 1, description: 'ID de la succursale (branche)' })
    @IsOptional()
    @IsInt()
    branchId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
