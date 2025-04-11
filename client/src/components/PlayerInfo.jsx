import React from 'react';

const PlayerInfo = ({ player, isCurrentPlayer }) => {
  return (
    <div className={`player-info ${isCurrentPlayer ? 'current-player' : ''}`}>
      <h3>{player?.name || 'Waiting for player...'}</h3>
      <p>Rating: {player?.rating || 'N/A'}</p>
      {isCurrentPlayer && <p className="turn-indicator">Your turn!</p>}
    </div>
  );
};

export default PlayerInfo; 