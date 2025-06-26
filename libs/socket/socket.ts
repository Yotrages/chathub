import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();