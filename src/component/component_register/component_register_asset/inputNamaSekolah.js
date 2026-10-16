import React from "react";
import "./inputNamaSekolah.css"; // Tambahkan file CSS untuk styling

const InputNamaSekolah = ({ value = '', onChange }) => {
  return (
    <div>
    <label className="label-school" htmlFor="school">Nama Sekolah</label>
    <input type="text" className="input-sekolah" value={value} onChange={onChange} />
  </div>
  );
  
  
};

export default InputNamaSekolah;
