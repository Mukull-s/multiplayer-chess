// Room Events
export const ROOM_EVENTS = {
    CREATE_ROOM: 'create-room',
    JOIN_ROOM: 'join-room',
    ROOM_CREATED: 'room-created',
    GAME_STARTED: 'game-started',
    ERROR: 'error'
};

// Game Events
export const GAME_EVENTS = {
    MOVE: 'move',
    MOVE_MADE: 'move-made',
    GAME_OVER: 'game-over',
    DRAW_OFFER: 'draw-offer',
    DRAW_ACCEPTED: 'draw-accepted',
    DRAW_REJECTED: 'draw-rejected',
    RESIGN: 'resign'
};

// Game Status
export const GAME_STATUS = {
    WAITING: 'waiting',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
};

// Game End Reasons
export const GAME_END_REASONS = {
    CHECKMATE: 'checkmate',
    STALEMATE: 'stalemate',
    THREEFOLD_REPETITION: 'threefold_repetition',
    INSUFFICIENT_MATERIAL: 'insufficient_material',
    DRAW: 'draw',
    RESIGNATION: 'resignation',
    PLAYER_DISCONNECTED: 'player_disconnected',
    TIME_OUT: 'time_out'
};

// Player Colors
export const PLAYER_COLORS = {
    WHITE: 'white',
    BLACK: 'black'
}; 