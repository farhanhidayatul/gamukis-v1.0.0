import { useState } from "react";
import './inputForgotOtp.css';

const InputForgotOtp = ({ setInputOtp }) => {
  const [otpValue, setOtpValue] = useState('');
  const [inputClass, setInputClass] = useState('input-empty');

  const handleChange = (event) => {
    const raw = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(raw);
    setInputOtp(raw);

    if (raw === '') {
      setInputClass('input-empty');
    } else if (raw.length === 6) {
      setInputClass('input-valid');
    } else {
      setInputClass('input-invalid');
    }
  };

  return (
    <div>
      <label className="label-forgot-otp" htmlFor="forgotOtp">6 Digit Kode OTP</label>
      <input
        type="text"
        id="forgotOtp"
        maxLength={6}
        placeholder="123456"
        value={otpValue}
        onChange={handleChange}
        className={`input-field-forgot-otp ${inputClass}`}
        required
      />
    </div>
  );
};

export default InputForgotOtp;

