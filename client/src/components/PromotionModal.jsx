import { useEffect, useRef } from 'react';

const PromotionModal = ({ isOpen, onClose, onSelect, color }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pieces = ['q', 'r', 'b', 'n']; // queen, rook, bishop, knight
  const pieceNames = {
    q: 'Queen',
    r: 'Rook',
    b: 'Bishop',
    n: 'Knight'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white p-4 rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-4">Choose promotion piece</h3>
        <div className="grid grid-cols-2 gap-4">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="flex items-center justify-center p-2 border rounded hover:bg-gray-100"
            >
              <img
                src={`/src/assets/chess/pieces/${color}${piece}.svg`}
                alt={`${pieceNames[piece]}`}
                className="w-8 h-8"
              />
              <span className="ml-2">{pieceNames[piece]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal; 