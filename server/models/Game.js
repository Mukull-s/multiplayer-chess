const mongoose = require('mongoose');

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
    },

    // Players
    whitePlayer: playerSchema,
    blackPlayer: playerSchema,

    // Game state
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'draw', 'checkmate', 'resigned', 'timeout'],
        default: 'waiting',
    },
    currentTurn: {
        type: String,
        enum: ['white', 'black'],
        default: 'white',
    },
    fen: {
        type: String,
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
    moves: [moveSchema],
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
        winner: {
            type: String,
            enum: ['white', 'black', 'draw'],
            default: null,
        },
        reason: {
            type: String,
            enum: ['checkmate', 'resignation', 'timeout', 'draw', 'stalemate', 'insufficient-material', 'threefold-repetition', '50-move-rule'],
            default: null,
        },
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
}, {
    timestamps: true,
});

// Indexes for better query performance
gameSchema.index({ roomId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'whitePlayer.userId': 1 });
gameSchema.index({ 'blackPlayer.userId': 1 });
gameSchema.index({ startedAt: -1 });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game; 