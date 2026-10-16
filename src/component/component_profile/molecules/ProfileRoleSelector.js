import React, { useEffect, useState } from "react";

const ROLES = [
  { value: "siswa", title: "Siswa", detail: "Belajar dan berpetualang" },
  { value: "guru", title: "Guru", detail: "Mengajar dan membimbing" },
];

const SUBJECTS = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris",
  "IPA", "IPS", "Fisika", "Kimia", "Biologi", "Sejarah", "Lainnya",
];

const ProfileRoleSelector = ({ currentRole, currentSubject, teacherApplication, onSave, isSaving }) => {
  const [role, setRole] = useState(() => (
    ["siswa", "guru"].includes(currentRole) ? currentRole : ""
  ));
  const [subject, setSubject] = useState(currentSubject || "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setRole(["siswa", "guru"].includes(currentRole) ? currentRole : "");
    setSubject(currentSubject || "");
  }, [currentRole, currentSubject]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    try {
      const result = await onSave({ role, subject: role === "guru" ? subject : "" });
      setMessage(result?.teacherApplication?.status === "pending"
        ? "Pengajuan Guru dikirim. Akses Guru aktif setelah disetujui administrator."
        : "Peran berhasil disimpan.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Gagal menyimpan peran. Coba lagi.");
    }
  };

  return (
    <form className="profile-role-form" onSubmit={handleSubmit}>
      {teacherApplication?.status === "pending" && <p className="profile-role-notice" role="status">Pengajuan Guru sedang menunggu persetujuan. Anda dapat memilih peran lagi jika pengajuan ditolak.</p>}
      {teacherApplication?.status === "rejected" && <p className="profile-role-notice" role="status">Pengajuan Guru ditolak. Silakan pilih kembali peran Siswa atau Guru.</p>}
      <fieldset className="profile-role-fieldset" disabled={isSaving || teacherApplication?.status === "pending"}>
        <legend className="profile-role-legend">Saya mendaftar sebagai</legend>
        <div className="profile-role-options">
          {ROLES.map((option) => (
            <label
              key={option.value}
              className={`profile-role-option${role === option.value ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="profile-role"
                value={option.value}
                checked={role === option.value}
                onChange={() => {
                  setRole(option.value);
                  if (option.value === "siswa") setSubject("");
                  setMessage("");
                }}
              />
              <span className="profile-role-radio" aria-hidden="true" />
              <span>
                <strong>{option.title}</strong>
                <small>{option.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!role && (
        <p className="profile-role-notice" role="status">
          Pilih Siswa atau Guru untuk mengaktifkan akses sesuai peran.
        </p>
      )}

      {role === "guru" && (
        <label className="profile-role-subject">
          <span>Mata Pelajaran</span>
          <select
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setMessage("");
            }}
            required
            disabled={isSaving || teacherApplication?.status === "pending"}
          >
            <option value="" disabled>Pilih mata pelajaran</option>
            {SUBJECTS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      )}

      {message && (
        <p
          className={`profile-role-message${isError ? " error" : ""}`}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <button
        className="profile-role-submit"
        type="submit"
        disabled={isSaving || teacherApplication?.status === "pending" || !role || (role === "guru" && !subject)}
      >
        {isSaving ? "Menyimpan…" : teacherApplication?.status === "pending" ? "Menunggu Persetujuan" : "Simpan Peran"}
      </button>
    </form>
  );
};

export default ProfileRoleSelector;
