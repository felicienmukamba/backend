import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCompanyDto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: {
                companyName: createCompanyDto.companyName,
                rccm: createCompanyDto.rccm,
                nationalId: createCompanyDto.nationalId,
                taxId: createCompanyDto.taxId,
                headquartersAddress: createCompanyDto.headquartersAddress,
                phone: createCompanyDto.phone,
                email: createCompanyDto.email,
                taxRegime: createCompanyDto.taxRegime,
                taxCenter: createCompanyDto.taxCenter,
                mcfConfig: createCompanyDto.mcfConfig ?? Prisma.JsonNull,
            },
        });
    }

    async findAll() {
        return this.prisma.company.findMany();
    }

    async findOne(id: number) {
        return this.prisma.company.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateCompanyDto: UpdateCompanyDto) {
        const { mcfConfig, ...rest } = updateCompanyDto;

        return this.prisma.company.update({
            where: { id },
            data: {
                ...rest,
                mcfConfig: mcfConfig ?? undefined,
            },
        });
    }

    async remove(id: number) {
        return this.prisma.company.delete({
            where: { id },
        });
    }
}
