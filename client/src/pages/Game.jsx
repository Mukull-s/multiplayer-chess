import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Chessboard from '../components/Chessboard';
import PlayerInfo from '../components/PlayerInfo';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const {
    game,
    playerColor,
    opponentName,
    gameStatus,
    error,
    makeMove,
    setGameStatus,
    setError
  } = useGame();

  useEffect(() => {
    // Set up socket listeners
    socketService.onGameUpdate((data) => {
      const newGame = new Chess(data.fen);
      setGame(newGame);
    });

    socketService.onOpponentMove((move) => {
      makeMove(move);
    });

    socketService.onGameOver((result) => {
      setGameStatus('gameOver');
      // You can handle the result (checkmate, stalemate, etc.) here
    });

    socketService.onOpponentLeft(() => {
      setError('Opponent has left the game');
      setGameStatus('gameOver');
    });

    // Cleanup
    return () => {
      socketService.removeAllListeners();
    };
  }, [makeMove, setGameStatus, setError]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-gray-600 mb-4">Waiting for opponent to join...</div>
        <div className="text-sm text-gray-500">Game Code: {gameId}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Chessboard
              position={game.fen()}
              onPieceDrop={makeMove}
              playerColor={playerColor}
            />
          </div>
          <div>
            <PlayerInfo
              playerColor={playerColor}
              opponentName={opponentName}
              currentTurn={game.turn()}
              gameStatus={gameStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game; 