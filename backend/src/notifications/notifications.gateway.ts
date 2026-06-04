import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketsMap = new Map<string, string>(); // userId -> socketId
  private socketUsersMap = new Map<string, string>(); // socketId -> userId

  constructor(private notificationsService: NotificationsService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSocketsMap.set(userId, client.id);
      this.socketUsersMap.set(client.id, userId);
      console.log(`User connected: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsersMap.get(client.id);
    if (userId) {
      this.userSocketsMap.delete(userId);
      this.socketUsersMap.delete(client.id);
    }
  }

  async sendNotificationToUser(userId: string, title: string, message: string) {
    const notification = await this.notificationsService.create({
      userId,
      title,
      message,
      isRead: false,
    });

    const socketId = this.userSocketsMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', { 
        id: notification.id,
        title, 
        message, 
        isRead: false,
        createdAt: new Date() 
      });
    }
  }
}
