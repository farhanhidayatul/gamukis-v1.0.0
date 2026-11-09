import TemplateCard from '../atoms/TemplateCard';
import './TemplateGallery.css';

/**
 * TemplateGallery Molecule
 * Horizontal scrollable gallery displaying template presets for quick selection.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.templates=[]] - List of template objects
 * @param {string|null} props.selectedTemplateId - ID of currently active/selected template
 * @param {Function} props.onSelectTemplate - Callback when a template is selected
 * @param {Function} [props.renderPreview] - Optional render function to customize preview node
 */
const TemplateGallery = ({
  templates = [],
  selectedTemplateId,
  onSelectTemplate,
  renderPreview
}) => {
  if (!templates || templates.length === 0) return null;

  return (
    <div className="template-gallery-container">
      <div className="template-gallery-header">
        <h3 className="template-gallery-title">Pilih Template Karakter</h3>
        <span className="template-gallery-subtitle">
          Pilih template siap pakai atau sesuaikan lebih lanjut
        </span>
      </div>
      <div className="template-gallery-scroll">
        {templates.map((tpl) => (
          <TemplateCard
            key={tpl.templateId}
            template={tpl}
            isSelected={selectedTemplateId === tpl.templateId}
            onSelect={onSelectTemplate}
            previewNode={renderPreview ? renderPreview(tpl) : null}
          />
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;

