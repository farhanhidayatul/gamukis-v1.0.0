import React from 'react';
import './TemplateCard.css';

/**
 * TemplateCard Atom
 * Displays a single character preset template with mini preview, descriptive name, and selection button.
 *
 * @param {Object} props
 * @param {Object} props.template - Template data object ({ templateId, name, description, appearance })
 * @param {boolean} props.isSelected - Whether this card is currently selected
 * @param {Function} props.onSelect - Callback invoked with the selected template object
 * @param {React.ReactNode} [props.previewNode] - Custom rendered preview element or icon
 */
const TemplateCard = ({
  template,
  isSelected,
  onSelect,
  previewNode
}) => {
  if (!template) return null;

  return (
    <div
      className={`template-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(template);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Pilih template ${template.name}`}
    >
      <div className="template-card-preview">
        {previewNode || <div className="template-card-placeholder">🎭</div>}
      </div>
      <div className="template-card-info">
        <h4 className="template-card-name">{template.name}</h4>
        {template.description && (
          <p className="template-card-desc">{template.description}</p>
        )}
      </div>
      <button
        type="button"
        className={`template-card-btn ${isSelected ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(template);
        }}
      >
        {isSelected ? '✓ Terpilih' : 'Gunakan'}
      </button>
    </div>
  );
};

export default TemplateCard;

