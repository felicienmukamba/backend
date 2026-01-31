import { IsNotEmpty, IsString, IsDate, IsEnum, IsNumber, IsOptional, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { EntryStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntryLineDto {
    @ApiProperty({ required: false, example: 1000.50, description: 'Montant au débit' })
    @IsOptional()
    @IsNumber({}, { message: 'Le montant au débit doit être un nombre' })
    debit?: number;

    @ApiProperty({ required: false, example: 0, description: 'Montant au crédit' })
    @IsOptional()
    @IsNumber({}, { message: 'Le montant au crédit doit être un nombre' })
    credit?: number;

    @ApiProperty({ example: 'Vente de marchandises', description: 'Libellé de la ligne d\'écriture' })
    @IsNotEmpty({ message: 'La description de la ligne est obligatoire' })
    @IsString()
    description: string;

    @ApiProperty({ required: false, example: 'LET-001', description: 'Code de lettrage' })
    @IsOptional()
    @IsString()
    matchingCode?: string;

    @ApiProperty({ required: false, example: '2024-12-27', description: 'Date de lettrage' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    matchingDate?: Date;

    @ApiProperty({ example: 1, description: 'ID du compte comptable (Plan OHADA)' })
    @IsNotEmpty({ message: 'Le compte comptable est obligatoire' })
    @IsInt()
    accountId: number;

    @ApiProperty({ required: false, example: 1, description: 'ID du tiers associé (si compte 411/401)' })
    @IsOptional()
    @IsInt()
    thirdPartyId?: number;

    @ApiProperty({ required: false, example: 1, description: 'ID du centre de coût (Compta analytique)' })
    @IsOptional()
    @IsInt()
    costCenterId?: number;
}

export class CreateAccountingEntryDto {
    @ApiProperty({ example: 1, description: 'ID de la société' })
    @IsOptional()
    @IsInt()
    companyId?: number;

    @ApiProperty({ example: 'FC', description: 'Devise de la transaction', default: 'FC' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiProperty({ example: 1, description: 'Taux de change', default: 1 })
    @IsOptional()
    @IsNumber()
    exchangeRate?: number;

    @ApiProperty({ example: 'OD-2024-0015', description: 'Référence unique de la pièce' })
    @IsNotEmpty({ message: 'La référence de la pièce est obligatoire' })
    @IsString()
    referenceNumber: string;

    @ApiProperty({ example: '2024-12-27', description: 'Date comptable de la pièce' })
    @IsNotEmpty({ message: 'La date comptable est obligatoire' })
    @IsDate()
    @Type(() => Date)
    entryDate: Date;

    @ApiProperty({ example: 'Achat fournitures bureau', description: 'Libellé général de l\'écriture' })
    @IsNotEmpty({ message: 'La description générale est obligatoire' })
    @IsString()
    description: string;

    @ApiProperty({ enum: EntryStatus, example: EntryStatus.VALIDATED, description: 'Statut de l\'écriture' })
    @IsNotEmpty()
    @IsEnum(EntryStatus, { message: 'Le statut doit être une valeur valide (DRAFT, VALIDATED, etc.)' })
    status: EntryStatus;

    @ApiProperty({ example: 5, description: 'ID du journal comptable' })
    @IsNotEmpty({ message: 'Le journal comptable est obligatoire' })
    @IsInt()
    journalId: number;

    @ApiProperty({ example: 1, description: 'ID de l\'exercice fiscal' })
    @IsNotEmpty({ message: 'L\'exercice fiscal est obligatoire' })
    @IsInt()
    fiscalYearId: number;

    @ApiProperty({ required: false, example: 1, description: 'ID de la facture d\'origine' })
    @IsOptional()
    invoiceId?: number | string;

    @ApiProperty({ required: false, example: 1, description: 'ID du paiement d\'origine' })
    @IsOptional()
    paymentId?: number | string;

    @ApiProperty({ example: 1, description: 'ID de l\'utilisateur créateur' })
    @IsNotEmpty({ message: 'L\'utilisateur créateur est obligatoire' })
    @IsInt()
    createdById: number;

    @ApiProperty({ type: [CreateEntryLineDto], description: 'Lignes d\'écriture comptable' })
    @IsNotEmpty({ message: 'L\'écriture doit contenir au moins une ligne' })
    @ValidateNested({ each: true })
    @Type(() => CreateEntryLineDto)
    entryLines: CreateEntryLineDto[];
}
