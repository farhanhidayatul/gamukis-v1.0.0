import React from 'react';

const LogoOptionButton = ({ label, src, isActive, onSelect }) => (
  <button
    type="button"
    className={`buttonLogo ${isActive ? 'active' : ''}`}
    aria-pressed={isActive}
    aria-label={`Pilih logo ${label}`}
    onClick={onSelect}
  >
    <img src={src} alt={label} draggable="false" />
  </button>
);

export default LogoOptionButton;
