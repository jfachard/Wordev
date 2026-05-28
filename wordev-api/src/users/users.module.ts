import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  controllers: [UsersController, LeaderboardController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
