import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
    ) { }

    async create(createProductDto: CreateProductDto) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');

        let prismaType = createProductDto.type;
        if (prismaType === 'BIEN') prismaType = 'GOODS';

        if (!createProductDto.barcode) {
            // Generate a 13-digit barcode-like string (EAN-13 style but internal)
            const prefix = '20'; // Internal use prefix
            const timestamp = Date.now().toString().slice(-9); // Last 9 digits of timestamp
            const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            (createProductDto as any).barcode = `${prefix}${timestamp}${random}`;
        }

        const product = await this.prisma.product.create({
            data: {
                ...createProductDto,
                type: prismaType,
                companyId,
                branchId,
            } as any,
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logCreate('Product', product.id, currentUserId, companyId, product);
        }

        return product;
    }

    async findAll(pagination?: { page?: number; limit?: number; search?: string; type?: string }) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;
        const search = pagination?.search;
        const type = pagination?.type;

        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        const where: any = { companyId };
        if (type && type !== 'ALL') {
            let prismaType = type;
            if (type === 'BIEN') prismaType = 'GOODS';

            where.type = prismaType;
        }
        if (branchId) {
            where.branchId = branchId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);


        return {
            data,
            meta: {
                total,
                page,
                last_page: Math.ceil(total / limit),
                limit,
            }
        };

    }

    async findOne(id: number) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        return this.prisma.product.findFirst({
            where: { id, companyId, branchId },
        });
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        const before = await this.findOne(id);

        // Map labels to internal enum values if necessary
        const data = { ...updateProductDto };
        if (data.type) {
            if (data.type === 'BIEN') data.type = 'GOODS';
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id, companyId, branchId },
            data: data as any,
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logUpdate('Product', id, currentUserId, companyId, before, updatedProduct);
        }

        return updatedProduct;
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        const before = await this.findOne(id);

        const result = await this.prisma.product.delete({
            where: { id, companyId, branchId },
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logDelete('Product', id, currentUserId, companyId, before);
        }

        return result;
    }

    // Soft Delete Methods

    async softDelete(id: number) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        return this.prisma.product.update({
            where: { id, companyId, branchId },
            data: { deletedAt: new Date() as any },
        });
    }

    async findTrashed() {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        return this.prisma.product.findMany({
            where: {
                deletedAt: { not: null } as any,
                companyId,
                branchId,
            },
        });
    }

    async restoreFromTrash(id: number) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        return this.prisma.product.update({
            where: { id, companyId, branchId },
            data: { deletedAt: null as any },
        });
    }

    async permanentDelete(id: number) {
        const companyId = this.cls.get('companyId');
        const branchId = this.cls.get('branchId');
        return this.prisma.product.delete({
            where: { id, companyId, branchId },
        });
    }
}
