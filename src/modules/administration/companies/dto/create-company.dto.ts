import { IsNotEmpty, IsString, IsEmail, IsJSON, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Mon Entreprise SAS' })
    @IsNotEmpty()
    @IsString()
    companyName: string;

    @ApiProperty({ example: 'KG/1234/M', description: 'Registre du Commerce et du Crédit Mobilier' })
    @IsNotEmpty()
    @IsString()
    rccm: string;

    @ApiProperty({ example: '01-987-N12345T', description: 'Identification Nationale' })
    @IsNotEmpty()
    @IsString()
    nationalId: string;

    @ApiProperty({ example: 'A1234567B', description: 'Numéro d\'Impôt Fiscale (NIF)' })
    @IsNotEmpty()
    @IsString()
    taxId: string;

    @ApiProperty({ example: '123 Avenue de la Paix, Kinshasa, RDC' })
    @IsNotEmpty()
    @IsString()
    headquartersAddress: string;

    @ApiProperty({ example: '+243999999999' })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({ example: 'contact@monentreprise.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Réel', description: 'Régime fiscal' })
    @IsNotEmpty()
    @IsString()
    taxRegime: string;

    @ApiProperty({ example: 'DPI Kinshasa', description: 'Centre fiscal de rattachement' })
    @IsNotEmpty()
    @IsString()
    taxCenter: string;

    // Handling Bytes for logo is minimal in DTO, usually handled by file upload interceptor
    // We'll leave it optional/undefined in basic DTO for now.

    @ApiProperty({ required: false, example: { serverUrl: 'http://mcf.dgi.gouv.cd' }, description: 'Configuration MCF (JSON)' })
    @IsOptional()
    mcfConfig?: any;

    @ApiProperty({ required: false, example: true, description: 'Compte actif/inactif' })
    @IsOptional()
    isActive?: boolean;
}
