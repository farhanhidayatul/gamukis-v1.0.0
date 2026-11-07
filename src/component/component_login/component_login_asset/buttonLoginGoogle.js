import React, { useEffect, useRef } from 'react';
import '../component_login_asset/buttonLoginGoogle.css';
import googleIcon from '../../../images/google-icon.png';
import { loadGoogleIdentityScript } from '../../../database/googleCloudAuth';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '257611845379-hpqrv564tfrkk1210epc73ulobnka4lf.apps.googleusercontent.com';

const ButtonLoginGoogle = ({ onCredentialSuccess, onCredentialError, disabled = false }) => {
  const googleBtnMountRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleIdentityScript()
      .then((gsi) => {
        if (!isMounted || !googleBtnMountRef.current) return;

        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              if (typeof onCredentialSuccess === 'function') {
                onCredentialSuccess(response.credential);
              }
            } else {
              if (typeof onCredentialError === 'function') {
                onCredentialError(new Error('Kredensial Google tidak ditemukan.'));
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Mount official button at maximum width
        gsi.renderButton(googleBtnMountRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 400
        });
      })
      .catch((err) => {
        console.warn('[GoogleAuth] Failed to load GSI script:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [onCredentialSuccess, onCredentialError]);

  return (
    <div className="google-login-wrapper">
      <div 
        className="google-official-btn-container"
        style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.6 : 1 }}
      >
        {/* Tombol visual asli Gamukis yang 100% konsisten dengan desain lama */}
        <div className="google-custom-btn-visual">
          <img src={googleIcon} alt="Google Icon" />
          <span>Lanjutkan dengan Google</span>
        </div>

        {/* Iframe resmi Google di lapisan transparan atasnya untuk menangkap klik native */}
        <div ref={googleBtnMountRef} className="google-hidden-mount" />
      </div>
    </div>
  );
};

export default ButtonLoginGoogle;
