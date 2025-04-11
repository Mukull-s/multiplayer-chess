import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

const useGame = () => {
  const [game, setGame] = useState(new Chess());

  const makeMove = useCallback((move) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });

      if (result) {
        setGame(newGame);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [game]);

  const resetGame = useCallback(() => {
    setGame(new Chess());
  }, []);

  const getValidMoves = useCallback((square) => {
    return game.moves({ square, verbose: true });
  }, [game]);

  return {
    game,
    makeMove,
    resetGame,
    getValidMoves,
    fen: game.fen(),
    isGameOver: game.isGameOver(),
    turn: game.turn()
  };
};

export default useGame; 