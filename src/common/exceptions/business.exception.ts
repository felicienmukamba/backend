import { HttpException } from '@nestjs/common';

/**
 * Base class for all business exceptions
 * Provides structured error information with codes and metadata
 */
export class BusinessException extends HttpException {
    constructor(
        public readonly code: string,
        message: string,
        statusCode: number = 400,
        public readonly metadata?: Record<string, any>,
    ) {
        super(
            {
                message,
                code,
                metadata,
                statusCode,
            },
            statusCode,
        );
    }
}
