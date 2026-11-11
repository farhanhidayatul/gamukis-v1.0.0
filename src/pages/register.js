import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authenticateWithBackendGoogle } from "../database/googleCloudAuth";
import {
  clearManualSession,
  requestRegistrationOtp,
  verifyRegistrationOtp
} from "../database/manualAuth";
import "./register.css";
import IntroductionRegistration from "../component/component_register/introductionRegistration";
import RoleChoice from "../component/component_register/molecules/roleChoice";
import RegistrationAccount from "../component/component_register/registrationAccount";
import OTPVerification from "../component/component_register/otpVerification";
import PersonalInfo from "../component/component_register/personalInfo";
import GamukisLogo from "../images/gamukis_vector.png";
import AssetGamukis from "../images/gamukis-regist-1.png";

const routeByResolvedRole = (navigate, rawRole) => {
  const normalizedRole = String(rawRole || "").toLowerCase();
  if (["admin", "administrator"].includes(normalizedRole)) navigate("/admin/dashboard");
  else if (normalizedRole === "guru") navigate("/guru/dashboard");
  else if (normalizedRole === "siswa") navigate("/siswa/dashboard");
  else navigate("/complete-profile");
};

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("siswa");
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [account, setAccount] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [profile, setProfile] = useState({ gender: "", birthDate: "", school: "", address: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.fromGoogleLogin) {
      if (location.state.email) {
        setAccount((current) => ({
          ...current,
          email: location.state.email,
          username: location.state.name ? location.state.name.replace(/[^a-zA-Z0-9]/g, "") : current.username
        }));
      }
      if (location.state.name) {
        setFullName((current) => current || location.state.name);
      }
      setError("Akun Google belum terdaftar. Silakan pilih peran dan lengkapi pendaftaran akun Anda.");
      setStep(2);
    }
  }, [location.state]);

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
      await requestRegistrationOtp({
        ...account,
        profile,
        role,
        fullName: role === "guru" ? fullName.trim() : "",
        subject: role === "guru" ? subject.trim() : ""
      });
      setStep(5);
    } catch (requestError) {
      setError(requestError.message || "Kode OTP gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    const result = await verifyRegistrationOtp(account.email, otp);
    routeByResolvedRole(navigate, result?.user?.role);
  };

  const finishRegistration = async (action) => {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await action();
      routeByResolvedRole(navigate, result?.user?.role);
    } catch (registrationError) {
      setError(registrationError.message || "Registrasi gagal. Periksa kembali data Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = (idToken) => {
    finishRegistration(async () => {
      if (typeof clearManualSession === "function") {
        clearManualSession();
      }

      const session = await authenticateWithBackendGoogle(idToken, "register", {
        role,
        fullName: role === "guru" ? fullName.trim() : "",
        subject: role === "guru" ? subject.trim() : ""
      });

      if (session?.user && typeof window !== "undefined") {
        window.localStorage?.setItem("gamukis_manual_user", JSON.stringify(session.user));
        if (session.token) {
          window.localStorage?.setItem("gamukis_manual_token", session.token);
        }
        window.dispatchEvent(new Event("gamukis-manual-auth-change"));
      }
      return session;
    });
  };

  const handleGoogleError = (err) => {
    setError(err?.message || "Login Google gagal. Silakan coba kembali.");
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
          {step === 2 && (
            <RoleChoice
              role={role}
              fullName={fullName}
              subject={subject}
              onChangeRole={setRole}
              onChangeFullName={setFullName}
              onChangeSubject={setSubject}
              nextStep={() => setStep(3)}
              prevStep={() => setStep(1)}
              disabled={isSubmitting}
            />
          )}
          {step === 3 && (
            <RegistrationAccount
              account={account}
              updateAccount={updateAccount}
              nextStep={() => setStep(4)}
              onCredentialSuccess={handleGoogleCredential}
              onCredentialError={handleGoogleError}
              disabled={isSubmitting}
            />
          )}
          {step === 4 && (
            <PersonalInfo
              profile={profile}
              updateProfile={updateProfile}
              nextStep={handleRequestOtp}
              prevStep={() => setStep(3)}
              onCredentialSuccess={handleGoogleCredential}
              onCredentialError={handleGoogleError}
              disabled={isSubmitting}
            />
          )}
          {step === 5 && (
            <OTPVerification
              email={account.email}
              onVerify={handleVerifyOtp}
              onResend={handleRequestOtp}
              disabled={isSubmitting}
            />
          )}
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
