import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DgiService } from '../../dgi/application/dgi.service';
import { EntriesService } from '../../accounting/entries/entries.service';
import { StockMovementsService } from '../../resources/stock-movements/stock-movements.service';
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoicesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: DgiService, useValue: mockDgiService },
                { provide: EntriesService, useValue: mockEntriesService },
                { provide: StockMovementsService, useValue: mockStockMovementsService },
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

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('1');
            expect(prisma.invoice.create).toHaveBeenCalled();
        });
    });

    // Add more tests for other methods like validate, etc.
});
