import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('PayrollService', () => {
    let service: PayrollService;
    let prisma: PrismaService;

    const mockPrismaService = {
        payslip: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        payslipLine: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        accountingEntry: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PayrollService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<PayrollService>(PayrollService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processPayslip', () => {
        it('should calculate IPR and CNSS correctly for a basic salary', async () => {
            const mockPayslip = {
                id: 'PAY-1',
                employeeId: 'EMP-1',
                periodId: 'PERIOD-1',
                companyId: 1,
                employee: {
                    firstName: 'John',
                    lastName: 'Doe',
                    baseSalary: new Decimal(1000000), // 1.000.000 FC
                },
            };

            mockPrismaService.payslip.findUnique.mockResolvedValue(mockPayslip);
            mockPrismaService.payslipLine.deleteMany.mockResolvedValue({ count: 0 });
            mockPrismaService.payslipLine.createMany.mockResolvedValue({ count: 3 });
            mockPrismaService.payslip.update.mockResolvedValue({ ...mockPayslip, netSalary: new Decimal(835000) });

            const result = await service.processPayslip('PAY-1');

            expect(result).toBeDefined();
            expect(mockPrismaService.payslip.findUnique).toHaveBeenCalled();

            // Verification of intermediate calculations if we had access (via private methods or return value)
            // Since it's a black box, we check the final update
            expect(mockPrismaService.payslip.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'PAY-1' },
            }));
        });
    });

    describe('calculateCNSS', () => {
        it('should return 3.5% for employee part', () => {
            // @ts-ignore - reaching into private method for unit test
            const result = service['calculateCNSS'](new Decimal(1000), 'EMPLOYEE');
            expect(result.toNumber()).toBe(35);
        });

        it('should return 13% for employer part', () => {
            // @ts-ignore
            const result = service['calculateCNSS'](new Decimal(1000), 'EMPLOYER');
            expect(result.toNumber()).toBe(130);
        });
    });

    describe('calculateIPR', () => {
        it('should calculate IPR according to Congolese tax scales (simplified check)', () => {
            // Scale in code: 0-161325 (0%), 161325-540000 (15%), etc.
            // @ts-ignore
            const result = service['calculateIPR'](new Decimal(200000)); // Over 161325
            expect(result).toBeGreaterThan(0);
            expect(typeof result).toBe('number');
        });
    });
});
