import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { WordModule } from './word/word.module';
import { DailyWordModule } from './daily-word/daily-word.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule, UsersModule, GamesModule, WordModule, DailyWordModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
