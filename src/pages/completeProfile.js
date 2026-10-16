import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../database/firebaseAuth";
import { getManualAccount, getManualUser, saveCompleteProfile } from "../database/manualAuth";
import { getBackendAccount, saveFirebaseCompleteProfile } from "../database/firebaseDatabase";
import RegistrationArt from "../images/gamukis-regist-1.png";
import "./completeProfile.css";

const subjects = ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "Fisika", "Kimia", "Biologi", "Sejarah", "Lainnya"];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [role, setRole] = useState(() => (
    ["guru", "siswa"].includes(manualUser?.role) ? manualUser.role : ""
  ));
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherApplicationStatus, setTeacherApplicationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setFirebaseUser), []);
  useEffect(() => {
    const refresh = () => setManualUser(getManualUser());
    window.addEventListener("gamukis-manual-auth-change", refresh);
    return () => window.removeEventListener("gamukis-manual-auth-change", refresh);
  }, []);

  useEffect(() => {
    if (["guru", "siswa"].includes(manualUser?.role)) setRole(manualUser.role);
  }, [manualUser?.role]);

  useEffect(() => {
    if (["guru", "siswa"].includes(firebaseUser?.role)) setRole(firebaseUser.role);
  }, [firebaseUser?.role]);

  const isFirebaseUser = Boolean(firebaseUser && !firebaseUser.isAnonymous);
  const signedIn = isFirebaseUser || Boolean(manualUser);

  useEffect(() => {
    let isCurrent = true;
    if (!signedIn) return undefined;
    const loadRoleStatus = async () => {
      try {
        const response = isFirebaseUser ? await getBackendAccount() : await getManualAccount();
        if (!isCurrent) return;
        const application = response?.user?.teacherApplication;
        setTeacherApplicationStatus(application?.status || null);
        if (application?.status === "pending") {
          setRole("guru");
          setFullName(application.fullName || "");
          setSubject(application.subject || "");
        } else if (application?.status === "rejected") {
          setRole("");
          setSubject("");
        }
      } catch {
        // Submission endpoints still provide the authoritative status if this lookup fails.
      }
    };
    loadRoleStatus();
    return () => { isCurrent = false; };
  }, [signedIn, isFirebaseUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = { role, fullName: fullName.trim(), subject: role === "guru" ? subject : "" };
      const result = isFirebaseUser
        ? await saveFirebaseCompleteProfile(data)
        : await saveCompleteProfile(data);
      if (role === "guru" && result?.teacherApplication?.status === "pending") {
        setTeacherApplicationStatus("pending");
        return;
      }
      navigate("/home");
    } catch (requestError) {
      setError(requestError.message || "Data diri gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckTeacherStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = isFirebaseUser ? await getBackendAccount() : await getManualAccount();
      const account = response?.user;
      const status = account?.teacherApplication?.status || null;
      setTeacherApplicationStatus(status);
      if (status === "rejected") {
        setRole("");
        setSubject("");
        return;
      }
      if (status === "approved" || account?.role === "guru") navigate("/home");
    } catch (requestError) {
      setError(requestError.message || "Status pengajuan belum dapat diperiksa.");
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <main className="complete-profile-page">
      <section className="complete-profile-content">
        <header className="complete-profile-heading">
          <div className="complete-profile-step">LANGKAH 4 DARI 5</div>
          <h1>Lengkapi Data Diri</h1>
          <p className="complete-profile-intro">Lengkapi data dirimu terlebih dahulu untuk memulai petualangan belajar yang seru di Dunia Gamukis!</p>
        </header>

        <form className="complete-profile-card" onSubmit={handleSubmit}>
          <h2>Data Pengguna</h2>
          <p className="complete-profile-card-intro">Pilih peranmu dan lengkapi informasi di bawah ini.</p>

          {!signedIn && <div className="complete-profile-notice" role="status">Silakan masuk terlebih dahulu untuk melengkapi data diri.</div>}

          {teacherApplicationStatus === "pending" && (
            <div className="complete-profile-notice" role="status">
              <p>Pengajuan Guru sedang menunggu persetujuan administrator. Role Guru akan aktif setelah diterima.</p>
              <button type="button" className="complete-profile-status-button" onClick={handleCheckTeacherStatus} disabled={checkingStatus}>
                {checkingStatus ? "Memeriksa…" : "Periksa status pengajuan"}
              </button>
            </div>
          )}
          {teacherApplicationStatus === "rejected" && <p className="complete-profile-notice" role="status">Pengajuan Guru sebelumnya ditolak. Silakan pilih kembali peran Siswa atau Guru.</p>}

          <fieldset className="complete-profile-roles" disabled={!signedIn || saving || teacherApplicationStatus === "pending"}>
            <legend>Saya mendaftar sebagai</legend>
            {[{ value: "guru", title: "Guru", detail: "Mengajar dan membimbing" }, { value: "siswa", title: "Siswa", detail: "Belajar dan berpetualang" }].map((option) => (
              <label className={`complete-profile-role ${role === option.value ? "selected" : ""}`} key={option.value}>
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => {
                    setRole(option.value);
                    if (option.value === "siswa") setSubject("");
                  }}
                />
                <span className="complete-profile-radio" aria-hidden="true" />
                <span><strong>{option.title}</strong><small>{option.detail}</small></span>
              </label>
            ))}
          </fieldset>

          {signedIn && !role && (
            <p className="complete-profile-notice" role="status">
              Pilih peran Siswa atau Guru untuk melanjutkan. Pilihan ini akan disimpan saat data dikonfirmasi.
            </p>
          )}

          <label className="complete-profile-field">
            <span>Nama Lengkap</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={255} placeholder="Masukkan nama lengkap Anda" autoComplete="name" required disabled={!signedIn || saving || teacherApplicationStatus === "pending"} />
            <small>Gunakan nama lengkap sesuai identitas Anda.</small>
          </label>

          {role === "guru" && (
            <label className="complete-profile-field">
              <span>Mata Pelajaran</span>
              <select value={subject} onChange={(event) => setSubject(event.target.value)} required disabled={!signedIn || saving || teacherApplicationStatus === "pending"}>
                <option value="" disabled>Pilih mata pelajaran</option>
                {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <small>Pilih mata pelajaran yang Anda ajarkan.</small>
            </label>
          )}

          {error && <p className="complete-profile-error" role="alert">{error}</p>}
          <button className="complete-profile-submit" type="submit" disabled={!signedIn || saving || teacherApplicationStatus === "pending" || !role || fullName.trim().length < 2 || (role === "guru" && !subject)}>
            {saving ? "Menyimpan…" : teacherApplicationStatus === "pending" ? "Menunggu Persetujuan" : "Konfirmasi Data Anda"}
          </button>
        </form>
      </section>
      <section className="complete-profile-art" aria-hidden="true">
        <div className="complete-profile-circle complete-profile-circle-blue" />
        <div className="complete-profile-circle complete-profile-circle-cream" />
        <img className="complete-profile-character" src={RegistrationArt} alt="" />
      </section>
    </main>
  );
}
