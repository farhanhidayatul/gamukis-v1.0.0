const CardActionButton = ({ children, onClick }) => (
  <button type="button" className="play-button" onClick={onClick}>
    {children}
  </button>
);

export default CardActionButton;
