import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [error, setError] = useState(null);
  const [opponentName, setOpponentName] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  // Safely get auth context
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (error) {
    console.warn('Auth context not available:', error);
  }

  const handlePlayerJoined = useCallback(({ players, playerColor: assignedColor }) => {
    setOpponentConnected(true);
    setGameStatus('in-progress');
    setPlayerColor(assignedColor);
    setIsMyTurn(assignedColor === 'white');
  }, []);

  const handleGameStarted = useCallback(({ players, fen, turn }) => {
    const newGame = new Chess(fen);
    setGame(newGame);
    setGameStatus('in-progress');
    setIsMyTurn(turn === (playerColor === 'white' ? 'w' : 'b'));
  }, [playerColor]);

  const handleMoveMade = useCallback(({ move, fen, turn, isGameOver, inCheck, isCheckmate }) => {
    setGame(currentGame => {
      try {
        const gameCopy = new Chess(fen);
        return gameCopy;
      } catch (error) {
        console.error('Error applying move:', error);
        return currentGame;
      }
    });

    setIsMyTurn(turn === (playerColor === 'white' ? 'w' : 'b'));

    if (isGameOver) {
      setGameStatus('completed');
      if (isCheckmate) {
        setError(`Game Over - ${inCheck ? 'Checkmate!' : 'Draw!'}`);
      }
    }
  }, [playerColor]);

  const handlePlayerLeft = useCallback(({ playerId }) => {
    setOpponentConnected(false);
    setGameStatus('waiting');
    setError('Opponent disconnected');
  }, []);

  const handleError = useCallback(({ message }) => {
    setError(message);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const setupGame = async () => {
      try {
        await socketService.connect();

        if (!isSubscribed) return;

        socketService.on('playerJoined', handlePlayerJoined);
        socketService.on('gameStarted', handleGameStarted);
        socketService.on('moveMade', handleMoveMade);
        socketService.on('playerLeft', handlePlayerLeft);
        socketService.on('error', handleError);

      } catch (error) {
        console.error('Failed to setup game:', error);
        if (isSubscribed) {
          setError('Failed to connect to game server');
        }
      }
    };

    setupGame();

    return () => {
      isSubscribed = false;
      try {
        socketService.removeAllListeners();
        socketService.disconnect();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [handlePlayerJoined, handleGameStarted, handleMoveMade, handlePlayerLeft, handleError]);

  const makeMove = useCallback(async (move) => {
    if (!user) {
      setError('You must be logged in to make a move');
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`http://localhost:5000/api/games/${gameId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          move,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make move');
      }

      const data = await response.json();
      setGame(currentGame => {
        try {
          const gameCopy = new Chess(data.fen);
          return gameCopy;
        } catch (error) {
          console.error('Error applying move:', error);
          return currentGame;
        }
      });
      setIsMyTurn(!isMyTurn);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [gameId, isMyTurn, user]);

  const createGame = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to create a game');
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('http://localhost:5000/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          timeControl: 'rapid',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create game');
      }

      const data = await response.json();
      setGameId(data.gameId);
      setPlayerColor('white');
      setIsMyTurn(true);
      return data.gameId;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [user]);

  const joinGame = useCallback(async (gameId) => {
    if (!user) {
      setError('You must be logged in to join a game');
      throw new Error('Not authenticated');
    }

    try {
      // First check if game exists
      const gameResponse = await fetch(`http://localhost:5000/api/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error || 'Game not found');
      }

      // Then try to join the game
      const response = await fetch(`http://localhost:5000/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join game');
      }

      const data = await response.json();
      
      // Connect to socket server
      await socketService.connect();
      
      // Join the game room
      await socketService.joinGame(gameId, user._id);

      setGameId(gameId);
      setPlayerColor('black');
      setIsMyTurn(false);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [user]);

  const resetGame = useCallback(() => {
    setGame(new Chess());
    setGameStatus('waiting');
    setOpponentConnected(false);
    setError(null);
    setIsMyTurn(false);
  }, []);

  return (
    <GameContext.Provider
      value={{
        game,
        setGame,
        gameId,
        playerColor,
        opponentConnected,
        gameStatus,
        error,
        opponentName,
        isMyTurn,
        createGame,
        joinGame,
        makeMove,
        resetGame,
        setGameStatus,
        setError,
        fen: game.fen(),
        turn: game.turn()
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 