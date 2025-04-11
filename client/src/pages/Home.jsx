import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const { setPlayerColor } = useGame();
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createNewGame = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post('http://localhost:5000/api/games/create');
      const { gameId } = response.data;
      setPlayerColor('white');
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!gameId) {
      setError('Please enter a game ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`http://localhost:5000/api/games/${gameId}/join`);
      setPlayerColor('black');
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game. Please check the game ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Multiplayer Chess</h1>
        
        <div className="space-y-4">
          <button
            onClick={createNewGame}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create New Game'}
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              className="flex-1 border rounded py-2 px-3"
            />
            <button
              onClick={joinGame}
              disabled={loading}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              Join
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 