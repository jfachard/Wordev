import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordService } from '../word/word.service';
import { DailyWordService } from '../daily-word/daily-word.service';

@Injectable()
export class GamesService {
    constructor(
        private prisma: PrismaService,
        private wordService: WordService,
        private dailyWordService: DailyWordService,
    ) {}

    async startDailyGame(userId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existing = await this.prisma.game.findFirst({
            where: {
                player1Id: userId,
                mode: 'DAILY',
                startedAt: { gte: startOfDay },
            },
        });

        if (existing) {
            throw new BadRequestException('You have already played today\'s daily challenge');
        }

        const dailyWord = await this.dailyWordService.getToday();

        const game = await this.prisma.game.create({
            data: {
                mode: 'DAILY',
                status: 'ACTIVE',
                word: dailyWord.word,
                player1Id: userId,
            },
            select: {
                id: true,
                mode: true,
                status: true,
            },
        });

        return { gameId: game.id, mode: game.mode, status: game.status, wordLength: dailyWord.length };
    }

    async getDailyStatus(userId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const game = await this.prisma.game.findFirst({
            where: {
                player1Id: userId,
                mode: 'DAILY',
                startedAt: { gte: startOfDay },
            },
            select: {
                id: true,
                status: true,
                player1Attempts: true,
                winnerId: true,
                hintsUsed: true,
                hintedPositions: true,
                word: true,
            },
        });

        if (!game) return { hasPlayed: false };

        if (game.status === 'ACTIVE') {
            return {
                hasPlayed: true,
                gameId: game.id,
                status: 'ACTIVE',
                attempts: game.player1Attempts,
                hintsUsed: game.hintsUsed,
                wordLength: game.word.length,
                hintedPositions: game.hintedPositions,
                hintedLetters: game.hintedPositions.map(pos => game.word.toUpperCase()[pos]),
            };
        }

        return {
            hasPlayed: true,
            gameId: game.id,
            status: 'FINISHED',
            attempts: game.player1Attempts,
            winnerId: game.winnerId,
        };
    }

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

        return { ...game, wordLength: randomWord.word.length };
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

    async getHint(userId: string, gameId: string) {
        const MAX_HINTS = 3;
        const game = await this.prisma.game.findUnique({ where: { id: gameId } });

        if (!game || game.player1Id !== userId) {
            throw new NotFoundException('Game not found or you are not the owner');
        }
        if (game.status === 'FINISHED') {
            throw new BadRequestException('Game is already finished');
        }
        if (game.hintsUsed >= MAX_HINTS) {
            throw new BadRequestException('No hints remaining');
        }

        const word = game.word.toUpperCase();
        const alreadyHinted = new Set(game.hintedPositions);
        const available = Array.from({ length: word.length }, (_, i) => i).filter(i => !alreadyHinted.has(i));

        if (available.length === 0) {
            throw new BadRequestException('No more positions to hint');
        }

        const position = available[Math.floor(Math.random() * available.length)];
        const letter = word[position];
        const newHintsUsed = game.hintsUsed + 1;

        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                hintsUsed: newHintsUsed,
                hintedPositions: [...game.hintedPositions, position],
            },
        });

        return { position, letter, hintsUsed: newHintsUsed, hintsLeft: MAX_HINTS - newHintsUsed };
    }

    async getGameStatus(userId: string, gameId: string) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: {
                id: true,
                mode: true,
                status: true,
                player1Attempts: true,
                endedAt: true,
                word: true,
                player1Id: true,
            }
        });

        if (!game || game.player1Id !== userId) {
            throw new NotFoundException('Game not found or you are not the owner');
        }

        return {
            gameId: game.id,
            status: game.status,
            mode: game.mode,
            attempts: game.player1Attempts,
            endedAt: game.endedAt,
            ...(game.status === 'FINISHED' ? { word: game.word } : {})
        };
    }
}
