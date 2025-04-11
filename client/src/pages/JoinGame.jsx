import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socketService';

const JoinGame = () => {
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!gameId.trim()) {
      setError('Please enter a game ID');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // First try to join via HTTP
      const response = await fetch(`http://localhost:5000/api/games/${gameId}/join`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join game');
      }

      // If successful, navigate to the game
      navigate(`/game/${gameId}`);
    } catch (err) {
      console.error('Error joining game:', err);
      setError(err.message);
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Join Game</h2>
        
        <form onSubmit={handleJoinGame} className="space-y-4">
          <div>
            <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-1">
              Game ID
            </label>
            <input
              type="text"
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter game ID"
              disabled={isJoining}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isJoining
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinGame; 