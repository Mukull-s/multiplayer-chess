// Socket event constants
export const SOCKET_EVENTS = {
  // Game events
  GAME_STARTED: 'gameStarted',
  GAME_ENDED: 'gameEnded',
  MOVE_MADE: 'moveMade',
  GAME_STATE: 'gameState',
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  
  // Chat events
  CHAT_MESSAGE: 'chatMessage',
  
  // Error events
  ERROR: 'error',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Room events
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  ROOM_FULL: 'roomFull',
  ROOM_NOT_FOUND: 'roomNotFound'
}; 