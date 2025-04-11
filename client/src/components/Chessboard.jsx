import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useState, useEffect } from 'react';
import PromotionModal from './PromotionModal';

// Import SVG pieces
import wP from '../assets/chess/pieces/wP.svg';
import wN from '../assets/chess/pieces/wN.svg';
import wB from '../assets/chess/pieces/wB.svg';
import wR from '../assets/chess/pieces/wR.svg';
import wQ from '../assets/chess/pieces/wQ.svg';
import wK from '../assets/chess/pieces/wK.svg';
import bP from '../assets/chess/pieces/bP.svg';
import bN from '../assets/chess/pieces/bN.svg';
import bB from '../assets/chess/pieces/bB.svg';
import bR from '../assets/chess/pieces/bR.svg';
import bQ from '../assets/chess/pieces/bQ.svg';
import bK from '../assets/chess/pieces/bK.svg';

const ChessBoard = ({ position, onPieceDrop, playerColor }) => {
  const [game, setGame] = useState(new Chess(position));
  const [showPromotion, setShowPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [lastMove, setLastMove] = useState(null);
  const [gameStatus, setGameStatus] = useState({
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  });

  // Update game state when position prop changes
  useEffect(() => {
    const newGame = new Chess(position);
    setGame(newGame);
    updateGameStatus(newGame);
  }, [position]);

  const updateGameStatus = (chessGame) => {
    const status = {
      isCheck: chessGame.isCheck(),
      isCheckmate: chessGame.isCheckmate(),
      isStalemate: chessGame.isStalemate(),
      isDraw: chessGame.isDraw()
    };
    setGameStatus(status);
  };

  // Custom pieces object
  const customPieces = {
    wP: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wP} alt="white pawn" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    wN: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wN} alt="white knight" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    wB: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wB} alt="white bishop" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    wR: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wR} alt="white rook" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    wQ: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wQ} alt="white queen" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    wK: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={wK} alt="white king" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bP: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bP} alt="black pawn" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bN: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bN} alt="black knight" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bB: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bB} alt="black bishop" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bR: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bR} alt="black rook" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bQ: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bQ} alt="black queen" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    bK: ({ squareWidth }) => (
      <div style={{ width: squareWidth, height: squareWidth }}>
        <img src={bK} alt="black king" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
  };

  const onSquareClick = (square) => {
    const piece = game.get(square);
    
    // If no piece is selected and the square is empty, do nothing
    if (!piece) return;

    // If it's not the player's turn, do nothing
    if (piece.color !== (playerColor === 'white' ? 'w' : 'b')) return;

    // Get all valid moves for the selected piece
    const moves = game.moves({ square, verbose: true });
    
    // Create a map of highlighted squares
    const highlights = {};
    moves.forEach(move => {
      // Highlight regular moves in yellow
      highlights[move.to] = {
        background: 'rgba(255, 255, 0, 0.4)'
      };

      // Highlight en passant captures in red
      if (move.flags.includes('e')) {
        const enPassantSquare = move.to[0] + (move.to[1] === '6' ? '5' : '4');
        highlights[enPassantSquare] = {
          background: 'rgba(255, 0, 0, 0.4)'
        };
      }
    });

    setHighlightedSquares(highlights);
  };

  const onDrop = (sourceSquare, targetSquare) => {
    try {
      // Check if the move is a promotion
      const piece = game.get(sourceSquare);
      const isPromotion = piece.type === 'p' && 
        ((piece.color === 'w' && targetSquare[1] === '8') || 
         (piece.color === 'b' && targetSquare[1] === '1'));

      if (isPromotion) {
        // Store the move and show promotion modal
        setPendingMove({ from: sourceSquare, to: targetSquare });
        setShowPromotion(true);
        return false;
      }

      // Regular move (including castling and en passant)
      const move = game.move({
        from: sourceSquare,
        to: targetSquare
      });

      if (move === null) return false;

      // Update local game state
      setGame(new Chess(game.fen()));
      setLastMove(move);
      updateGameStatus(game);

      // Notify parent component
      onPieceDrop({
        from: sourceSquare,
        to: targetSquare,
        flags: move.flags, // Include move flags for castling and en passant
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isStalemate: game.isStalemate(),
        isDraw: game.isDraw()
      });

      // Clear highlights
      setHighlightedSquares({});

      return true;
    } catch (error) {
      return false;
    }
  };

  const handlePromotionSelect = (piece) => {
    if (!pendingMove) return;

    try {
      const move = game.move({
        from: pendingMove.from,
        to: pendingMove.to,
        promotion: piece
      });

      if (move === null) return;

      // Update local game state
      setGame(new Chess(game.fen()));
      setLastMove(move);
      updateGameStatus(game);

      // Notify parent component
      onPieceDrop({
        from: pendingMove.from,
        to: pendingMove.to,
        promotion: piece,
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isStalemate: game.isStalemate(),
        isDraw: game.isDraw()
      });

      // Reset state
      setShowPromotion(false);
      setPendingMove(null);
      setHighlightedSquares({});
    } catch (error) {
      console.error('Error making promotion move:', error);
    }
  };

  // Get the king's square for the current player
  const getKingSquare = () => {
    const kingColor = game.turn() === 'w' ? 'w' : 'b';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const piece = game.get(square);
        if (piece && piece.type === 'k' && piece.color === kingColor) {
          return square;
        }
      }
    }
    return null;
  };

  // Add check highlight to the king's square
  const getSquareStyles = () => {
    const styles = { ...highlightedSquares };
    if (gameStatus.isCheck) {
      const kingSquare = getKingSquare();
      if (kingSquare) {
        styles[kingSquare] = {
          ...styles[kingSquare],
          background: 'rgba(255, 0, 0, 0.4)'
        };
      }
    }
    return styles;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {gameStatus.isCheckmate && (
        <div className="text-center text-2xl font-bold text-red-600 mb-4">
          Checkmate! {game.turn() === 'w' ? 'Black' : 'White'} wins!
        </div>
      )}
      {gameStatus.isStalemate && (
        <div className="text-center text-2xl font-bold text-gray-600 mb-4">
          Stalemate! Game is a draw.
        </div>
      )}
      {gameStatus.isDraw && !gameStatus.isStalemate && (
        <div className="text-center text-2xl font-bold text-gray-600 mb-4">
          Game is a draw!
        </div>
      )}
      {gameStatus.isCheck && !gameStatus.isCheckmate && (
        <div className="text-center text-2xl font-bold text-yellow-600 mb-4">
          Check!
        </div>
      )}
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor === 'white' ? 'white' : 'black'}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}
        customDarkSquareStyle={{ backgroundColor: '#779556' }}
        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
        customPieces={customPieces}
        customSquareStyles={getSquareStyles()}
        lastMove={lastMove}
      />
      <PromotionModal
        isOpen={showPromotion}
        onClose={() => setShowPromotion(false)}
        onSelect={handlePromotionSelect}
        color={game.turn() === 'w' ? 'w' : 'b'}
      />
    </div>
  );
};

export default ChessBoard; 