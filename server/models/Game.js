const mongoose = require('mongoose');
const { Chess } = require('chess.js');
const { GameState, PlayerColor, GameResult, MoveType } = require('../../shared/types');

const moveSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    piece: {
        type: String,
        required: true,
    },
    captured: {
        type: String,
        default: null,
    },
    promotion: {
        type: String,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const playerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        transform: (v) => v.toString(), // Convert ObjectId to string when toJSON is called
    },
    username: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        enum: ['white', 'black'],
        required: true,
    },
    timeLeft: {
        type: Number, // in milliseconds
        required: true,
    },
    rating: {
        type: Number,
        default: 1200,
    },
});

const gameSchema = new mongoose.Schema({
    // Game identification
    gameId: {
        type: String,
        required: true,
        unique: true,
    },
    roomId: {
        type: String,
        required: true,
        unique: true,
    },

    // Players
    whitePlayer: {
        type: playerSchema,
        required: true,
    },
    blackPlayer: {
        type: playerSchema,
        default: null,
    },

    // Game state
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'completed'],
        default: 'waiting',
    },
    currentTurn: {
        type: String,
        enum: ['white', 'black'],
        default: 'white',
    },
    fen: {
        type: String,
        required: true,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    },
    pgn: {
        type: String,
        default: '',
    },

    // Game settings
    timeControl: {
        type: {
            type: String,
            enum: ['blitz', 'rapid', 'classical', 'custom'],
            required: true,
        },
        initialTime: {
            type: Number, // in milliseconds
            required: true,
        },
        increment: {
            type: Number, // in milliseconds
            default: 0,
        },
    },

    // Game history
    moves: {
        type: [moveSchema],
        default: [],
    },
    capturedPieces: {
        white: [String],
        black: [String],
    },

    // Game metadata
    startedAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: {
        type: Date,
        default: null,
    },
    lastMoveAt: {
        type: Date,
        default: Date.now,
    },

    // Game result
    result: {
        type: String,
        enum: ['white_wins', 'black_wins', 'draw', null],
        default: null,
    },

    // Spectators
    spectators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    // Chat messages
    chat: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        username: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes for better query performance
gameSchema.index({ roomId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'whitePlayer.userId': 1 });
gameSchema.index({ 'blackPlayer.userId': 1 });
gameSchema.index({ startedAt: -1 });

// Add toJSON transform to convert ObjectIds to strings
gameSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

class Game {
  constructor(id, timeControl = null) {
    this.id = id;
    this.chess = new Chess();
    this.players = new Map();
    this.spectators = new Set();
    this.state = GameState.WAITING;
    this.timeControl = timeControl;
    this.timers = {
      white: timeControl ? timeControl * 60 * 1000 : null, // Convert minutes to milliseconds
      black: timeControl ? timeControl * 60 * 1000 : null
    };
    this.lastMoveTime = null;
    this.drawOffer = null;
    this.rematchOffer = null;
    this.moveHistory = [];
    this.chat = [];
  }

