const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Socket.io authentication middleware
exports.socketAuth = async (socket, next) => {
  try {
    // Try to get token from auth object first
    let token = socket.handshake.auth.token;
    
    // If not in auth object, try Authorization header
    if (!token && socket.handshake.headers.authorization) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.error('Socket authentication failed: User not found');
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    console.log('Socket authenticated successfully:', {
      socketId: socket.id,
      userId: user._id,
      username: user.username
    });
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication error: Invalid token'));
  }
}; 