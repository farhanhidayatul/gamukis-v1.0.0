import React from 'react';

const PlayerNameInput = ({ value, onChange, editable = true }) => (
  <label htmlFor="player-name">
    {editable ? 'Your Name' : 'Nama Pengguna'}
    <input
      id="player-name"
      maxLength={30}
      type="text"
      value={value}
      onChange={onChange}
      readOnly={!editable}
      aria-readonly={!editable}
    />
  </label>
);

export default PlayerNameInput;
