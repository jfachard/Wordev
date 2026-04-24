import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
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

    async submitGuess(userId: string, gameId: string, guess: string) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId }
        });

        if (!game || game.player1Id !== userId) {
            throw new NotFoundException('Game not found or you are not the owner');
        }

        if (game.status === 'FINISHED') {
            throw new BadRequestException('Game is already finished');
        }

        const targetWord = game.word.toUpperCase();
        const guessWord = guess.toUpperCase();

        if (guessWord.length !== targetWord.length) {
            throw new BadRequestException(`Guess must be exactly ${targetWord.length} characters long`);
        }

        // Evaluate the guess
        const result = new Array(targetWord.length).fill('absent');
        const targetLetterCounts: Record<string, number> = {};

        for (const char of targetWord) {
            targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
        }

        // First pass: Find 'correct'
        for (let i = 0; i < targetWord.length; i++) {
            if (guessWord[i] === targetWord[i]) {
                result[i] = 'correct';
                targetLetterCounts[guessWord[i]]--;
            }
        }

        // Second pass: Find 'present'
        for (let i = 0; i < targetWord.length; i++) {
            if (result[i] !== 'correct' && targetLetterCounts[guessWord[i]] > 0) {
                result[i] = 'present';
                targetLetterCounts[guessWord[i]]--;
            }
        }

        const newAttempts = game.player1Attempts + 1;
        const isWin = guessWord === targetWord;
        const isLoss = !isWin && newAttempts >= 6;
        const isFinished = isWin || isLoss;

        const updatedGame = await this.prisma.game.update({
            where: { id: game.id },
            data: {
                player1Attempts: newAttempts,
                ...(isFinished ? { status: 'FINISHED', endedAt: new Date() } : {}),
                ...(isWin ? { winnerId: userId } : {})
            },
            select: {
                id: true,
                status: true,
                mode: true,
                player1Attempts: true,
            }
        });

        return {
            guess: guessWord,
            result,
            game: updatedGame
        };
    }
}
