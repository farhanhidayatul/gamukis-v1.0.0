import React from "react";
import "./inputAlamat.css"; // Tambahkan file CSS untuk styling

const InputAlamat = ({ value = '', onChange }) => {
  return (
  <div className="address-container">
    <label className="label-address" htmlFor="address">Alamat</label>
    <input type="text" className="input-alamat" value={value} onChange={onChange} />
  
  </div>
  
  );
};

export default InputAlamat;
