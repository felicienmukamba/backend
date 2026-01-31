import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';
import { FindAllThirdPartiesDto } from './dto/find-all-third-parties.dto';
import { Prisma, ThirdPartyType } from '@prisma/client';

@Injectable()
export class ThirdPartiesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
    ) { }

    async create(createThirdPartyDto: CreateThirdPartyDto) {
        const companyId = this.cls.get('companyId');

        // Note: Manual mapping removed as DTO now enforces strict Enum usage.
        // Frontend must send 'CUSTOMER' or 'SUPPLIER'.

        const data: Prisma.ThirdPartyCreateInput = {
            type: createThirdPartyDto.type,
            name: createThirdPartyDto.name,
            taxId: createThirdPartyDto.taxId || null,
            rccm: createThirdPartyDto.rccm || null,
            address: createThirdPartyDto.address,
            phone: createThirdPartyDto.phone,
            email: createThirdPartyDto.email,
            isVatSubject: createThirdPartyDto.isVatSubject,
            creditLimit: createThirdPartyDto.creditLimit ? new Prisma.Decimal(createThirdPartyDto.creditLimit) : null,
            company: { connect: { id: companyId } },
        };

        try {
            const thirdParty = await this.prisma.thirdParty.create({
                data,
            });

            // Log Audit
            const currentUserId = this.cls.get('user')?.id;
            if (currentUserId && companyId) {
                await this.auditTrail.logCreate('ThirdParty', thirdParty.id, currentUserId, companyId, thirdParty);
            }

            return thirdParty;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestException(`Un tiers avec ce ${error.meta?.target} existe déjà.`);
            }
            throw error;
        }
    }

    async findAll(pagination?: FindAllThirdPartiesDto) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;
        const search = pagination?.search;
        const type = pagination?.type;

        const companyId = this.cls.get('companyId');

        const where: Prisma.ThirdPartyWhereInput = { companyId };

        if (type && (type as string) !== 'ALL') {
            // If incoming type matches the Enum, use it directly.
            if (Object.values(ThirdPartyType).includes(type as ThirdPartyType)) {
                where.type = type as ThirdPartyType;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search } }, // Removed mode: insensitive for specific DB compatibility or add if Postgres
                { email: { contains: search } },
                { phone: { contains: search } },
                { taxId: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.thirdParty.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.thirdParty.count({ where }),
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
        return this.prisma.thirdParty.findFirst({
            where: { id, companyId },
        });
    }

    async update(id: number, updateThirdPartyDto: UpdateThirdPartyDto) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        if (!before) {
            throw new BadRequestException('Tiers introuvable.');
        }

        const data: Prisma.ThirdPartyUpdateInput = {
            ...updateThirdPartyDto,
            creditLimit: updateThirdPartyDto.creditLimit ? new Prisma.Decimal(updateThirdPartyDto.creditLimit) : undefined,
        };

        // Remove undefined fields
        Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);

        try {
            const updatedThirdParty = await this.prisma.thirdParty.update({
                where: { id, companyId },
                data: data,
            });

            // Log Audit
            const currentUserId = this.cls.get('user')?.id;
            if (currentUserId && companyId) {
                await this.auditTrail.logUpdate('ThirdParty', id, currentUserId, companyId, before, updatedThirdParty);
            }

            return updatedThirdParty;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestException(`Un tiers avec ce ${error.meta?.target} existe déjà.`);
            }
            throw error;
        }
    }

    async getHistory(id: number) {
        const companyId = this.cls.get('companyId');
        const thirdParty = await this.findOne(id);

        if (!thirdParty) throw new BadRequestException('Tiers introuvable.');

        if (thirdParty.type === 'CUSTOMER') {
            const invoices = await this.prisma.invoice.findMany({
                where: { clientId: id, companyId },
                include: { payments: true },
                orderBy: { issuedAt: 'desc' }
            });
            // Also fetch payments not linked to invoice? (Advance payments) - maybe too complex for now.
            // Just invoices is good start.
            return {
                type: 'CUSTOMER',
                transactions: invoices.map(inv => ({
                    id: inv.id,
                    date: inv.issuedAt,
                    reference: inv.invoiceNumber,
                    type: 'INVOICE',
                    amount: inv.totalAmountInclTax,
                    status: inv.status,
                    details: inv.payments
                }))
            };
        } else {
            // SUPPLIER
            const purchaseOrders = await this.prisma.purchaseOrder.findMany({
                where: { supplierId: id, companyId },
                orderBy: { orderDate: 'desc' }
            });
            return {
                type: 'SUPPLIER',
                transactions: purchaseOrders.map(po => ({
                    id: po.id,
                    date: po.orderDate,
                    reference: po.orderNumber,
                    type: 'PURCHASE_ORDER',
                    amount: po.totalAmount,
                    status: po.status,
                }))
            };
        }
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        if (!before) {
            throw new BadRequestException('Tiers introuvable.');
        }

        const result = await this.prisma.thirdParty.delete({
            where: { id, companyId },
        });

        // Log Audit
        const currentUserId = this.cls.get('user')?.id;
        if (currentUserId && companyId) {
            await this.auditTrail.logDelete('ThirdParty', id, currentUserId, companyId, before);
        }

        return result;
    }

    // Soft Delete Methods

    async softDelete(id: number) {
        const companyId = this.cls.get('companyId');
        return this.prisma.thirdParty.update({
            where: { id, companyId },
            data: { deletedAt: new Date() },
        });
    }

    async findTrashed() {
        return this.prisma.thirdParty.findMany({
            where: {
                deletedAt: { not: null },
            },
        });
    }

    async restoreFromTrash(id: number) {
        return this.prisma.thirdParty.update({
            where: { id },
            data: { deletedAt: null },
        });
    }

    async permanentDelete(id: number) {
        return this.prisma.thirdParty.delete({
            where: { id },
        });
    }
}