  addPlayer(playerId, socketId) {
    if (this.players.size >= 2) {
      throw new Error('Game is full');
    }

    const color = this.players.size === 0 ? PlayerColor.WHITE : PlayerColor.BLACK;
    this.players.set(playerId, {
      id: playerId,
      socketId,
      color,
      connected: true,
      timeRemaining: this.timers[color]
    });

    if (this.players.size === 2) {
      this.state = GameState.IN_PROGRESS;
      this.lastMoveTime = Date.now();
    }

    return color;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      if (this.state === GameState.IN_PROGRESS) {
        this.state = GameState.ABANDONED;
      }
      return player;
    }
    return null;
  }

  addSpectator(socketId) {
    this.spectators.add(socketId);
  }

  removeSpectator(socketId) {
    this.spectators.delete(socketId);
  }

  makeMove(playerId, move) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (this.state !== GameState.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    const currentTurn = this.chess.turn() === 'w' ? PlayerColor.WHITE : PlayerColor.BLACK;
    if (player.color !== currentTurn) {
      throw new Error('Not your turn');
    }

    // Update timers before making the move
    if (this.timeControl) {
      this.updateTimers();
    }

    // Make the move
    const result = this.chess.move(move);
    if (!result) {
      throw new Error('Invalid move');
    }

    // Record move in history
    this.moveHistory.push({
      ...result,
      timestamp: Date.now(),
      timeRemaining: player.timeRemaining
    });

    // Update last move time
    this.lastMoveTime = Date.now();

    // Determine move type
    let moveType = MoveType.NORMAL;
    if (result.captured) moveType = MoveType.CAPTURE;
    if (result.flags.includes('k')) moveType = MoveType.CASTLE_KINGSIDE;
    if (result.flags.includes('q')) moveType = MoveType.CASTLE_QUEENSIDE;
    if (result.flags.includes('e')) moveType = MoveType.EN_PASSANT;
    if (result.flags.includes('p')) moveType = MoveType.PROMOTION;

    // Check game status
    const gameStatus = {
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      moveType
    };

    if (gameStatus.isGameOver) {
      this.state = GameState.COMPLETED;
      if (gameStatus.isDraw) {
        gameStatus.result = GameResult.DRAW;
      } else {
        gameStatus.result = this.chess.turn() === 'w' ? GameResult.BLACK_WIN : GameResult.WHITE_WIN;
      }
    }

    return {
      ...gameStatus,
      move: result,
      fen: this.chess.fen(),
      pgn: this.chess.pgn()
    };
  }

  updateTimers() {
    if (!this.timeControl || !this.lastMoveTime) return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - this.lastMoveTime;
    const currentColor = this.chess.turn() === 'w' ? PlayerColor.WHITE : PlayerColor.BLACK;

    for (const [playerId, player] of this.players) {
      if (player.color === currentColor) {
        player.timeRemaining = Math.max(0, player.timeRemaining - elapsedTime);
        if (player.timeRemaining === 0) {
          this.state = GameState.COMPLETED;
          return {
            result: player.color === PlayerColor.WHITE ? GameResult.BLACK_WIN : GameResult.WHITE_WIN,
            reason: 'timeout'
          };
        }
      }
    }
  }

  offerDraw(playerId) {
    if (!this.players.has(playerId)) {
      throw new Error('Player not found');
    }
    this.drawOffer = playerId;
  }

  acceptDraw(playerId) {
    if (this.drawOffer && this.drawOffer !== playerId) {
      this.state = GameState.COMPLETED;
      return true;
    }
    return false;
  }

  declineDraw(playerId) {
    if (this.drawOffer && this.drawOffer !== playerId) {
      this.drawOffer = null;
      return true;
    }
    return false;
  }

  offerRematch(playerId) {
    if (!this.players.has(playerId)) {
      throw new Error('Player not found');
    }
    this.rematchOffer = playerId;
  }

  acceptRematch(playerId) {
    if (this.rematchOffer && this.rematchOffer !== playerId) {
      // Create new game with reversed colors
      const newGame = new Game(this.id + '_rematch', this.timeControl);
      for (const [pid, player] of this.players) {
        const newColor = player.color === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
        newGame.addPlayer(pid, player.socketId);
      }
      return newGame;
    }
    return null;
  }

  declineRematch(playerId) {
    if (this.rematchOffer && this.rematchOffer !== playerId) {
      this.rematchOffer = null;
      return true;
    }
    return false;
  }

  addChatMessage(playerId, message) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const chatMessage = {
      playerId,
      playerColor: player.color,
      message,
      timestamp: Date.now()
    };
    this.chat.push(chatMessage);
    return chatMessage;
  }

  getState() {
    return {
      id: this.id,
      state: this.state,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      players: Array.from(this.players.values()),
      spectators: Array.from(this.spectators),
      timeControl: this.timeControl,
      timers: this.timers,
      lastMoveTime: this.lastMoveTime,
      drawOffer: this.drawOffer,
      rematchOffer: this.rematchOffer,
      moveHistory: this.moveHistory,
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver()
    };
  }
}

const GameModel = mongoose.model('Game', gameSchema);

module.exports = GameModel; 