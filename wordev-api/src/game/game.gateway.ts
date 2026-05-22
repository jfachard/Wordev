import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ 
    cors: { 
        origin: process.env.CORS_ORIGIN, 
        credentials: true 
    } 
})

export class GameGateway implements OnGatewayConnection {
  constructor(private readonly authService: AuthService) {}

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
}
