import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsString()
    @IsNotEmpty()
    resetToken: string;

    @ApiProperty({ example: 'NewSecurePassword123!' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}
