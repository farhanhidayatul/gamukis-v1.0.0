import React from "react";
import ProfileForm from "./molecules/ProfileForm";
import ProfileRoleSelector from "./molecules/ProfileRoleSelector";

const ProfileDetails = ({ profile, profileDisabled, profileLoading, profileLoadError, onRetryProfile, onChange, onSubmit, isSaving, message, user, onRoleSave, isRoleSaving }) => (
  <section className="profile-details profile-panel" id="profile-details">
    <div className="profile-panel-heading">
      <div>
        <span className="profile-eyebrow">Data diri</span>
        <h2>Lengkapi profilmu</h2>
      </div>
    </div>
    {profileLoading && <p className="profile-form-message" role="status">Memuat data profil…</p>}
    {profileLoadError && (
      <div className="profile-role-message error" role="alert">
        <span>{profileLoadError}</span>{" "}
        <button type="button" className="profile-edit-button" onClick={onRetryProfile}>Coba lagi</button>
      </div>
    )}
    <ProfileForm profile={profile} disabled={profileDisabled} onChange={onChange} onSubmit={onSubmit} isSaving={isSaving} message={message} />

    <div className="profile-role-section">
      <div className="profile-role-section-header">
        <span className="profile-eyebrow">Peran akun</span>
        <h3>Pilih peranmu</h3>
        {!user?.role && (
          <p className="profile-role-notice" role="status">
            ⚠ Kamu belum memilih peran. Pilih peranmu sebagai <strong>Siswa</strong> atau <strong>Guru</strong> untuk mengakses semua fitur.
          </p>
        )}
      </div>
      <ProfileRoleSelector
        currentRole={user?.role}
        currentSubject={user?.subject}
        teacherApplication={user?.teacherApplication}
        onSave={onRoleSave}
        isSaving={isRoleSaving}
      />
    </div>
  </section>
);

export default ProfileDetails;

