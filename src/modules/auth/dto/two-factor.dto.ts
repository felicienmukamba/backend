import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumberString, Length } from 'class-validator';

export class TwoFactorDto {
    @ApiProperty({
        description: 'Code 2FA (6 chiffres)',
        example: '123456',
    })
    @IsNotEmpty()
    @IsNumberString()
    @Length(6, 6)
    code: string;
}

export class TwoFactorLoginDto extends TwoFactorDto {
    @ApiProperty({
        description: 'Token MFA temporaire (obtenu lors de la première étape de login)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsNotEmpty()
    @IsString()
    mfaToken: string;
}
