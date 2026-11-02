import React from 'react';
import './CharacterSlotInfo.css';

/**
 * CharacterSlotInfo Atom
 * Visual indicator displaying how many character slots are occupied vs maximum slots allowed.
 *
 * @param {Object} props
 * @param {number} [props.currentCount=0] - Number of saved characters currently stored
 * @param {number} [props.maxSlots=5] - Maximum character slots allowed by the user's membership tier
 */
const CharacterSlotInfo = ({ currentCount = 0, maxSlots = 5 }) => {
  const isFull = currentCount >= maxSlots;

  return (
    <div className={`character-slot-info ${isFull ? 'full' : ''}`}>
      <span className="slot-label">Slot Karakter:</span>
      <span className="slot-badge">
        <strong>{currentCount}</strong> / {maxSlots}
      </span>
      {isFull && <span className="slot-warning">Penuh</span>}
    </div>
  );
};

export default CharacterSlotInfo;

