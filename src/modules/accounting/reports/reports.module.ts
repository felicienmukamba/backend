import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ExportService } from '../services/export.service';

@Module({
    imports: [PrismaModule],
    controllers: [ReportsController],
    providers: [ReportsService, ExportService],
    exports: [ReportsService],
})
export class ReportsModule { }