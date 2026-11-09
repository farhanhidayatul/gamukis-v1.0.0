import { useState, useEffect, useMemo, useCallback } from "react";
import CurriculumBadge from './atoms/CurriculumBadge';
import CurriculumClassEditorModal from './molecules/CurriculumClassEditorModal';
import CurriculumQuizEditor from './molecules/CurriculumQuizEditor';
import {
  fetchAdminCurriculumClasses,
  createAdminCurriculumClass,
  updateAdminCurriculumClass,
  deleteAdminCurriculumClass,
  createAdminCurriculumOffering,
  fetchAdminCurriculumOfferingDetail,
  updateAdminCurriculumOfferingTemplate
} from '../../database/adminCurriculumApi';
import './AdminCurriculumPanel.css';

const formatOfferingGrade = (offering) => (
  offering.educationStage === 'KULIAH' ? offering.schoolGrade : `Kelas ${offering.schoolGrade}`
);

const AdminCurriculumPanel = () => {
  const [classes, setClasses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [editingClass, setEditingClass] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [managingQuizClass, setManagingQuizClass] = useState(null);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [isOfferingFormOpen, setIsOfferingFormOpen] = useState(false);
  const [offeringSubjectId, setOfferingSubjectId] = useState('');
  const [subjectActionId, setSubjectActionId] = useState('');
  const [offeringStage, setOfferingStage] = useState('SMA');
  const [offeringGrade, setOfferingGrade] = useState('10');

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchAdminCurriculumClasses(categoryFilter === 'ALL' ? null : categoryFilter);
      setClasses(data);
      setSubjectActionId((currentId) => (data.some((subject) => subject.id === currentId) ? currentId : (data[0]?.id || '')));
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat kurikulum kelas.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredItems = useMemo(() => {
    const items = classes.flatMap((subject) => {
      const offerings = Array.isArray(subject.offerings) ? subject.offerings : [];
      return offerings.length > 0
        ? offerings.map((offering) => ({ subject, offering }))
        : [{ subject, offering: null }];
    });

    return items.filter(({ subject, offering }) => {
      if (stageFilter !== 'ALL' && offering?.educationStage !== stageFilter) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const searchableFields = [
        subject.title,
        subject.description,
        subject.category,
        offering?.title,
        offering?.description,
        offering?.educationStage,
        offering?.schoolGrade
      ];
      return searchableFields.some((field) => String(field || '').toLowerCase().includes(query));
    });
  }, [classes, searchQuery, stageFilter]);
  const selectedSubject = classes.find((subject) => subject.id === subjectActionId) || null;

  const handleOpenCreate = () => {
    // Mode tambah mapel/kelas baru lengkap
    setEditingClass(null);
    setIsEditorOpen(true);
  };

  const handleOpenOfferingCreate = () => {
    setOfferingSubjectId(classes[0]?.id || '');
    setIsOfferingFormOpen(true);
  };

  const handleCreateOffering = async (event) => {
    event.preventDefault();
    try {
      await createAdminCurriculumOffering(offeringSubjectId, { educationStage: offeringStage, schoolGrade: offeringGrade });
      setStatusMessage(`Kelas ${offeringGrade} ${offeringStage} berhasil dibuat.`);
      setIsOfferingFormOpen(false);
      await loadClasses();
    } catch (err) { setErrorMessage(err.message || 'Gagal membuat kelas.'); }
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setIsEditorOpen(true);
  };

  const handleOpenOfferingTemplate = async (cls, offering) => {
    try {
      const detail = await fetchAdminCurriculumOfferingDetail(cls.id, offering.id);
      setEditingClass(detail || { ...cls, offering });
      setIsEditorOpen(true);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat template kelas.');
    }
  };

  const handleSaveClass = async (payload) => {
    try {
      if (editingClass?.id) {
        if (editingClass.offering?.id) {
          await updateAdminCurriculumOfferingTemplate(editingClass.id, editingClass.offering.id, payload);
          setStatusMessage(`Template ${editingClass.offering.educationStage} ${editingClass.offering.schoolGrade} berhasil diperbarui.`);
        } else {
          await updateAdminCurriculumClass(editingClass.id, payload);
          setStatusMessage(`Mata pelajaran '${payload.title}' berhasil diperbarui!`);
        }
      } else {
        await createAdminCurriculumClass(payload);
        setStatusMessage(`Mata pelajaran '${payload.title}' berhasil ditambahkan!`);
      }
      setIsEditorOpen(false);
      setEditingClass(null);
      loadClasses();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan mata pelajaran.');
    }
  };

  const handleDeleteClass = async (cls) => {
    if (!window.confirm(`Yakin ingin menghapus mata pelajaran '${cls.title}' beserta seluruh jenjang, bab, dan soal kuisnya?`)) {
      return;
    }
    try {
      await deleteAdminCurriculumClass(cls.id);
      setStatusMessage(`Mata pelajaran '${cls.title}' berhasil dihapus.`);
      loadClasses();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghapus mata pelajaran.');
    }
  };

  const handleOpenOfferingQuizManager = async (cls, offering) => {
    try {
      const detail = await fetchAdminCurriculumOfferingDetail(cls.id, offering.id);
      setManagingQuizClass(detail || { ...cls, offering });
      setIsQuizEditorOpen(true);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat soal kuis kelas yang dipilih.');
    }
  };

  const refreshQuizManager = useCallback(async () => {
    await loadClasses();
    if (!managingQuizClass?.id) return;
    try {
      if (managingQuizClass.offering?.id) {
        const detail = await fetchAdminCurriculumOfferingDetail(managingQuizClass.id, managingQuizClass.offering.id);
        if (detail) setManagingQuizClass(detail);
        return;
      }
      const data = await fetchAdminCurriculumClasses(categoryFilter === 'ALL' ? null : categoryFilter);
      const refreshed = data.find((subject) => subject.id === managingQuizClass.id);
      if (refreshed) setManagingQuizClass(refreshed);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui data soal kuis.');
    }
  }, [categoryFilter, loadClasses, managingQuizClass]);

  return (
    <section className="admin-curriculum-panel" aria-label="Manajemen Kurikulum Kelas Siswa">
      {statusMessage && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', border: '1px solid #86efac', fontWeight: 600 }}>
          ✅ {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5', fontWeight: 600 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="admin-curriculum-toolbar">
        <div className="admin-curriculum-pills">
          {['ALL', 'SD', 'SMP', 'SMA', 'KULIAH'].map((stage) => (
            <button key={stage} type="button" className={`curriculum-pill admin-curriculum-pill ${stageFilter === stage ? 'active' : ''}`} onClick={() => setStageFilter(stage)}>
              {stage === 'ALL' ? 'Semua Jenjang' : stage}
            </button>
          ))}
        </div>
        <div className="admin-curriculum-pills">
          {['ALL', 'BAHASA', 'SAINTEK', 'SOSHUM'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`curriculum-pill admin-curriculum-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat === 'BAHASA' ? 'Bahasa' : cat === 'SAINTEK' ? 'Sains & Teknologi' : 'Sosial Humaniora'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 240px', justifyContent: 'flex-end' }}>
          <input
            type="text"
            className="curriculum-modal__input"
            style={{ width: '220px', flex: '1 1 180px', minWidth: 'min(100%, 180px)', maxWidth: '100%' }}
            placeholder="Cari mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className="curriculum-btn curriculum-btn--secondary"
            onClick={handleOpenOfferingCreate}
            title="Tambah tingkatan kelas pada mata pelajaran yang sudah ada"
          >
            + Jenjang Kelas
          </button>
          <button
            type="button"
            className="curriculum-btn curriculum-btn--primary"
            onClick={handleOpenCreate}
            title="Tambah mata pelajaran dan kelas baru"
          >
            + Tambah Mapel/Kelas Baru
          </button>
        </div>
      </div>

      {classes.length > 0 && <div className="admin-curriculum-subject-actions">
        <label htmlFor="admin-curriculum-subject-actions">Aksi Mata Pelajaran</label>
        <select id="admin-curriculum-subject-actions" value={subjectActionId} onChange={(event) => setSubjectActionId(event.target.value)} style={{ maxWidth: '100%' }}>
          {classes.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
        </select>
        <button type="button" className="curriculum-btn curriculum-btn--secondary" disabled={!selectedSubject} onClick={() => selectedSubject && handleOpenEdit(selectedSubject)}>Edit Mapel</button>
        <button type="button" className="curriculum-btn curriculum-btn--danger" disabled={!selectedSubject} onClick={() => selectedSubject && handleDeleteClass(selectedSubject)}>Hapus Mapel</button>
      </div>}

      {isOfferingFormOpen && <form onSubmit={handleCreateOffering} className="admin-curriculum-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>Mata Pelajaran <select required value={offeringSubjectId} onChange={(e) => setOfferingSubjectId(e.target.value)} style={{ maxWidth: '100%' }}>{classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>Jenjang <select value={offeringStage} onChange={(e) => { const stage=e.target.value; setOfferingStage(stage); setOfferingGrade(stage==='SD'?'1':stage==='SMP'?'7':stage==='SMA'?'10':'Semester 1'); }} style={{ maxWidth: '100%' }}><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="KULIAH">Kuliah</option></select></label>
        <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>{offeringStage==='KULIAH'?'Semester':'Kelas'} <select value={offeringGrade} onChange={(e)=>setOfferingGrade(e.target.value)} style={{ maxWidth: '100%' }}>{(offeringStage==='SD'?['1','2','3','4','5','6']:offeringStage==='SMP'?['7','8','9']:offeringStage==='SMA'?['10','11','12']:['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8']).map(g=><option key={g} value={g}>{offeringStage==='KULIAH'?g:`Kelas ${g}`}</option>)}</select></label>
        <button type="submit" className="curriculum-btn curriculum-btn--primary">Simpan Kelas</button><button type="button" className="curriculum-btn" onClick={()=>setIsOfferingFormOpen(false)}>Batal</button>
      </form>}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mut, #767676)' }}>
          Sedang memuat data kurikulum kelas...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg, #f8fafc)', borderRadius: '12px', border: '1px dashed var(--line, #cbd5e1)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink, #333333)' }}>
            Tidak ada item kurikulum yang cocok dengan filter atau pencarian.
          </p>
        </div>
      ) : (
        <div className="admin-curriculum-grid">
          {filteredItems.map(({ subject, offering }) => {
            const syllabusCount = offering ? Number(offering.syllabusCount || 0) : (subject.syllabus || []).length;
            const lessonsCount = offering
              ? Number(offering.lessonCount || 0)
              : Array.isArray(subject.syllabus)
                ? subject.syllabus.reduce((count, chapter) => count + (Array.isArray(chapter.lessons) ? chapter.lessons.length : 0), 0)
              : 0;
            const quizCount = offering ? Number(offering.questionCount || 0) : (subject.miniQuiz || []).length;

            return (
              <div key={`${subject.id}:${offering?.id || 'legacy'}`} className="admin-curriculum-card">
                <div>
                  <div className="admin-curriculum-card__top">
                    <CurriculumBadge type="category" value={subject.category} />
                    {offering ? (
                      <span className="admin-curriculum-card__grade">{offering.educationStage} · {formatOfferingGrade(offering)}</span>
                    ) : (
                      <span className="admin-curriculum-card__grade">Data lama</span>
                    )}
                  </div>
                  <h3 className="admin-curriculum-card__title">{subject.title}</h3>
                  <p className="admin-curriculum-card__desc">
                    {(offering?.description || subject.description) || 'Belum ada deskripsi mata pelajaran.'}
                  </p>
                  {offering && <p className={`admin-curriculum-card__status ${offering.contentStatus === 'approved' ? 'is-approved' : 'is-draft'}`}>
                    {offering.contentStatus === 'approved' ? 'Disetujui' : 'Draf · perlu ditinjau'}
                  </p>}
                  <div className="admin-curriculum-card__stats">
                    <span><strong>{syllabusCount}</strong> Bab</span>
                    <span><strong>{lessonsCount}</strong> Sub-Materi</span>
                    <span><strong>{quizCount}</strong> Soal Kuis</span>
                  </div>
                </div>

                <div className="admin-curriculum-card__actions">
                  {offering ? (
                    <>
                      <button
                        type="button"
                        className="curriculum-btn curriculum-btn--secondary"
                        onClick={() => handleOpenOfferingTemplate(subject, offering)}
                        aria-label={`Edit template ${subject.title} ${offering.educationStage} ${formatOfferingGrade(offering)}`}
                      >
                        Edit Materi
                      </button>
                      <button
                        type="button"
                        className="curriculum-btn curriculum-btn--action"
                        onClick={() => handleOpenOfferingQuizManager(subject, offering)}
                        aria-label={`Kelola soal ${subject.title} ${offering.educationStage} ${formatOfferingGrade(offering)}`}
                      >
                        Soal & AI ({quizCount})
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="curriculum-btn curriculum-btn--secondary" onClick={() => handleOpenEdit(subject)} title="Ubah metadata mata pelajaran">
                        Edit Mapel
                      </button>
                      <button type="button" className="curriculum-btn curriculum-btn--action" onClick={() => { setManagingQuizClass(subject); setIsQuizEditorOpen(true); }} title="Kelola soal kuis & impor dari AI Soal">
                        Soal & AI ({quizCount})
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isEditorOpen && (
        <CurriculumClassEditorModal
          isOpen={isEditorOpen}
          classData={editingClass}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveClass}
        />
      )}

      {isQuizEditorOpen && (
        <CurriculumQuizEditor
          isOpen={isQuizEditorOpen}
          classData={managingQuizClass}
          onClose={() => setIsQuizEditorOpen(false)}
          onRefresh={refreshQuizManager}
        />
      )}
    </section>
  );
};

export default AdminCurriculumPanel;
