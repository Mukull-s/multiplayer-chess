import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const gameService = {
  // Create a new game
  createGame: async (timeControl) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/games`,
        { timeControl }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error.response?.data || error;
    }
  },

  // Join an existing game
  joinGame: async (gameId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameId}/join`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error joining game:', error);
      throw error.response?.data || error;
    }
  },

  // Make a move
  makeMove: async (gameId, move) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameId}/move`,
        { move }
      );
      return response.data;
    } catch (error) {
      console.error('Error making move:', error);
      throw error.response?.data || error;
    }
  },

  // Get game state
  getGameState: async (gameId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/games/${gameId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting game state:', error);
      throw error.response?.data || error;
    }
  },

  // Resign from game
  resign: async (gameId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/games/${gameId}/resign`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error resigning from game:', error);
      throw error.response?.data || error;
    }
  },

  // Get active games
  getActiveGames: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/games/user/${userId}/active`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting active games:', error);
      throw error.response?.data || error;
    }
  },

  // Get game history
  getGameHistory: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/games/user/${userId}/history`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting game history:', error);
      throw error.response?.data || error;
    }
  }
};

export default gameService; 