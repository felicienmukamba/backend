import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: redisStore,
                host: configService.get('REDIS_HOST', 'localhost'),
                port: configService.get('REDIS_PORT', 6379),
                ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
                max: configService.get('CACHE_MAX_ITEMS', 100),
                // Redis password (if needed)
                password: configService.get('REDIS_PASSWORD'),
                // Fallback to in-memory if Redis is not available
                isCacheableValue: (value: any) => value !== null && value !== undefined,
            }),
        }),
    ],
    exports: [CacheModule],
})
export class CacheConfigModule { }
