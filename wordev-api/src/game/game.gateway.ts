import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { GamesService } from '../games/games.service';
import { QueueService } from './queue.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly gamesService: GamesService,
    private readonly queueService: QueueService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.authService.verifyToken(token);
      client.data.userId = payload.userId;
      client.emit('authenticated');
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.queueService.leave(client.data.userId);
    }
    if (client.data.gameId && client.data.opponentId) {
      void this.resolveDisconnect(client.data.gameId, client.data.opponentId, client.data.userId);
    }
  }

  private async resolveDisconnect(gameId: string, opponentId: string, disconnectedUserId: string) {
    const gameOver = await this.gamesService.endVersusGame(gameId, opponentId, disconnectedUserId);
    if (gameOver) {
      this.server.to(`game:${gameId}`).emit('game_over', { ...gameOver, disconnected: true });
    }
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(client: Socket) {
    const userId = client.data.userId;
    const added = this.queueService.join(userId, client.id);

    if (!added) {
      client.emit('queue_error', { message: 'Already in queue' });
      return;
    }

    client.emit('queue_joined');

    const match = this.queueService.tryMatch();
    if (!match) return;

    this.queueService.leave(match.p1.userId);
    this.queueService.leave(match.p2.userId);

    const game = await this.gamesService.startVersusGame(match.p1.userId, match.p2.userId);

    this.server.in(match.p1.socketId).socketsJoin(`game:${game.id}`);
    this.server.in(match.p2.socketId).socketsJoin(`game:${game.id}`);

    client.data.gameId = game.id;
    client.data.opponentId = match.p2.userId;
    const p2Socket = this.server.sockets.sockets.get(match.p2.socketId);
    if (p2Socket) {
      p2Socket.data.gameId = game.id;
      p2Socket.data.opponentId = match.p1.userId;
    }

    this.server.to(match.p1.socketId).emit('game_start', {
      gameId: game.id,
      wordLength: game.wordLength,
      opponentUsername: game.player2.username,
      opponentElo: game.player2.elo,
    });
    this.server.to(match.p2.socketId).emit('game_start', {
      gameId: game.id,
      wordLength: game.wordLength,
      opponentUsername: game.player1.username,
      opponentElo: game.player1.elo,
    });
  }

  @SubscribeMessage('submit_guess')
  async handleSubmitGuess(
    client: Socket,
    payload: { gameId: string; guess: string },
  ) {
    const userId = client.data.userId;
    const { gameId, guess } = payload ?? {};

    if (!gameId || typeof gameId !== 'string' ||
        !guess || typeof guess !== 'string' || guess.length > 20) {
      client.emit('guess_error', { message: 'Invalid payload' });
      return;
    }

    try {
      const { result, attempts, isWin, opponentId } = await this.gamesService.submitVersusGuess(userId, gameId, guess);

      client.emit('guess_result', { result, isWin });
      client.to(`game:${gameId}`).emit('opponent_progress', { attempts });

      const isLoss = !isWin && attempts >= 6;
      if (isWin || isLoss) {
        const winnerId = isWin ? userId : opponentId;
        const loserId = isWin ? opponentId : userId;
        const gameOver = await this.gamesService.endVersusGame(gameId, winnerId, loserId);
        if (gameOver) {
          this.server.to(`game:${gameId}`).emit('game_over', gameOver);
        }
      }
    } catch (e: any) {
      client.emit('guess_error', { message: e.message });
    }
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    this.queueService.leave(client.data.userId);
    client.emit('queue_left');
  }
}
