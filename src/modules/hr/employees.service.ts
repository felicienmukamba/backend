import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PaginationDto, createPaginatedResponse } from '../../common/dto/pagination.dto';
import { CacheService } from '../../common/cache/cache.service';
import { Decimal } from '@prisma/client/runtime/library';


@Injectable()
export class EmployeesService {
    private readonly RESOURCE = 'employees';

    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService,
    ) { }

    async findAll(pagination: PaginationDto, companyId: number) {
        const { page = 1, limit = 10, search } = pagination;
        const skip = (page - 1) * limit;

        // Try to get from cache
        const cacheKey = this.cacheService.generatePaginationKey(this.RESOURCE, page, limit, search);
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const where: any = { companyId, deletedAt: null };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { department: true }, // Include department details
            }),
            this.prisma.employee.count({ where }),
        ]);

        const result = createPaginatedResponse(data, total, page, limit);

        // Set cache
        await this.cacheService.set(cacheKey, result);

        return result;
    }

    async findOne(id: string, companyId: number) {
        const cacheKey = this.cacheService.generateEntityKey(this.RESOURCE, id);
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { department: true },
        });

        if (!employee) throw new NotFoundException('Employé non trouvé');

        await this.cacheService.set(cacheKey, employee);
        return employee;
    }

    async create(data: CreateEmployeeDto, companyId: number) {
        const employee = await this.prisma.employee.create({
            data: {
                ...data,
                companyId,
                departmentId: data.departmentId, // Map departmentId
                hireDate: data.hireDate || new Date(),
            },
        });

        // Invalidate list cache
        await this.cacheService.reset();
        return employee;
    }

    async update(id: string, data: any, companyId: number) {
        await this.findOne(id, companyId);

        const employee = await this.prisma.employee.update({
            where: { id },
            data,
        });

        // Invalidate caches
        await this.cacheService.del(this.cacheService.generateEntityKey(this.RESOURCE, id));
        await this.cacheService.reset();

        return employee;
    }

    async remove(id: string, companyId: number) {
        await this.findOne(id, companyId);

        await this.prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Invalidate caches
        await this.cacheService.del(this.cacheService.generateEntityKey(this.RESOURCE, id));
        await this.cacheService.reset();
    }

    async importEmployees(data: any[], companyId: number) {
        // Basic validation and transformation
        const employeesToCreate = data.map((item) => ({
            firstName: item.firstName || item.prenom || item.Prénom || item.Firstname,
            lastName: item.lastName || item.nom || item.Nom || item.Lastname,
            email: item.email || item.Email,
            phone: item.phone || item.telephone || item.Téléphone || item.Phone,
            jobTitle: item.jobTitle || item.poste || item.Poste || item.JobTitle,
            departmentId: undefined, // Import logic needs update to lookup ID by name, skipping for now
            hireDate: item.hireDate || item.date_embauche || item.HireDate ? new Date(item.hireDate || item.date_embauche || item.HireDate) : new Date(),
            baseSalary: new Decimal(item.baseSalary || item.salaire || item.Salaire || item.BaseSalary || 0),
            companyId,
        }));

        // Filter out invalid rows (minimal validation: needs first and last name)
        const validEmployees = employeesToCreate.filter(e => e.firstName && e.lastName);

        if (validEmployees.length === 0) {
            throw new BadRequestException('Aucune donnée valide à importer (Prénom et Nom requis)');
        }

        const result = await this.prisma.employee.createMany({
            data: validEmployees,
            skipDuplicates: true,
        });

        await this.cacheService.reset();
        return {
            inserted: result.count,
            total: data.length,
        };
    }

    async bulkRemove(ids: string[], companyId: number) {
        if (!ids.length) return { count: 0 };

        const result = await this.prisma.employee.updateMany({
            where: {
                id: { in: ids },
                companyId,
            },
            data: { deletedAt: new Date() },
        });

        // Clear all relevant caches
        for (const id of ids) {
            await this.cacheService.del(this.cacheService.generateEntityKey(this.RESOURCE, id));
        }
        await this.cacheService.reset();

        return result;
    }

    async bulkUpdateStatus(ids: string[], isActive: boolean, companyId: number) {
        if (!ids.length) return { count: 0 };

        const result = await this.prisma.employee.updateMany({
            where: {
                id: { in: ids },
                companyId,
            },
            data: { isActive },
        });

        // Clear all relevant caches
        for (const id of ids) {
            await this.cacheService.del(this.cacheService.generateEntityKey(this.RESOURCE, id));
        }
        await this.cacheService.reset();

        return result;
    }
}


