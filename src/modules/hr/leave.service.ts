import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
    constructor(private prisma: PrismaService) { }

    async create(createLeaveDto: CreateLeaveDto, companyId: number) {
        const { employeeId, startDate, endDate, reason } = createLeaveDto;

        // Verify employee exists and belongs to company
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        if (new Date(startDate) > new Date(endDate)) {
            throw new BadRequestException('Start date must be before end date');
        }

        return this.prisma.leave.create({
            data: {
                employee: { connect: { id: employeeId } },
                company: { connect: { id: companyId } },
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING',
            },
        });
    }

    async findAll(companyId: number, employeeId?: string) {
        const where: any = { companyId };
        if (employeeId) {
            where.employeeId = employeeId;
        }
        return this.prisma.leave.findMany({
            where,
            include: {
                employee: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    async findOne(id: string, companyId: number) {
        const leave = await this.prisma.leave.findFirst({
            where: { id, companyId },
            include: { employee: true },
        });

        if (!leave) {
            throw new NotFoundException('Leave request not found');
        }
        return leave;
    }

    async updateStatus(id: string, updateStatusDto: UpdateLeaveStatusDto, companyId: number) {
        await this.findOne(id, companyId);

        return this.prisma.leave.update({
            where: { id },
            data: {
                status: updateStatusDto.status,
                rejectionReason: updateStatusDto.rejectionReason,
            },
        });
    }

    async remove(id: string, companyId: number) {
        const leave = await this.findOne(id, companyId);
        if (leave.status !== 'PENDING') {
            throw new BadRequestException('Only PENDING leave requests can be deleted');
        }
        return this.prisma.leave.delete({ where: { id } });
    }
}


