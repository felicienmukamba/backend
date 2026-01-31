import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        description: 'Email de l\'utilisateur',
        example: 'admin@sigcf.com',
    })
    @IsEmail({}, { message: 'Email invalide' })
    @IsNotEmpty({ message: 'Email requis' })
    email: string;

    @ApiProperty({
        description: 'Mot de passe',
        example: 'Password123!',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'Mot de passe requis' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;
}
