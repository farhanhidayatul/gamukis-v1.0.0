import React from 'react';
import ChecklistItem from '../atoms/ChecklistItem';

const FeatureChecklist = ({ features }) => (
  <div className="checklistContainer">
    {features.map((feature) => <ChecklistItem key={feature} label={feature} />)}
  </div>
);

export default FeatureChecklist;
