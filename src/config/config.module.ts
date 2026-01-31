import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateConfig } from './config.schema';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            validate: validateConfig,
            envFilePath: ['.env.local', '.env'],
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule { }
