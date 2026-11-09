const ClothingOptionButton = ({
  label,
  category,
  sprite,
  isSelected,
  onClick,
  option,
  onSelect
}) => {
  const resolvedLabel = label || option?.label || '';
  const resolvedCategory = category || option?.category || '';
  const resolvedSprite = sprite || option?.preview || option?.sprites?.front || (option?.sprites && Object.values(option.sprites)[0]) || '';
  const resolvedIsSelected = isSelected !== undefined ? isSelected : false;
  const resolvedClick = onClick || onSelect || (() => {});

  return (
    <button
      type="button"
      className={`option-chip clothing-chip ${resolvedIsSelected ? 'selected' : ''}`}
      onClick={resolvedClick}
      aria-label={resolvedLabel}
      aria-pressed={resolvedIsSelected}
      title={resolvedLabel}
    >
      <span
        className={`clothing-chip-sprite ${resolvedCategory ? `clothing-chip-sprite-${resolvedCategory}` : ''}`}
        style={resolvedSprite ? { backgroundImage: `url(${resolvedSprite})` } : undefined}
        aria-hidden="true"
      />
      <span className="clothing-chip-label">{resolvedLabel}</span>
    </button>
  );
};

export default ClothingOptionButton;
