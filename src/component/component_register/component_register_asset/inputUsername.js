import React, { useState } from 'react';
import '../component_register_asset/inputUsername.css';

const InputUsername = ({ username = '', setUsername }) => {
  const [inputClass, setInputClass] = useState('input-empty');

  const handleChange = (event) => {
    const value = event.target.value;
    setUsername(value);

    // Username valid jika memiliki minimal 4 karakter
    setInputClass(value.trim() === '' ? 'input-empty' : value.length >= 4 ? 'input-valid' : 'input-invalid');
  };

  return (
    <div>
      <label className="label-username" htmlFor="username">Username</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={handleChange}
        className={`input-field-username ${inputClass}`}
      />
    </div>
  );
};

export default InputUsername;
