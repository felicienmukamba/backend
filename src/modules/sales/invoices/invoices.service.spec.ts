import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DgiService } from '../../dgi/application/dgi.service';
import { EntriesService } from '../../accounting/entries/entries.service';
import { StockMovementsService } from '../../resources/stock-movements/stock-movements.service';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { ClsService } from 'nestjs-cls';
import { AccountingAutomationService } from '../../accounting/automation/accounting-automation.service';
import { PaymentsService } from '../../sales/payments/payments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoicesService', () => {
    let service: InvoicesService;
    let prisma: PrismaService;
    let dgiService: DgiService;
    let entriesService: EntriesService;
    let stockMovementsService: StockMovementsService;

    const mockPrismaService = {
        invoice: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        company: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, companyName: 'Test Co' }),
        },
        stockMovement: {
            create: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockDgiService = {
        processInvoice: jest.fn(),
    };

    const mockEntriesService = {
        create: jest.fn(),
    };

    const mockStockMovementsService = {
        create: jest.fn(),
    };
    const mockAuditTrailService = {
        logValidate: jest.fn(),
        logCreate: jest.fn(),
    };
    const mockClsService = {
        get: jest.fn(),
    };
    const mockAccountingAutomationService = {
        handleInvoiceValidation: jest.fn(),
    };
    const mockPaymentsService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoicesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: DgiService, useValue: mockDgiService },
                { provide: EntriesService, useValue: mockEntriesService },
                { provide: StockMovementsService, useValue: mockStockMovementsService },
                { provide: AuditTrailService, useValue: mockAuditTrailService },
                { provide: ClsService, useValue: mockClsService },
                { provide: AccountingAutomationService, useValue: mockAccountingAutomationService },
                { provide: PaymentsService, useValue: mockPaymentsService },
            ],
        }).compile();

        service = module.get<InvoicesService>(InvoicesService);
        prisma = module.get<PrismaService>(PrismaService);
        dgiService = module.get<DgiService>(DgiService);
        entriesService = module.get<EntriesService>(EntriesService);
        stockMovementsService = module.get<StockMovementsService>(StockMovementsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an invoice successfully', async () => {
            const createDto: CreateInvoiceDto = {
                invoiceNumber: 'FAC-2024-001',
                clientId: 1,
                companyId: 1,
                issuedAt: new Date(),
                currency: 'USD',
                exchangeRate: 1,
                invoiceLines: [
                    {
                        productId: 1,
                        quantity: 2,
                        unitPrice: 100,
                        vatAmount: 20,
                        netAmountExclTax: 200,
                        totalAmountInclTax: 240,
                        description: 'Test Product',
                        taxId: 1
                    }
                ]
            } as any;

            const expectedInvoice = {
                id: '1',
                invoiceNumber: 'FAC-2024-001',
                invoiceLines: [{ id: '1', invoiceId: '1' }]
            };

            (prisma.invoice.create as jest.Mock).mockResolvedValue({
                id: BigInt(1),
                invoiceNumber: 'FAC-2024-001',
                invoiceLines: [{ id: BigInt(1), invoiceId: BigInt(1) }]
            });
            (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
                id: BigInt(1),
                invoiceNumber: 'FAC-2024-001',
                invoiceLines: [{ id: BigInt(1), invoiceId: BigInt(1) }]
            });

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(result.id).toBe(BigInt(1));
            expect(prisma.invoice.create).toHaveBeenCalled();
        });
    });

    describe('validate', () => {
        it('should validate an invoice and trigger DGI processing', async () => {
            const invoiceId = 1;
            const mockInvoice = {
                id: BigInt(invoiceId),
                status: 'DRAFT',
                companyId: 1,
                invoiceNumber: 'FAC-001',
                issuedAt: new Date(),
                totalAmountInclTax: 100,
                totalAmountExclTax: 86.2,
                totalVAT: 13.8,
                currency: 'USD',
                exchangeRate: 1,
                client: { name: 'Test Client' },
                invoiceLines: [
                    { productId: 1, quantity: 1, product: { type: 'GOODS', purchasePriceExclTax: 10 }, tax: { id: 1, rate: 16 } }
                ],
            };

            (prisma.invoice.findUnique as jest.Mock)
                .mockResolvedValueOnce(mockInvoice)
                .mockResolvedValueOnce({ ...mockInvoice, status: 'VALIDATED' });

            (prisma.invoice.update as jest.Mock).mockResolvedValue({ ...mockInvoice, status: 'VALIDATED' });

            const result = await service.validate(invoiceId);

            expect(result!.status).toBe('VALIDATED');
            expect(prisma.invoice.update).toHaveBeenCalled();
            expect(mockAccountingAutomationService.handleInvoiceValidation).toHaveBeenCalled();
            expect(mockDgiService.processInvoice).toHaveBeenCalled();
        });
    });

    // Add more tests for other methods like validate, etc.
});
