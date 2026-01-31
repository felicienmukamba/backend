import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateJournalDto) {
        return this.prisma.journal.create({
            data: createDto as any,
        });
    }

    async findAll() {
        return this.prisma.journal.findMany();
    }

    async findOne(id: number) {
        return this.prisma.journal.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateJournalDto) {
        return this.prisma.journal.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: number) {
        return this.prisma.journal.delete({
            where: { id },
        });
    }
}
