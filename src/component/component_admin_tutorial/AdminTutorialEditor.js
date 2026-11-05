import React, { useState, useEffect } from 'react';
import {
  fetchAdminTutorialContent,
  updateAdminTutorialContent,
  resetAdminTutorialContent
} from '../../database/adminTutorialApi';
import { FiBookOpen, FiSave, FiRotateCcw, FiChevronDown, FiChevronUp, FiImage, FiCheckCircle } from 'react-icons/fi';
import './AdminTutorialEditor.css';

const AdminTutorialEditor = () => {
  const [content, setContent] = useState(null);
  const [activeAudience, setActiveAudience] = useState('siswa');
  const [openStepIndex, setOpenStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadContent = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetchAdminTutorialContent();
      setContent(res.data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memuat konten tutorial.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleModeIntroChange = (val) => {
    setContent((prev) => ({
      ...prev,
      modes: {
        ...prev.modes,
        [activeAudience]: {
          ...prev.modes[activeAudience],
          intro: val
        }
      }
    }));
  };

  const handleStepChange = (index, field, val) => {
    setContent((prev) => {
      const currentSteps = [...(prev.modes[activeAudience]?.steps || [])];
      currentSteps[index] = {
        ...currentSteps[index],
        [field]: val
      };
      return {
        ...prev,
        modes: {
          ...prev.modes,
          [activeAudience]: {
            ...prev.modes[activeAudience],
            steps: currentSteps
          }
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await updateAdminTutorialContent(content);
      setStatusMessage({ type: 'success', text: res.message || 'Konten tutorial berhasil disimpan!' });
      setContent(res.data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menyimpan tutorial.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Yakin ingin mereset konten tutorial kembali ke teks standar awal?')) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await resetAdminTutorialContent();
      setStatusMessage({ type: 'success', text: res.message || 'Konten tutorial direset ke default.' });
      setContent(res.data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mereset tutorial.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-tutorial-editor-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Memuat editor konten tutorial...</p>
      </div>
    );
  }

  const currentMode = content?.modes?.[activeAudience] || { label: '', intro: '', steps: [] };

  return (
    <div className="admin-tutorial-editor-container">
      <div className="admin-tutorial-toolbar">
        <div className="admin-tutorial-modes">
          <button
            type="button"
            className={`admin-tutorial-mode-btn ${activeAudience === 'siswa' ? 'is-active' : ''}`}
            onClick={() => { setActiveAudience('siswa'); setOpenStepIndex(0); }}
          >
            <FiBookOpen /> Alur Siswa
          </button>
          <button
            type="button"
            className={`admin-tutorial-mode-btn ${activeAudience === 'guru' ? 'is-active' : ''}`}
            onClick={() => { setActiveAudience('guru'); setOpenStepIndex(0); }}
          >
            <FiBookOpen /> Alur Guru
          </button>
        </div>

        <div className="admin-tutorial-actions">
          <button
            type="button"
            className="admin-tutorial-btn-reset"
            onClick={handleReset}
            disabled={saving}
          >
            <FiRotateCcw /> Reset ke Default
          </button>
          <button
            type="button"
            className="admin-tutorial-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            <FiSave /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`admin-tutorial-status-msg ${statusMessage.type}`}>
          {statusMessage.type === 'success' && <FiCheckCircle style={{ marginRight: '6px' }} />}
          {statusMessage.text}
        </div>
      )}

      <div className="admin-tutorial-card">
        <h3 className="admin-tutorial-section-title">
          Pengantar {currentMode.label || activeAudience}
        </h3>
        <div className="admin-tutorial-field-group">
          <label>Teks Ringkasan / Intro Header</label>
          <textarea
            rows={2}
            className="admin-tutorial-textarea"
            value={currentMode.intro || ''}
            onChange={(e) => handleModeIntroChange(e.target.value)}
            placeholder="Masukkan pengantar alur tutorial..."
          />
        </div>
      </div>

      <div className="admin-tutorial-card">
        <h3 className="admin-tutorial-section-title">
          Daftar Langkah & Aset Visual ({currentMode.steps?.length || 0} Langkah)
        </h3>

        <div className="admin-tutorial-step-list">
          {(currentMode.steps || []).map((step, idx) => {
            const isOpen = openStepIndex === idx;
            return (
              <div
                key={step.id || idx}
                className={`admin-tutorial-step-accordion ${isOpen ? 'is-open' : ''}`}
              >
                <div
                  className="admin-tutorial-step-header"
                  onClick={() => setOpenStepIndex(isOpen ? -1 : idx)}
                >
                  <div className="admin-tutorial-step-title-wrap">
                    <span className="admin-tutorial-badge-pill">{step.stepLabel || `Langkah ${idx + 1}`}</span>
                    <strong>{step.title || 'Langkah Tanpa Judul'}</strong>
                  </div>
                  <div>
                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>

                {isOpen && (
                  <div className="admin-tutorial-step-body">
                    <div className="admin-tutorial-field-group">
                      <label>Label Badge / Kicker</label>
                      <input
                        type="text"
                        className="admin-tutorial-input"
                        value={step.badgeLabel || ''}
                        onChange={(e) => handleStepChange(idx, 'badgeLabel', e.target.value)}
                      />
                    </div>

                    <div className="admin-tutorial-field-group">
                      <label>Judul Langkah</label>
                      <input
                        type="text"
                        className="admin-tutorial-input"
                        value={step.title || ''}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      />
                    </div>

                    <div className="admin-tutorial-field-group admin-tutorial-span-full">
                      <label>Deskripsi Panduan Detail</label>
                      <textarea
                        rows={3}
                        className="admin-tutorial-textarea"
                        value={step.description || ''}
                        onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                      />
                    </div>

                    <div className="admin-tutorial-field-group">
                      <label>Teks Tombol Aksi</label>
                      <input
                        type="text"
                        className="admin-tutorial-input"
                        value={step.actionLabel || ''}
                        onChange={(e) => handleStepChange(idx, 'actionLabel', e.target.value)}
                      />
                    </div>

                    <div className="admin-tutorial-field-group">
                      <label>Rute Tujuan (URL Path)</label>
                      <input
                        type="text"
                        className="admin-tutorial-input"
                        value={step.to || ''}
                        onChange={(e) => handleStepChange(idx, 'to', e.target.value)}
                        placeholder="/home atau /gamePage"
                      />
                    </div>

                    <div className="admin-tutorial-field-group admin-tutorial-span-full">
                      <label>Path Aset Gambar / Mockup Visual</label>
                      <input
                        type="text"
                        className="admin-tutorial-input"
                        value={step.imagePath || ''}
                        onChange={(e) => handleStepChange(idx, 'imagePath', e.target.value)}
                        placeholder="/images/asset_game/tutorial/example.png atau https://..."
                      />
                      {step.imagePath && (
                        <div className="admin-tutorial-asset-preview">
                          <FiImage />
                          <span>Path aktif: <strong>{step.imagePath}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminTutorialEditor;
