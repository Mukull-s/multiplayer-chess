import { io } from 'socket.io-client';
import { ROOM_EVENTS, GAME_EVENTS } from '../shared/socketEvents';

class SocketService {
  constructor() {
    if (SocketService.instance) {
      return SocketService.instance;
    }
    SocketService.instance = this;

    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.currentGameId = null;
    this.currentRoomId = null;
    this.currentPlayerId = null;
    this.token = null;
    this.listeners = new Map();
  }

  setToken(token) {
    this.token = token;
    if (this.socket) {
      this.socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${token}`
      };
    }
  }

  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('Attempting to connect to server...');
        
        // Remove /api from the URL for socket connection
        const serverUrl = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').replace('/api', '');
        console.log('Connecting to server URL:', serverUrl);
        
        this.socket = io(serverUrl, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          forceNew: true,
          extraHeaders: this.token ? {
            Authorization: `Bearer ${this.token}`
          } : {}
        });

        this.socket.on('connect', () => {
          console.log('Socket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Socket disconnected');
          this.isConnected = false;
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
          this.isConnected = false;
        });

        // Handle game events
        this.socket.on(ROOM_EVENTS.ROOM_CREATED, (data) => {
          console.log('Game created:', data);
          this.currentGameId = data.gameId;
          this.currentRoomId = data.roomId;
          const callback = this.listeners.get('gameCreated');
          if (callback) {
            callback(data);
          }
        });

        this.socket.on(ROOM_EVENTS.GAME_STARTED, (data) => {
          console.log('Game started:', data);
          this.currentGameId = data.gameId;
          this.currentRoomId = data.roomId;
          const callback = this.listeners.get('gameStarted');
          if (callback) {
            callback(data);
          }
        });

        this.socket.on(GAME_EVENTS.MOVE_MADE, (data) => {
          console.log('Move made:', data);
          const callback = this.listeners.get('moveMade');
          if (callback) {
            callback(data);
          }
        });

      } catch (error) {
        console.error('Error initializing socket:', error);
        reject(error);
      }
    });
  }

  joinGame(roomId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    console.log('Joining game room:', roomId);
    this.socket.emit('joinRoom', { roomId });
    this.currentRoomId = roomId;
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot add listener');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot remove listener');
      return;
    }
    this.socket.off(event);
  }

  removeAllListeners() {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot remove listeners');
      return;
    }
    this.socket.removeAllListeners();
  }

  cleanup() {
    if (this.currentRoomId) {
      this.socket.leave(this.currentRoomId);
    }
    this.currentGameId = null;
    this.currentRoomId = null;
    this.currentPlayerId = null;
    this.removeAllListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit(event, data);
  }
}

// Create and export a single instance
const socketService = new SocketService();
export default socketService; 