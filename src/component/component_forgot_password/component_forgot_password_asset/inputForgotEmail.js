import { useState } from "react";
import './inputForgotEmail.css';

const InputForgotEmail = ({ setInputEmail }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputClass, setInputClass] = useState('input-empty');

  const handleChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setInputEmail(value);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.trim() === '') {
      setInputClass('input-empty');
    } else if (emailPattern.test(value)) {
      setInputClass('input-valid');
    } else {
      setInputClass('input-invalid');
    }
  };

  return (
    <div>
      <label className="label-forgot-email" htmlFor="forgotEmail">Email Akun</label>
      <input
        type="email"
        id="forgotEmail"
        placeholder="nama@email.com"
        value={inputValue}
        onChange={handleChange}
        className={`input-field-forgot-email ${inputClass}`}
        autoComplete="email"
        required
      />
    </div>
  );
};

export default InputForgotEmail;

