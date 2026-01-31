import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountType } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ImportService } from '../../../common/import/import.service';

@Injectable()
export class AccountsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly importService: ImportService
    ) { }

    async create(createDto: CreateAccountDto) {
        const fullData = await this.calculateDerivedData(createDto);
        return this.prisma.account.create({
            data: fullData as any,
        });
    }

    async findAll() {
        return this.prisma.account.findMany();
    }

    async findOne(id: number) {
        return this.prisma.account.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateDto: UpdateAccountDto) {
        const fullData = await this.calculateDerivedData(updateDto);
        return this.prisma.account.update({
            where: { id },
            data: fullData as any,
        });
    }

    private async calculateDerivedData(dto: any) {
        const accountNumber = String(dto.accountNumber || '').trim();
        if (!accountNumber) return dto;

        const accountClass = dto.accountClass || parseInt(accountNumber[0]) || 1;
        const type = dto.type || AccountType.ASSET;
        const companyId = dto.companyId;

        let parentAccountId = dto.parentAccountId || null;

        // Auto-detect parent if not provided (SYSCOHADA hierarchy)
        if (!parentAccountId && accountNumber.length > 1 && companyId) {
            const parentNum = accountNumber.slice(0, -1);
            const parent = await this.prisma.account.findFirst({
                where: {
                    accountNumber: parentNum,
                    companyId: companyId
                }
            });
            if (parent) parentAccountId = parent.id;
        }

        return {
            ...dto,
            accountNumber,
            accountClass,
            parentAccountId,
            level: accountNumber.length,
            isBalanceSheet: accountClass <= 5,
            isProfitLoss: accountClass >= 6 && accountClass <= 7,
            isHAO: accountClass === 8,
            isAnalytical: accountClass === 9,
            normalBalance: (type === AccountType.ASSET || type === AccountType.EXPENSE) ? 'DEBIT' : 'CREDIT',
        };
    }

    async remove(id: number) {
        return this.prisma.account.delete({
            where: { id },
        });
    }

    async importAccounts(buffer: Buffer, filename: string, companyId: number) {
        const rawData = await this.importService.parseFile(buffer, filename);
        if (!rawData || rawData.length === 0) {
            throw new BadRequestException('0 importations verifier votre fichier et son contenu');
        }

        const errors: string[] = [];
        let successCount = 0;
        let updatedCount = 0;

        // Helper for boolean parsing
        const parseBool = (val: any): boolean => {
            if (typeof val === 'boolean') return val;
            const s = String(val).toUpperCase().trim();
            return ['TRUE', 'VRAI', 'YES', '1', 'OUI'].includes(s);
        };

        // Trier par longueur de numéro pour créer les parents avant les enfants
        rawData.sort((a, b) => {
            const numA = String(a['Numero'] || a['Numéro'] || a['accountNumber'] || '').length;
            const numB = String(b['Numero'] || b['Numéro'] || b['accountNumber'] || '').length;
            return numA - numB;
        });

        for (const row of rawData) {
            const accountNumber = String(row['Numero'] || row['Numéro'] || row['accountNumber'] || '').trim();
            const label = (row['Intitulé'] || row['Libellé'] || row['label'] || '').trim();

            if (!accountNumber || !label) continue;

            // Déterminer le type
            let type: AccountType = AccountType.ASSET;
            const typeRaw = (row['Type'] || row['type'] || '').toUpperCase();

            if (['ACTIF', 'ASSET'].includes(typeRaw)) type = AccountType.ASSET;
            else if (['PASSIF', 'LIABILITY'].includes(typeRaw)) type = AccountType.LIABILITY;
            else if (['CHARGE', 'EXPENSE'].includes(typeRaw)) type = AccountType.EXPENSE;
            else if (['PRODUIT', 'REVENUE'].includes(typeRaw)) type = AccountType.REVENUE;
            else {
                // Inférence basée sur la classe (1er chiffre)
                const firstDigit = parseInt(accountNumber[0]);
                if (!isNaN(firstDigit)) {
                    if ([1, 4].includes(firstDigit)) type = AccountType.LIABILITY;
                    else if ([2, 3, 5].includes(firstDigit)) type = AccountType.ASSET;
                    else if (firstDigit === 6) type = AccountType.EXPENSE;
                    else if (firstDigit === 7) type = AccountType.REVENUE;
                }
            }

            // Parse booleans
            const isReconcilable = parseBool(row['Lettrable'] || row['isReconcilable'] || row['est_lettrable']);
            const isAuxiliary = parseBool(row['Auxiliaire'] || row['isAuxiliary'] || row['est_auxiliaire']);

            const accountData = await this.calculateDerivedData({
                accountNumber,
                label,
                type,
                accountClass: parseInt(accountNumber[0]) || 1,
                companyId,
                isReconcilable,
                isAuxiliary,
            });

            // Vérifier existence
            const existing = await this.prisma.account.findUnique({
                where: { accountNumber_companyId: { accountNumber, companyId } }
            });

            try {
                if (existing) {
                    await this.prisma.account.update({
                        where: { id: existing.id },
                        data: accountData as any,
                    });
                    updatedCount++;
                } else {
                    await this.prisma.account.create({
                        data: accountData as any,
                    });
                    successCount++;
                }
            } catch (error) {
                errors.push(`Erreur compte ${accountNumber}: ${error.message}`);
            }
        }

        // Si absolument rien n'a été traité (soit parce que le fichier est vide, soit parce que rien ne respecte les normes)
        if (successCount === 0 && updatedCount === 0) {
            throw new BadRequestException('0 importations verifier votre fichier et son contenu');
        }

        return {
            message: `${successCount} compte(s) enregistré(s), ${updatedCount} compte(s) mis à jour.`,
            errors: errors.length > 0 ? errors : undefined,
            stats: {
                total: rawData.length,
                created: successCount,
                updated: updatedCount,
                failed: errors.length
            }
        };
    }
}


