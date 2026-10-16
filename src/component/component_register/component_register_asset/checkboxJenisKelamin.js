import React from "react";
import "./checkboxJenisKelamin.css"; // Tambahkan file CSS untuk styling

const CheckboxJenisKelamin = ({ value = '', onChange }) => {

  const handleSelect = (gender) => {
    if (onChange) {
      onChange(gender);
    }
  };

  return (
    <div>
        <label className="checkbox-gender" htmlFor="gender">Jenis Kelamin</label>
        <div className="gender-container">
            <label className={`gender-option ${value === "Laki-laki" ? "selected" : ""}`} onClick={() => handleSelect("Laki-laki")}>
                <span className="circle-gender"></span> Laki-laki
            </label>
            <label className={`gender-option ${value === "Perempuan" ? "selected" : ""}`} onClick={() => handleSelect("Perempuan")}>
                <span className="circle-gender"></span> Perempuan
            </label>
        </div>
    </div>
    
  );
};

export default CheckboxJenisKelamin;
