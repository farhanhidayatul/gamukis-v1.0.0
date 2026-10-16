import React from 'react';
import AnswerOption from '../atoms/AnswerOption';

const AnswerCard = ({ question, options, statusClass, getOptionClass }) => (
  <article className={`answer-card answer-card-question ${statusClass}`}>
    <h3>{question}</h3>
    <div className="card-divider" />
    <div className="answer-options">
      {options.map((option, index) => (
        <AnswerOption key={index} className={getOptionClass(option, index)}>
          {option}
        </AnswerOption>
      ))}
    </div>
  </article>
);

export default AnswerCard;
