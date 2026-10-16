import React from 'react';
import hpIn from '../../../images/HP_in.png';
import hpOut from '../../../images/HP_out.png';

const PlayerHealth = ({ health = 3 }) => {
  const normalizedHealth = Math.min(3, Math.max(0, Number(health) || 0));
  const isBlinking = normalizedHealth === 1;

  return (
    <div
      className={`player-health${isBlinking ? ' player-health--blinking' : ''}`}
      aria-label={`${normalizedHealth} dari 3 darah`}
    >
      {[0, 1, 2].map((heart) => {
        const isFull = heart < normalizedHealth;
        return (
          <span key={heart} className={`heart ${isFull ? 'heart-full' : 'heart-empty'}`}>
            <img className="heart-image heart-in" src={hpIn} alt="" aria-hidden="true" />
            <img className="heart-image heart-out" src={hpOut} alt="" aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
};

export default PlayerHealth;
