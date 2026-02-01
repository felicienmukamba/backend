import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

export type EntityType = 'employees' | 'accounts' | 'companies' | 'thirdParties' | 'products';

export interface ImportValidationResult {
    isValid: boolean;
    errors: Array<{
        row: number;
        field: string;
        message: string;
    }>;
    warnings: Array<{
        row: number;
        field: string;
        message: string;
    }>;
    data: any[];
    summary: {
        totalRows: number;
        validRows: number;
        errorRows: number;
    };
}

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Parse and validate uploaded file
     */
    async validateImport(
        entityType: EntityType,
        file: Express.Multer.File,
        companyId: number
    ): Promise<ImportValidationResult> {
        this.logger.log(`Validating import for ${entityType}, company ${companyId}`);

        // Parse file
        const data = await this.parseFile(file);

        // Validate data
        const result = await this.validateData(entityType, data, companyId);

        return result;
    }

    /**
     * Execute validated import
     */
    async executeImport(
        entityType: EntityType,
        data: any[],
        companyId: number,
        userId: number
    ): Promise<{ created: number; updated: number; failed: number }> {
        this.logger.log(`Executing import for ${entityType}, ${data.length} rows`);

        let created = 0;
        let updated = 0;
        let failed = 0;

        // Execute import in transaction
        await this.prisma.$transaction(async (prisma) => {
            for (const row of data) {
                try {
                    switch (entityType) {
                        case 'employees':
                            await this.importEmployee(row, companyId, userId, prisma);
                            created++;
                            break;
                        case 'accounts':
                            await this.importAccount(row, companyId, prisma);
                            created++;
                            break;
                        case 'companies':
                            await this.importCompany(row, prisma);
                            created++;
                            break;
                        case 'thirdParties':
                            await this.importThirdParty(row, companyId, prisma);
                            created++;
                            break;
                        case 'products':
                            await this.importProduct(row, companyId, prisma);
                            created++;
                            break;
                    }
                } catch (error) {
                    this.logger.error(`Failed to import row: ${JSON.stringify(row)}`, error);
                    failed++;
                }
            }
        });

        return { created, updated, failed };
    }

    // ========== FILE PARSING ==========

    private async parseFile(file: Express.Multer.File): Promise<any[]> {
        const ext = file.originalname.split('.').pop()?.toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
            return this.parseExcel(file.buffer);
        } else if (ext === 'csv') {
            return this.parseCSV(file.buffer);
        } else {
            throw new BadRequestException('Unsupported file format. Use Excel (.xlsx) or CSV (.csv)');
        }
    }

    private parseExcel(buffer: Buffer): any[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    }

    private parseCSV(buffer: Buffer): any[] {
        const csvString = buffer.toString('utf-8');
        const result = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        return result.data as any[];
    }

    // ========== VALIDATION ==========

    private async validateData(
        entityType: EntityType,
        data: any[],
        companyId: number
    ): Promise<ImportValidationResult> {
        const errors: any[] = [];
        const warnings: any[] = [];
        const validData: any[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 for header and 0-index

            const rowValidation = await this.validateRow(entityType, row, rowNumber, companyId);

            if (rowValidation.errors.length > 0) {
                errors.push(...rowValidation.errors);
            } else {
                validData.push(row);
            }

            if (rowValidation.warnings.length > 0) {
                warnings.push(...rowValidation.warnings);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            data: validData,
            summary: {
                totalRows: data.length,
                validRows: validData.length,
                errorRows: errors.length
            }
        };
    }

    private async validateRow(
        entityType: EntityType,
        row: any,
        rowNumber: number,
        companyId: number
    ): Promise<{ errors: any[]; warnings: any[] }> {
        const errors: any[] = [];
        const warnings: any[] = [];

        switch (entityType) {
            case 'employees':
                return this.validateEmployeeRow(row, rowNumber, companyId);
            case 'accounts':
                return this.validateAccountRow(row, rowNumber, companyId);
            case 'companies':
                return this.validateCompanyRow(row, rowNumber);
            case 'thirdParties':
                return this.validateThirdPartyRow(row, rowNumber, companyId);
            case 'products':
                return this.validateProductRow(row, rowNumber, companyId);
        }

        return { errors, warnings };
    }

    // ========== ENTITY-SPECIFIC VALIDATION ==========

    private async validateEmployeeRow(row: any, rowNumber: number, companyId: number) {
        const errors: any[] = [];
        const warnings: any[] = [];

        // Required fields
        if (!row.firstName || row.firstName.trim() === '') {
            errors.push({ row: rowNumber, field: 'firstName', message: 'First name is required' });
        }
        if (!row.lastName || row.lastName.trim() === '') {
            errors.push({ row: rowNumber, field: 'lastName', message: 'Last name is required' });
        }
        if (!row.email || row.email.trim() === '') {
            errors.push({ row: rowNumber, field: 'email', message: 'Email is required' });
        } else {
            // Check unique email
            const existing = await this.prisma.employee.findFirst({
                where: { email: row.email, companyId }
            });
            if (existing) {
                errors.push({ row: rowNumber, field: 'email', message: 'Email already exists' });
            }
        }

        return { errors, warnings };
    }

    private async validateAccountRow(row: any, rowNumber: number, companyId: number) {
        const errors: any[] = [];
        const warnings: any[] = [];

        // Required fields
        if (!row.accountNumber || row.accountNumber.trim() === '') {
            errors.push({ row: rowNumber, field: 'accountNumber', message: 'Account number is required' });
        } else {
            // Check unique
            const existing = await this.prisma.account.findFirst({
                where: { accountNumber: row.accountNumber, companyId }
            });
            if (existing) {
                errors.push({ row: rowNumber, field: 'accountNumber', message: 'Account number already exists' });
            }

            // OHADA validation (must be numeric, 2-8 digits)
            if (!/^\d{2,8}$/.test(row.accountNumber)) {
                errors.push({ row: rowNumber, field: 'accountNumber', message: 'Invalid OHADA account number format' });
            }
        }

        if (!row.label || row.label.trim() === '') {
            errors.push({ row: rowNumber, field: 'label', message: 'Label is required' });
        }

        return { errors, warnings };
    }

    private async validateCompanyRow(row: any, rowNumber: number) {
        const errors: any[] = [];
        const warnings: any[] = [];

        if (!row.companyName || row.companyName.trim() === '') {
            errors.push({ row: rowNumber, field: 'companyName', message: 'Company name is required' });
        }
        if (!row.taxId || row.taxId.trim() === '') {
            errors.push({ row: rowNumber, field: 'taxId', message: 'Tax ID is required' });
        } else {
            const existing = await this.prisma.company.findFirst({
                where: { taxId: row.taxId }
            });
            if (existing) {
                errors.push({ row: rowNumber, field: 'taxId', message: 'Tax ID already exists' });
            }
        }

        return { errors, warnings };
    }

    private async validateThirdPartyRow(row: any, rowNumber: number, companyId: number) {
        const errors: any[] = [];
        const warnings: any[] = [];

        if (!row.name || row.name.trim() === '') {
            errors.push({ row: rowNumber, field: 'name', message: 'Name is required' });
        }
        if (!row.type || !['CLIENT', 'SUPPLIER', 'BOTH'].includes(row.type)) {
            errors.push({ row: rowNumber, field: 'type', message: 'Type must be CLIENT, SUPPLIER, or BOTH' });
        }

        return { errors, warnings };
    }

    private async validateProductRow(row: any, rowNumber: number, companyId: number) {
        const errors: any[] = [];
        const warnings: any[] = [];

        if (!row.name || row.name.trim() === '') {
            errors.push({ row: rowNumber, field: 'name', message: 'Product name is required' });
        }
        if (!row.price || isNaN(parseFloat(row.price))) {
            errors.push({ row: rowNumber, field: 'price', message: 'Valid price is required' });
        }

        return { errors, warnings };
    }

    // ========== ENTITY-SPECIFIC IMPORT ==========

    private async importEmployee(row: any, companyId: number, userId: number, prisma: any) {
        // Find or create department
        let department: { id: number } | null = null;
        if (row.department) {
            department = await prisma.department.findFirst({
                where: { name: row.department, companyId }
            });
            if (!department) {
                throw new Error(`Department ${row.department} not found`);
            }
        }

        await prisma.employee.create({
            data: {
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone || '',
                position: row.position || '',
                departmentId: department?.id || null,
                companyId,
                hireDate: row.hireDate ? new Date(row.hireDate) : new Date(),
                isActive: row.isActive !== 'false' && row.isActive !== '0'
            }
        });
    }

    private async importAccount(row: any, companyId: number, prisma: any) {
        // Determine account type from number
        const accountClass = row.accountNumber.toString()[0];
        const accountType = this.determineAccountType(accountClass);

        await prisma.account.create({
            data: {
                accountNumber: row.accountNumber,
                label: row.label,
                accountType,
                companyId,
                isActive: row.isActive !== 'false' && row.isActive !== '0'
            }
        });
    }

    private async importCompany(row: any, prisma: any) {
        await prisma.company.create({
            data: {
                companyName: row.companyName,
                taxId: row.taxId,
                rccm: row.rccm || 'PENDING',
                nationalId: row.nationalId || 'PENDING',
                email: row.email,
                phone: row.phone || 'PENDING',
                headquartersAddress: row.address || 'PENDING',
                taxRegime: row.taxRegime || 'PENDING',
                taxCenter: row.taxCenter || 'PENDING',
                isActive: true
            }
        });
    }

    private async importThirdParty(row: any, companyId: number, prisma: any) {
        await prisma.thirdParty.create({
            data: {
                name: row.name,
                type: row.type,
                taxId: row.taxId || null,
                email: row.email || null,
                phone: row.phone || null,
                address: row.address || null,
                companyId
            }
        });
    }

    private async importProduct(row: any, companyId: number, prisma: any) {
        await prisma.product.create({
            data: {
                name: row.name,
                sku: row.sku || null,
                category: row.category || 'General',
                price: parseFloat(row.price),
                description: row.description || null,
                companyId
            }
        });
    }

    // ========== HELPERS ==========

    private determineAccountType(accountClass: string): string {
        const typeMap: Record<string, string> = {
            '1': 'CAPITAL',
            '2': 'IMMOBILISATION',
            '3': 'STOCK',
            '4': 'TIERS',
            '5': 'TRESORERIE',
            '6': 'CHARGE',
            '7': 'PRODUIT'
        };
        return typeMap[accountClass] || 'AUTRE';
    }
}
