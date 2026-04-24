import { Module } from '@nestjs/common';
import { WordService } from './word.service';
import { WordController } from './word.controller';

@Module({
  exports: [WordService],
  providers: [WordService],
  controllers: [WordController]
})
export class WordModule {}
