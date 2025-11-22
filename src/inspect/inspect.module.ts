import { Module } from '@nestjs/common';
import { InspectService } from './inspect.service';
import { InspectController } from './inspect.controller';
import { SteamModule } from '../steam/steam.module';

@Module({
  imports: [SteamModule],
  providers: [InspectService],
  controllers: [InspectController],
})
export class InspectModule { }
