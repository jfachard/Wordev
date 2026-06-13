import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordService } from '../word/word.service';
import { DailyWordService } from '../daily-word/daily-word.service';
import { UsersService } from '../users/users.service';
import { DiscordWebhookService } from '../discord/discord-webhook.service';
import { randomUUID } from 'crypto';

interface GuestSession {
    word: string;
    hintsUsed: number;
    hintedPositions: number[];
    expiresAt: number;
}

@Injectable()
export class GamesService {
    private readonly guestSessions = new Map<string, GuestSession>();

    constructor(
        private prisma: PrismaService,
        private wordService: WordService,
        private dailyWordService: DailyWordService,
        private usersService: UsersService,
        private discordWebhook: DiscordWebhookService,
    ) {
        setInterval(() => this.pruneGuestSessions(), 15 * 60 * 1000);
    }

    private pruneGuestSessions() {
        const now = Date.now();
        for (const [id, s] of this.guestSessions) {
            if (s.expiresAt < now) this.guestSessions.delete(id);
        }
    }

    async startGuestSoloGame(length?: number) {
        const randomWord = await this.wordService.getRandomWord(length);
        const sessionId = randomUUID();
        this.guestSessions.set(sessionId, {
            word: randomWord.word,
            hintsUsed: 0,
            hintedPositions: [],
            expiresAt: Date.now() + 2 * 60 * 60 * 1000,
        });
        return { sessionId, wordLength: randomWord.word.length };
    }

    async startGuestDailyGame() {
        const dailyWord = await this.dailyWordService.getToday();
        const sessionId = randomUUID();
        this.guestSessions.set(sessionId, {
            word: dailyWord.word,
            hintsUsed: 0,
            hintedPositions: [],
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });
        return { sessionId, wordLength: dailyWord.length };
    }

    async submitGuestGuess(sessionId: string, guess: string) {
        const session = this.guestSessions.get(sessionId);
        if (!session || session.expiresAt < Date.now()) {
            throw new NotFoundException('Guest session not found or expired');
        }

        const targetWord = session.word.toUpperCase();
        const guessWord = guess.toUpperCase();

        if (guessWord.length !== targetWord.length) {
            throw new BadRequestException(`Guess must be exactly ${targetWord.length} characters long`);
        }

        const validWord = await this.prisma.word.findFirst({ where: { word: guessWord } });
        if (!validWord) {
            throw new BadRequestException('Not a valid word');
        }

        const result = new Array(targetWord.length).fill('absent');
        const targetLetterCounts: Record<string, number> = {};
        for (const char of targetWord) {
            targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
        }
        for (let i = 0; i < targetWord.length; i++) {
            if (guessWord[i] === targetWord[i]) {
                result[i] = 'correct';
                targetLetterCounts[guessWord[i]]--;
            }
        }
        for (let i = 0; i < targetWord.length; i++) {
            if (result[i] !== 'correct' && targetLetterCounts[guessWord[i]] > 0) {
                result[i] = 'present';
                targetLetterCounts[guessWord[i]]--;
            }
        }

        const isWin = guessWord === targetWord;
        return { guess: guessWord, result, isWin, word: isWin ? null : undefined };
    }

    async getGuestHint(sessionId: string) {
        const MAX_HINTS = 3;
        const session = this.guestSessions.get(sessionId);
        if (!session || session.expiresAt < Date.now()) {
            throw new NotFoundException('Guest session not found or expired');
        }
        if (session.hintsUsed >= MAX_HINTS) {
            throw new BadRequestException('No hints remaining');
        }

        const word = session.word.toUpperCase();
        const alreadyHinted = new Set(session.hintedPositions);
        const available = Array.from({ length: word.length }, (_, i) => i).filter(i => !alreadyHinted.has(i));

        if (available.length === 0) {
            throw new BadRequestException('No more positions to hint');
        }

        const position = available[Math.floor(Math.random() * available.length)];
        const letter = word[position];
        session.hintsUsed++;
        session.hintedPositions.push(position);

        return { position, letter, hintsUsed: session.hintsUsed, hintsLeft: MAX_HINTS - session.hintsUsed };
    }

    async getGuestRevealedWord(sessionId: string) {
        const session = this.guestSessions.get(sessionId);
        if (!session) throw new NotFoundException('Guest session not found or expired');
        return { word: session.word.toUpperCase() };
    }

