import { Injectable, Logger } from '@nestjs/common';
import { SteamService } from '../steam/steam.service';

interface QueueItem {
    params: { s?: string; a: string; d: string; m?: string };
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    retries: number;
}

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);
    private queue: QueueItem[] = [];
    private processing = false;
    private readonly maxRetries = 3;
    private readonly rateLimit: number;
    private stats = {
        processed: 0,
        failed: 0,
        queued: 0,
    };

    constructor(private steamService: SteamService) {
        this.rateLimit = 1000; // 1 second between requests per bot
    }

    /**
     * Add item to queue and return promise
     */
    enqueue(params: { s?: string; a: string; d: string; m?: string }): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                params,
                resolve,
                reject,
                retries: 0,
            });
            this.stats.queued++;

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    /**
     * Process queue items
     */
    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item) break;

            try {
                const result = await this.inspectItem(item);
                item.resolve(result);
                this.stats.processed++;
            } catch (err) {
                if (item.retries < this.maxRetries) {
                    // Retry
                    item.retries++;
                    this.queue.push(item);
                    this.logger.warn(`Retrying item (attempt ${item.retries}/${this.maxRetries})`);
                } else {
                    // Max retries reached
                    item.reject(err);
                    this.stats.failed++;
                }
            }

            // Rate limiting: wait before processing next item
            if (this.queue.length > 0) {
                await this.sleep(this.rateLimit);
            }
        }

        this.processing = false;
    }

    /**
     * Inspect single item using available bot
     */
    private async inspectItem(item: QueueItem): Promise<any> {
        const bot = this.steamService.getNextBot();

        if (!bot || !bot.isGcReady) {
            throw new Error('No bots available');
        }

        const { s, a, d, m } = item.params;
        const ownerId = s || '0';

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Inspect request timed out'));
            }, 10000);

            try {
                bot.csgo.inspectItem(ownerId, a, d, (result) => {
                    clearTimeout(timeout);
                    if (!result) {
                        reject(new Error('GC returned null'));
                        return;
                    }
                    resolve(result);
                });
            } catch (err) {
                clearTimeout(timeout);
                reject(err);
            }
        });
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            ...this.stats,
        };
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
