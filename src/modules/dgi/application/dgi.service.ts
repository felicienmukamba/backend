import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DgiInvoiceClient } from '../infrastructure/dgi-invoice.client';
import { DgiMapper } from '../infrastructure/dgi.mapper';
import { TransmissionStatus } from '@prisma/client';

@Injectable()
export class DgiService {
    private readonly logger = new Logger(DgiService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly invoiceClient: DgiInvoiceClient,
        private readonly mapper: DgiMapper,
    ) { }

    async processInvoice(invoiceId: bigint) {
        this.logger.log(`Processing DGI submission for invoice ${invoiceId}`);

        // 1. Retrieve Invoice with full details and its company
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                invoiceLines: true,
                company: true,
            },
        });

        if (!invoice) {
            this.logger.error(`Invoice ${invoiceId} not found`);
            return;
        }

        const company = invoice.company;
        const mcfConfig = (company?.mcfConfig as any) || {};

        // 2. Map payload (now with company context)
        const payload = this.mapper.toDgiInvoicePayload(invoice as any, company);

        // 3. Create Transmission Record
        const transmission = await this.prisma.defTransmission.create({
            data: {
                invoiceId: invoice.id,
                status: TransmissionStatus.PENDING,
                requestPayload: payload,
                companyId: invoice.companyId,
            } as any,
        });

        try {
            // 4. Submit to DGI with dynamic config
            const response = await this.invoiceClient.submitInvoice(payload, {
                mcfHost: mcfConfig.mcfHost,
                mcfApiKey: mcfConfig.mcfApiKey,
            });

            // 5. Update Transmission Record Success
            await (this.prisma as any).defTransmission.update({
                where: { id: transmission.id },
                data: {
                    status: TransmissionStatus.VALIDATED,
                    dgiInvoiceId: response.idFactureDGI,
                    fiscalSecurityId: response.idFactureDGI, // Assuming mapping if needed or ISF
                    qrCode: response.codeQR,
                    responsePayload: response as any,
                }
            });

            // 6. Update Invoice with DGI details (Optional but good for quick access)
            await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    mcfSignature: response.idFactureDGI, // Mapping conventions
                    qrCodeData: response.codeQR,
                    // status: 'VALIDATED' // Already validated before trigger
                }
            });

            this.logger.log(`Invoice ${invoiceId} successfully registered with DGI`);

        } catch (error) {
            // 5b. Update Transmission Record Failure
            await (this.prisma as any).defTransmission.update({
                where: { id: transmission.id },
                data: {
                    status: TransmissionStatus.REJECTED,
                    errorMessage: error.message,
                    responsePayload: error.response || {},
                }
            });
            this.logger.error(`Failed to register invoice ${invoiceId} with DGI`);
        }
    }
}
