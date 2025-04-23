import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { setupGame } = useGame();
    const { user } = useAuth();
    const [timeControl, setTimeControl] = useState('rapid');
    const [error, setError] = useState(null);

    const handleCreateGame = async () => {
        try {
            setError(null);
            const gameId = await setupGame(timeControl);
            navigate(`/game/${gameId}`);
        } catch (error) {
            console.error('Error creating game:', error);
            setError(error.message || 'Failed to create game');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Welcome to Chess</h1>
                
                {user ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Control
                            </label>
                            <select
                                value={timeControl}
                                onChange={(e) => setTimeControl(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="rapid">Rapid (15+10)</option>
                                <option value="blitz">Blitz (5+3)</option>
                                <option value="classical">Classical (30+0)</option>
                            </select>
                        </div>
                        
                        <button
                            onClick={handleCreateGame}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create New Game
                        </button>
                        
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-600">
                        Please log in to start playing
                    </p>
                )}
            </div>
        </div>
    );
};

export default Home; 