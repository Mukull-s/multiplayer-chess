const Game = require('../models/Game');
const { Chess } = require('chess.js');
const { GAME_EVENTS, ROOM_EVENTS, GAME_STATUS, GAME_END_REASONS, PLAYER_COLORS } = require('../../shared/socketEvents');

const setupMoveHandlers = (io, socket) => {
    // Handle making a move
    socket.on(GAME_EVENTS.MOVE, async ({ gameId, userId, move }) => {
        try {
            const game = await Game.findOne({ gameId });
            
            if (!game) {
                socket.emit(ROOM_EVENTS.ERROR, { message: 'Game not found' });
                return;
            }

            // Validate player's turn
            const playerColor = game.whitePlayer.userId.toString() === userId ? PLAYER_COLORS.WHITE : PLAYER_COLORS.BLACK;
            if (game.currentTurn !== playerColor) {
                socket.emit(ROOM_EVENTS.ERROR, { message: 'Not your turn' });
                return;
            }

            // Initialize chess.js with current game state
            const chess = new Chess(game.fen);

            // Validate move using chess.js
            const chessMove = chess.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion // 'q' for queen, 'r' for rook, etc.
            });

            if (!chessMove) {
                socket.emit(ROOM_EVENTS.ERROR, { message: 'Invalid move' });
                return;
            }

            // Update game state
            game.moves.push({
                from: move.from,
                to: move.to,
                promotion: move.promotion,
                san: chessMove.san // Standard Algebraic Notation
            });
            game.currentTurn = game.currentTurn === PLAYER_COLORS.WHITE ? PLAYER_COLORS.BLACK : PLAYER_COLORS.WHITE;
            game.lastMoveAt = new Date();
            game.fen = chess.fen(); // Update FEN after move
            await game.save();

            // Check for game over conditions
            let gameOver = false;
            let winner = null;
            let reason = null;

            if (chess.isGameOver()) {
                gameOver = true;
                if (chess.isCheckmate()) {
                    winner = playerColor;
                    reason = GAME_END_REASONS.CHECKMATE;
                } else if (chess.isDraw()) {
                    if (chess.isStalemate()) {
                        reason = GAME_END_REASONS.STALEMATE;
                    } else if (chess.isThreefoldRepetition()) {
                        reason = GAME_END_REASONS.THREEFOLD_REPETITION;
                    } else if (chess.isInsufficientMaterial()) {
                        reason = GAME_END_REASONS.INSUFFICIENT_MATERIAL;
                    } else {
                        reason = GAME_END_REASONS.DRAW;
                    }
                }
            }

            // Broadcast move to all players in the game
            io.to(game.roomId).emit(GAME_EVENTS.MOVE_MADE, {
                gameId: game.gameId,
                move: {
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion,
                    san: chessMove.san
                },
                currentTurn: game.currentTurn,
                fen: game.fen,
                gameState: game
            });

            if (gameOver) {
                game.status = GAME_STATUS.COMPLETED;
                game.winner = winner;
                game.endedAt = new Date();
                game.endReason = reason;
                await game.save();

                io.to(game.roomId).emit(GAME_EVENTS.GAME_OVER, {
                    gameId: game.gameId,
                    winner,
                    reason,
                    fen: game.fen
                });
            }

        } catch (error) {
            socket.emit(ROOM_EVENTS.ERROR, { message: error.message });
        }
    });
};

module.exports = { setupMoveHandlers }; 