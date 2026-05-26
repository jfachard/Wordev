import { Injectable } from '@nestjs/common';

interface QueueEntry {
  userId: string;
  socketId: string;
}

@Injectable()
export class QueueService {
  private queue = new Map<string, string>(); // userId -> socketId

  join(userId: string, socketId: string): boolean {
    if (this.queue.has(userId)) return false;
    this.queue.set(userId, socketId);
    return true;
  }

  leave(userId: string): void {
    this.queue.delete(userId);
  }

  tryMatch(): { p1: QueueEntry; p2: QueueEntry } | null {
    if (this.queue.size < 2) return null;
    const [[p1UserId, p1SocketId], [p2UserId, p2SocketId]] = this.queue.entries();
    return {
      p1: { userId: p1UserId, socketId: p1SocketId },
      p2: { userId: p2UserId, socketId: p2SocketId },
    };
  }
}
