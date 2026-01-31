import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DepartmentService {
    constructor(
        private prisma: PrismaService,
        private readonly cls: ClsService,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto) {
        const companyId = this.cls.get('companyId') || createDepartmentDto.companyId || 1;
        const { companyId: _, ...data } = createDepartmentDto;

        return this.prisma.department.create({
            data: {
                ...data,
                description: data.description || '',
                company: { connect: { id: companyId } },
            },
        });
    }

    async findAll(companyId: number) {
        return this.prisma.department.findMany({
            where: { companyId },
            include: {
                employees: true,
            },
        });
    }

    async findOne(id: string) {
        const department = await this.prisma.department.findUnique({
            where: { id },
            include: {
                employees: true,
            },
        });
        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
        try {
            return await this.prisma.department.update({
                where: { id },
                data: updateDepartmentDto,
            });
        } catch (error) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.department.delete({
                where: { id },
            });
        } catch (error) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }
    }
}
