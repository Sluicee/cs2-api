import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SteamModule } from './steam/steam.module';
import { InspectModule } from './inspect/inspect.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SteamModule,
    InspectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
