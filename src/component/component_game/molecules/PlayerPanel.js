import React from 'react';
import PlayerColorButton from '../atoms/PlayerColorButton';
import PlayerHealth from '../atoms/PlayerHealth';
import PlayerNameInput from '../atoms/PlayerNameInput';

const PlayerPanel = ({
  name,
  onNameChange,
  health,
  onChangeColor,
  isGuest,
  hasRenamed = false
}) => (
  <div className="player-info">
    <div className="player-info__identity">
      <div className="player-info__main-row">
        <PlayerNameInput
          value={name}
          onNameChange={onNameChange}
          isGuest={isGuest}
          hasRenamed={hasRenamed}
        />
      </div>
      <div className="player-info__sub-row">
        <PlayerHealth health={health} />
        {/* Change color button positioned underneath rename, visible only on tablet/mobile */}
        <div className="player-info__color-action">
          <PlayerColorButton onClick={onChangeColor} />
        </div>
      </div>
    </div>
  </div>
);

export default PlayerPanel;
