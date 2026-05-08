import { Module } from '@nestjs/common';
import { DailyWordService } from './daily-word.service';
import { DailyWordController } from './daily-word.controller';

@Module({
  providers: [DailyWordService],
  controllers: [DailyWordController],
  exports: [DailyWordService],
})
export class DailyWordModule {}
