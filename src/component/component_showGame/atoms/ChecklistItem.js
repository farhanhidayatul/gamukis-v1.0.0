import React from 'react';

const checkIcon = require('../../../images/Checkbox.svg').default;

const ChecklistItem = ({ label }) => (
  <div className="checklist">
    <img src={checkIcon} alt="" draggable="false" />
    <p>{label}</p>
  </div>
);

export default ChecklistItem;
