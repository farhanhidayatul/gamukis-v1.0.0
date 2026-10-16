import React from 'react';

const HairStyleButton = ({ option, isSelected, sprite, onSelect }) => (
  <button
    type="button"
    className={`option-chip ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
    aria-label={`Gaya rambut ${option.label}`}
    aria-pressed={isSelected}
  >
    <span
      className={`hair-preview hair-${option.id} ${sprite ? 'hair-preview-sprite' : ''}`}
      style={sprite ? { backgroundImage: `url(${sprite})` } : undefined}
    />
  </button>
);

export default HairStyleButton;
