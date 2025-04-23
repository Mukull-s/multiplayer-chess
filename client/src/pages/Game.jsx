import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Chessboard from '../components/Chessboard';

const Game = () => {
  const { gameId } = useParams();
  const { game, setupGame, makeMove, resign } = useGame();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await setupGame(gameId);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [gameId, setupGame]);

  // Update FEN when game state changes
  useEffect(() => {
    if (game?.fen) {
      setFen(game.fen);
    }
  }, [game]);

  const handleResign = async () => {
    try {
      await resign();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-5">Loading game...</div>;
  }

  if (error) {
    return <div className="max-w-4xl mx-auto p-5">Error: {error}</div>;
  }

  if (!game) {
    return <div className="max-w-4xl mx-auto p-5">Game not found</div>;
  }

  // Safely check if user is a player
  const isPlayer = game?.players?.some(p => p.userId === user?.id) || false;
  const playerColor = game?.players?.find(p => p.userId === user?.id)?.color || null;

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">
      <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">Game Room: {gameId}</h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500 text-white rounded text-sm capitalize">
            {game?.status || 'waiting'}
          </span>
          {game?.status === 'waiting' && (
            <span className="text-gray-600 italic">Waiting for opponent...</span>
          )}
        </div>
      </div>

      <div className="flex justify-center my-5">
        <Chessboard
          position={fen}
          onPieceDrop={makeMove}
          playerColor={playerColor}
          disabled={!isPlayer || game?.status !== 'in_progress'}
        />
      </div>

      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">White:</span>
            <span className="text-gray-600">
              {game?.players?.find(p => p.color === 'white')?.username || 'Waiting...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">Black:</span>
            <span className="text-gray-600">
              {game?.players?.find(p => p.color === 'black')?.username || 'Waiting...'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="text-gray-800">
            Current turn: <span className="font-bold capitalize">{game?.currentTurn || 'white'}</span>
          </div>
          {isPlayer && playerColor && (
            <div className="flex items-center gap-2">
              <div className="text-gray-600">
                Your color: <span className="px-2 py-1 bg-gray-200 rounded font-bold capitalize">{playerColor}</span>
              </div>
              {game?.status === 'in_progress' && (
                <button
                  onClick={handleResign}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Resign
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game; 