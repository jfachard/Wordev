import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordService } from '../word/word.service';

@Injectable()
export class GamesService {
    constructor(private prisma: PrismaService, private wordService: WordService) {}

    async startSoloGame(userId: string, length?: number) {
        const randomWord = await this.wordService.getRandomWord(length);

        if (!randomWord) {
            throw new InternalServerErrorException('Could not retrieve a random word');
        }

        const game = await this.prisma.game.create({
            data: {
                mode: 'SOLO',
                status: 'ACTIVE',
                word: randomWord.word,
                player1Id: userId,
            },
            select: {
                id: true,
                mode: true,
                status: true,
            }
        });

        return game;
    }
}
