import { useEffect, useRef } from "react";
import './buttonRegisterGoogle.css';
import { loadGoogleIdentityScript } from '../../../database/googleCloudAuth';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '257611845379-hpqrv564tfrkk1210epc73ulobnka4lf.apps.googleusercontent.com';

const ButtonRegisterGoogle = ({ onCredentialSuccess, onCredentialError, disabled = false }) => {
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

        const containerWidth = googleBtnMountRef.current?.offsetWidth || 340;
        const targetWidth = Math.min(Math.max(containerWidth, 240), 400);

        gsi.renderButton(googleBtnMountRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: targetWidth
        });
      })
      .catch((err) => {
        console.warn('[GoogleAuth] Failed to load GSI script in register:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [onCredentialSuccess, onCredentialError]);

  return (
    <div className="google-register-wrapper">
      <div 
        ref={googleBtnMountRef}
        className="google-official-register-btn-container"
        style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
};

export default ButtonRegisterGoogle;
