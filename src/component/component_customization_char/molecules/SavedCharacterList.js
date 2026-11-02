import React from 'react';
import SavedCharacterItem from '../atoms/SavedCharacterItem';
import CharacterSlotInfo from '../atoms/CharacterSlotInfo';
import './SavedCharacterList.css';

/**
 * SavedCharacterList Molecule
 * Panel managing user's saved characters, displaying remaining slots, loading state,
 * and listing individual character items with management actions.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.characters=[]] - List of saved character records
 * @param {number} [props.maxSlots=5] - Maximum permitted character slots
 * @param {number|null} [props.activeCharacterId] - Currently active character ID
 * @param {Function} props.onActivate - Callback when a character is activated
 * @param {Function} props.onLoad - Callback when a character is loaded into editor
 * @param {Function} props.onDelete - Callback when a character is deleted
 * @param {boolean} [props.isLoading=false] - Whether character list is currently loading
 */
const SavedCharacterList = ({
  characters = [],
  maxSlots = 5,
  activeCharacterId,
  onActivate,
  onLoad,
  onDelete,
  isLoading
}) => {
  return (
    <div className="saved-char-list-panel">
      <div className="saved-char-list-header">
        <h3 className="saved-char-list-title">Karakter Tersimpan</h3>
        <CharacterSlotInfo
          currentCount={characters.length}
          maxSlots={maxSlots}
        />
      </div>

      {isLoading ? (
        <div className="saved-char-empty">Memuat daftar karakter...</div>
      ) : characters.length === 0 ? (
        <div className="saved-char-empty">
          Belum ada karakter yang disimpan ke akun Anda.
        </div>
      ) : (
        <div className="saved-char-items">
          {characters.map((char) => (
            <SavedCharacterItem
              key={char.id}
              character={char}
              isActive={char.isActive || char.id === activeCharacterId}
              onActivate={onActivate}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedCharacterList;