    async startDailyGame(userId: string) {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

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
        startOfDay.setUTCHours(0, 0, 0, 0);

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
            won: game.winnerId !== null,
        };
    }

    async shareToDiscord(userId: string, gameId: string, shareText: string) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: {
                id: true,
                status: true,
                player1Id: true,
                player2Id: true,
            },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const isPlayer =
            game.player1Id === userId || game.player2Id === userId;
        if (!isPlayer) {
            throw new NotFoundException('Game not found or you are not a player');
        }

        if (game.status !== 'FINISHED') {
            throw new BadRequestException('Game is not finished');
        }

        const webhookUrl = await this.usersService.getDecryptedDiscordWebhook(userId);
        if (!webhookUrl) {
            throw new BadRequestException('Discord is not connected');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true },
        });
        const content = user?.username
            ? `**${user.username}**\n${shareText}`
            : shareText;

        await this.discordWebhook.postMessage(webhookUrl, content);
        return { ok: true };
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

        const validWord = await this.prisma.word.findFirst({ where: { word: guessWord } });
        if (!validWord) {
            throw new BadRequestException('Not a valid word');
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

    async startVersusGame(player1Id: string, player2Id: string) {
        const word = await this.wordService.getRandomWord();

        if (!word) {
            throw new InternalServerErrorException('Could not retrieve a random word');
        }

        const game = await this.prisma.game.create({
            data: {
                mode: 'VERSUS',
                status: 'ACTIVE',
                word: word.word,
                player1Id,
                player2Id,
            },
            include: {
                player1: { select: { username: true, elo: true } },
                player2: { select: { username: true, elo: true } },
            },
        });

        return {
            id: game.id,
            wordLength: word.word.length,
            player1: { username: game.player1.username, elo: game.player1.elo },
            player2: { username: game.player2!.username, elo: game.player2!.elo },
        };
    }

    async submitVersusGuess(userId: string, gameId: string, guess: string) {
        const game = await this.prisma.game.findUnique({ where: { id: gameId } });

        if (!game || (game.player1Id !== userId && game.player2Id !== userId)) {
            throw new NotFoundException('Game not found or you are not a player');
        }

        if (game.status !== 'ACTIVE') {
            throw new BadRequestException('Game is not active');
        }

        const targetWord = game.word.toUpperCase();
        const guessWord = guess.toUpperCase();

        if (guessWord.length !== targetWord.length) {
            throw new BadRequestException(`Guess must be exactly ${targetWord.length} characters long`);
        }

        const validWord = await this.prisma.word.findFirst({ where: { word: guessWord } });
        if (!validWord) {
            throw new BadRequestException('Not a valid word');
        }

        const isPlayer1 = game.player1Id === userId;
        const currentAttempts = isPlayer1 ? game.player1Attempts : game.player2Attempts;

        const result: { letter: string; status: string }[] = Array.from({ length: targetWord.length }, (_, i) => ({
            letter: guessWord[i],
            status: 'absent',
        }));
        const targetLetterCounts: Record<string, number> = {};

        for (const char of targetWord) {
            targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
        }

        for (let i = 0; i < targetWord.length; i++) {
            if (guessWord[i] === targetWord[i]) {
                result[i].status = 'correct';
                targetLetterCounts[guessWord[i]]--;
            }
        }

        for (let i = 0; i < targetWord.length; i++) {
            if (result[i].status !== 'correct' && targetLetterCounts[guessWord[i]] > 0) {
                result[i].status = 'present';
                targetLetterCounts[guessWord[i]]--;
            }
        }

        const newAttempts = currentAttempts + 1;
        const isWin = guessWord === targetWord;
        const opponentId = isPlayer1 ? game.player2Id! : game.player1Id;

        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                ...(isPlayer1 ? { player1Attempts: newAttempts } : { player2Attempts: newAttempts }),
            },
        });

        return { result, attempts: newAttempts, isWin, opponentId };
    }

    async endVersusGame(gameId: string, winnerId: string, loserId: string) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: {
                player1: { select: { id: true, elo: true } },
                player2: { select: { id: true, elo: true } },
            },
        });

        if (!game || game.status !== 'ACTIVE') return null;

        const winner = game.player1Id === winnerId ? game.player1 : game.player2!;
        const loser = game.player1Id === loserId ? game.player1 : game.player2!;

        const K = 32;
        const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
        const winnerEloDelta = Math.round(K * (1 - expectedWinner));
        const loserEloDelta = Math.round(K * (0 - (1 - expectedWinner)));

        const winnerNewElo = winner.elo + winnerEloDelta;
        const loserNewElo = loser.elo + loserEloDelta;

        await this.prisma.$transaction([
            this.prisma.game.update({
                where: { id: gameId },
                data: { status: 'FINISHED', winnerId, endedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: winnerId },
                data: { elo: winnerNewElo, wins: { increment: 1 } },
            }),
            this.prisma.user.update({
                where: { id: loserId },
                data: { elo: loserNewElo, losses: { increment: 1 } },
            }),
            this.prisma.eloStat.create({
                data: { userId: winnerId, gameId, eloBefore: winner.elo, eloAfter: winnerNewElo },
            }),
            this.prisma.eloStat.create({
                data: { userId: loserId, gameId, eloBefore: loser.elo, eloAfter: loserNewElo },
            }),
        ]);

        return {
            winnerId,
            word: game.word,
            players: {
                [winnerId]: { eloBefore: winner.elo, eloAfter: winnerNewElo, eloDelta: winnerEloDelta },
                [loserId]: { eloBefore: loser.elo, eloAfter: loserNewElo, eloDelta: loserEloDelta },
            },
        };
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
