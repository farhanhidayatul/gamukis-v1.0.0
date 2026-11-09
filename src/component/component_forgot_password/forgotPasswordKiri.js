import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestForgotPasswordOtp, resetForgotPassword } from '../../database/manualAuth';
import InputForgotEmail from './component_forgot_password_asset/inputForgotEmail';
import InputForgotOtp from './component_forgot_password_asset/inputForgotOtp';
import ButtonForgotSubmit from './component_forgot_password_asset/buttonForgotSubmit';
import InputPassword from '../component_login/component_login_asset/inputPassword';
import './forgotPasswordKiri.css';

const ForgotPasswordKiri = ({ onError }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Input Email, 2: OTP & Kata Sandi Baru, 3: Sukses
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');

  // Step 1: Kirim OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    onError?.(null);
    if (!email) {
      onError?.({ source: 'forgot-password', message: 'Harap masukkan alamat email akun Anda.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestForgotPasswordOtp(email.trim().toLowerCase());
      setSuccessInfo(res.message || 'Kode OTP telah dikirim ke email Anda.');
      setStep(2);
    } catch (err) {
      onError?.({ source: 'forgot-password', message: err.message || 'Gagal mengirim kode pemulihan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset Password
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
      const res = await resetForgotPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
      setSuccessInfo(res.message || 'Kata sandi berhasil diatur ulang!');
      setStep(3);
    } catch (err) {
      onError?.({ source: 'forgot-password', message: err.message || 'Gagal mengatur ulang kata sandi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

        {/* STEP 1: FORM EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="forgot-step-form">
            <p className="forgot-instruction">
              Masukkan email yang terdaftar untuk menerima 6 digit kode OTP pemulihan kata sandi.
            </p>

            <InputForgotEmail setInputEmail={setEmail} />

            <ButtonForgotSubmit
              label="Kirim Kode OTP"
              disabled={!isEmailValid || isSubmitting}
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
              Kode OTP telah dikirim ke <strong>{email}</strong>. Masukkan kode dan kata sandi baru Anda.
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
                Ganti Alamat Email
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
