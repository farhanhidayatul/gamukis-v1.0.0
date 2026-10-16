import React from 'react';
import PlayerColorButton from '../atoms/PlayerColorButton';
import PlayerHealth from '../atoms/PlayerHealth';
import PlayerNameInput from '../atoms/PlayerNameInput';

const PlayerPanel = ({ name, onNameChange, health, onChangeColor, isGuest }) => (
  <div className="player-info">
    <div className="player-info__identity">
      <div className="player-info__main-row">
        <PlayerNameInput value={name} onChange={onNameChange} editable={isGuest} />
      </div>
      <PlayerHealth health={health} />
    </div>
    <div className="player-info__actions">
      <PlayerColorButton onClick={onChangeColor} />
    </div>
  </div>
);

export default PlayerPanel;
