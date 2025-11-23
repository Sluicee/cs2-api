import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
    private readonly logger = new Logger(CacheService.name);
    private redis: Redis;
    private cacheTtl: number;
    private stats = {
        hits: 0,
        misses: 0,
        sets: 0,
    };

    constructor(private configService: ConfigService) {
        this.cacheTtl = this.configService.get<number>('INSPECT_CACHE_TTL') || 86400;
    }

    onModuleInit() {
        this.initializeRedis();
    }

    private initializeRedis() {
        const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
        const port = this.configService.get<number>('REDIS_PORT') || 6379;
        const password = this.configService.get<string>('REDIS_PASSWORD');
        const db = this.configService.get<number>('REDIS_DB') || 0;

        this.redis = new Redis({
            host,
            port,
            password: password || undefined,
            db,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.redis.on('connect', () => {
            this.logger.log(`Connected to Redis at ${host}:${port}`);
        });

        this.redis.on('error', (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });
    }

    /**
     * Generate cache key for inspect item
     */
    private getCacheKey(s: string, a: string, d: string): string {
        return `inspect:${s}:${a}:${d}`;
    }

    /**
     * Get cached item
     */
    async get(s: string, a: string, d: string): Promise<any | null> {
        try {
            const key = this.getCacheKey(s, a, d);
            const cached = await this.redis.get(key);

            if (cached) {
                this.stats.hits++;
                return JSON.parse(cached);
            }

            this.stats.misses++;
            return null;
        } catch (err) {
            this.logger.error(`Cache get error: ${err.message}`);
            return null;
        }
    }

    /**
     * Set cached item
     */
    async set(s: string, a: string, d: string, data: any): Promise<void> {
        try {
            const key = this.getCacheKey(s, a, d);
            await this.redis.setex(key, this.cacheTtl, JSON.stringify(data));
            this.stats.sets++;
        } catch (err) {
            this.logger.error(`Cache set error: ${err.message}`);
        }
    }

    /**
     * Get multiple cached items (bulk operation)
     */
    async getMany(items: Array<{ s: string; a: string; d: string }>): Promise<Map<string, any>> {
        const result = new Map<string, any>();

        try {
            const keys = items.map(item => this.getCacheKey(item.s, item.a, item.d));
            const values = await this.redis.mget(...keys);

            values.forEach((value, index) => {
                if (value) {
                    const item = items[index];
                    const key = `${item.s}:${item.a}:${item.d}`;
                    result.set(key, JSON.parse(value));
                    this.stats.hits++;
                } else {
                    this.stats.misses++;
                }
            });
        } catch (err) {
            this.logger.error(`Cache getMany error: ${err.message}`);
        }

        return result;
    }

    /**
     * Set multiple cached items (bulk operation)
     */
    async setMany(items: Array<{ s: string; a: string; d: string; data: any }>): Promise<void> {
        try {
            const pipeline = this.redis.pipeline();

            items.forEach(item => {
                const key = this.getCacheKey(item.s, item.a, item.d);
                pipeline.setex(key, this.cacheTtl, JSON.stringify(item.data));
            });

            await pipeline.exec();
            this.stats.sets += items.length;
        } catch (err) {
            this.logger.error(`Cache setMany error: ${err.message}`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            hitRate: hitRate.toFixed(2) + '%',
        };
    }

    /**
     * Clear all inspect cache
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await this.redis.keys('inspect:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.log(`Cleared ${keys.length} cached items`);
            }
        } catch (err) {
            this.logger.error(`Cache clearAll error: ${err.message}`);
        }
    }
}
