import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { WordModule } from '../word/word.module';
import { DailyWordModule } from '../daily-word/daily-word.module';

@Module({
  imports: [WordModule, DailyWordModule],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule {}
