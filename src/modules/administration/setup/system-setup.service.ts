import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { UpdateSystemSetupDto } from './dto/update-system-setup.dto';

@Injectable()
export class SystemSetupService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService,
    ) { }

    async getSystemSetup() {
        const companyId = this.cls.get('companyId');
        if (!companyId) {
            throw new NotFoundException('Identifiant entreprise introuvable dans le contexte');
        }

        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new NotFoundException('Société introuvable');
        }

        return {
            id: company.id,
            companyName: company.companyName,
            companyEmail: company.email,
            companyPhone: company.phone,
            currency: company.currency,
            timezone: company.timezone,
            dateFormat: company.dateFormat,
            fiscalYearStart: company.fiscalYearStart,
            taxNumber: company.taxId,
            logo: company.logo ? `data:image/png;base64,${Buffer.from(company.logo).toString('base64')}` : null,
            primaryColor: company.primaryColor,
            secondaryColor: company.secondaryColor,
            updatedAt: company.updatedAt,
        };
    }

    async updateSystemSetup(dto: UpdateSystemSetupDto) {
        const companyId = this.cls.get('companyId');
        if (!companyId) {
            throw new NotFoundException('Identifiant entreprise introuvable dans le contexte');
        }

        let logoBuffer: Buffer | undefined = undefined;
        if (dto.logo && dto.logo.startsWith('data:image')) {
            const base64Data = dto.logo.split(';base64,').pop();
            if (base64Data) {
                logoBuffer = Buffer.from(base64Data, 'base64');
            }
        }

        const updatedCompany = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                companyName: dto.companyName,
                email: dto.companyEmail,
                phone: dto.companyPhone,
                currency: dto.currency,
                timezone: dto.timezone,
                dateFormat: dto.dateFormat,
                fiscalYearStart: dto.fiscalYearStart,
                taxId: dto.taxNumber,
                logo: logoBuffer ? new Uint8Array(logoBuffer) : undefined,
                primaryColor: dto.primaryColor,
                secondaryColor: dto.secondaryColor,
            },
        });

        return {
            id: updatedCompany.id,
            companyName: updatedCompany.companyName,
            companyEmail: updatedCompany.email,
            companyPhone: updatedCompany.phone,
            currency: updatedCompany.currency,
            timezone: updatedCompany.timezone,
            dateFormat: updatedCompany.dateFormat,
            fiscalYearStart: updatedCompany.fiscalYearStart,
            taxNumber: updatedCompany.taxId,
            logo: updatedCompany.logo ? `data:image/png;base64,${Buffer.from(updatedCompany.logo).toString('base64')}` : null,
            primaryColor: updatedCompany.primaryColor,
            secondaryColor: updatedCompany.secondaryColor,
            updatedAt: updatedCompany.updatedAt,
        };
    }
}
