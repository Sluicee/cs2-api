import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import SteamTotp from 'steam-totp';

interface SteamBot {
    id: number;
    user: SteamUser;
    csgo: any;
    isGcReady: boolean;
    username: string;
}

@Injectable()
export class SteamService implements OnModuleInit {
    private readonly logger = new Logger(SteamService.name);
    private bots: SteamBot[] = [];
    private currentBotIndex = 0;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.initializeBots();
    }

    private initializeBots() {
        const botsConfig = this.configService.get<string>('STEAM_BOTS');

        if (!botsConfig) {
            this.logger.error('Missing STEAM_BOTS in .env');
            return;
        }

        // Parse bot credentials: username:password:secret|username:password:secret
        const botEntries = botsConfig.split('|');

        botEntries.forEach((entry, index) => {
            const parts = entry.split(':');

            if (parts.length < 2) {
                this.logger.warn(`Invalid bot entry at index ${index}: ${entry}`);
                return;
            }

            const [username, password, sharedSecret] = parts;

            if (!username || !password) {
                this.logger.warn(`Missing username or password for bot ${index}`);
                return;
            }

            this.createBot(index, username, password, sharedSecret);
        });

        this.logger.log(`Initialized ${this.bots.length} Steam bot(s)`);
    }

    private createBot(id: number, username: string, password: string, sharedSecret?: string) {
        const user = new SteamUser();
        const csgo = new GlobalOffensive(user);

        const bot: SteamBot = {
            id,
            user,
            csgo,
            isGcReady: false,
            username,
        };

        this.bots.push(bot);

        // Login
        const logOnOptions: any = {
            accountName: username,
            password: password,
        };

        if (sharedSecret && sharedSecret.trim() !== '') {
            logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(sharedSecret);
        }

        user.logOn(logOnOptions);

        // Event handlers
        user.on('loggedOn', () => {
            this.logger.log(`Bot ${id} (${username}) logged into Steam as ${user.steamID.getSteamID64()}`);
            user.setPersona(SteamUser.EPersonaState.Online);
            user.gamesPlayed([730]); // Launch CS2
        });

        csgo.on('connectedToGC', () => {
            this.logger.log(`Bot ${id} (${username}) connected to CS2 Game Coordinator`);
            bot.isGcReady = true;
        });

        csgo.on('disconnectedFromGC', (reason) => {
            this.logger.warn(`Bot ${id} (${username}) disconnected from GC: ${reason}`);
            bot.isGcReady = false;
        });

        user.on('error', (err) => {
            this.logger.error(`Bot ${id} (${username}) error: ${err.message}`);
        });
    }

    /**
     * Get next available bot using round-robin
     */
    getNextBot(): SteamBot | null {
        if (this.bots.length === 0) {
            return null;
        }

        // Filter only ready bots
        const readyBots = this.bots.filter(bot => bot.isGcReady);

        if (readyBots.length === 0) {
            return null;
        }

        // Round-robin selection
        const bot = readyBots[this.currentBotIndex % readyBots.length];
        this.currentBotIndex++;

        return bot;
    }

    /**
     * Get all bots
     */
    getAllBots(): SteamBot[] {
        return this.bots;
    }

    /**
     * Get bot statistics
     */
    getBotStats() {
        return {
            total: this.bots.length,
            ready: this.bots.filter(bot => bot.isGcReady).length,
            bots: this.bots.map(bot => ({
                id: bot.id,
                username: bot.username,
                isGcReady: bot.isGcReady,
            })),
        };
    }

    /**
     * Check if any bot is ready
     */
    get isAnyBotReady(): boolean {
        return this.bots.some(bot => bot.isGcReady);
    }

    // Backward compatibility - deprecated
    get user(): SteamUser {
        const bot = this.getNextBot();
        return bot ? bot.user : null as any;
    }

    get csgo(): any {
        const bot = this.getNextBot();
        return bot ? bot.csgo : null;
    }

    get isGcReady(): boolean {
        return this.isAnyBotReady;
    }
}
