import { Test, TestingModule } from '@nestjs/testing';
import { DgiService } from '../application/dgi.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DgiInvoiceClient } from '../infrastructure/dgi-invoice.client';
import { DgiMapper } from '../infrastructure/dgi.mapper';
import { DgiStatus } from '../domain/dgi-status.enum';

describe('DgiService', () => {
    let service: DgiService;
    let prisma: PrismaService;
    let client: DgiInvoiceClient;
    let mapper: DgiMapper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DgiService,
                {
                    provide: PrismaService,
                    useValue: {
                        invoice: { findUnique: jest.fn(), update: jest.fn() },
                        dgiTransmission: { create: jest.fn(), update: jest.fn() },
                    },
                },
                {
                    provide: DgiInvoiceClient,
                    useValue: { submitInvoice: jest.fn() },
                },
                {
                    provide: DgiMapper,
                    useValue: { toDgiInvoicePayload: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<DgiService>(DgiService);
        prisma = module.get<PrismaService>(PrismaService);
        client = module.get<DgiInvoiceClient>(DgiInvoiceClient);
        mapper = module.get<DgiMapper>(DgiMapper);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process invoice and call DGI client', async () => {
        const invoiceId = BigInt(1);
        const mockInvoice = { id: invoiceId };
        const mockPayload = { foo: 'bar' };
        const mockTransmission = { id: BigInt(100) };
        const mockResponse = { idFactureDGI: '123', codeQR: 'qwerty' };

        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
        (mapper.toDgiInvoicePayload as jest.Mock).mockReturnValue(mockPayload);
        (prisma.dgiTransmission.create as jest.Mock).mockResolvedValue(mockTransmission);
        (client.submitInvoice as jest.Mock).mockResolvedValue(mockResponse);

        await service.processInvoice(invoiceId);

        expect(prisma.invoice.findUnique).toHaveBeenCalledWith({ where: { id: invoiceId }, include: expect.any(Object) });
        expect(mapper.toDgiInvoicePayload).toHaveBeenCalledWith(mockInvoice);
        expect(prisma.dgiTransmission.create).toHaveBeenCalledWith({
            data: {
                invoiceId: invoiceId,
                status: DgiStatus.PENDING,
                requestPayload: mockPayload,
            },
        });
        expect(client.submitInvoice).toHaveBeenCalledWith(mockPayload);
        expect(prisma.dgiTransmission.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: mockTransmission.id },
                data: expect.objectContaining({
                    status: DgiStatus.VALIDATED,
                    dgiInvoiceId: '123'
                }),
            }),
        );
    });
});
