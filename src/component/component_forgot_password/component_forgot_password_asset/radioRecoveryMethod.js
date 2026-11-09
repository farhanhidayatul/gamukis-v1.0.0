import React from 'react';
import './radioRecoveryMethod.css';

const RadioRecoveryMethod = ({ method, setMethod }) => {
  return (
    <div className="recovery-method-container">
      <label className="recovery-method-title">Pilih Metode Pengiriman OTP:</label>
      <div className="recovery-method-options">
        <label className={`recovery-method-card ${method === 'primary' ? 'active' : ''}`}>
          <input
            type="radio"
            name="recoveryMethod"
            value="primary"
            checked={method === 'primary'}
            onChange={() => setMethod('primary')}
          />
          <div className="recovery-card-text">
            <strong>Email Utama Akun</strong>
            <span>Kode OTP dikirim langsung ke email yang terdaftar.</span>
          </div>
        </label>

        <label className={`recovery-method-card ${method === 'recovery' ? 'active' : ''}`}>
          <input
            type="radio"
            name="recoveryMethod"
            value="recovery"
            checked={method === 'recovery'}
            onChange={() => setMethod('recovery')}
          />
          <div className="recovery-card-text">
            <strong>Email Pemulihan Lain</strong>
            <span>Kirim OTP ke email cadangan yang telah Anda kaitkan.</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default RadioRecoveryMethod;

