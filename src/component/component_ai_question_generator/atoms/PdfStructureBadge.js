import React from 'react';
import './PdfStructureBadge.css';

const PdfStructureBadge = ({ structure, className = '' }) => {
  if (!structure || typeof structure.totalQuestions !== 'number') {
    return null;
  }

  const { totalQuestions, optionScheme, isSequenceComplete, detectedSections = [] } = structure;
  const optionLabel = optionScheme === 'A_TO_E' ? 'Opsi A–E (5 Pilihan)' : 'Opsi A–D (4 Pilihan)';

  return (
    <div className={`pdf-structure-badge-container ${className}`}>
      <span className="pdf-structure-pill count-pill">
        <span className="pill-dot green-dot"></span>
        <strong>{totalQuestions}</strong> Soal Terdeteksi
      </span>
      <span className="pdf-structure-pill scheme-pill">
        {optionLabel}
      </span>
      {isSequenceComplete && (
        <span className="pdf-structure-pill verified-pill" title="Urutan soal 100% berurutan tanpa celah">
          ✓ 100% Sequence Verified
        </span>
      )}
      {detectedSections.length > 1 && (
        <span className="pdf-structure-pill sections-pill">
          {detectedSections.length} Bagian / Subtes
        </span>
      )}
    </div>
  );
};

export default PdfStructureBadge;
