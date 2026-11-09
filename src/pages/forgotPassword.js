import { useEffect, useState } from "react";
import ForgotPasswordKanan from '../component/component_forgot_password/forgotPasswordKanan';
import ForgotPasswordKiri from '../component/component_forgot_password/forgotPasswordKiri';
import './forgotPassword.css';

const ForgotPassword = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setError(null);
    };

    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, []);

  return (
    <div className="login-container">
      <ForgotPasswordKanan />
      <ForgotPasswordKiri onError={setError} />
      {error && (
        <div className="login-error-overlay" role="presentation" onClick={() => setError(null)}>
          <div
            className="login-error-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="forgot-error-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-error-close"
              aria-label="Tutup pesan error"
              onClick={() => setError(null)}
            >
              ×
            </button>
            <h2 id="forgot-error-title">Pemulihan Gagal</h2>
            <p>{error.message || 'Terjadi kesalahan saat memproses pemulihan kata sandi.'}</p>
            <button type="button" className="login-error-action" onClick={() => setError(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
