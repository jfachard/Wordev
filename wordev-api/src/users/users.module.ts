import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LeaderboardController } from './leaderboard.controller';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [DiscordModule],
  controllers: [UsersController, LeaderboardController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
