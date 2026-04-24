import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { WordModule } from '../word/word.module';

@Module({
  imports: [WordModule],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule {}
