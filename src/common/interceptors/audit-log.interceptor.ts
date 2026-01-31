import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/administration/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditLogInterceptor.name);

    constructor(private readonly auditLogsService: AuditLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, user, ip } = req;

        // Only log mutations (POST, PUT, PATCH, DELETE)
        if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap(async (response) => {
                try {
                    if (!user || !user.companyId) {
                        return; // Skip if not authenticated or no company context
                    }

                    // Heuristic to determine "Table" and "ObjectId"
                    // URL often contains the resource name: /api/invoices/123
                    const parts = url.split('/');
                    const resource = parts[1] || 'Unknown';

                    let objectId = 0;
                    // Try to find ID in params
                    // If response has an ID, use it (creation)
                    if (response && response.id) {
                        objectId = Number(response.id);
                    } else if (req.params && req.params.id) {
                        objectId = Number(req.params.id);
                    }

                    await this.auditLogsService.create({
                        action: method,
                        tableName: resource,
                        objectId: objectId,
                        oldValues: null, // Hard to get without pre-fetch
                        newValues: method !== 'DELETE' ? body : null,
                        ipAddress: ip || req.connection.remoteAddress,
                        user: { connect: { id: user.id } },
                        company: { connect: { id: user.companyId } },
                        timestamp: new Date(),
                    } as any);

                } catch (err) {
                    this.logger.error('Failed to create audit log', err);
                }
            }),
        );
    }
}
