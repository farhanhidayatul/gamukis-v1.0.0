import React from 'react';

const ViewDirectionButton = ({ label, symbol, isSelected, onClick }) => (
  <button
    type="button"
    className={`view-direction-button ${isSelected ? 'selected' : ''}`}
    aria-label={`Lihat dari arah ${label.toLowerCase()}`}
    aria-pressed={isSelected}
    title={label}
    onClick={onClick}
  >
    {symbol}
  </button>
);

export default ViewDirectionButton;
