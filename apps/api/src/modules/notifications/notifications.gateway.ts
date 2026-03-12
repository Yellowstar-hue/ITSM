import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.userSockets.forEach((sockets, userId) => {
      const filtered = sockets.filter(s => s !== client.id);
      if (filtered.length === 0) this.userSockets.delete(userId);
      else this.userSockets.set(userId, filtered);
    });
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (data.userId) {
      client.join(`user:${data.userId}`);
      const existing = this.userSockets.get(data.userId) || [];
      this.userSockets.set(data.userId, [...existing, client.id]);
    }
  }

  @OnEvent('ticket.created')
  broadcastTicketCreated(ticket: any) {
    this.server.emit('ticket:created', ticket);
  }

  @OnEvent('ticket.updated')
  broadcastTicketUpdated(payload: any) {
    this.server.emit('ticket:updated', payload.ticket);
  }

  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
