import PdfStructureBadge from '../atoms/PdfStructureBadge';
import './PdfStructureDetectorCard.css';

const PdfStructureDetectorCard = ({
  structure,
  isScanning = false,
  customCount = null,
  onCustomCountChange = null,
  className = ''
}) => {
  if (isScanning) {
    return (
      <div className={`pdf-structure-detector-card scanning ${className}`}>
        <div className="pdf-scanner-spinner"></div>
        <div className="pdf-scanner-text">
          <strong>Memindai Struktur Ujian PDF...</strong>
          <span>Menghitung jumlah soal, opsi jawaban (A–D / A–E), dan pemetaan subtes secara dinamis.</span>
        </div>
      </div>
    );
  }

  if (!structure || typeof structure.totalQuestions !== 'number') {
    return null;
  }

  const {
    totalQuestions,
    minQuestionNumber = 1,
    maxQuestionNumber = totalQuestions,
    optionScheme = 'A_TO_D',
    numberingType = 'sequential',
    isSequenceComplete = true,
    hasPassages = false,
    hasMatrixQuestions = false,
    hasDiagramQuestions = false,
    hasTableDescriptions = false,
    hasCaseStudies = false,
    hasTheoryConcepts = false,
    hasMathFormula = false,
    detectedSections = []
  } = structure;

  const effectiveCount = customCount !== null && customCount !== undefined ? customCount : totalQuestions;
  const isCustomized = customCount !== null && customCount !== undefined && customCount !== totalQuestions;

  return (
    <div className={`pdf-structure-detector-card ready ${className}`}>
      <div className="pdf-detector-header">
        <div className="header-left">
          <span className="detector-icon">📊</span>
          <div>
            <h4 className="detector-title">Hasil Pemindaian Struktur Ujian PDF</h4>
            <span className="detector-subtitle">
              Terdeteksi secara dinamis & murni dari isi dokumen (Zero Hardcoding)
            </span>
          </div>
        </div>
        <div className="header-right">
          <PdfStructureBadge structure={structure} />
        </div>
      </div>

      <div className="pdf-detector-stats-grid">
        <div className="detector-stat-box">
          <span className="stat-label">Total Soal Terdeteksi</span>
          <div className="stat-value-row">
            <span className="stat-value highlight-green">{effectiveCount}</span>
            <span className="stat-unit">Soal</span>
            {isCustomized && (
              <span className="custom-override-tag">(Disesuaikan Pengguna)</span>
            )}
          </div>
        </div>

        <div className="detector-stat-box">
          <span className="stat-label">Format Pilihan Jawaban</span>
          <span className="stat-value highlight-blue">
            {optionScheme === 'A_TO_E' ? 'Pilihan A – E' : 'Pilihan A – D'}
          </span>
          <span className="stat-unit-note">
            {optionScheme === 'A_TO_E' ? 'Standar Ujian Nasional / UTBK' : 'Standar Kuis / Ujian Sekolah'}
          </span>
        </div>

        <div className="detector-stat-box">
          <span className="stat-label">Rentang Nomor Soal</span>
          <span className="stat-value highlight-purple">
            No. {minQuestionNumber} s/d {maxQuestionNumber}
          </span>
          <span className="stat-unit-note">
            {numberingType === 'multi_package'
              ? 'Multi-Paket Ujian (Rantai Lengkap)'
              : (isSequenceComplete ? 'Rantai Berurutan Lengkap' : 'Nomor Soal Terpartisi')}
          </span>
        </div>

        <div className="detector-stat-box">
          <span className="stat-label">Fitur Dokumen</span>
          <div className="detector-features-list">
            {hasPassages && <span className="feature-pill" title="Teks naratif bertingkat atau stimulus bacaan">📖 Soal Cerita / Wacana</span>}
            {hasDiagramQuestions && <span className="feature-pill" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }} title="Memuat soal yang merujuk gambar, diagram, grafik, atau peta visual">🖼️ Soal Bergambar</span>}
            {hasTableDescriptions && <span className="feature-pill" style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }} title="Memuat deskripsi tabel data">📊 Deskripsi Tabel</span>}
            {hasMathFormula && <span className="feature-pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }} title="Memuat formula matematika, aljabar, atau kalkulus">∑ Formula Matematika</span>}
            {hasCaseStudies && <span className="feature-pill" style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8" }} title="Memuat skenario studi kasus atau eksperimen">🔬 Studi Kasus</span>}
            {hasTheoryConcepts && <span className="feature-pill" style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fef08a" }} title="Pertanyaan pemahaman konsep teori mandiri atau kuantitatif">⚡ Konsep Teori</span>}
            {hasMatrixQuestions && <span className="feature-pill" title="Tabel pernyataan matriks benar/salah atau memperlemah">🎯 Matriks Pernyataan</span>}
            {!hasPassages && !hasDiagramQuestions && !hasTableDescriptions && !hasCaseStudies && !hasTheoryConcepts && !hasMatrixQuestions && !hasMathFormula && (
              <span className="feature-pill" title="Pertanyaan teori/konsep mandiri tanpa wacana panjang">⚡ Konsep Teori</span>
            )}
          </div>
        </div>
      </div>

      {detectedSections.length > 1 && (
        <div className="detector-sections-container">
          <span className="sections-heading">Pembagian Subtes / Bagian Dokumen:</span>
          <div className="sections-chips-list">
            {detectedSections.map((sec, idx) => (
              <div key={idx} className="section-distribution-chip">
                <span className="section-name">{sec.title}</span>
                <span className="section-range">
                  No. {sec.startQuestion}–{sec.endQuestion} ({sec.count} Soal)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onCustomCountChange && (
        <div className="detector-override-row">
          <label htmlFor="custom-question-count-input" className="override-label">
            ✏️ Sesuaikan target jumlah soal jika ingin mengecualikan soal tertentu:
          </label>
          <div className="override-input-group">
            <input
              id="custom-question-count-input"
              type="number"
              min="1"
              max="500"
              value={effectiveCount}
              onChange={(e) => onCustomCountChange(parseInt(e.target.value, 10) || totalQuestions)}
              className="override-input"
            />
            {isCustomized && (
              <button
                type="button"
                onClick={() => onCustomCountChange(totalQuestions)}
                className="override-reset-btn"
              >
                Reset ke Deteksi Awal ({totalQuestions})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfStructureDetectorCard;
