import React from "react";
import ProfileField from "../atoms/ProfileField";
import ProfileSaveButton from "../atoms/ProfileSaveButton";

const ProfileForm = ({ profile, disabled, onChange, onSubmit, isSaving, message }) => (
  <form className="profile-form" onSubmit={onSubmit}>
    <ProfileField
      name="gender"
      label="Jenis kelamin"
      value={profile.gender}
      onChange={onChange}
      placeholder="Contoh: Laki-laki"
      disabled={disabled || isSaving}
    />
    <ProfileField
      name="birthDate"
      label="Tanggal lahir"
      value={profile.birthDate}
      onChange={onChange}
      inputMode="numeric"
      placeholder="DDMMYYYY"
      maxLength={8}
      required
      pattern="[0-9]{8}"
      title="Masukkan tanggal yang valid dengan format DDMMYYYY."
      disabled={disabled || isSaving}
    />
    <ProfileField
      name="school"
      label="Sekolah"
      value={profile.school}
      onChange={onChange}
      placeholder="Nama sekolah"
      disabled={disabled || isSaving}
    />
    <ProfileField
      name="address"
      label="Alamat"
      value={profile.address}
      onChange={onChange}
      placeholder="Alamat tempat tinggal"
      rows={3}
      isMultiline
      className="profile-form-wide"
      disabled={disabled || isSaving}
    />
    <div className="profile-form-footer">
      {message && <p className="profile-form-message" role="status">{message}</p>}
      <ProfileSaveButton isSaving={isSaving} disabled={disabled} />
    </div>
  </form>
);

export default ProfileForm;
