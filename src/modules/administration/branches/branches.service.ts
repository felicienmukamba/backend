import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createBranchDto: CreateBranchDto) {
        // companyId is automatically injected by the Extended Client based on CLS context
        return (this.prisma as any).branch.create({
            data: createBranchDto,
        });
    }

    async findAll() {
        // Automatically filtered by companyId via Extended Client (CLS)
        return (this.prisma as any).branch.findMany();
    }

    async findOne(id: number) {
        return (this.prisma as any).branch.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateBranchDto: UpdateBranchDto) {
        return (this.prisma as any).branch.update({
            where: { id },
            data: updateBranchDto,
        });
    }

    async remove(id: number) {
        return (this.prisma as any).branch.delete({
            where: { id },
        });
    }
}
