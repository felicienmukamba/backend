import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
    ) { }

    async create(createDto: CreateTaxDto) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');

        const data: Prisma.TaxCreateInput = {
            code: createDto.code,
            rate: createDto.rate,
            label: createDto.label,
            isDeductible: createDto.isDeductible ?? false,
            branch: { connect: { id: branchId } },
            company: { connect: { id: companyId } },
        };

        try {
            const tax = await this.prisma.tax.create({
                data,
            });

            // Log Audit
            const userId = this.cls.get('user')?.id;
            if (userId && companyId) {
                await this.auditTrail.logCreate('Tax', tax.id, userId, companyId, tax);
            }

            return tax;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestException(`Une taxe avec ce code existe déjà.`);
            }
            throw error;
        }
    }

    async findAll() {
        try {
            const companyId = this.cls.get('companyId');
            const branchId = this.cls.get('branchId');
            if (!companyId) return [];
            if (!branchId) return [];

            return await this.prisma.tax.findMany({
                where: { companyId: Number(companyId)},
            });
        } catch (error: any) {
            console.error(`[TaxesService] findAll error: ${error.message}`);
            throw error;
        }
    }

    async findOne(id: number) {
        return this.prisma.tax.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateTaxDto) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        if (!before) {
            throw new BadRequestException('Taxe introuvable.');
        }

        const data: Prisma.TaxUpdateInput = {
            ...updateDto,
        };

        // Cleaning undefined
        Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);

        try {
            const updatedTax = await this.prisma.tax.update({
                where: { id },
                data,
            });

            // Log Audit
            const userId = this.cls.get('user')?.id;
            if (userId && companyId) {
                await this.auditTrail.logUpdate('Tax', id, userId, companyId, before, updatedTax);
            }

            return updatedTax;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestException(`Une taxe avec ce code existe déjà.`);
            }
            throw error;
        }
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        if (!before) {
            throw new BadRequestException('Taxe introuvable.');
        }

        try {
            const result = await this.prisma.tax.delete({
                where: { id },
            });

            // Log Audit
            const userId = this.cls.get('user')?.id;
            if (userId && companyId) {
                await this.auditTrail.logDelete('Tax', id, userId, companyId, before);
            }

            return result;
        } catch (error: any) {
            // Foreign key constraint failure usually
            if (error.code === 'P2003') {
                throw new BadRequestException('Impossible de supprimer cette taxe car elle est utilisée dans des factures ou produits.');
            }
            throw error;
        }
    }
}
