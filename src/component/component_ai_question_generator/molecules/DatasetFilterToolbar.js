import './DatasetFilterToolbar.css';

const MODALITY_OPTIONS = [
  { id: 'all', label: 'Semua Modality', icon: '🌐' },
  { id: 'single_choice', label: 'Pilihan Ganda', icon: '🔘', type: 'interaction' },
  { id: 'matrix_drag_drop', label: 'Matriks Tabel', icon: '📊', type: 'interaction' },
  { id: 'reading_passage', label: 'Wacana / Cerita', icon: '📖', type: 'stimulus' },
  { id: 'image', label: 'Soal Bergambar', icon: '🖼️', type: 'hasImage' }
];

const QUALITY_TIERS = [
  { id: 'all', label: 'Semua Kualitas' },
  { id: 'verified', label: '✓ Lolos Quality Guard (≥85%)' },
  { id: 'anomaly', label: '⚠️ Terindikasi Anomali' }
];

const DatasetFilterToolbar = ({
  filters = {
    modality: 'all',
    category: 'all',
    qualityTier: 'all',
    search: ''
  },
  categories = [],
  totalCount = 0,
  filteredCount = 0,
  onFilterChange = () => {},
  onResetFilters = () => {}
}) => {
  const handleModalityClick = (opt) => {
    onFilterChange({ ...filters, modality: opt.id });
  };

  const handleCategoryChange = (e) => {
    onFilterChange({ ...filters, category: e.target.value });
  };

  const handleQualityChange = (e) => {
    onFilterChange({ ...filters, qualityTier: e.target.value });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const hasActiveFilter =
    filters.modality !== 'all' ||
    filters.category !== 'all' ||
    filters.qualityTier !== 'all' ||
    Boolean(filters.search?.trim());

  return (
    <div className="dataset-filter-toolbar-root" data-testid="dataset-filter-toolbar">
      <div className="dataset-filter-row-top">
        <div className="dataset-filter-pills" role="tablist" aria-label="Filter Modality Soal">
          {MODALITY_OPTIONS.map((opt) => {
            const isActive = filters.modality === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`dataset-filter-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => handleModalityClick(opt)}
                role="tab"
                aria-selected={isActive}
              >
                <span className="pill-icon">{opt.icon}</span>
                <span className="pill-text">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            className="dataset-filter-reset-btn"
            onClick={onResetFilters}
            title="Reset semua filter ke default"
          >
            ↺ Reset Filter
          </button>
        )}
      </div>

      <div className="dataset-filter-row-bottom">
        <div className="filter-input-group filter-search-group">
          <input
            type="search"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Cari teks pertanyaan, kata kunci, atau wacana..."
            className="dataset-search-input"
            aria-label="Cari soal"
          />
        </div>

        {categories.length > 0 && (
          <div className="filter-input-group">
            <select
              value={filters.category || 'all'}
              onChange={handleCategoryChange}
              className="dataset-filter-select"
              aria-label="Pilih Subtes / Kategori"
            >
              <option value="all">Semua Subtes ({categories.length})</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-input-group">
          <select
            value={filters.qualityTier || 'all'}
            onChange={handleQualityChange}
            className="dataset-filter-select"
            aria-label="Filter Kualitas"
          >
            {QUALITY_TIERS.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dataset-filter-counter">
          <span>
            Menampilkan <strong>{filteredCount}</strong> dari {totalCount} soal
          </span>
        </div>
      </div>
    </div>
  );
};

export default DatasetFilterToolbar;
