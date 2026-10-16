import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './modal.css';

const CoinModal = ({ isOpen, onRequestClose, onQuestionAnswered, playerId, questionData }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAnswer(null);
      setIsCorrect(false);
      if (questionData && Array.isArray(questionData.options)) {
        // Fisher-Yates shuffle to randomize answer positions in the UI
        const opts = [...questionData.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        setShuffledOptions(opts);
      } else {
        setShuffledOptions([]);
      }
    }
  }, [isOpen, questionData]);

  const handleAnswerClick = (answer) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answer);
      const correct = answer === questionData.correct;
      setIsCorrect(correct);
      onQuestionAnswered(questionData.question, answer, correct);

      setTimeout(() => {
        onRequestClose();
      }, 1500);
    }
  };

  const displayedOptions = shuffledOptions.length > 0 ? shuffledOptions : (questionData?.options || []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Coin Collection Modal"
      ariaHideApp={false}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      className="coin-modal"
      overlayClassName="coin-modal-overlay"
    >
      <div className="modal-content">
        <h2>{questionData.question}</h2>
        <div className="options">
          {displayedOptions.map((option, index) => (
            <button 
              key={index} 
              onClick={() => handleAnswerClick(option)}
              className={`option-button ${selectedAnswer !== null && selectedAnswer !== option ? 'blurred' : ''} ${selectedAnswer === option ? (isCorrect ? "correct" : "incorrect") : ""}`}
              disabled={selectedAnswer !== null && selectedAnswer !== option}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CoinModal;













