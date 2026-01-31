import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DgiAuthClient {
    private readonly logger = new Logger(DgiAuthClient.name);
    private token: string | null = null;
    private tokenExpiration: number | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async getAccessToken(): Promise<string> {
        if (this.token && this.tokenExpiration && Date.now() < this.tokenExpiration) {
            return this.token;
        }

        try {
            this.logger.log('Authenticating with DGI API...');
            const dgiApiBase = this.configService.get<string>('DGI_API_BASE');
            const clientId = this.configService.get<string>('DGI_CLIENT_ID');
            const clientSecret = this.configService.get<string>('DGI_CLIENT_SECRET');

            if (!dgiApiBase || !clientId || !clientSecret) {
                throw new Error('Missing DGI configuration (DGI_API_BASE, DGI_CLIENT_ID, DGI_CLIENT_SECRET)');
            }

            const response = await lastValueFrom(
                this.httpService.post(`${dgiApiBase}/oauth/token`, {
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials',
                }),
            );

            this.token = response.data.access_token;
            if (!this.token) {
                throw new Error('No access token received');
            }
            // Expires in comes in seconds, convert to ms and subtract buffer
            this.tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 60000;
            this.logger.log('DGI Authentication successful');

            return this.token;
        } catch (error) {
            this.logger.error('DGI Authentication failed', error.message);
            throw new UnauthorizedException('Erreur d’authentification à l’API DGI');
        }
    }
}
