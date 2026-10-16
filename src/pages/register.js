import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../database/firebaseAuth";
import {
  requestRegistrationOtp,
  verifyRegistrationOtp
} from "../database/manualAuth";
import { createBackendSession } from "../database/firebaseDatabase";
import "./register.css";
import IntroductionRegistration from "../component/component_register/introductionRegistration";
import RegistrationAccount from "../component/component_register/registrationAccount";
import OTPVerification from "../component/component_register/otpVerification";
import PersonalInfo from "../component/component_register/personalInfo";
import GamukisLogo from "../images/gamukis_vector.png"
import AssetGamukis from "../images/gamukis-regist-1.png"

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [profile, setProfile] = useState({ gender: "", birthDate: "", school: "", address: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const nextStep = () => setStep((prev) => prev + 1);

  const updateAccount = (data) => setAccount((current) => ({ ...current, ...data }));
  const updateProfile = (data) => setProfile((current) => ({ ...current, ...data }));

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") setError("");
    };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  const handleRequestOtp = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await requestRegistrationOtp({ ...account, profile });
      setStep(4);
    } catch (requestError) {
      setError(requestError.message || "Kode OTP gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    const result = await verifyRegistrationOtp(account.email, otp);
    const role = String(result?.user?.role || '').toLowerCase();
    navigate(["siswa", "guru"].includes(role) ? "/home" : "/complete-profile");
  };

  const finishRegistration = async (action) => {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await action();
      const role = String(result?.user?.role || '').toLowerCase();
      if (["admin", "administrator"].includes(role)) navigate("/admin/dashboard");
      else navigate(["siswa", "guru"].includes(role) ? "/home" : "/complete-profile");
    } catch (registrationError) {
      setError(registrationError.message || "Registrasi gagal. Periksa kembali data Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegistration = () => {
    finishRegistration(async () => {
      await signInWithGoogle();
      return createBackendSession();
    });
  };

  return (
    <div className="register-container">
      <div className="register-bg-assesoris">
        <div className="register-left">
          <img src={GamukisLogo} alt="GAMUKIS Logo" className="logo-gamukis-regist" />
          <img src={AssetGamukis} alt="AssetRegist" className="logo-regist" />
          <div className="circle-1"></div>
          <div className="circle-2"></div>
        </div>

        <div className="register-right">
          {step === 1 && <IntroductionRegistration nextStep={nextStep} />}
          {step === 2 && <RegistrationAccount account={account} updateAccount={updateAccount} nextStep={() => setStep(3)} onGoogle={handleGoogleRegistration} disabled={isSubmitting} />}
          {step === 3 && <PersonalInfo profile={profile} updateProfile={updateProfile} nextStep={handleRequestOtp} prevStep={() => setStep(2)} onGoogle={handleGoogleRegistration} disabled={isSubmitting} />}
          {step === 4 && <OTPVerification email={account.email} onVerify={handleVerifyOtp} onResend={handleRequestOtp} disabled={isSubmitting} />}
          {error && (
            <div className="register-error-overlay" role="presentation" onClick={() => setError("")}>
              <div
                className="register-error-popup"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="register-error-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="register-error-title">Registrasi gagal</h2>
                <p>{error}</p>
                <button type="button" onClick={() => setError("")}>Tutup</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

