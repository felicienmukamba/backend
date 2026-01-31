import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@Injectable()
export class CostCentersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateCostCenterDto) {
        return this.prisma.costCenter.create({
            data: createDto as any,
        });
    }

    async findAll() {
        return this.prisma.costCenter.findMany();
    }

    async findOne(id: number) {
        return this.prisma.costCenter.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateCostCenterDto) {
        return this.prisma.costCenter.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: number) {
        return this.prisma.costCenter.delete({
            where: { id },
        });
    }
}
