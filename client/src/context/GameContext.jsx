import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
import { createGame as apiCreateGame } from '../services/api';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [error, setError] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const { user } = useAuth();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user?.token) {
      socketService.setToken(user.token);
      socketService.connect().catch(error => {
        console.error('Failed to connect to socket server:', error);
      });
    }
  }, [user]);

  const handlePlayerJoined = useCallback(({ players, playerColor: assignedColor }) => {
    console.log('Player joined:', { players, assignedColor });
    setOpponentConnected(true);
    setGameStatus('in_progress');
    setPlayerColor(assignedColor);
    setIsMyTurn(assignedColor === 'white');
  }, []);

  const handleGameStarted = useCallback(({ players, fen, turn }) => {
    console.log('Game started:', { players, fen, turn });
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setGameStatus('in_progress');
      setIsMyTurn(turn === (playerColor === 'white' ? 'w' : 'b'));
    } catch (error) {
      console.error('Error initializing game:', error);
      setError('Failed to initialize game state');
    }
  }, [playerColor]);

  const handleMoveMade = useCallback(({ move, fen, turn, isGameOver, inCheck, isCheckmate }) => {
    console.log('Move made:', { move, fen, turn, isGameOver, inCheck, isCheckmate });
    try {
      const gameCopy = new Chess(fen);
      setGame(gameCopy);
      setIsMyTurn(turn === (playerColor === 'white' ? 'w' : 'b'));

      if (isGameOver) {
        setGameStatus('completed');
        setError(`Game Over - ${isCheckmate ? 'Checkmate!' : 'Draw!'}`);
      }
    } catch (error) {
      console.error('Error applying move:', error);
      setError('Failed to apply move');
    }
  }, [playerColor]);

  const handlePlayerLeft = useCallback(({ playerId }) => {
    console.log('Player left:', playerId);
    setOpponentConnected(false);
    setGameStatus('waiting');
    setError('Opponent disconnected');
  }, []);

  const handleError = useCallback(({ message }) => {
    console.error('Game error:', message);
    setError(message);
  }, []);

  const handleGameOver = useCallback(({ result, winner }) => {
    console.log('Game over:', { result, winner });
    setGameStatus('completed');
    setError(`Game Over - ${result === 'checkmate' ? 'Checkmate!' : 'Draw!'}`);
  }, []);

  const setupGame = async (timeControl) => {
    try {
      console.log('Setting up game with time control:', timeControl);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate time control
      const validTimeControls = {
        'rapid': { initialTime: 900000, increment: 10000 }, // 15 minutes + 10 seconds
        'blitz': { initialTime: 300000, increment: 3000 },  // 5 minutes + 3 seconds
        'classical': { initialTime: 1800000, increment: 0 } // 30 minutes
      };

      if (!validTimeControls[timeControl]) {
        throw new Error('Invalid time control selected');
      }

      const response = await apiCreateGame(timeControl);
      console.log('Game creation response:', response);

      if (!response.gameId) {
        throw new Error('No game ID received from server');
      }

      const { gameId, roomId } = response;
      console.log('Game created successfully:', { gameId, roomId });

      // Set game state
      setGameId(gameId);
      setGameStatus('waiting');
      setPlayerColor('white');
      setOpponentConnected(false);
      setIsMyTurn(true);

      // Connect to socket server and join room
      try {
        await socketService.connect();
        socketService.joinGame(roomId);

        // Set up socket event listeners
        socketService.on('playerJoined', handlePlayerJoined);
        socketService.on('gameStarted', handleGameStarted);
        socketService.on('moveMade', handleMoveMade);
        socketService.on('gameOver', handleGameOver);
        socketService.on('error', handleError);
      } catch (socketError) {
        console.error('Socket connection error:', socketError);
        setError('Failed to connect to game server');
      }

      return gameId;
    } catch (error) {
      console.error('Error setting up game:', error);
      setError(error.message || 'Failed to set up game');
      throw error;
    }
  };

  // Cleanup socket listeners and connection
  useEffect(() => {
    return () => {
      try {
        if (socketService.socket) {
          socketService.removeAllListeners();
          socketService.disconnect();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  const value = {
    game,
    gameId,
    gameStatus,
    playerColor,
    isMyTurn,
    error,
    opponentConnected,
    setupGame,
    handleMoveMade,
    handlePlayerJoined,
    handleGameStarted,
    handlePlayerLeft,
    handleError,
    handleGameOver
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