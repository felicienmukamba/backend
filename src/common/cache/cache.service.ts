import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    /**
     * Get cached value
     */
    async get<T>(key: string): Promise<T | undefined> {
        return await this.cacheManager.get<T>(key);
    }

    /**
     * Set cache value with optional TTL
     */
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        await this.cacheManager.set(key, value, ttl);
    }

    /**
     * Delete cache key
     */
    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    /**
     * Clear all cache
     */
    async reset(): Promise<void> {
        if ((this.cacheManager as any).clear) {
            await (this.cacheManager as any).clear();
        } else if ((this.cacheManager as any).reset) {
            await (this.cacheManager as any).reset();
        }
    }

    /**
     * Generate cache key for pagination
     */
    generatePaginationKey(resource: string, page: number, limit: number, search?: string): string {
        const searchPart = search ? `-${search}` : '';
        return `${resource}:page:${page}:limit:${limit}${searchPart}`;
    }

    /**
     * Generate cache key for single entity
     */
    generateEntityKey(resource: string, id: string | number): string {
        return `${resource}:${id}`;
    }

    /**
     * Invalidate all keys matching pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        // Note: This requires Redis SCAN command support
        // For basic cache-manager, we'll use reset for now
        // In production, implement with Redis client directly
        await this.reset();
    }
}
