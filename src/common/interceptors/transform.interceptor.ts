import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    data: T;
    success: boolean;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => ({
                data: this.serialize(data),
                success: true,
                timestamp: new Date().toISOString(),
            })),
        );
    }

    private serialize(data: any): any {
        if (data === null || data === undefined) return data;

        // Handle Prisma Decimal / decimal.js / Numeric types
        if (data && typeof data === 'object') {
            const constructorName = data.constructor?.name;
            if (constructorName === 'Decimal' || constructorName === 'Number') {
                return Number(data.toString());
            }
            // Check for decimal.js properties (d: digits, s: sign, e: exponent)
            if (Array.isArray(data.d) && typeof data.s === 'number' && typeof data.e === 'number') {
                return Number(data.toString());
            }
        }

        if (typeof data === 'bigint') {
            return data.toString();
        }

        if (data instanceof Date) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.serialize(item));
        }

        if (typeof data === 'object') {
            const serialized: any = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    serialized[key] = this.serialize(data[key]);
                }
            }
            return serialized;
        }

        return data;
    }
}
