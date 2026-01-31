import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrainingDomainDto, CreateTrainingDto, CreateParticipationDto } from './dto/training.dto';

@Injectable()
export class TrainingService {
    constructor(private prisma: PrismaService) { }

    // --- Domains ---
    async createDomain(dto: CreateTrainingDomainDto, companyId: number) {
        return this.prisma.trainingDomain.create({
            data: {
                ...dto,
                description: dto.description || '',
                company: { connect: { id: companyId } },
            },
        });
    }

    async findAllDomains(companyId: number) {
        return this.prisma.trainingDomain.findMany({ where: { companyId } });
    }

    async removeDomain(id: string, companyId: number) {
        return this.prisma.trainingDomain.delete({ where: { id, companyId } });
    }

    // --- Trainings ---
    async createTraining(dto: CreateTrainingDto, companyId: number) {
        return this.prisma.training.create({
            data: {
                ...dto,
                description: dto.description || '',
                company: { connect: { id: companyId } },
            },
            include: { trainingParticipations: true },
        });
    }

    async findAllTrainings(companyId: number) {
        return this.prisma.training.findMany({
            where: { companyId },
            include: { trainingParticipations: true },
        });
    }

    async removeTraining(id: string, companyId: number) {
        return this.prisma.training.delete({ where: { id, companyId } });
    }

    // --- Participation ---
    async addParticipation(dto: CreateParticipationDto, companyId: number) {
        return this.prisma.trainingParticipation.create({
            data: {
                employee: { connect: { id: dto.employeeId } },
                training: { connect: { id: dto.trainingId } },
                company: { connect: { id: companyId } },
            },
        });
    }

    async findAllParticipations(companyId: number, trainingId?: string) {
        // Note: trainingId is string in recent schema change, or int? 
        // Schema check: trainingId -> String (changed in step 22/25)
        const where: any = { companyId };
        if (trainingId) where.trainingId = trainingId;

        return this.prisma.trainingParticipation.findMany({
            where,
            include: {
                employee: true,
                training: true,
            }
        });
    }

    async removeParticipation(id: string, companyId: number) {
        return this.prisma.trainingParticipation.delete({ where: { id, companyId } });
    }
}
