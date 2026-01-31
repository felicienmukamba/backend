import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        PinoLoggerModule.forRoot({
            pinoHttp: {
                level: process.env.LOG_LEVEL || 'info',
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                colorize: true,
                                translateTime: 'SYS:standard',
                                ignore: 'pid,hostname',
                                singleLine: false,
                            },
                        }
                        : undefined,
                customProps: (req: any) => ({
                    correlationId: req.headers['x-correlation-id'] || req.id,
                    userId: req.user?.id,
                    companyId: req.user?.companyId,
                }),
                customLogLevel: (req, res, err) => {
                    if (res.statusCode >= 500 || err) {
                        return 'error';
                    }
                    if (res.statusCode >= 400) {
                        return 'warn';
                    }
                    return 'info';
                },
                customSuccessMessage: (req, res) => {
                    return `${req.method} ${req.url} ${res.statusCode}`;
                },
                customErrorMessage: (req, res, err) => {
                    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
                },
            },
        }),
    ],
    exports: [PinoLoggerModule],
})
export class LoggerModule { }
