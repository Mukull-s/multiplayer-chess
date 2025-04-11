import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import gameService from '../services/gameService';
import { socketService } from '../services/socketService';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerColor, setPlayerColor] = useState('white');
  const [opponentName, setOpponentName] = useState(null);
  const [gameStatus, setGameStatus] = useState({
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to socket server when component mounts
    socketService.connect().catch((err) => {
      console.error('Failed to connect to socket server:', err);
      setError('Failed to connect to server');
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      socketService.removeAllListeners();
    };
  }, []);

  const createGame = async (playerName) => {
    try {
      const response = await gameService.createGame(playerName);
      setGameId(response.gameId);
      setPlayerId(response.playerId);
      setPlayerColor('white');
      setGameStatus({
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false
      });
      socketService.joinGame(response.gameId, response.playerId);
    } catch (error) {
      setError('Failed to create game');
      throw error;
    }
  };

  const joinGame = async (gameId, playerName) => {
    try {
      const response = await gameService.joinGame(gameId, playerName);
      setGameId(gameId);
      setPlayerId(response.playerId);
      setPlayerColor('black');
      setOpponentName(response.opponentName);
      setGameStatus({
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false
      });
      socketService.joinGame(gameId, response.playerId);
    } catch (error) {
      setError('Failed to join game');
      throw error;
    }
  };

  const makeMove = (from, to, promotion = null) => {
    try {
      const move = game.move({
        from,
        to,
        promotion
      });

      if (move === null) return false;

      setGame(new Chess(game.fen()));
      setGameStatus({
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isStalemate: game.isStalemate(),
        isDraw: game.isDraw()
      });

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setGameStatus({
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false
    });
  };

  const value = {
    game,
    gameId,
    playerId,
    playerColor,
    opponentName,
    gameStatus,
    error,
    createGame,
    joinGame,
    makeMove,
    resetGame,
    setGameStatus,
    setError,
    fen: game.fen(),
    turn: game.turn()
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 