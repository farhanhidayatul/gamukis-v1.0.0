import React from 'react';
import '../component_login_asset/buttonLoginGoogle.css';
import googleIcon from '../../../images/google-icon.png'; // Pastikan ada gambar ikon Google

const ButtonLoginGoogle = ({ onClick, disabled = false }) => {

    return (
      <div>
          <button type="button" onClick={onClick} className="google-login-button" disabled={disabled}>
              <img src={googleIcon} alt="Google Icon" />
              Lanjutkan dengan Google
          </button>
      </div>
    );
};

export default ButtonLoginGoogle;
