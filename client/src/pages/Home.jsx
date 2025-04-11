import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, gameStatus, opponentConnected } = useGame();
  const { user, loading } = useAuth();
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const [gameLoading, setGameLoading] = useState(false);
  const [createdGameId, setCreatedGameId] = useState(null);

  const handleCreateGame = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setGameLoading(true);
      setError('');
      const newGameId = await createGame();
      setCreatedGameId(newGameId);
      navigate(`/game/${newGameId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGameLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!gameId) {
      setError('Please enter a game ID');
      return;
    }

    try {
      setGameLoading(true);
      setError('');
      await joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game. Please check the game ID and try again.');
    } finally {
      setGameLoading(false);
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(createdGameId);
  };

  const startGame = () => {
    if (createdGameId) {
      navigate(`/game/${createdGameId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Chess Game
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleCreateGame}
          disabled={gameLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gameLoading ? 'Creating Game...' : 'Create New Game'}
        </button>

        {createdGameId && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Share this Game ID with your opponent:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={createdGameId}
                readOnly
                className="flex-1 p-2 border rounded bg-white"
              />
              <button
                onClick={copyGameId}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {opponentConnected ? 'Opponent connected!' : 'Waiting for opponent...'}
              </p>
              <button
                onClick={startGame}
                disabled={!opponentConnected}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 mt-4">
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleJoinGame}
            disabled={gameLoading || !gameId}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {gameLoading ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 