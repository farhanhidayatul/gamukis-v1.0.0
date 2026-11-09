import { useState, useEffect } from "react";
import TableStructurePreview from './TableStructurePreview';
import {
  createGroundTruthSpec,
  fetchGroundTruthSpecs,
  deleteGroundTruthSpec,
  updateGroundTruthSpec
} from '../../../database/aiQuestionGeneratorApi';
import './MultimodalReferenceUploader.css';

const DEFAULT_COLUMNS = ['Pernyataan', 'Benar', 'Salah'];
const DEFAULT_ROWS = [
  { statement: 'Pernyataan 1 contoh...', expectedKey: 'Benar' },
  { statement: 'Pernyataan 2 contoh...', expectedKey: 'Salah' }
];

const MultimodalReferenceUploader = ({
  onSpecSaved = () => {},
  subjectKey = 'semua_pelajaran',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Penalaran Umum');
  const [modalityType, setModalityType] = useState('table_matrix');
  const [referenceText, setReferenceText] = useState('');
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState(null);

  // Table structure state
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(DEFAULT_ROWS);

  // Specs library list
  const [specs, setSpecs] = useState([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const loadSpecs = async () => {
    setIsLoadingSpecs(true);
    try {
      const res = await fetchGroundTruthSpecs({ subjectKey, page: 1, pageSize: 50 });
      setSpecs(res?.specs || []);
    } catch (_) {
      // ignore
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSpecs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subjectKey]);

  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      setStatusMessage({ text: 'File harus berupa gambar (PNG, JPG, WebP).', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ text: 'Ukuran foto maksimal 5 MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
      setStatusMessage({ text: `Foto "${file.name || 'screenshot'}" berhasil dimuat!`, type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleAddRow = () => {
    setRows([...rows, { statement: '', expectedKey: columns[1] || '' }]);
  };

  const handleDeleteRow = (index) => {
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, updatedRow) => {
    const newRows = [...rows];
    newRows[index] = updatedRow;
    setRows(newRows);
  };

  const handleAddColumn = () => {
    const newColName = `Opsi ${columns.length}`;
    setColumns([...columns, newColName]);
  };

  const handleDeleteColumn = (colIdx) => {
    if (columns.length <= 2) return;
    const removedCol = columns[colIdx];
    const newCols = columns.filter((_, idx) => idx !== colIdx);
    setColumns(newCols);
    // Reset expected keys matching removed column
    setRows(
      rows.map((r) => (r.expectedKey === removedCol ? { ...r, expectedKey: newCols[1] || '' } : r))
    );
  };

  const handleColumnChange = (colIdx, val) => {
    const oldName = columns[colIdx];
    const newCols = [...columns];
    newCols[colIdx] = val;
    setColumns(newCols);
    // Update matching keys in rows
    setRows(
      rows.map((r) => (r.expectedKey === oldName ? { ...r, expectedKey: val } : r))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setStatusMessage({ text: 'Judul spesifikasi minimal 3 karakter.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const payload = {
        title: title.trim(),
        subjectKey,
        category,
        modalityType,
        referenceText: referenceText.trim(),
        referenceImageBase64: imageBase64 || null,
        tableStructure: modalityType === 'table_matrix' || modalityType === 'hybrid'
          ? { columns, rows }
          : { columns: [], rows: [] },
        notes: notes.trim()
      };

      let res;
      if (editingSpecId) {
        res = await updateGroundTruthSpec(editingSpecId, payload);
        setStatusMessage({ text: 'Model referensi berhasil diperbarui!', type: 'success' });
        setEditingSpecId(null);
      } else {
        res = await createGroundTruthSpec(payload);
        setStatusMessage({ text: 'Model referensi berhasil disimpan ke basis data AI!', type: 'success' });
      }
      // Reset form
      setTitle('');
      setReferenceText('');
      setNotes('');
      handleClearImage();
      loadSpecs();
      if (onSpecSaved) onSpecSaved(res?.spec);
    } catch (err) {
      setStatusMessage({ text: err.message || 'Gagal menyimpan model referensi.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingSpecId(item.specId);
    setTitle(item.title || '');
    setCategory(item.category || 'Penalaran Umum');
    setModalityType(item.modalityType || 'table_matrix');
    setReferenceText(item.referenceText || '');
    setNotes(item.trainingNotes || item.notes || '');
    const existingImg = item.referenceImageBase64 || item.referenceImageUrl || item.referenceImagePath;
    if (existingImg) {
      setImagePreview(existingImg);
      setImageBase64(item.referenceImageBase64 || existingImg);
    } else {
      setImagePreview(null);
      setImageBase64(null);
    }
    if (item.tableStructure?.columns && item.tableStructure?.rows) {
      setColumns([...item.tableStructure.columns]);
      setRows(item.tableStructure.rows.map((r) => ({ ...r })));
    }
    setStatusMessage({ text: `Mode Edit: Mengedit spesifikasi "${item.title}".`, type: 'info' });
  };

  const handleCancelEdit = () => {
    setEditingSpecId(null);
    setTitle('');
    setReferenceText('');
    setNotes('');
    handleClearImage();
    setColumns(DEFAULT_COLUMNS);
    setRows(DEFAULT_ROWS);
    setStatusMessage({ text: '', type: '' });
  };

  const handleDeleteSpec = async (specId) => {
    if (!window.confirm('Hapus model referensi latihan ini?')) return;
    try {
      await deleteGroundTruthSpec(specId);
      loadSpecs();
    } catch (err) {
      alert(err.message || 'Gagal menghapus model referensi.');
    }
  };

  return (
    <div className={`multimodal-reference-uploader-root ${className}`}>
      <div className="multimodal-reference-header">
        <div className="header-meta">
          <span className="header-icon" aria-hidden="true">🧠</span>
          <div>
            <h3>Dataset Review & Pelatihan Ground-Truth Multimodal AI</h3>
            <p>
              Sinkronisasi acuan data antara Admin dan AI Agent: unggah foto/screenshot, teks wacana, dan cetak biru struktur tabel.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="toggle-uploader-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Tutup Panel Pelatihan ▲' : 'Buka Pelatihan & Ground-Truth ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="multimodal-reference-body">
          <form onSubmit={handleSave} className="reference-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="spec-title">Judul Acuan / Deskripsi Model *</label>
                <input
                  id="spec-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Format Tabel Benar/Salah UTBK Penalaran Umum 2024"
                  required
                />
              </div>

              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label htmlFor="spec-category">Kategori / Subtes</label>
                  <select
                    id="spec-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Penalaran Umum">Penalaran Umum</option>
                    <option value="Pengetahuan Kuantitatif">Pengetahuan Kuantitatif</option>
                    <option value="Pemahaman Bacaan dan Menulis">Pemahaman Bacaan dan Menulis</option>
                    <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                    <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                    <option value="Penalaran Matematika">Penalaran Matematika</option>
                    <option value="Umum">Umum / Lainnya</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="spec-modality">Tipe Modalitas (Ground Truth)</label>
                  <select
                    id="spec-modality"
                    value={modalityType}
                    onChange={(e) => setModalityType(e.target.value)}
                  >
                    <option value="table_matrix">Tabel / Matriks (Pernyataan & Kunci)</option>
                    <option value="hybrid">Hibrida (Foto + Tabel + Teks)</option>
                    <option value="image">Visual / Foto Soal Bergambar</option>
                    <option value="text">Teks Wacana & Pilihan Ganda</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="spec-text">Teks Acuan / Stimulus Soal</label>
                <textarea
                  id="spec-text"
                  rows={3}
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder="Ketik atau tempel teks wacana atau pertanyaan stimulus yang seharusnya..."
                />
              </div>

              {/* Multimodal Photo/Screenshot Uploader with Drag & Drop and Paste Support */}
              <div className="form-group">
                <label>Foto / Screenshot Referensi (Struktur Asli Soal)</label>
                <div
                  className={`photo-upload-dropzone ${isDragging ? 'photo-upload-dropzone--dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                  tabIndex={0}
                  role="region"
                  aria-label="Area Unggah Drag and Drop Foto Soal"
                >
                  {imagePreview ? (
                    <div className="photo-preview-box">
                      <img src={imagePreview} alt="Pratinjau Referensi" className="photo-thumb" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={handleClearImage}
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-label">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageChange}
                        className="photo-file-input"
                      />
                      <span className="photo-icon" aria-hidden="true">
                        {isDragging ? '📥' : '🖼️'}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: isDragging ? '#2563eb' : '#1e293b' }}>
                        {isDragging ? 'Lepaskan Foto Di Sini!' : 'Seret & Letakkan (Drag & Drop) Foto di Sini'}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        atau klik untuk memilih file dari komputer
                      </span>
                      <small style={{ color: '#94a3b8', marginTop: '4px' }}>
                        Mendukung Drag-and-Drop, Klik File, atau Tempel (Ctrl + V) Screenshot Snipping Tool (Maks 5MB)
                      </small>
                    </label>
                  )}
                </div>
              </div>

              {/* Table Structure Model Builder */}
              {(modalityType === 'table_matrix' || modalityType === 'hybrid') && (
                <div className="table-builder-section">
                  <TableStructurePreview
                    columns={columns}
                    rows={rows}
                    readOnly={false}
                    onRowChange={handleRowChange}
                    onAddRow={handleAddRow}
                    onDeleteRow={handleDeleteRow}
                    onAddColumn={handleAddColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onColumnChange={handleColumnChange}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="spec-notes">Catatan & Arahan Pelatihan untuk Agent</label>
                <input
                  id="spec-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Deteksi batas tabel 3 baris dengan pilihan Benar/Salah, abaikan nomor halaman."
                />
              </div>

              {statusMessage.text && (
                <div className={`status-alert ${statusMessage.type}`}>
                  {statusMessage.text}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="save-spec-btn"
                >
                  {isSaving ? 'Menyimpan Acuan...' : editingSpecId ? '💾 Perbarui Model Latihan' : '💾 Simpan Model Ground-Truth'}
                </button>
                {editingSpecId && (
                  <button
                    type="button"
                    className="btn-cancel-edit-spec"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Stored Specs Library List */}
          <div className="specs-library-section">
            <h4>Koleksi Model Ground-Truth Tersimpan ({specs.length})</h4>
            {isLoadingSpecs ? (
              <p className="loading-specs">Memuat model tersimpan...</p>
            ) : specs.length === 0 ? (
              <p className="empty-specs">Belum ada model acuan yang disimpan.</p>
            ) : (
              <div className="specs-grid">
                {specs.map((item) => (
                  <div key={item.specId || item._id} className="spec-card">
                    <div className="spec-card-header">
                      <div>
                        <strong>{item.title}</strong>
                        <span className="spec-badge">{item.modalityType}</span>
                      </div>
                      <div className="spec-card-actions">
                        <button
                          type="button"
                          className="btn-edit-spec"
                          title="Edit Model"
                          onClick={() => handleStartEdit(item)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn-del-spec"
                          title="Hapus Model"
                          onClick={() => handleDeleteSpec(item.specId)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {item.referenceImageBase64 && (
                      <div className="spec-card-image">
                        <img src={item.referenceImageBase64} alt={item.title} />
                      </div>
                    )}

                    {item.tableStructure?.rows?.length > 0 && (
                      <div className="spec-card-table">
                        <TableStructurePreview
                          columns={item.tableStructure.columns}
                          rows={item.tableStructure.rows}
                          readOnly={true}
                        />
                      </div>
                    )}

                    {item.notes && <p className="spec-card-notes">📝 {item.notes}</p>}
                    <small className="spec-card-date">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimodalReferenceUploader;
