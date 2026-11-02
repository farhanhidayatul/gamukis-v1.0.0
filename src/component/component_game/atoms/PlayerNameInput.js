import React, { useState } from 'react';

const PlayerNameInput = ({
  value,
  onNameChange,
  isGuest = true,
  hasRenamed = false,
  disabled = false
}) => {
  const [draftName, setDraftName] = useState(value || '');

  // Sync draftName when parent name changes before renaming
  React.useEffect(() => {
    if (!hasRenamed) {
      setDraftName(value || '');
    }
  }, [value, hasRenamed]);

  const handleApplyRename = (e) => {
    e.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === value) {
      return;
    }
    onNameChange(trimmed);
  };

  // Registered accounts: use permanent profile account name
  if (!isGuest) {
    return (
      <div className="player-name-wrapper player-name--registered">
        <label htmlFor="player-name">Nama Pengguna</label>
        <span id="player-name" className="player-name-display">
          {value || 'Pengguna'}
        </span>
      </div>
    );
  }

  // Guest accounts after one-time rename has been used: locked
  if (hasRenamed) {
    return (
      <div className="player-name-wrapper player-name--locked">
        <label htmlFor="player-name">Nama Guest (Terkunci)</label>
        <div className="player-name-locked-row">
          <input
            id="player-name"
            type="text"
            value={value}
            readOnly
            disabled
            className="player-name-input player-name-input--locked"
          />
          <span className="player-name-badge">Terkunci</span>
        </div>
      </div>
    );
  }

  // Guest accounts: one-time rename available
  return (
    <form className="player-name-wrapper player-name--guest" onSubmit={handleApplyRename}>
      <label htmlFor="player-name">Nama Guest</label>
      <div className="player-name-action-row">
        <input
          id="player-name"
          type="text"
          maxLength={20}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Ketik nama..."
          disabled={disabled}
          className="player-name-input"
        />
        <button
          type="submit"
          id="btn-change-name"
          className="player-name-button"
          disabled={disabled || !draftName.trim()}
          title="Ganti nama hanya bisa dilakukan 1 kali"
        >
          Ganti Nama
        </button>
      </div>
    </form>
  );
};

export default PlayerNameInput;
