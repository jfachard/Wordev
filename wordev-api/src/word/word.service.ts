import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Word } from '../../prisma/generated/client';

@Injectable()
export class WordService {
  constructor(private prisma: PrismaService) {}

  async getRandomWord(length?: number): Promise<Word> {
    const whereClause = { isAnswer: true, ...(length ? { length } : {}) };
    
    const count = await this.prisma.word.count({
      where: whereClause,
    });

    if (count === 0) {
      throw new NotFoundException(length ? `No answer words found in the database for length ${length}` : 'No answer words found in the database');
    }

    const skip = Math.floor(Math.random() * count);
    const words = await this.prisma.word.findMany({
      where: whereClause,
      skip,
      take: 1,
    });

    return words[0];
  }
}
