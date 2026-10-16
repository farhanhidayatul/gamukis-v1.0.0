import React from 'react';
import '../../pages/result.css';

const SubjectSection = ({ subject = null, totalQuestions = 25 }) => {
  const displaySubject = subject || 'Biologi';
  const isSoshum = ['Sosiologi', 'Indonesia'].includes(displaySubject);

  return (
    <div className="result-card subject card-blue">
      <div className="result-card-inner">
        <h2>Pelajaran</h2>
        <div className="subject-details">
          <p className="subject-badge">{isSoshum ? 'SOSHUM' : 'SAINTEK'}</p>
          <p className="subject-desc">Telah menjawab tantangan {isSoshum ? 'soshum' : 'saintek'}, kamu siap unggul</p>
          <div className="subject-meta">
            <p className="subject-name">{displaySubject}</p>
            <p className="subject-count">{totalQuestions} Soal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSection;
