import React from "react";
import "./buttonNext.css"; // Pastikan membuat file CSS untuk styling tombol

const ButtonNext = ({ onClick, text = "Lanjutkan", disabled = false }) => {
  return (
    <button className="next-button" onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};

export default ButtonNext;