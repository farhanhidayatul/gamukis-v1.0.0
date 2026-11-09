import React, { useState } from 'react';
import { formatDurationMinutes, sumLessonDurationMinutes } from '../../../database/studentClassData';
import './CurriculumClassEditorModal.css';

const deriveChapterDuration = (chapter, lessons) => {
  const durationMinutes = sumLessonDurationMinutes(lessons);
  return {
    ...chapter,
    lessons,
    duration: durationMinutes === null ? '' : formatDurationMinutes(durationMinutes)
  };
};

const initializeSyllabus = (syllabus) => {
  if (!Array.isArray(syllabus)) return [];
  return JSON.parse(JSON.stringify(syllabus)).map((chapter) => {
    const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
    return lessons.length > 0 ? deriveChapterDuration(chapter, lessons) : chapter;
  });
};

const CurriculumClassEditorModal = ({ isOpen, classData, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'syllabus'
  const [formData, setFormData] = useState(() => ({
    id: classData?.id || '',
    title: classData?.offering?.title || classData?.title || '',
    slug: classData?.slug || '',
    category: classData?.category || 'BAHASA',
    categoryLabel: classData?.categoryLabel || 'Bahasa & Literasi',
    educationStage: classData?.offering?.educationStage || classData?.educationStage || 'SMA',
    schoolGrade: classData?.offering?.schoolGrade || classData?.schoolGrade || '10',
    level: classData?.level || 'Dasar - Mahir',
    totalDuration: classData?.totalDuration || '10 Jam',
    badge: classData?.badge || '',
    description: classData?.description || '',
    instructorName: classData?.instructor?.name || 'Instruktur Gamukis',
    instructorTitle: classData?.instructor?.title || 'Pendidik Profesional',
    learningObjectivesText: (classData?.offering?.learningObjectives || classData?.learningObjectives || []).join('\n'),
    syllabus: initializeSyllabus(classData?.syllabus)
  }));

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddChapter = () => {
    setFormData((prev) => {
      const nextNum = prev.syllabus.length + 1;
      return {
        ...prev,
        syllabus: [
          ...prev.syllabus,
          {
            chapterNumber: nextNum,
            title: `Bab ${nextNum}: Materi Baru`,
            duration: '',
            difficulty: 'Sedang',
            summary: '',
            lessons: []
          }
        ]
      };
    });
  };

  const handleChapterChange = (cIdx, field, val) => {
    setFormData((prev) => {
      const nextSyl = [...prev.syllabus];
      nextSyl[cIdx] = { ...nextSyl[cIdx], [field]: val };
      return { ...prev, syllabus: nextSyl };
    });
  };

  const handleDeleteChapter = (cIdx) => {
    setFormData((prev) => ({
      ...prev,
      syllabus: prev.syllabus.filter((_, idx) => idx !== cIdx)
    }));
  };

  const handleAddLesson = (cIdx) => {
    setFormData((prev) => {
      const nextSyl = [...prev.syllabus];
      const ch = nextSyl[cIdx];
      const nextLessonNum = (ch.lessons || []).length + 1;
      const newLesson = {
        id: `${prev.slug || 'cls'}-${cIdx + 1}-${nextLessonNum}`,
        title: `Sub Materi ${nextLessonNum}`,
        duration: '30 Menit',
        type: 'interactive'
      };
      nextSyl[cIdx] = deriveChapterDuration(ch, [...(ch.lessons || []), newLesson]);
      return { ...prev, syllabus: nextSyl };
    });
  };

  const handleLessonChange = (cIdx, lIdx, field, val) => {
    setFormData((prev) => {
      const nextSyl = [...prev.syllabus];
      const ch = nextSyl[cIdx];
      const nextLessons = [...(ch.lessons || [])];
      nextLessons[lIdx] = { ...nextLessons[lIdx], [field]: val };
      nextSyl[cIdx] = deriveChapterDuration(ch, nextLessons);
      return { ...prev, syllabus: nextSyl };
    });
  };

  const handleDeleteLesson = (cIdx, lIdx) => {
    setFormData((prev) => {
      const nextSyl = [...prev.syllabus];
      const ch = nextSyl[cIdx];
      nextSyl[cIdx] = deriveChapterDuration(
        ch,
        (ch.lessons || []).filter((_, idx) => idx !== lIdx)
      );
      return { ...prev, syllabus: nextSyl };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (classData?.offering) {
      onSave({
        title: formData.title,
        description: formData.description,
        educationStage: formData.educationStage,
        schoolGrade: formData.schoolGrade,
        learningObjectives: formData.learningObjectivesText.split('\n').map((objective) => objective.trim()).filter(Boolean),
        syllabus: formData.syllabus
      });
      return;
    }
    const payload = {
      title: formData.title,
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: formData.category,
      categoryLabel: formData.category === 'SAINTEK' ? 'Sains & Teknologi' : formData.category === 'SOSHUM' ? 'Sosial & Humaniora' : 'Bahasa & Literasi',
      educationStage: formData.educationStage,
      schoolGrade: formData.schoolGrade,
      level: formData.level,
      totalDuration: formData.totalDuration,
      badge: formData.badge || null,
      description: formData.description,
      instructor: {
        name: formData.instructorName,
        title: formData.instructorTitle,
        avatar: formData.category === 'BAHASA' ? '🇮🇩' : formData.category === 'SAINTEK' ? '🔬' : '🌍'
      },
      syllabus: formData.syllabus
    };
    onSave(payload);
  };

  return (
    <div className="curriculum-modal-overlay" role="dialog" aria-modal="true">
      <div className="curriculum-modal">
        <div className="curriculum-modal__header">
          <h2>{classData?.offering ? `Edit Template: ${classData.title} · ${classData.offering.educationStage} ${classData.offering.educationStage === 'KULIAH' ? classData.offering.schoolGrade : `Kelas ${classData.offering.schoolGrade}`}` : classData?.id ? `Edit Kurikulum: ${classData.title}` : 'Tambah Mata Pelajaran Baru'}</h2>
          <button type="button" className="curriculum-modal__close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className="curriculum-modal__tabs">
          <button
            type="button"
            className={`curriculum-modal__tab-btn ${activeTab === 'meta' ? 'active' : ''}`}
            onClick={() => setActiveTab('meta')}
          >
            {classData?.offering ? 'Data Template' : 'Data Mata Pelajaran'}
          </button>
          <button
            type="button"
            className={`curriculum-modal__tab-btn ${activeTab === 'syllabus' ? 'active' : ''}`}
            onClick={() => setActiveTab('syllabus')}
          >
            Silabus Materi & Sub-Materi ({formData.syllabus.length} Bab)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="curriculum-modal__body">
            {activeTab === 'meta' ? (
              <>
                <div className="curriculum-modal__form-row">
                  <div className="curriculum-modal__form-group">
                    <label>Jenjang Pendidikan</label>
                    <select
                      className="curriculum-modal__select"
                      value={formData.educationStage}
                      onChange={(e) => {
                        const stage = e.target.value;
                        const defaultGrade = stage === 'SD' ? '1' : stage === 'SMP' ? '7' : stage === 'SMA' ? '10' : 'Semester 1';
                        setFormData((prev) => ({ ...prev, educationStage: stage, schoolGrade: defaultGrade }));
                      }}
                    >
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                      <option value="KULIAH">Perguruan Tinggi / Kuliah</option>
                    </select>
                  </div>
                  <div className="curriculum-modal__form-group">
                    <label>{formData.educationStage === 'KULIAH' ? 'Semester' : 'Tingkat Kelas'}</label>
                    <select
                      className="curriculum-modal__select"
                      value={formData.schoolGrade}
                      onChange={(e) => handleFieldChange('schoolGrade', e.target.value)}
                    >
                      {(formData.educationStage === 'SD'
                        ? ['1', '2', '3', '4', '5', '6']
                        : formData.educationStage === 'SMP'
                        ? ['7', '8', '9']
                        : formData.educationStage === 'SMA'
                        ? ['10', '11', '12']
                        : ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
                      ).map((g) => (
                        <option key={g} value={g}>
                          {formData.educationStage === 'KULIAH' ? g : `Kelas ${g}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {classData?.offering && (
                  <div className="curriculum-modal__form-row" style={{ marginTop: '-8px', marginBottom: '8px' }}>
                    <div className="curriculum-modal__form-group">
                      <small style={{ color: 'var(--mut, #64748b)' }}>
                        Status Konten: <strong>{classData.offering.contentStatus === 'approved' ? 'Disetujui' : 'Draf · perlu ditinjau'}</strong>
                      </small>
                    </div>
                  </div>
                )}

                <div className="curriculum-modal__form-row">
                  <div className="curriculum-modal__form-group">
                    <label>{classData?.offering ? 'Judul Template Kelas' : 'Judul Mata Pelajaran'}</label>
                    <input
                      type="text"
                      className="curriculum-modal__input"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="Contoh: Matematika Diskrit"
                      required
                    />
                  </div>
                  {!classData?.offering && <div className="curriculum-modal__form-group">
                    <label>Kategori Kurikulum</label>
                    <select
                      className="curriculum-modal__select"
                      value={formData.category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                    >
                      <option value="BAHASA">Bahasa & Literasi</option>
                      <option value="SAINTEK">Sains & Teknologi</option>
                      <option value="SOSHUM">Sosial & Humaniora</option>
                    </select>
                  </div>}
                </div>

                {!classData?.offering && <div className="curriculum-modal__form-row">
                  <div className="curriculum-modal__form-group">
                    <label>Level / Tingkat</label>
                    <input
                      type="text"
                      className="curriculum-modal__input"
                      value={formData.level}
                      onChange={(e) => handleFieldChange('level', e.target.value)}
                      placeholder="Contoh: Dasar - Mahir"
                    />
                  </div>
                  <div className="curriculum-modal__form-group">
                    <label>Total Durasi Belajar</label>
                    <input
                      type="text"
                      className="curriculum-modal__input"
                      value={formData.totalDuration}
                      onChange={(e) => handleFieldChange('totalDuration', e.target.value)}
                      placeholder="Contoh: 18 Jam"
                    />
                  </div>
                </div>}

                {!classData?.offering && <div className="curriculum-modal__form-row">
                  <div className="curriculum-modal__form-group">
                    <label>Nama Instruktur / Pengampu</label>
                    <input
                      type="text"
                      className="curriculum-modal__input"
                      value={formData.instructorName}
                      onChange={(e) => handleFieldChange('instructorName', e.target.value)}
                      placeholder="Nama Instruktur"
                    />
                  </div>
                  <div className="curriculum-modal__form-group">
                    <label>Gelar / Keahlian Instruktur</label>
                    <input
                      type="text"
                      className="curriculum-modal__input"
                      value={formData.instructorTitle}
                      onChange={(e) => handleFieldChange('instructorTitle', e.target.value)}
                      placeholder="Contoh: Pakar Algoritma"
                    />
                  </div>
                </div>}

                {classData?.offering && <div className="curriculum-modal__form-group">
                  <label>Capaian Belajar (satu per baris)</label>
                  <textarea rows={4} className="curriculum-modal__textarea" value={formData.learningObjectivesText} onChange={(e) => handleFieldChange('learningObjectivesText', e.target.value)} />
                </div>}

                <div className="curriculum-modal__form-group">
                  <label>{classData?.offering ? 'Deskripsi Template' : 'Deskripsi Mata Pelajaran'}</label>
                  <textarea
                    rows={4}
                    className="curriculum-modal__textarea"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Tuliskan gambaran ringkas materi yang dipelajari di kelas ini..."
                  />
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                    Kelola materi bab dan sub-materi pelajaran untuk tampilan rute <code>/kelas</code>.
                  </p>
                  <button
                    type="button"
                    className="curriculum-btn curriculum-btn--secondary"
                    onClick={handleAddChapter}
                  >
                    ➕ Tambah Bab Materi
                  </button>
                </div>

                {formData.syllabus.map((ch, cIdx) => (
                  <div key={cIdx} className="curriculum-chapter-card">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e40af' }}>
                        Bab #{cIdx + 1}
                      </span>
                      <input
                        type="text"
                        className="curriculum-modal__input"
                        style={{ flex: '1 1 160px', minWidth: 'min(100%, 160px)', fontWeight: 600 }}
                        value={ch.title}
                        onChange={(e) => handleChapterChange(cIdx, 'title', e.target.value)}
                        placeholder="Judul Bab Materi"
                      />
                      <input
                        type="text"
                        className="curriculum-modal__input"
                        style={{ width: '100px' }}
                        aria-label={`Total durasi Bab ${cIdx + 1}`}
                        value={ch.duration}
                        readOnly
                        title="Dijumlahkan dari durasi submateri"
                        placeholder="Otomatis"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(cIdx)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                        title="Hapus Bab"
                      >
                        🗑️
                      </button>
                    </div>

                    <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Sub Materi (Lessons):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddLesson(cIdx)}
                          style={{ fontSize: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 8px', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
                        >
                          + Tambah Sub Materi
                        </button>
                      </div>

                      {(ch.lessons || []).map((les, lIdx) => (
                        <div key={les.id || lIdx} className="curriculum-lesson-item">
                          <input
                            type="text"
                            className="curriculum-modal__input"
                            style={{ flex: '1 1 160px', minWidth: 'min(100%, 160px)' }}
                            value={les.title}
                            onChange={(e) => handleLessonChange(cIdx, lIdx, 'title', e.target.value)}
                            placeholder="Judul Sub Materi"
                          />
                          <select
                            className="curriculum-modal__select"
                            style={{ width: '130px' }}
                            value={les.type || 'interactive'}
                            onChange={(e) => handleLessonChange(cIdx, lIdx, 'type', e.target.value)}
                          >
                            <option value="interactive">Interaktif</option>
                            <option value="video">Video</option>
                            <option value="quiz">Kuis Mini</option>
                            <option value="article">Artikel</option>
                          </select>
                          <input
                            type="text"
                            className="curriculum-modal__input"
                            style={{ width: '90px' }}
                            aria-label={`Durasi submateri ${lIdx + 1} Bab ${cIdx + 1}`}
                            value={les.duration}
                            onChange={(e) => handleLessonChange(cIdx, lIdx, 'duration', e.target.value)}
                            placeholder="Durasi"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(cIdx, lIdx)}
                            style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                            title="Hapus Sub Materi"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="curriculum-modal__footer">
            <button type="button" className="curriculum-btn curriculum-btn--secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="curriculum-btn curriculum-btn--primary">
              Simpan Kurikulum
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurriculumClassEditorModal;
