import { io, Socket } from 'socket.io-client';
import { LocationUpdate } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    // Replace with your actual WebSocket server URL
    this.socket = io('ws://localhost:3001', {
      auth: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Location tracking
  sendLocationUpdate(update: LocationUpdate) {
    if (this.socket?.connected) {
      this.socket.emit('location:update', update);
    }
  }

  onLocationUpdate(callback: (update: LocationUpdate) => void) {
    if (this.socket) {
      this.socket.on('location:update', callback);
    }
  }

  // Trip updates
  joinTrip(tripId: string) {
    if (this.socket?.connected) {
      this.socket.emit('trip:join', { tripId });
    }
  }

  leaveTrip(tripId: string) {
    if (this.socket?.connected) {
      this.socket.emit('trip:leave', { tripId });
    }
  }

  // Chat
  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', { conversationId, isTyping });
    }
  }

  onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('chat:typing', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
