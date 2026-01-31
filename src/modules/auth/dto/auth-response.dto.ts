import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({
        description: 'Token d\'accès JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    @ApiProperty({
        description: 'Token de rafraîchissement',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Type de token',
        example: 'Bearer',
    })
    tokenType: string;

    @ApiProperty({
        description: 'Durée de validité en secondes',
        example: 3600,
    })
    expiresIn: number;

    @ApiProperty({
        description: 'Informations utilisateur',
        example: {
            id: 1,
            email: 'admin@sigcf.com',
            firstName: 'Admin',
            lastName: 'SIGCF',
            role: {
                id: 1,
                code: 'ADMIN',
                label: 'Administrateur',
                permissions: ['*'],
            },
        },
    })
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        isSaaSAdmin: boolean;
        roles: {
            id: number;
            code: string;
            label: string;
            permissions: any;
        }[];
        company: {
            id: number;
            companyName: string;
            taxId?: string;
        };
    };
}
