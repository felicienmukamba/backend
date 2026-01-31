import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { AuditTrailService } from '../../../common/services/audit-trail.service';
import { OhadaValidationService } from '../ohada-validation.service';

@Module({
    controllers: [EntriesController],
    providers: [EntriesService, AuditTrailService, OhadaValidationService],
    exports: [EntriesService],
})
export class EntriesModule { }
