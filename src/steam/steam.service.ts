import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import SteamTotp from 'steam-totp';

@Injectable()
export class SteamService implements OnModuleInit {
    private readonly logger = new Logger(SteamService.name);
    public user: SteamUser;
    public csgo: any; // GlobalOffensive types might be missing
    public isGcReady = false;

    constructor(private configService: ConfigService) {
        this.user = new SteamUser();
        this.csgo = new GlobalOffensive(this.user);
    }

    onModuleInit() {
        this.login();
    }

    private login() {
        const username = this.configService.get<string>('STEAM_USERNAME');
        const password = this.configService.get<string>('STEAM_PASSWORD');
        const sharedSecret = this.configService.get<string>('STEAM_SHARED_SECRET');

        if (!username || !password) {
            this.logger.error('Missing STEAM_USERNAME or STEAM_PASSWORD in .env');
            return;
        }

        const logOnOptions: any = {
            accountName: username,
            password: password,
        };

        if (sharedSecret) {
            logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(sharedSecret);
        }

        this.user.logOn(logOnOptions);

        this.user.on('loggedOn', () => {
            this.logger.log(`Logged into Steam as ${this.user.steamID.getSteamID64()}`);
            this.user.setPersona(SteamUser.EPersonaState.Online);
            this.user.gamesPlayed([730]); // Launch CS2
        });

        this.csgo.on('connectedToGC', () => {
            this.logger.log('Connected to CS2 Game Coordinator');
            this.isGcReady = true;
        });

        this.csgo.on('disconnectedFromGC', (reason) => {
            this.logger.warn(`Disconnected from GC: ${reason}`);
            this.isGcReady = false;
        });

        this.user.on('error', (err) => {
            this.logger.error(`Steam error: ${err.message}`);
        });
    }
}
