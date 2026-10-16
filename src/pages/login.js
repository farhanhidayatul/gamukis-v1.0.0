import React, { useEffect, useState } from 'react';
import BackgroundKanan from '../component/component_login/backgroundKanan';
import './login.css';
import BackgroundKiri from '../component/component_login/backgroundKiri';

const Login = () => {
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setLoginError(null);
    };

    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, []);

  return (
    <div className="login-container">
      <BackgroundKanan/>
      <BackgroundKiri onLoginError={setLoginError} />
      {loginError && (
        <div className="login-error-overlay" role="presentation" onClick={() => setLoginError(null)}>
          <div
            className="login-error-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-error-close"
              aria-label="Tutup pesan error"
              onClick={() => setLoginError(null)}
            >
              ×
            </button>
            <h2 id="login-error-title">
              {loginError.source === 'google' ? 'Login Google gagal' : 'Login gagal'}
            </h2>
            <p>{loginError.message}</p>
            <button type="button" className="login-error-action" onClick={() => setLoginError(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

