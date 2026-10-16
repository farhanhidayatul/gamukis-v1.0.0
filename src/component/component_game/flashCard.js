import React from 'react';
import './flashCard.css';

const Flashcards = ({ title, curriculum = [] }) => {
  return (
    <div className="flashcards">
      <div className="curriculum-heading">
        <span className="curriculum-icon" aria-hidden="true">&#127807;</span>
        <div>
          <h3>{title}</h3>
          <p>Jelajahi Keajaiban {title}</p>
        </div>
      </div>
      <ul className="curriculum-list">
        {curriculum.map((item) => (
          <li key={item.title} className="curriculum-item">
            <span className="curriculum-progress">{item.progress}%</span>
            <div className="curriculum-content">
              <strong>{item.title}</strong>
              {item.topics.map((topic) => <span key={topic}>{topic}</span>)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Flashcards;
