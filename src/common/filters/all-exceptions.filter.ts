import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    message: string | string[];
    code?: string;
    metadata?: Record<string, any>;
    correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();

        // --- FIX IS HERE ---
        const response = ctx.getResponse<Response>();
        // -------------------

        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse: ErrorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: this.getErrorMessage(exception),
            correlationId: request.headers['x-correlation-id'] as string,
        };

        // Add custom error code and metadata if available
        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse as any;
                if (responseObj.code) {
                    errorResponse.code = responseObj.code;
                }
                if (responseObj.metadata) {
                    errorResponse.metadata = responseObj.metadata;
                }
            }
        }

        // Log the error
        if (status >= 500) {
            this.logger.error(
                `Internal Server Error: ${errorResponse.message}`,
                exception instanceof Error ? exception.stack : undefined,
                {
                    ...errorResponse,
                    exception: exception instanceof Error ? exception.message : exception,
                },
            );
        } else if (status >= 400) {
            this.logger.warn(`Client Error: ${errorResponse.message}`, {
                ...errorResponse,
            });
        }

        response.status(status).json(errorResponse);
    }

    private getErrorMessage(exception: unknown): string | string[] {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null) {
                const responseObj = response as any;
                return responseObj.message || exception.message;
            }
            return exception.message;
        }

        // Handle Prisma errors
        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    return 'Une entrée avec ces données existe déjà';
                case 'P2025':
                    return 'Enregistrement non trouvé';
                case 'P2003':
                    return 'Contrainte de clé étrangère violée';
                default:
                    return `Erreur de base de données (${exception.code})`;
            }
        }

        if (exception instanceof Prisma.PrismaClientValidationError) {
            return `Erreur de validation des données: ${exception.message.replace(/\n/g, ' ')}`;
        }

        if (exception instanceof Error) {
            return exception.message;
        }

        return 'Internal server error';
    }
}