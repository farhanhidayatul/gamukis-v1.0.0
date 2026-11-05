import React from 'react';
import './flashCard.css';

const Flashcards = ({
  title,
  curriculum = [],
  selectedChapterId = null,
  onSelectChapter = () => {},
  isLoading = false
}) => {
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
        <li className="curriculum-item">
          <button
            type="button"
            className={`curriculum-item-button ${selectedChapterId === null ? 'is-selected' : ''}`}
            aria-pressed={selectedChapterId === null}
            onClick={() => onSelectChapter(null)}
          >
            <span className="curriculum-progress" aria-hidden="true">✦</span>
            <span className="curriculum-content">
              <strong>Semua Materi (Acak)</strong>
              <span>Latihan dari seluruh bab mata pelajaran ini.</span>
            </span>
            {selectedChapterId === null && <span className="curriculum-selected-badge">✓ Terpilih</span>}
          </button>
        </li>
        {isLoading && <li className="curriculum-message" role="status">Memuat silabus mata pelajaran...</li>}
        {!isLoading && curriculum.length === 0 && (
          <li className="curriculum-message">Silabus untuk mata pelajaran ini belum tersedia.</li>
        )}
        {!isLoading && curriculum.map((item) => {
          const chapterId = String(item.id || item.chapterNumber || item.title);
          const isSelected = selectedChapterId === chapterId;
          return (
            <li key={chapterId} className="curriculum-item">
              <button
                type="button"
                className={`curriculum-item-button ${isSelected ? 'is-selected' : ''}`}
                data-chapter-id={chapterId}
                aria-pressed={isSelected}
                onClick={() => onSelectChapter({ ...item, id: chapterId })}
              >
                <span className="curriculum-progress">{item.progress || 0}%</span>
                <span className="curriculum-content">
                  <strong>{item.title}</strong>
                  {(item.topics || []).map((topic) => <span key={topic}>{topic}</span>)}
                </span>
                {isSelected && <span className="curriculum-selected-badge">✓ Terpilih</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Flashcards;
