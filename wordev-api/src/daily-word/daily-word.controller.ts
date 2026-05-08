import { Controller, Get, UseGuards } from '@nestjs/common';
import { DailyWordService } from './daily-word.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('daily-word')
export class DailyWordController {
  constructor(private readonly dailyWordService: DailyWordService) {}

  @UseGuards(JwtAuthGuard)
  @Get('today')
  getToday() {
    return this.dailyWordService.getToday();
  }
}
