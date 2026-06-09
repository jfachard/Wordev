import { Controller, Post, Get, Param, UseGuards, Req, Body, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('daily/today')
  async getDailyStatus(@Req() req) {
    return this.gamesService.getDailyStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('daily/start')
  async startDailyGame(@Req() req) {
    return this.gamesService.startDailyGame(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('solo/start')
  async startSoloGame(@Req() req, @Body('length') length?: number) {
    const userId = req.user.userId;
    return this.gamesService.startSoloGame(userId, length);
  }

  @UseGuards(JwtAuthGuard)
  @Post('solo/guess')
  async submitGuess(
    @Req() req,
    @Body('gameId') gameId: string,
    @Body('guess') guess: string,
  ) {
    const userId = req.user.userId;
    return this.gamesService.submitGuess(userId, gameId, guess);
  }

  @UseGuards(JwtAuthGuard)
  @Post('solo/hint')
  async getHint(@Req() req, @Body('gameId') gameId: string) {
    return this.gamesService.getHint(req.user.userId, gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('solo/:id')
  async getGameStatus(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.gamesService.getGameStatus(userId, id);
  }

  @Post('guest/solo/start')
  async startGuestSoloGame(@Query('length') length?: string) {
    const parsed = length ? parseInt(length, 10) : undefined;
    return this.gamesService.startGuestSoloGame(parsed && !isNaN(parsed) ? parsed : undefined);
  }

  @Post('guest/daily/start')
  async startGuestDailyGame() {
    return this.gamesService.startGuestDailyGame();
  }

  @Post('guest/guess')
  async submitGuestGuess(
    @Body('sessionId') sessionId: string,
    @Body('guess') guess: string,
  ) {
    return this.gamesService.submitGuestGuess(sessionId, guess);
  }

  @Post('guest/hint')
  async getGuestHint(@Body('sessionId') sessionId: string) {
    return this.gamesService.getGuestHint(sessionId);
  }

  @Get('guest/reveal/:sessionId')
  async getGuestRevealedWord(@Param('sessionId') sessionId: string) {
    return this.gamesService.getGuestRevealedWord(sessionId);
  }
}
