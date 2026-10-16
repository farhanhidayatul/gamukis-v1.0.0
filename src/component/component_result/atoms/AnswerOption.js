import React from 'react';

const AnswerOption = ({ className, children }) => (
  <div className={`answer-option ${className}`}>{children}</div>
);

export default AnswerOption;
