import { DgiStatus } from './dgi-status.enum';

export class DgiTransmissionEntity {
    id: bigint;
    invoiceId: bigint;
    status: DgiStatus;
    dgiInvoiceId?: string;
    qrCode?: string;
    requestPayload: any;
    responsePayload?: any;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
