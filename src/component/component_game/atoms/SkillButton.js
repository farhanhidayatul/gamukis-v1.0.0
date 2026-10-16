import React from 'react';

const SkillButton = ({ skill, isCoolingDown, onClick }) => (
  <button
    type="button"
    className="skill-button"
    onClick={onClick}
    disabled={isCoolingDown}
    aria-label="Keluarkan jurus"
  >
    {isCoolingDown ? '...' : skill}
  </button>
);

export default SkillButton;
