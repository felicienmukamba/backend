import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';

@Injectable()
export class CreditNotesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateCreditNoteDto) {
        return this.prisma.creditNote.create({
            data: {
                ...createDto,
                invoice: { connect: { id: BigInt(createDto.invoiceId) } },
            } as any,
        });
    }

    async findAll() {
        return this.prisma.creditNote.findMany();
    }

    async findOne(id: number) {
        return this.prisma.creditNote.findUnique({
            where: { id: BigInt(id) },
        });
    }

    async update(id: number, updateDto: UpdateCreditNoteDto) {
        const { invoiceId, ...data } = updateDto;
        return this.prisma.creditNote.update({
            where: { id: BigInt(id) },
            data: data,
        });
    }

    async remove(id: number) {
        return this.prisma.creditNote.delete({
            where: { id: BigInt(id) },
        });
    }
}
