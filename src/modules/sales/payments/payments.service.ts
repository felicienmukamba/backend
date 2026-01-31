import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';

import { AccountingAutomationService } from '../../accounting/automation/accounting-automation.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditTrail: AuditTrailService,
        private readonly cls: ClsService,
        private readonly accountingAutomation: AccountingAutomationService
    ) { }

    async create(createDto: CreatePaymentDto) {
        const companyId = this.cls.get('companyId');
        const payment = await this.prisma.payment.create({
            data: {
                ...createDto,
                amountPaid: createDto.amountPaid,
                paidAt: new Date(createDto.paidAt),
                invoice: {
                    connect: { id: BigInt(createDto.invoiceId) }
                },
                company: {
                    connect: { id: Number(companyId) }
                }
            } as any,
        });

        // Log Audit
        const userId = this.cls.get('user')?.id;
        if (userId && companyId) {
            await this.auditTrail.logCreate('Payment', payment.id, userId, companyId, payment);
        }

        // Trigger Accounting Automation
        await this.accountingAutomation.handlePaymentCreation(payment.id);

        return payment;
    }

    async findAll() {
        return this.prisma.payment.findMany({
            include: { invoice: true }
        });
    }

    async findOne(id: number) {
        return this.prisma.payment.findUnique({
            where: { id: BigInt(id) },
            include: { invoice: true }
        });
    }

    async update(id: number, updateDto: UpdatePaymentDto) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        const { invoiceId, ...data } = updateDto as any;
        const updatedPayment = await this.prisma.payment.update({
            where: { id: BigInt(id) },
            data: data,
        });

        // Log Audit
        const userId = this.cls.get('user')?.id;
        if (userId && companyId) {
            await this.auditTrail.logUpdate('Payment', id, userId, companyId, before, updatedPayment);
        }

        return updatedPayment;
    }

    async remove(id: number) {
        const companyId = this.cls.get('companyId');
        const before = await this.findOne(id);

        const result = await this.prisma.payment.delete({
            where: { id: BigInt(id) },
        });

        // Log Audit
        const userId = this.cls.get('user')?.id;
        if (userId && companyId) {
            await this.auditTrail.logDelete('Payment', id, userId, companyId, before);
        }

        return result;
    }
}
