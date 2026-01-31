import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { DgiAuthClient } from './dgi-auth.client';
import { DgiResponseDto } from '../application/dto/dgi-response.dto';

@Injectable()
export class DgiInvoiceClient {
    private readonly logger = new Logger(DgiInvoiceClient.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly authClient: DgiAuthClient,
    ) { }

    async submitInvoice(payload: any, config?: { mcfHost?: string; mcfApiKey?: string }): Promise<DgiResponseDto> {
        const token = config?.mcfApiKey || await this.authClient.getAccessToken();
        const dgiApiBase = config?.mcfHost || this.configService.get<string>('DGI_API_BASE');

        try {
            this.logger.log(`Submitting invoice to DGI at ${dgiApiBase}...`);
            const response = await lastValueFrom(
                this.httpService.post(`${dgiApiBase}/v1/factures`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            );

            this.logger.log('Invoice submitted successfully');
            return response.data;
        } catch (error) {
            this.logger.error('Invoice submission failed', error.response?.data || error.message);
            throw new BadRequestException('Envoi de facture refusé par la DGI (MCF)');
        }
    }
}
