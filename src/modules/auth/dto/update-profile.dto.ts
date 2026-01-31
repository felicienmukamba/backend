import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Jean' })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Dupont' })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({ example: 'newpassword123' })
    @IsString()
    @IsOptional()
    password?: string;
}
