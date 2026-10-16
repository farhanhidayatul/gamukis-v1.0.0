import React from "react";
import DefaultProfile from "../../images/people-profile.png";

const ProfileHero = ({ user, onEdit, onCustomize }) => {
  const displayName = user?.displayName || user?.username || user?.email?.split("@")[0] || "Pengguna";
  const profileImage = user?.photoURL || DefaultProfile;

  return (
    <section className="profile-hero">
      <img className="profile-hero-image" src={profileImage} alt={`Profil ${displayName}`} />
      <div className="profile-hero-copy">
        <span className="profile-eyebrow">Profil GAMUKIS</span>
        <h1>{displayName}</h1>
        <p>{user?.email || "Akun pengguna"}</p>
      </div>
      <div className="profile-hero-actions">
        <button type="button" className="profile-edit-button" onClick={onEdit}>
          Edit profil
        </button>
        <button type="button" className="profile-edit-button secondary" onClick={onCustomize}>
          Kustomisasi karakter
        </button>
      </div>
    </section>
  );
};

export default ProfileHero;
