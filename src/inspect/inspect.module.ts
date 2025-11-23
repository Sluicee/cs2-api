import { Module } from '@nestjs/common';
import { InspectService } from './inspect.service';
import { InspectController } from './inspect.controller';
import { QueueService } from './queue.service';
import { CacheService } from './cache.service';
import { SteamModule } from '../steam/steam.module';

@Module({
  imports: [SteamModule],
  providers: [InspectService, QueueService, CacheService],
  controllers: [InspectController],
})
export class InspectModule { }
