const { Chess } = require('chess.js');
const { games } = require('../routes/gameRoutes');

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = require('socket.io')(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join game room
      socket.on('joinGame', ({ gameId, playerId }) => {
        const gameData = games.get(gameId);
        if (!gameData) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        socket.join(gameId);
        gameData.players.add(playerId);

        // Notify all players in the room
        this.io.to(gameId).emit('playerJoined', {
          playerId,
          players: Array.from(gameData.players)
        });
      });

      // Handle moves
      socket.on('makeMove', ({ gameId, move }) => {
        const gameData = games.get(gameId);
        if (!gameData) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        try {
          const result = gameData.game.move(move);
          if (result) {
            // Broadcast the move to all players in the room
            this.io.to(gameId).emit('moveMade', {
              move: result,
              fen: gameData.game.fen(),
              turn: gameData.game.turn(),
              isGameOver: gameData.game.isGameOver()
            });
          } else {
            socket.emit('error', { message: 'Invalid move' });
          }
        } catch (error) {
          console.error('Error making move:', error);
          socket.emit('error', { message: 'Failed to make move' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up player from all games
        for (const [gameId, gameData] of games.entries()) {
          if (gameData.players.has(socket.id)) {
            gameData.players.delete(socket.id);
            this.io.to(gameId).emit('playerLeft', {
              playerId: socket.id,
              players: Array.from(gameData.players)
            });
          }
        }
      });
    });
  }
}

module.exports = new SocketService(); 