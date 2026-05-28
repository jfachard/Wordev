import { io, type Socket } from 'socket.io-client'

let instance: Socket | null = null

export const socketService = {
  connect(token: string): Socket {
    instance?.disconnect()
    instance = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
      auth: { token },
    })
    return instance
  },

  get(): Socket | null {
    return instance
  },

  disconnect(): void {
    instance?.disconnect()
    instance = null
  },
}
