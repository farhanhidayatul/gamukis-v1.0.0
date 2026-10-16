import React from "react";

const roleLabel = (role) => {
  if (!role) return "Belum dipilih";
  if (role === "guru") return "Guru";
  if (role === "siswa") return "Siswa";
  if (["admin", "administrator"].includes(role.toLowerCase())) return "Admin";
  return role;
};

const ProfileSummary = ({ user }) => (
  <section className="profile-summary profile-panel">
    <div className="profile-panel-heading">
      <div>
        <span className="profile-eyebrow">Akun aktif</span>
        <h2>Ringkasan akun</h2>
      </div>
      <span className="profile-status">Aktif</span>
    </div>
    <div className="profile-summary-grid">
      <div>
        <span>Nama pengguna</span>
        <strong>{user?.username || user?.displayName || "Belum diatur"}</strong>
      </div>
      <div>
        <span>Email</span>
        <strong>{user?.email || "Belum tersedia"}</strong>
      </div>
      <div>
        <span>Metode masuk</span>
        <strong>
          {user?.authType === "google" ||
          user?.providerId === "google.com" ||
          (Array.isArray(user?.providerData) && user.providerData.some((p) => p?.providerId === "google.com"))
            ? "Google"
            : "Email dan password"}
        </strong>
      </div>
      <div>
        <span>Peran</span>
        <strong className={`profile-role-badge${!user?.role ? " unset" : ""}`}>
          {roleLabel(user?.role)}
        </strong>
      </div>
      {user?.role === "guru" && user?.subject && (
        <div>
          <span>Mata pelajaran</span>
          <strong>{user.subject}</strong>
        </div>
      )}
    </div>
  </section>
);

export default ProfileSummary;

