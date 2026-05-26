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
    origin: process.env.CORS_ORIGIN,
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
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.queueService.leave(client.data.userId);
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

    this.server.to(match.p1.socketId).emit('game_start', {
      gameId: game.id,
      wordLength: game.wordLength,
      opponentId: match.p2.userId,
    });
    this.server.to(match.p2.socketId).emit('game_start', {
      gameId: game.id,
      wordLength: game.wordLength,
      opponentId: match.p1.userId,
    });
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    this.queueService.leave(client.data.userId);
    client.emit('queue_left');
  }
}
