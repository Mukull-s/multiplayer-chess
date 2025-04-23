import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth endpoints
export const register = (userData) => api.post('/users/register', userData);
export const login = (credentials) => api.post('/users/login', credentials);
export const getProfile = () => api.get('/users/profile');

// Game endpoints
export const createGame = async (timeControl) => {
    try {
        console.log('Sending time control:', timeControl);
        const response = await api.post('/games', { timeControl });
        console.log('Game creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating game:', error);
        throw error.response?.data || error;
    }
};

export const joinGame = async (gameId) => {
    try {
        const response = await api.post(`/games/${gameId}/join`);
        return response.data;
    } catch (error) {
        console.error('Error joining game:', error);
        throw error.response?.data || error;
    }
};

export const getGame = async (gameId) => {
    try {
        const response = await api.get(`/games/${gameId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting game:', error);
        throw error.response?.data || error;
    }
};

export const makeMove = async (gameId, move) => {
    try {
        const response = await api.post(`/games/${gameId}/move`, { move });
        return response.data;
    } catch (error) {
        console.error('Error making move:', error);
        throw error.response?.data || error;
    }
};

export const resignGame = async (gameId) => {
    try {
        const response = await api.post(`/games/${gameId}/resign`);
        return response.data;
    } catch (error) {
        console.error('Error resigning game:', error);
        throw error.response?.data || error;
    }
};

export const getActiveGames = async () => {
    try {
        const response = await api.get('/games/active');
        return response.data;
    } catch (error) {
        console.error('Error getting active games:', error);
        throw error.response?.data || error;
    }
};

export const getGameHistory = async () => {
    try {
        const response = await api.get('/games/history');
        return response.data;
    } catch (error) {
        console.error('Error getting game history:', error);
        throw error.response?.data || error;
    }
};

// Matchmaking endpoints
export const joinQueue = async () => {
    try {
        const response = await api.post('/matchmaking/join');
        return response.data;
    } catch (error) {
        console.error('Error joining queue:', error);
        throw error.response?.data || error;
    }
};

export const leaveQueue = async () => {
    try {
        const response = await api.post('/matchmaking/leave');
        return response.data;
    } catch (error) {
        console.error('Error leaving queue:', error);
        throw error.response?.data || error;
    }
};

export const getQueueStatus = async () => {
    try {
        const response = await api.get('/matchmaking/status');
        return response.data;
    } catch (error) {
        console.error('Error getting queue status:', error);
        throw error.response?.data || error;
    }
};

export default api; 