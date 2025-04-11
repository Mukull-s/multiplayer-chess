import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Chessboard from '../components/Chessboard';
import { socketService } from '../services/socketService';
import { Chess } from 'chess.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    if (retries > 0 && error.message !== 'Game not found') {
      console.log(`Retrying request... (${retries} attempts left)`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [playerId, setPlayerId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [players, setPlayers] = useState(new Map());
  const [error, setError] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [gameResult, setGameResult] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    // Generate a unique player ID
    const newPlayerId = Math.random().toString(36).substring(7);
    setPlayerId(newPlayerId);

    // Connect to socket server and join game
    const setupGame = async () => {
      if (!mounted) return;
      
      try {
        setIsConnecting(true);
        setError(null);

        // First check if game exists with retry logic
        const gameData = await fetchWithRetry(`http://localhost:5000/api/games/${gameId}`);
        
        if (!mounted) return;

        // Connect to socket server
        await socketService.connect();

        // Wait a short moment to ensure connection is stable
        await sleep(500);

        if (!mounted) return;

        // Then join the game
        const response = await socketService.joinGame(gameId, newPlayerId);
        console.log('Joined game successfully:', response);
        
        if (!mounted) return;

        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.color) {
          setPlayerColor(response.color);
        }
        if (response.isSpectator) {
          setIsSpectator(true);
        }
        if (response.players) {
          setPlayers(new Map(response.players.map(player => [player.id, player])));
          setIsWaiting(response.players.length < 2);
        }
      } catch (err) {
        console.error('Error joining game:', err);
        if (mounted) {
          setError(err.message || 'Failed to join game');
          if (err.message === 'Game not found') {
            navigate('/join');
          }
        }
      } finally {
        if (mounted) {
          setIsConnecting(false);
        }
      }
    };

    // Set up event listeners
    const handleGameState = (data) => {
      if (!mounted) return;
      try {
        const newGame = new Chess(data.fen);
        setGame(newGame);
      } catch (err) {
        console.error('Error updating game state:', err);
      }
    };

    const handleMoveMade = (data) => {
      if (!mounted) return;
      try {
        console.log('Move received:', data);
        const newGame = new Chess(data.fen);
        setGame(newGame);
        
        // Clear any previous error messages
        setError(null);
        
        // Check for game end conditions
        if (data.isCheckmate) {
          setGameResult(`Checkmate! ${data.turn === 'w' ? 'Black' : 'White'} wins!`);
        } else if (data.isGameOver) {
          setGameResult('Game Over!');
        } else if (data.inCheck) {
          setError(`${data.turn === 'w' ? 'White' : 'Black'} is in check!`);
        }
      } catch (err) {
        console.error('Error processing move:', err);
      }
    };

    const handleGameOver = (data) => {
      if (!mounted) return;
      setGameResult(data.result);
      setError(data.result);
    };

    const handlePlayerJoined = (data) => {
      if (!mounted) return;
      try {
        console.log('Player joined:', data);
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers);
          data.players.forEach(player => {
            newPlayers.set(player.id, player);
          });
          return newPlayers;
        });
        setIsWaiting(data.totalPlayers < 2);
      } catch (err) {
        console.error('Error processing player join:', err);
      }
    };

    const handleGameStarted = (data) => {
      if (!mounted) return;
      try {
        console.log('Game started:', data);
        setIsWaiting(false);
        const newGame = new Chess(data.fen);
        setGame(newGame);
        
        // Update players with their colors
        const updatedPlayers = new Map();
        data.players.forEach(player => {
          updatedPlayers.set(player.id, player);
          // Update player color if this is the current player
          if (player.id === playerId) {
            setPlayerColor(player.color);
          }
        });
        setPlayers(updatedPlayers);
        
        // Update game state
        if (data.fen) {
          setGame(new Chess(data.fen));
        }
        
        console.log('Game initialized with:', {
          players: Array.from(updatedPlayers.entries()),
          playerColor,
          currentTurn: newGame.turn()
        });
      } catch (err) {
        console.error('Error starting game:', err);
      }
    };

    const handlePlayerLeft = (data) => {
      if (!mounted) return;
      try {
        console.log('Player left:', data);
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers);
          data.players.forEach(player => {
            newPlayers.set(player.id, player);
          });
          return newPlayers;
        });
        setIsWaiting(data.players.length < 2);
        if (data.players.length < 2) {
          setError('Opponent left the game');
        }
      } catch (err) {
        console.error('Error processing player leave:', err);
      }
    };

    const handleError = (data) => {
      if (!mounted) return;
      console.error('Socket error:', data);
      setError(data.message || 'An error occurred');
    };

    // Add event listeners
    socketService.on('gameState', handleGameState);
    socketService.on('moveMade', handleMoveMade);
    socketService.on('gameOver', handleGameOver);
    socketService.on('playerJoined', handlePlayerJoined);
    socketService.on('playerLeft', handlePlayerLeft);
    socketService.on('gameStarted', handleGameStarted);
    socketService.on('error', handleError);

    // Start the setup process
    setupGame();

    // Cleanup on unmount
    return () => {
      mounted = false;
      socketService.off('gameState', handleGameState);
      socketService.off('moveMade', handleMoveMade);
      socketService.off('gameOver', handleGameOver);
      socketService.off('playerJoined', handlePlayerJoined);
      socketService.off('playerLeft', handlePlayerLeft);
      socketService.off('gameStarted', handleGameStarted);
      socketService.off('error', handleError);
      socketService.disconnect();
    };
  }, [gameId, navigate]);

  const handleMove = async (move) => {
    try {
      if (!socketService.isConnected) {
        setError('Not connected to game');
        return;
      }

      // Validate if it's player's turn
      const isWhiteTurn = game.turn() === 'w';
      const isPlayerTurn = (isWhiteTurn && playerColor === 'white') ||
                         (!isWhiteTurn && playerColor === 'black');

      if (!isPlayerTurn) {
        setError("Not your turn!");
        return;
      }

      console.log('Attempting move:', {
        move,
        playerColor,
        currentTurn: game.turn(),
        playerId
      });

      await socketService.makeMove(gameId, move);
    } catch (err) {
      console.error('Move error:', err);
      setError(err.message);
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Connecting to game...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            {gameResult ? 'Game Over' : 'Error'}
          </h2>
          <p className="text-red-500">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Waiting for opponent...</h2>
          <p className="text-gray-600">Game ID: {gameId}</p>
          <p className="text-gray-600">Players: {players.size}/2</p>
          <p className="text-gray-600">
            {playerColor ? `You are playing as ${playerColor}` : 'Waiting for color assignment...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Game {gameId}</h1>
        <p className="text-gray-600">
          {isSpectator ? 'Spectating' : `Playing as ${playerColor}`}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <Chessboard
          position={game.fen()}
          onPieceDrop={handleMove}
          boardOrientation={playerColor === 'black' ? 'black' : 'white'}
        />
      </div>
    </div>
  );
};

export default Game; 