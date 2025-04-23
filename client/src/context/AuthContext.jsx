import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authToken) => {
    if (!authToken) {
      console.log('No auth token available for profile fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching user profile with token:', authToken.substring(0, 10) + '...');
      const response = await getProfile();
      console.log('Profile response:', response);
      
      if (response.data) {
        setUser(response.data);
        // Set token for socket service
        if (socketService) {
          socketService.setToken(authToken);
        }
      } else {
        console.error('No data in profile response:', response);
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, logging out');
        logout();
      } else {
        console.error('Profile fetch error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await apiLogin({ email, password });
      console.log('Login response:', response);
      
      if (response.data) {
        const { token, user } = response.data;
        
        if (token && user) {
          localStorage.setItem('token', token);
          setToken(token);
          setUser(user);
          // Set token for socket service
          if (socketService) {
            socketService.setToken(token);
          }
          return { success: true };
        } else {
          console.error('Missing token or user in response:', response.data);
          return { success: false, error: 'Invalid server response format' };
        }
      } else {
        console.error('No data in response:', response);
        return { success: false, error: 'Invalid server response' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred during login';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, username) => {
    try {
      const response = await apiRegister({ email, password, username });
      
      if (response.data) {
        const { token, user } = response.data;
        
        if (token && user) {
          localStorage.setItem('token', token);
          setToken(token);
          setUser(user);
          // Set token for socket service
          if (socketService) {
            socketService.setToken(token);
          }
          return { success: true };
        } else {
          console.error('Missing token or user in response:', response.data);
          return { success: false, error: 'Invalid server response format' };
        }
      } else {
        console.error('No data in response:', response);
        return { success: false, error: 'Invalid server response' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred during registration';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (socketService) {
      socketService.setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 