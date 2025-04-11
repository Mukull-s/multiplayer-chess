import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.currentGameId = null;
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
        
        this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          forceNew: true,
          extraHeaders: {
            Authorization: `Bearer ${this.token}`
          }
        });

        this.socket.on('connect', () => {
          console.log('Successfully connected to server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          clearTimeout(this.reconnectTimeout);
          
          // Rejoin game if we were in one
          if (this.currentGameId && this.currentPlayerId) {
            this.joinGame(this.currentGameId, this.currentPlayerId)
              .catch(error => console.error('Failed to rejoin game:', error));
          }
          
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.cleanup();
            reject(new Error('Failed to connect after multiple attempts'));
          } else {
            // Exponential backoff for reconnection
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
            this.reconnectTimeout = setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          }
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnected = false;
        });

      } catch (error) {
        console.error('Error setting up socket:', error);
        reject(error);
      }
    });
  }

  joinGame(gameId, playerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('Attempting to join game:', { gameId, playerId });
      
      this.currentGameId = gameId;
      this.currentPlayerId = playerId;

      // Join the socket room
      this.socket.emit('joinRoom', { 
        gameId,
        userId: playerId
      }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.socket.off(event, handler);
        });
      });
      this.listeners.clear();
    }
  }

  cleanup() {
    clearTimeout(this.reconnectTimeout);
    this.removeAllListeners();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentGameId = null;
    this.currentPlayerId = null;
  }

  disconnect() {
    this.cleanup();
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected when attempting to emit:', event);
      // Queue the event for when connection is restored
      this.connect().then(() => {
        this.socket.emit(event, data);
      }).catch(error => {
        console.error('Failed to reconnect and emit event:', error);
      });
    }
  }
}

const socketService = new SocketService();
export { socketService }; 