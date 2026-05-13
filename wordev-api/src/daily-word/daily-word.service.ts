import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyWordService implements OnModuleInit {
  private readonly logger = new Logger(DailyWordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const today = this.todayDate();
    const existing = await this.prisma.dailyWord.findUnique({ where: { date: today } });
    if (!existing) {
      this.logger.log('No daily word found for today on startup — assigning one now.');
      await this.assignDailyWord();
    }
  }

  @Cron('0 0 * * *')
  async assignDailyWord() {
    const today = this.todayDate();

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = await this.prisma.dailyWord.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { wordId: true },
    });

    const excludedIds = recent.map((dw) => dw.wordId);

    const count = await this.prisma.word.count({
      where: { isAnswer: true, id: { notIn: excludedIds } },
    });

    if (count === 0) {
      this.logger.error('No eligible words left for daily assignment (all used in the last 30 days).');
      return;
    }

    const skip = Math.floor(Math.random() * count);
    const [word] = await this.prisma.word.findMany({
      where: { isAnswer: true, id: { notIn: excludedIds } },
      skip,
      take: 1,
    });

    await this.prisma.dailyWord.upsert({
      where: { date: today },
      update: { wordId: word.id },
      create: { date: today, wordId: word.id },
    });

    this.logger.log(`Daily word for ${today.toISOString().slice(0, 10)}: "${word.word}"`);
  }

  async getToday() {
    const today = this.todayDate();
    const daily = await this.prisma.dailyWord.findUnique({
      where: { date: today },
      include: { word: true },
    });

    if (!daily) {
      throw new ServiceUnavailableException('No daily word assigned yet for today.');
    }

    return { date: daily.date, word: daily.word.word, length: daily.word.length };
  }

  private todayDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
