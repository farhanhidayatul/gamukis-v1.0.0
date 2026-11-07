import React, { useEffect, useRef } from 'react';
import '../component_login_asset/buttonLoginGoogle.css';
import googleIcon from '../../../images/google-icon.png';
import { loadGoogleIdentityScript } from '../../../database/googleCloudAuth';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '257611845379-hpqrv564tfrkk1210epc73ulobnka4lf.apps.googleusercontent.com';

const ButtonLoginGoogle = ({ onCredentialSuccess, onCredentialError, disabled = false }) => {
  const googleBtnContainerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleIdentityScript()
      .then((gsi) => {
        if (!isMounted || !googleBtnContainerRef.current) return;

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

        // Render official Google button into the container with full responsive width & theme
        const containerWidth = googleBtnContainerRef.current?.offsetWidth || 400;
        const targetWidth = Math.min(Math.max(containerWidth, 200), 400);

        gsi.renderButton(googleBtnContainerRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: targetWidth
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
        ref={googleBtnContainerRef} 
        className="google-official-btn-container"
        style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
};

export default ButtonLoginGoogle;
