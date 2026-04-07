import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketsMap = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSocketsMap.set(userId, client.id);
      console.log(`User connected: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup logic if needed
  }

  sendNotificationToUser(userId: string, title: string, message: string) {
    const socketId = this.userSocketsMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', { 
        title, 
        message, 
        isRead: false,
        createdAt: new Date() 
      });
    }
  }
}
