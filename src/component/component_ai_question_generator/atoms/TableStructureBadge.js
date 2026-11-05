import React from 'react';
import './TableStructureBadge.css';

const TableStructureBadge = ({
  interactionType = 'single_choice',
  modalityType = 'text',
  matrixData = null,
  hasImage = false,
  className = ''
}) => {
  const isMatrix = interactionType === 'matrix_drag_drop' || modalityType === 'table_matrix';
  const rowCount = matrixData?.rows?.length || 0;
  const colCount = matrixData?.columns?.length || 0;

  let label = 'Pilihan Ganda';
  let badgeType = 'single';

  if (isMatrix) {
    badgeType = 'matrix';
    label = rowCount > 0 && colCount > 0 ? `Matriks ${rowCount}x${colCount}` : 'Matriks Tabel';
  } else if (hasImage || modalityType === 'image') {
    badgeType = 'image';
    label = 'Soal Bergambar';
  } else if (modalityType === 'table_description' || modalityType === 'deskripsi_tabel') {
    badgeType = 'table';
    label = 'Deskripsi Tabel';
  } else if (modalityType === 'hybrid') {
    badgeType = 'hybrid';
    label = 'Hibrida (Teks + Visual)';
  }

  return (
    <span className={`table-structure-badge table-structure-badge-${badgeType} ${className}`}>
      {badgeType === 'matrix' && <span className="badge-icon" aria-hidden="true">📊</span>}
      {badgeType === 'table' && <span className="badge-icon" aria-hidden="true">📊</span>}
      {badgeType === 'image' && <span className="badge-icon" aria-hidden="true">🖼️</span>}
      {badgeType === 'hybrid' && <span className="badge-icon" aria-hidden="true">📑</span>}
      {badgeType === 'single' && <span className="badge-icon" aria-hidden="true">🔘</span>}
      <span className="badge-label">{label}</span>
    </span>
  );
};

export default TableStructureBadge;
