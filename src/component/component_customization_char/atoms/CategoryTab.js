import React from 'react';

const CategoryTab = ({ label, isSelected, onClick }) => (
  <button
    type="button"
    className={`tab-button ${isSelected ? 'active' : ''}`}
    role="tab"
    aria-selected={isSelected}
    onClick={onClick}
  >
    {label}
  </button>
);

export default CategoryTab;
