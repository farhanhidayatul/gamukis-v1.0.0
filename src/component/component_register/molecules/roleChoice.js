import ProgressBar from "../progressBar";
import { ButtonBack, ButtonNext } from "../atoms";
import "./roleChoice.css";

export const REGISTER_SUBJECTS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPA",
  "IPS",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "Lainnya"
];

const ROLE_OPTIONS = [
  {
    value: "siswa",
    title: "Siswa",
    description: "Langsung aktif untuk bermain dan mengikuti kuis kelas."
  },
  {
    value: "guru",
    title: "Guru",
    description: "Mengajukan akses pengajar (menunggu persetujuan admin)."
  }
];

const RoleChoice = ({
  role,
  fullName,
  subject,
  onChangeRole,
  onChangeFullName,
  onChangeSubject,
  nextStep,
  prevStep,
  disabled = false
}) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const trimmedName = String(fullName || "").trim();
  const trimmedSubject = String(subject || "").trim();

  const isCanProceed =
    normalizedRole === "siswa" ||
    (normalizedRole === "guru" &&
      trimmedName.length >= 2 &&
      trimmedName.length <= 255 &&
      trimmedSubject.length >= 1 &&
      trimmedSubject.length <= 100);

  return (
    <div className="role-choice-form">
      <ProgressBar step={0} currentRoleStep />
      <h2 className="role-choice-title">Pilih Peran Akun</h2>
      <p className="role-choice-subtitle">
        Pilih peran Anda terlebih dahulu sebelum melanjutkan pendaftaran akun.
      </p>

      <fieldset className="role-choice-cards" disabled={disabled}>
        <legend className="role-choice-legend">Peran Pengguna</legend>
        {ROLE_OPTIONS.map((option) => {
          const isSelected = normalizedRole === option.value;
          return (
            <label
              key={option.value}
              className={`role-choice-card ${isSelected ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="register-role"
                value={option.value}
                checked={isSelected}
                onChange={() => onChangeRole(option.value)}
              />
              <span className="role-choice-radio" aria-hidden="true" />
              <span className="role-choice-text">
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          );
        })}
      </fieldset>

      {normalizedRole === "guru" && (
        <div className="role-choice-guru-panel">
          <div className="role-choice-pending-hint" role="status">
            <strong>Sedang Proses / Menunggu Persetujuan Admin:</strong> Akses Guru akan aktif setelah disetujui oleh administrator.
          </div>

          <label className="role-choice-field">
            <span>Nama Lengkap Pengajar</span>
            <input
              type="text"
              placeholder="Masukkan nama lengkap (minimal 2 karakter)"
              value={fullName}
              maxLength={255}
              onChange={(event) => onChangeFullName(event.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="role-choice-field">
            <span>Mata Pelajaran</span>
            <select
              value={subject}
              onChange={(event) => onChangeSubject(event.target.value)}
              disabled={disabled}
            >
              <option value="">Pilih mata pelajaran</option>
              {REGISTER_SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="register-action-group">
        {typeof prevStep === "function" && <ButtonBack onClick={prevStep} />}
        <ButtonNext
          onClick={() => isCanProceed && nextStep()}
          disabled={disabled || !isCanProceed}
        />
      </div>
    </div>
  );
};

export default RoleChoice;
