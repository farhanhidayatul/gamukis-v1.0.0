import React from 'react';
import '../../pages/result.css';

const AccuracySection = ({ accuracy, badgePosition }) => (
  <div className="result-card accuracy-card card-purple">
    <div className="result-card-inner">
      <div className="accuracy-header-row">
        <h2>Akurasi</h2>
        <span className="accuracy-percent-tag">{Math.round(accuracy)}%</span>
      </div>
      <div className="accuracy-bar full">
        <div className="accuracy-track">
          <div className="accuracy-progress" style={{ width: `${accuracy}%` }} />
        </div>
        <div className="accuracy-badge" style={{ left: `${badgePosition}%` }}>{Math.round(accuracy)}%</div>
        <div className="accuracy-info" aria-label="Persentase jawaban benar" title="Persentase jawaban benar">i</div>
      </div>
    </div>
  </div>
);

export default AccuracySection;
