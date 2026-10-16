import React from 'react';

const CategoryOptionButton = ({ category, description, icon, isActive, onSelect }) => (
  <button
    type="button"
    className={`category-button ${isActive ? 'active' : ''}`}
    aria-pressed={isActive}
    onClick={onSelect}
  >
    <img src={icon} alt={category} draggable="false" />
    <h3>
      {category}
      <br />
      <p>({description})</p>
    </h3>
  </button>
);

export default CategoryOptionButton;
