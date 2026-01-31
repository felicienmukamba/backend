import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductType } from '@prisma/client';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class FindAllProductsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    type?: string;
}
