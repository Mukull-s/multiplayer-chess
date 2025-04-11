import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = io(SOCKET_URL);
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        resolve();
      });
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId, playerId) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('joinGame', { gameId, playerId });
  }

  leaveGame(gameId) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leaveGame', { gameId });
  }

  makeMove(gameId, move) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('makeMove', { gameId, move });
  }

  onGameUpdate(callback) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('gameUpdate', callback);
    this.listeners.set('gameUpdate', callback);
  }

  onOpponentMove(callback) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('opponentMove', callback);
    this.listeners.set('opponentMove', callback);
  }

  onGameOver(callback) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('gameOver', callback);
    this.listeners.set('gameOver', callback);
  }

  onOpponentLeft(callback) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('opponentLeft', callback);
    this.listeners.set('opponentLeft', callback);
  }

  removeAllListeners() {
    if (!this.socket) return;
    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
  }
}

export const socketService = new SocketService(); 