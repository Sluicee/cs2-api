import { Injectable, BadRequestException, RequestTimeoutException, Logger } from '@nestjs/common';
import { SteamService } from '../steam/steam.service';
import { QueueService } from './queue.service';
import { CacheService } from './cache.service';
import { getDopplerPhase, getFadePercentage, isBlueGem, WEAPON_DEFINDEX_MAP, isFadeSkin } from './inspect.utils';

@Injectable()
export class InspectService {
    private readonly logger = new Logger(InspectService.name);

    constructor(
        private steamService: SteamService,
        private queueService: QueueService,
        private cacheService: CacheService,
    ) { }

    async inspectItem(params: { s?: string; a: string; d: string; m?: string }) {
        if (!this.steamService.isAnyBotReady) {
            throw new RequestTimeoutException('No bots connected to GC');
        }

        const { s, a, d, m } = params;
        const ownerId = s || '0';

        // Check cache first
        const cached = await this.cacheService.get(ownerId, a, d);
        if (cached) {
            this.logger.debug(`Cache hit for ${ownerId}:${a}:${d}`);
            return cached;
        }

        // Queue the request
        try {
            const item = await this.queueService.enqueue(params);
            const enhanced = this.enhanceItem(item);

            // Cache the result
            await this.cacheService.set(ownerId, a, d, enhanced);

            return enhanced;
        } catch (err) {
            this.logger.error(`Inspect error: ${err.message}`);
            throw new BadRequestException(`Inspect failed: ${err.message}`);
        }
    }

    async inspectBatch(items: Array<{ s?: string; a: string; d: string; m?: string }>) {
        if (!this.steamService.isAnyBotReady) {
            throw new RequestTimeoutException('No bots connected to GC');
        }

        // Check cache for all items
        const cacheChecks = items.map(item => ({
            s: item.s || '0',
            a: item.a,
            d: item.d,
        }));

        const cachedResults = await this.cacheService.getMany(cacheChecks);

        // Separate cached and non-cached items
        const results: any[] = new Array(items.length);
        const toFetch: Array<{ index: number; params: any }> = [];

        items.forEach((item, index) => {
            const key = `${item.s || '0'}:${item.a}:${item.d}`;
            const cached = cachedResults.get(key);

            if (cached) {
                results[index] = cached;
            } else {
                toFetch.push({ index, params: item });
            }
        });

        this.logger.log(`Batch: ${cachedResults.size} cached, ${toFetch.length} to fetch`);

        // Fetch non-cached items
        const fetchPromises = toFetch.map(async ({ index, params }) => {
            try {
                const item = await this.queueService.enqueue(params);
                const enhanced = this.enhanceItem(item);

                // Cache the result
                const ownerId = params.s || '0';
                await this.cacheService.set(ownerId, params.a, params.d, enhanced);

                results[index] = enhanced;
            } catch (err) {
                this.logger.error(`Failed to inspect item at index ${index}: ${err.message}`);
                results[index] = {
                    error: err.message,
                    params,
                };
            }
        });

        await Promise.all(fetchPromises);

        return {
            items: results,
            stats: {
                total: items.length,
                cached: cachedResults.size,
                fetched: toFetch.length,
                failed: results.filter(r => r.error).length,
            },
        };
    }

    private enhanceItem(item: any) {
        const defindex = item.defindex;
        const paintindex = item.paintindex;
        const paintseed = item.paintseed;

        const weaponName = WEAPON_DEFINDEX_MAP[defindex];

        let phase: string | null = null;
        let fadePercentage: number | null = null;
        let isBlueGemItem = false;

        if (paintindex) {
            phase = getDopplerPhase(paintindex);
        }

        if (weaponName && paintseed && paintindex && isFadeSkin(paintindex)) {
            fadePercentage = getFadePercentage(weaponName, paintseed);
        }

        if (paintseed && defindex) {
            isBlueGemItem = isBlueGem(defindex, paintseed);
        }

        return {
            ...item,
            phase,
            fadePercentage,
            isBlueGem: isBlueGemItem
        };
    }

    parseInspectLink(link: string) {
        // Regex to match S...A...D... or M...A...D...
        // Example: ...%20S76561198084749846A698323590D7935523998312483177
        const regex = /([SM])(\d+)A(\d+)D(\d+)/;
        const match = link.match(regex);

        if (!match) {
            throw new BadRequestException('Invalid inspect link format');
        }

        const type = match[1]; // 'S' or 'M'
        const id = match[2];
        const a = match[3];
        const d = match[4];

        return {
            s: type === 'S' ? id : undefined,
            m: type === 'M' ? id : undefined,
            a,
            d,
        };
    }

    getStats() {
        return {
            bots: this.steamService.getBotStats(),
            queue: this.queueService.getStats(),
            cache: this.cacheService.getStats(),
        };
    }
}
