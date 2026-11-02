import React from 'react';
import './SavedCharacterItem.css';

/**
 * SavedCharacterItem Atom
 * Renders a single saved character item with quick action buttons:
 * - Load: loads this character's appearance into the customization editor
 * - Activate: sets this character as the active avatar for in-game rendering
 * - Delete: removes this saved character
 *
 * @param {Object} props
 * @param {Object} props.character - Character record ({ id, name, data, isActive })
 * @param {boolean} props.isActive - Whether this character is the active in-game avatar
 * @param {Function} props.onActivate - Callback invoked when activating character (receives id)
 * @param {Function} props.onLoad - Callback invoked when loading into editor (receives character)
 * @param {Function} props.onDelete - Callback invoked when deleting character (receives id)
 */
const SavedCharacterItem = ({
  character,
  isActive,
  onActivate,
  onLoad,
  onDelete
}) => {
  if (!character) return null;

  return (
    <div className={`saved-char-item ${isActive ? 'active' : ''}`}>
      <div className="saved-char-info">
        <span className="saved-char-name">{character.name}</span>
        {isActive && <span className="active-badge">Aktif</span>}
      </div>
      <div className="saved-char-actions">
        <button
          type="button"
          className="saved-char-btn edit-btn"
          onClick={() => onLoad(character)}
          title="Muat karakter ini ke editor"
        >
          Muat
        </button>
        {!isActive && (
          <button
            type="button"
            className="saved-char-btn activate-btn"
            onClick={() => onActivate(character.id)}
            title="Gunakan karakter ini di game"
          >
            Aktifkan
          </button>
        )}
        <button
          type="button"
          className="saved-char-btn delete-btn"
          onClick={() => onDelete(character.id)}
          title="Hapus karakter"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SavedCharacterItem;

