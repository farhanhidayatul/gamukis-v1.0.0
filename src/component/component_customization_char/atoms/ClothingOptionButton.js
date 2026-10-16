import React from 'react';

const ClothingOptionButton = ({ label, category, sprite, isSelected, onClick }) => (
  <button
    type="button"
    className={`option-chip clothing-chip ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
    aria-label={label}
    aria-pressed={isSelected}
    title={label}
  >
    <span className={`clothing-chip-sprite clothing-chip-sprite-${category}`} style={{ backgroundImage: `url(${sprite})` }} aria-hidden="true" />
    <span className="clothing-chip-label">{label}</span>
  </button>
);

export default ClothingOptionButton;
