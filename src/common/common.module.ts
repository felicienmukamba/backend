import { Module, Global } from '@nestjs/common';
import { SoftDeleteService } from './services/soft-delete.service';
import { ImportService } from './import/import.service';
import { AuditTrailService } from './services/audit-trail.service';

@Global()
@Module({
    providers: [SoftDeleteService, ImportService, AuditTrailService],
    exports: [SoftDeleteService, ImportService, AuditTrailService],
})
export class CommonModule { }

