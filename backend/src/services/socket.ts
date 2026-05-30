import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  public init(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle user registration with socket for targeted updates
      socket.on('register', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        console.log(`👥 Registered User ID ${userId} to Socket ID ${socket.id}`);
      });

      socket.on('disconnect', () => {
        // Clean up disconnect user socket mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`👥 Unregistered User ID ${userId}`);
            break;
          }
        }
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Send update directly to a specific user
  public emitToUser(userId: string, event: string, data: any): boolean {
    if (!this.io) return false;
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all admins
  public emitToAdmins(event: string, data: any): void {
    if (!this.io) return;
    // For simplicity, we can emit globally and let clients handle filtering,
    // or broadcast specifically to an 'admins' room. Let's send globally
    // so any dashboard client can receive real-time action alerts.
    this.io.emit(event, data);
  }
}

export const socketService = new SocketService();
export default socketService;
