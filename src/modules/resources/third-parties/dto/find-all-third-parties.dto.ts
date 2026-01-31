import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export enum ThirdPartyQueryType {
    CLIENT = 'CLIENT',
    FOURNISSEUR = 'FOURNISSEUR',
    CUSTOMER = 'CUSTOMER',
    SUPPLIER = 'SUPPLIER',
}

export class FindAllThirdPartiesDto extends PaginationDto {
    @IsOptional()
    @IsString()
    type?: string;
}
