import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const gameService = {
  // Create a new game
  createGame: async (playerName) => {
    try {
      const response = await axios.post(`${API_URL}/api/games`, { playerName });
      return response.data;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },

  // Join an existing game
  joinGame: async (gameId, playerName) => {
    try {
      const response = await axios.post(`${API_URL}/api/games/${gameId}/join`, { playerName });
      return response.data;
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  },

  // Make a move
  makeMove: async (gameId, move) => {
    try {
      const response = await axios.post(`${API_URL}/api/games/${gameId}/move`, move);
      return response.data;
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  },

  // Get game state
  getGameState: async (gameId) => {
    try {
      const response = await axios.get(`${API_URL}/api/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error;
    }
  },

  // Resign from game
  resign: async (gameId, playerId) => {
    try {
      const response = await axios.post(`${API_URL}/api/games/${gameId}/resign`, { playerId });
      return response.data;
    } catch (error) {
      console.error('Error resigning from game:', error);
      throw error;
    }
  }
};

export default gameService; 