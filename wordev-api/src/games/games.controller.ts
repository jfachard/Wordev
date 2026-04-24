import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

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
}
