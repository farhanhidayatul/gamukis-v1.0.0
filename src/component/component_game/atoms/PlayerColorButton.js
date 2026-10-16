import React from 'react';

const PlayerColorButton = ({ onClick }) => (
  <button type="button" id="player-color" onClick={onClick}>
    Change Color
  </button>
);

export default PlayerColorButton;
