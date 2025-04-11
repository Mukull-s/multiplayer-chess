// Game States
const GameState = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DRAW: 'draw',
  ABANDONED: 'abandoned'
};

// Game Events
const GameEvents = {
  JOIN_GAME: 'joinGame',
  LEAVE_GAME: 'leaveGame',
  MAKE_MOVE: 'makeMove',
  GAME_STATE: 'gameState',
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  GAME_OVER: 'gameOver',
  DRAW_OFFERED: 'drawOffered',
  DRAW_ACCEPTED: 'drawAccepted',
  DRAW_DECLINED: 'drawDeclined',
  REMATCH_OFFERED: 'rematchOffered',
  REMATCH_ACCEPTED: 'rematchAccepted',
  REMATCH_DECLINED: 'rematchDeclined',
  MOVE_MADE: 'moveMade',
  CHECK: 'check',
  CHECKMATE: 'checkmate',
  TIME_UPDATE: 'timeUpdate',
  GAME_ERROR: 'gameError',
  CHAT_MESSAGE: 'chatMessage'
};

// Player Colors
const PlayerColor = {
  WHITE: 'white',
  BLACK: 'black'
};

// Game Results
const GameResult = {
  WHITE_WIN: 'white_win',
  BLACK_WIN: 'black_win',
  DRAW: 'draw',
  ABANDONED: 'abandoned'
};

// Move Types
const MoveType = {
  NORMAL: 'normal',
  CAPTURE: 'capture',
  CASTLE_KINGSIDE: 'castle_kingside',
  CASTLE_QUEENSIDE: 'castle_queenside',
  EN_PASSANT: 'en_passant',
  PROMOTION: 'promotion'
};

// Time Controls (in minutes)
const TimeControl = {
  BULLET_1: 1,
  BULLET_2: 2,
  BLITZ_3: 3,
  BLITZ_5: 5,
  RAPID_10: 10,
  RAPID_15: 15,
  CLASSICAL_30: 30
};

module.exports = {
  GameState,
  GameEvents,
  PlayerColor,
  GameResult,
  MoveType,
  TimeControl
}; 