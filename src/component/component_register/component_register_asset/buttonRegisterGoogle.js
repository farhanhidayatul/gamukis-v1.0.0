import React from 'react';
import './buttonRegisterGoogle.css';
import googleIcon from '../../../images/google-icon.png'; // Pastikan ada gambar ikon Google

const ButtonRegisterGoogle = ({ onClick, disabled = false }) => {

    return (
      <div>
          <button type="button" onClick={onClick} className="google-register-button" disabled={disabled}>
              <img src={googleIcon} alt="Google Icon" className='google-icon-regist' />
              Lanjutkan dengan Google
          </button>
      </div>
    );
};

export default ButtonRegisterGoogle;
