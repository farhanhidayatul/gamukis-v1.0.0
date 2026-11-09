import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { requestForgotPasswordOtp, resetForgotPassword } from '../../database/manualAuth';
import InputForgotEmail from './component_forgot_password_asset/inputForgotEmail';
import InputForgotOtp from './component_forgot_password_asset/inputForgotOtp';
import ButtonForgotSubmit from './component_forgot_password_asset/buttonForgotSubmit';
import RadioRecoveryMethod from './component_forgot_password_asset/radioRecoveryMethod';
import './forgotPasswordKiri.css';

const ForgotPasswordKiri = ({ onError }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Input Akun & Metode, 2: OTP & Kata Sandi Baru, 3: Sukses
  const [identifier, setIdentifier] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState('primary'); // 'primary' | 'recovery'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    onError?.(null);
    if (!identifier) {
      onError?.({ source: 'forgot-password', message: 'Harap masukkan Username atau Email akun Anda.' });
      return;
    }
    if (recoveryMethod === 'recovery' && !recoveryEmail) {
      onError?.({ source: 'forgot-password', message: 'Harap masukkan alamat email pemulihan yang Anda kaitkan.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestForgotPasswordOtp(identifier.trim(), {
        useRecoveryEmail: recoveryMethod === 'recovery',
        recoveryEmail: recoveryEmail.trim()
      });
      setSuccessInfo(res.message || 'Kode OTP telah dikirim.');
      setStep(2);
    } catch (err) {
      onError?.({ source: 'forgot-password', message: err.message || 'Gagal mengirim kode pemulihan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    onError?.(null);

    if (!otp || otp.trim().length < 6) {
      onError?.({ source: 'forgot-password', message: 'Harap masukkan 6 digit kode OTP.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      onError?.({ source: 'forgot-password', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      onError?.({ source: 'forgot-password', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const linkEmail = recoveryMethod === 'recovery' && recoveryEmail ? recoveryEmail.trim() : '';
      const res = await resetForgotPassword(identifier.trim(), otp.trim(), newPassword, linkEmail);
      setSuccessInfo(res.message || 'Kata sandi berhasil diatur ulang!');
      setStep(3);
    } catch (err) {
      onError?.({ source: 'forgot-password', message: err.message || 'Gagal mengatur ulang kata sandi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = Boolean(identifier) && (recoveryMethod === 'primary' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail));
  const isStep2Valid = otp.length === 6 && newPassword.length >= 6 && confirmPassword.length >= 6;

  return (
    <div className="login-right forgot-password-right">
      <div className="forgot-kiri-wrapper">
        <h2 className="font-welcome">
          Pemulihan <br /> <span className="font-gamukis">KATA SANDI</span>
        </h2>

        {successInfo && step !== 3 && (
          <div className="forgot-info-badge">
            <span>✓ {successInfo}</span>
          </div>
        )}

        {/* STEP 1: FORM IDENTIFIER & METODE PEMULIHAN */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="forgot-step-form">
            <p className="forgot-instruction">
              Masukkan Username atau Email akun Anda untuk memulai proses pemulihan kata sandi.
            </p>

            <InputForgotEmail setInputEmail={setIdentifier} />

            <RadioRecoveryMethod method={recoveryMethod} setMethod={setRecoveryMethod} />

            {recoveryMethod === 'recovery' && (
              <div className="forgot-input-group">
                <label className="label-forgot-email" htmlFor="recoveryEmailInput">
                  Email Pemulihan yang Dikaitkan
                </label>
                <input
                  id="recoveryEmailInput"
                  type="email"
                  className="input-field-forgot-email"
                  placeholder="email-pemulihan@gmail.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
                <span className="forgot-field-hint">
                  Kode OTP akan dikirimkan ke email cadangan ini.
                </span>
              </div>
            )}

            <ButtonForgotSubmit
              label="Kirim Kode OTP"
              disabled={!isStep1Valid || isSubmitting}
              loading={isSubmitting}
            />

            <div className="forgot-nav-bottom">
              <Link to="/login" className="forgot-link-text">
                ← Kembali ke Halaman Login
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: FORM OTP & PASSWORD BARU */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="forgot-step-form">
            <p className="forgot-instruction">
              Masukkan 6 digit kode OTP dan buat kata sandi baru untuk akun Anda.
            </p>

            <InputForgotOtp setInputOtp={setOtp} />

            <div className="forgot-input-group">
              <label className="label-forgot-email" htmlFor="newPassInput">Kata Sandi Baru</label>
              <input
                id="newPassInput"
                type="password"
                className="input-field-forgot-email"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-input-group">
              <label className="label-forgot-email" htmlFor="confirmPassInput">Konfirmasi Kata Sandi Baru</label>
              <input
                id="confirmPassInput"
                type="password"
                className="input-field-forgot-email"
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <ButtonForgotSubmit
              label="Simpan Kata Sandi Baru"
              disabled={!isStep2Valid || isSubmitting}
              loading={isSubmitting}
            />

            <div className="forgot-nav-bottom">
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => { setStep(1); onError?.(null); }}
              >
                Ganti Akun / Metode Pemulihan
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUKSES */}
        {step === 3 && (
          <div className="forgot-success-content">
            <div className="forgot-success-icon">✓</div>
            <h3>Kata Sandi Berhasil Diperbarui!</h3>
            <p>Silakan masuk menggunakan kata sandi baru Anda.</p>
            <button
              type="button"
              className="button-login-submit"
              onClick={() => navigate('/login', { replace: true })}
            >
              Masuk Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordKiri;
