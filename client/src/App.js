import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Game Route component
const GameRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <GameRoute>
                  <Home />
                </GameRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GameRoute>
                  <Game />
                </GameRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 