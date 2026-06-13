import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { WordModule } from '../word/word.module';
import { DailyWordModule } from '../daily-word/daily-word.module';
import { UsersModule } from '../users/users.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [WordModule, DailyWordModule, UsersModule, DiscordModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
