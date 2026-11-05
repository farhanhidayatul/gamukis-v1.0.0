import React from 'react';

const PlayerColorButton = ({ onClick }) => (
  <button type="button" id="player-color" onClick={onClick}>
    Change Character
  </button>
);

export default PlayerColorButton;
