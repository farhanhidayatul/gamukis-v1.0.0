import React from "react";

const ProfileSaveButton = ({ isSaving, disabled = false }) => (
  <button type="submit" className="profile-save-button" disabled={isSaving || disabled}>
    {isSaving ? "Menyimpan..." : "Simpan perubahan"}
  </button>
);

export default ProfileSaveButton;
