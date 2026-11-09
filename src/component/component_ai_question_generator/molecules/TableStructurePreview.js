import './TableStructurePreview.css';

const TableStructurePreview = ({
  columns = ['Pernyataan', 'Benar', 'Salah'],
  rows = [],
  matrixData = null,
  readOnly = true,
  isEditable = false,
  onRowChange = null,
  onDeleteRow = null,
  onAddRow = null,
  onColumnChange = null,
  onAddColumn = null,
  onDeleteColumn = null,
  className = ''
}) => {
  const effectiveReadOnly = isEditable ? false : readOnly;
  const resolvedColumns = (() => {
    if (matrixData && Array.isArray(matrixData.columns) && matrixData.columns.length > 0) {
      const normalized = matrixData.columns.map((c) => (typeof c === 'string' ? c : c?.label || c?.key || ''));
      return normalized[0]?.toLowerCase() === 'pernyataan' ? normalized : ['Pernyataan', ...normalized];
    }
    return Array.isArray(columns) && columns.length > 0 ? columns : ['Pernyataan', 'Benar', 'Salah'];
  })();
  const safeColumns = resolvedColumns;

  const safeRows = (() => {
    const rawRows = matrixData && Array.isArray(matrixData.statements || matrixData.rows)
      ? (matrixData.statements || matrixData.rows)
      : (Array.isArray(rows) ? rows : []);
    return rawRows.map((row) => {
      if (typeof row === 'string') return { statement: row, expectedKey: '' };
      const statement = row?.statement ?? row?.text ?? '';
      let expectedKey = row?.expectedKey ?? row?.correctCategory ?? '';
      if (!expectedKey && typeof row?.categoryIndex === 'number') {
        const optionCols = safeColumns.slice(1);
        expectedKey = optionCols[row.categoryIndex] || '';
      }
      if (expectedKey && matrixData && Array.isArray(matrixData.columns)) {
        const matchedCol = matrixData.columns.find((c) => typeof c === 'object' && c.key === expectedKey);
        if (matchedCol && matchedCol.label) expectedKey = matchedCol.label;
      }
      return { ...row, statement, expectedKey };
    });
  })();

  const handleInternalRowChange = (rIdx, updatedRow) => {
    if (!onRowChange) return;
    if (matrixData && onRowChange.length <= 1) {
      const nextRows = safeRows.map((r, idx) => (idx === rIdx ? { ...r, ...updatedRow } : r));
      onRowChange(nextRows);
    } else {
      onRowChange(rIdx, updatedRow);
    }
  };

  const handleInternalAddRow = () => {
    if (onAddRow) {
      onAddRow();
    } else if (matrixData && onRowChange && onRowChange.length <= 1) {
      const defaultKey = safeColumns[1] || 'Benar';
      onRowChange([...safeRows, { statement: `Pernyataan ${safeRows.length + 1}`, expectedKey: defaultKey }]);
    }
  };

  const handleInternalDeleteRow = (rIdx) => {
    if (onDeleteRow) {
      onDeleteRow(rIdx);
    } else if (matrixData && onRowChange && onRowChange.length <= 1) {
      onRowChange(safeRows.filter((_, idx) => idx !== rIdx));
    }
  };

  const handleInternalColumnChange = (cIdx, newValue) => {
    if (!onColumnChange) return;
    if (matrixData && onColumnChange.length <= 1) {
      const nextOptionCols = safeColumns.slice(1).map((c, i) => (i === cIdx - 1 ? newValue : c));
      onColumnChange(nextOptionCols);
    } else {
      onColumnChange(cIdx, newValue);
    }
  };

  const canAddRow = !effectiveReadOnly && (Boolean(onAddRow) || Boolean(matrixData && onRowChange));
  const canDeleteRow = !effectiveReadOnly && (Boolean(onDeleteRow) || Boolean(matrixData && onRowChange));

  return (
    <div className={`table-structure-preview-container ${className}`}>
      <div className="table-structure-header-actions">
        <div className="table-structure-title">
          <span className="table-structure-icon" aria-hidden="true">📊</span>
          <strong>Pratinjau Model Struktur Tabel</strong>
          <span className="table-structure-dimension-chip">
            {safeRows.length} Baris × {safeColumns.length} Kolom
          </span>
        </div>
        {canAddRow && (
          <button
            type="button"
            className="table-structure-btn add-row-btn"
            onClick={handleInternalAddRow}
          >
            + Tambah Pernyataan
          </button>
        )}
      </div>

      <div className="table-responsive-wrapper">
        <table className="table-structure-grid">
          <thead>
            <tr>
              <th className="col-idx">No</th>
              {safeColumns.map((col, cIdx) => (
                <th key={cIdx} className={cIdx === 0 ? 'col-statement' : 'col-key'}>
                  {!effectiveReadOnly && onColumnChange && cIdx > 0 ? (
                    <div className="editable-col-header">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => handleInternalColumnChange(cIdx, e.target.value)}
                        placeholder={`Kolom ${cIdx + 1}`}
                      />
                      {onDeleteColumn && safeColumns.length > 2 && (
                        <button
                          type="button"
                          className="btn-del-col"
                          title="Hapus Kolom"
                          onClick={() => onDeleteColumn(cIdx)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>{col}</span>
                  )}
                </th>
              ))}
              {!effectiveReadOnly && onAddColumn && (
                <th className="col-add-header">
                  <button
                    type="button"
                    className="btn-add-col-header"
                    title="Tambah Kolom Opsi"
                    onClick={onAddColumn}
                  >
                    + Kolom
                  </button>
                </th>
              )}
              {canDeleteRow && <th className="col-actions">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td
                  colSpan={safeColumns.length + (effectiveReadOnly ? 1 : 2)}
                  className="table-empty-notice"
                >
                  Belum ada baris pernyataan tabel.
                </td>
              </tr>
            ) : (
              safeRows.map((row, rIdx) => {
                const statementText = typeof row === 'string' ? row : row?.statement || '';
                const expectedKey = typeof row === 'object' ? row?.expectedKey : '';

                return (
                  <tr key={rIdx} className="table-row-item">
                    <td className="col-idx">{rIdx + 1}</td>
                    {/* First column is always statement */}
                    <td className="col-statement">
                      {!effectiveReadOnly && onRowChange ? (
                        <input
                          type="text"
                          value={statementText}
                          placeholder={`Pernyataan nomor ${rIdx + 1}...`}
                          onChange={(e) =>
                            handleInternalRowChange(rIdx, { statement: e.target.value, expectedKey })
                          }
                          className="table-statement-input"
                        />
                      ) : (
                        <span className="table-statement-text">{statementText || '—'}</span>
                      )}
                    </td>

                    {/* Subsequent columns are the options (e.g. Benar, Salah) */}
                    {safeColumns.slice(1).map((col, cIdx) => {
                      const isSelected =
                        expectedKey === col ||
                        String(expectedKey).toLowerCase() === String(col).toLowerCase() ||
                        expectedKey === String(cIdx);

                      return (
                        <td key={cIdx} className="col-key col-key-center">
                          {!effectiveReadOnly && onRowChange ? (
                            <label className="table-radio-label">
                              <input
                                type="radio"
                                name={`table_key_row_${rIdx}`}
                                checked={isSelected}
                                onChange={() =>
                                  handleInternalRowChange(rIdx, { statement: statementText, expectedKey: col })
                                }
                              />
                              <span className="table-radio-custom"></span>
                            </label>
                          ) : (
                            <span
                              className={`table-key-indicator ${
                                isSelected ? 'is-selected' : 'not-selected'
                              }`}
                            >
                              {isSelected ? '✓' : '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {!effectiveReadOnly && onAddColumn && <td></td>}

                    {canDeleteRow && (
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn-delete-row"
                          title="Hapus baris pernyataan ini"
                          onClick={() => handleInternalDeleteRow(rIdx)}
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableStructurePreview;
