import "./buttonBack.css";

const ButtonBack = ({ onClick, text = "Kembali" }) => {
  return (
    <button type="button" className="register-back-button" onClick={onClick}>
      {text}
    </button>
  );
};

export default ButtonBack;
