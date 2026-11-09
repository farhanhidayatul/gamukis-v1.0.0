import React from 'react';
import './buttonForgotSubmit.css';

const ButtonForgotSubmit = ({ label = 'Kirim', disabled = false, loading = false }) => {
  return (
    <div>
      <button
        type="submit"
        className={`forgot-button-submit ${disabled || loading ? 'button-disabled' : 'button-active'}`}
        disabled={disabled || loading}
      >
        {loading ? 'Memproses...' : label}
      </button>
    </div>
  );
};

export default ButtonForgotSubmit;

