import './CurriculumBadge.css';

const CurriculumBadge = ({ type = 'category', value = 'BAHASA' }) => {
  const norm = String(value || '').toUpperCase();

  let modifier = 'manual';
  let label = value;

  if (type === 'category') {
    if (norm === 'SAINTEK') {
      modifier = 'saintek';
      label = '🔬 SAINTEK';
    } else if (norm === 'SOSHUM') {
      modifier = 'soshum';
      label = '🌍 SOSHUM';
    } else {
      modifier = 'bahasa';
      label = '📖 BAHASA';
    }
  } else if (type === 'source') {
    if (norm === 'AI_CANDIDATE' || norm === 'AI') {
      modifier = 'ai';
      label = '🤖 AI Generator';
    } else {
      modifier = 'manual';
      label = '✍️ Manual';
    }
  }

  return (
    <span className={`curriculum-badge curriculum-badge--${modifier}`} data-testid="curriculum-badge">
      {label}
    </span>
  );
};

export default CurriculumBadge;
