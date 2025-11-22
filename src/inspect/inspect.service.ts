import { Injectable, BadRequestException, RequestTimeoutException, Logger } from '@nestjs/common';
import { SteamService } from '../steam/steam.service';

@Injectable()
export class InspectService {
    private readonly logger = new Logger(InspectService.name);

    constructor(private steamService: SteamService) { }

    async inspectItem(params: { s?: string; a: string; d: string; m?: string }) {
        if (!this.steamService.isGcReady) {
            throw new RequestTimeoutException('GC Connection not ready');
        }

        const { s, a, d, m } = params;
        // If 'm' (market id) is present, owner is usually '0' for the inspect request
        const ownerId = s || '0';

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new RequestTimeoutException('Inspect request timed out'));
            }, 10000); // 10s timeout to be safe

            try {
                this.steamService.csgo.inspectItem(ownerId, a, d, (item) => {
                    clearTimeout(timeout);
                    if (!item) {
                        reject(new BadRequestException('Failed to inspect item (GC returned null)'));
                        return;
                    }
                    resolve(item);
                });
            } catch (err) {
                clearTimeout(timeout);
                this.logger.error(`Inspect error: ${err.message}`);
                reject(new BadRequestException(`Inspect failed: ${err.message}`));
            }
        });
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
}
