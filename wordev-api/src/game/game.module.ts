import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { GameGateway } from './game.gateway';
import { QueueService } from './queue.service';

@Module({
  imports: [AuthModule, GamesModule],
  providers: [GameGateway, QueueService],
})
export class GameModule {}
