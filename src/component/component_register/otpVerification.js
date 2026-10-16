import React, { useEffect, useRef, useState } from "react";
import "./otpVerification.css";
import ProgressBar from "./progressBar";
import { ButtonNext } from "./atoms";

const OTPVerification = ({ email, onVerify, onResend, disabled = false }) => {
  const [countdown, setCountdown] = useState(60);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [resendDisabled, setResendDisabled] = useState(true);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleResend = () => {
    setCountdown(60);
    setResendDisabled(true);
    setError("");
    setOtp(Array(6).fill(""));
    inputRefs.current[0]?.focus();
    onResend();
  };

  const focusNextInput = (index) => {
    const nextIndex = Math.min(index + 1, otp.length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const focusPreviousInput = (index) => {
    const previousIndex = Math.max(index - 1, 0);
    inputRefs.current[previousIndex]?.focus();
  };

  const handleOtpChange = (event, index) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < otp.length - 1) {
      focusNextInput(index);
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      focusPreviousInput(index);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusPreviousInput(index);
    }

    if (event.key === "ArrowRight" && index < otp.length - 1) {
      event.preventDefault();
      focusNextInput(index);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = (event.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otp.length);

    if (!pasted) return;

    const nextOtp = Array(6).fill("");
    pasted.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);

    const nextFocusIndex = Math.min(pasted.length, otp.length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async () => {
    setError("");
    try {
      await onVerify(otp.join(""));
    } catch (verifyError) {
      setError(verifyError.message || "Kode OTP tidak valid.");
    }
  };

  return (
    <div className="otpVerification-container">
      <ProgressBar step={3} />
      <p className="text-desc">
        Kami telah mengirimkan kode verifikasi ke email Anda. Silakan periksa email Anda dan masukkan kode tersebut di bawah ini untuk melanjutkan.
      </p>

      <div className="otp-box">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(element) => {
              inputRefs.current[i] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength="1"
            className="otp-input"
            value={digit}
            onChange={(event) => handleOtpChange(event, i)}
            onKeyDown={(event) => handleKeyDown(event, i)}
            onPaste={handlePaste}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {countdown > 0 ? (
        <p className="countdown-text">
          Tidak menerima email? <span className="countdown-highlight">{countdown}s</span>
        </p>
      ) : (
        <button className="resend-button" onClick={handleResend} disabled={resendDisabled}>
          Kirim Ulang Kode
        </button>
      )}

      {error && <p role="alert" className="register-error">{error}</p>}
      <ButtonNext text="Verifikasi" disabled={disabled || otp.join("").length !== 6} onClick={handleVerify} />
    </div>
  );
};

export default OTPVerification;

