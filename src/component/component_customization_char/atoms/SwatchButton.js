import React from 'react';

const SwatchButton = ({ label, color, isSelected, onClick }) => (
  <button
    type="button"
    className={`option-chip color-chip ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
    style={{ background: color }}
    aria-label={label}
    aria-pressed={isSelected}
  />
);

export default SwatchButton;
