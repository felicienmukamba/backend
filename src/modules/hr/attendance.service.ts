import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async create(createAttendanceDto: CreateAttendanceDto, companyId: number) {
        const { employeeId, date, arrivalTime, departureTime, workedHours } = createAttendanceDto;

        // Verify employee
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const arrival = new Date(arrivalTime);
        const departure = new Date(departureTime);

        // Calculate worked hours if not provided
        let calculatedHours = workedHours;
        if (calculatedHours === undefined) {
            const diffMs = departure.getTime() - arrival.getTime();
            calculatedHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        }

        return this.prisma.attendance.create({
            data: {
                employee: { connect: { id: employeeId } },
                company: { connect: { id: companyId } },
                date: new Date(date),
                arrivalTime: arrival,
                departureTime: departure,
                workedHours: calculatedHours,
                status: 'PRESENT',
            },
        });
    }

    async findAll(companyId: number, employeeId?: string, date?: string) {
        const where: any = { companyId };
        if (employeeId) where.employeeId = employeeId;
        if (date) where.date = new Date(date);

        return this.prisma.attendance.findMany({
            where,
            include: { employee: true },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, companyId: number) {
        const attendance = await this.prisma.attendance.findFirst({
            where: { id, companyId },
            include: { employee: true },
        });
        if (!attendance) throw new NotFoundException('Attendance record not found');
        return attendance;
    }

    async update(id: string, updateAttendanceDto: UpdateAttendanceDto, companyId: number) {
        await this.findOne(id, companyId);
        return this.prisma.attendance.update({
            where: { id },
            data: updateAttendanceDto,
        });
    }

    async remove(id: string, companyId: number) {
        await this.findOne(id, companyId);
        return this.prisma.attendance.delete({ where: { id } });
    }
}
