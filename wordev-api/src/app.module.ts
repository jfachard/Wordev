import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { WordModule } from './word/word.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, GamesModule, WordModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
