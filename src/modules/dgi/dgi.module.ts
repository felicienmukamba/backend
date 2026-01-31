import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DgiController } from './dgi.controller';
import { DgiService } from './application/dgi.service';
import { DgiAuthClient } from './infrastructure/dgi-auth.client';
import { DgiInvoiceClient } from './infrastructure/dgi-invoice.client';
import { DgiMapper } from './infrastructure/dgi.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [DgiController],
    providers: [
        DgiService,
        DgiAuthClient,
        DgiInvoiceClient,
        DgiMapper,
        PrismaService
    ],
    exports: [DgiService],
})
export class DgiModule { }
