import React, { useRef } from "react";
import "./inputTanggalLahir.css"; // Pastikan file CSS tersedia

const InputTanggalLahir = ({ value = '', onChange }) => {
  const digits = Array.from({ length: 8 }, (_, index) => value[index] || '');
  const inputRefs = useRef([]);

  const handleChange = (event, index) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = value;

    if (value && index < nextDigits.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const birthDate = nextDigits.join("");
    onChange(birthDate);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderInput = (index, placeholder) => (
    <input
      key={index}
      ref={(element) => { inputRefs.current[index] = element; }}
      type="text"
      inputMode="numeric"
      maxLength="1"
      placeholder={placeholder}
      value={digits[index]}
      onChange={(event) => handleChange(event, index)}
      onKeyDown={(event) => handleKeyDown(event, index)}
    />
  );

  return (
    <div>
        <label className="label-birth" htmlFor="birth">Tanggal Lahir</label>
        <div className="tanggal-lahir-container">
            {/* DD */}
            {renderInput(0, "D")}
            {renderInput(1, "D")}
            <span>/</span>

            {/* MM */}
            {renderInput(2, "M")}
            {renderInput(3, "M")}
            <span>/</span>

            {/* YYYY */}
            {renderInput(4, "Y")}
            {renderInput(5, "Y")}
            {renderInput(6, "Y")}
            {renderInput(7, "Y")}
        </div>
    </div>
    
  );
};

export default InputTanggalLahir;

