import { IsString, IsOptional, MaxLength, MinLength, IsEmail, IsBoolean, IsNumber, Min, IsPositive, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
    @IsString()
    @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
    @MaxLength(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' })
    firstName: string;

    @IsString()
    @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
    @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
    lastName: string;

    @IsEmail({}, { message: 'Email invalide' })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    phone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    jobTitle?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    departmentId?: string;

    @Type(() => Date)
    @IsOptional()
    hireDate?: Date;

    @Type(() => Number)
    @IsNumber({}, { message: 'Le salaire doit être un nombre' })
    @Min(0, { message: 'Le salaire ne peut pas être négatif' })
    @IsPositive({ message: 'Le salaire doit être positif' })
    baseSalary: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    taxDependents?: number = 0;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    cnssNumber?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    tinNumber?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
}
