import React from 'react';
import '../../../pages/result.css';

const PerformanceSummary = ({ correct = 0, incorrect = 0 }) => (
  <div className="result-card performance card-green">
    <div className="result-card-inner">
      <h3>Performa Jawaban</h3>
      <div className="perf-content">
        <div className="perf-stat-group">
          <span className="perf-correct">{correct}</span>
          <span className="perf-label perf-label-correct">Benar</span>
        </div>
        <span className="perf-sep"> - </span>
        <div className="perf-stat-group">
          <span className="perf-incorrect">{incorrect}</span>
          <span className="perf-label perf-label-incorrect">Salah</span>
        </div>
      </div>
      <div className="perf-summary-subtext">
        <span>Total Dijawab: {correct + incorrect} Soal</span>
      </div>
    </div>
  </div>
);

export default PerformanceSummary;
