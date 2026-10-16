import React from 'react';
import '../../pages/result.css';

const ScoreBox = ({ score = 0, totalQuestions = 25, nValue = 4 }) => (
  <div className="result-card skors card-yellow">
    <div className="result-card-inner">
      <h3>Nilai Akademik</h3>
      <div className="score-large">{score}</div>
      <div className="score-hint">
        Skala 100 • Bobot Soal (n = {nValue})
      </div>
    </div>
  </div>
);

export default ScoreBox;
