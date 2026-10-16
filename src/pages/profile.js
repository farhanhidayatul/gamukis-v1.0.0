import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import { auth, onAuthStateChanged } from "../database/firebaseAuth";
import { getManualAccount, getManualProfile, getManualUser, saveManualProfile, updateManualRole } from "../database/manualAuth";
import { getBackendAccount, getBackendProfile, saveBackendProfile, updateBackendRole } from "../database/firebaseDatabase";
import ProfileHero from "../component/component_profile/profileHero";
import ProfileSummary from "../component/component_profile/profileSummary";
import ProfileAchievements from "../component/component_profile/profileAchievements";
import ProfileDetails from "../component/component_profile/profileDetails";
import "./profile.css";

const emptyProfile = { gender: "", birthDate: "", school: "", address: "" };

const formatBirthDateInput = (value) => {
  const date = String(value || "").trim();
  if (/^\d{8}$/.test(date)) return date;
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.slice(0, 10).split("-");
    return `${day}${month}${year}`;
  }
  return "";
};

const normalizeProfile = (value = {}) => ({
  gender: value.gender || "",
  birthDate: formatBirthDateInput(value.birthDate ?? value.birth_date),
  school: value.school || value.school_name || "",
  address: value.address || ""
});

const isValidBirthDate = (value) => {
  if (!/^\d{8}$/.test(value)) return false;
  const day = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const year = Number(value.slice(4, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const Profile = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseAccount, setFirebaseAccount] = useState(null);
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [profile, setProfile] = useState(emptyProfile);
  const [loadedProfileAccount, setLoadedProfileAccount] = useState("");
  const [profileLoadError, setProfileLoadError] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => onAuthStateChanged(auth, setFirebaseUser), []);

  useEffect(() => {
    let isCurrent = true;
    if (!firebaseUser || firebaseUser.isAnonymous) {
      setFirebaseAccount(null);
      if (manualUser?.id) {
        getManualAccount()
          .then((response) => {
            if (isCurrent && response?.user) setManualUser((current) => ({ ...current, ...response.user }));
          })
          .catch(() => {});
      }
      return undefined;
    }

    getBackendAccount()
      .then((response) => {
        if (isCurrent) setFirebaseAccount(response?.user || null);
      })
      .catch(() => {
        if (isCurrent) setFirebaseAccount(null);
      });

    return () => {
      isCurrent = false;
    };
  }, [firebaseUser, manualUser?.id]);

  const isFirebaseAccount = Boolean(firebaseUser && !firebaseUser.isAnonymous);
  const profileAccountKey = isFirebaseAccount
    ? `firebase:${firebaseUser.uid}`
    : manualUser?.id
      ? `manual:${manualUser.id}`
      : "";
  const profileReadyForCurrentAccount = loadedProfileAccount === profileAccountKey && Boolean(profileAccountKey);
  const visibleProfile = profileReadyForCurrentAccount ? profile : emptyProfile;

  useEffect(() => {
    let isCurrent = true;
    setProfile(emptyProfile);
    setLoadedProfileAccount("");
    setProfileLoadError("");
    setMessage("");

    if (!profileAccountKey) {
      setIsProfileLoading(false);
      return undefined;
    }

    setIsProfileLoading(true);
    const loadProfile = isFirebaseAccount ? getBackendProfile : getManualProfile;
    loadProfile()
      .then((response) => {
        if (!isCurrent) return;
        setProfile(normalizeProfile(response?.profile));
        setLoadedProfileAccount(profileAccountKey);
      })
      .catch((error) => {
        if (isCurrent) setProfileLoadError(error.message || "Profil gagal dimuat.");
      })
      .finally(() => {
        if (isCurrent) setIsProfileLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [firebaseUser, isFirebaseAccount, manualUser?.id, manualUser?.email, profileAccountKey, profileReloadKey]);

  useEffect(() => {
    const refreshUser = () => setManualUser(getManualUser());
    window.addEventListener("gamukis-manual-auth-change", refreshUser);
    return () => window.removeEventListener("gamukis-manual-auth-change", refreshUser);
  }, []);

  const activeUser = firebaseUser && !firebaseUser.isAnonymous
    ? { ...firebaseUser, ...(firebaseAccount || {}), role: firebaseAccount?.role ?? null }
    : manualUser;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: name === "birthDate" ? value.replace(/\D/g, "").slice(0, 8) : value }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isProfileLoading || profileLoadError || loadedProfileAccount !== profileAccountKey) return;
    if (!isValidBirthDate(profile.birthDate)) {
      setMessage("Tanggal lahir harus berupa tanggal yang valid dengan format DDMMYYYY.");
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        await saveBackendProfile(profile);
      } else {
        await saveManualProfile(profile);
      }
      setMessage("Profil berhasil disimpan.");
    } catch (error) {
      setMessage(error.message || "Profil gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleSave = async (roleData) => {
    setIsRoleSaving(true);
    try {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        const result = await updateBackendRole(roleData);
        setFirebaseAccount(result?.user || ((current) => ({
          ...current,
          role: roleData.role,
          subject: roleData.role === "guru" ? roleData.subject : ""
        })));
        return result;
      } else {
        const updatedUser = await updateManualRole(roleData);
        // Perbarui data user di localStorage/sessionStorage jika manual auth mengembalikan user terbaru
        if (updatedUser?.user) {
          setManualUser(updatedUser.user);
        }
        return updatedUser;
      }
    } finally {
      setIsRoleSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">
        {!activeUser ? (
          <section className="profile-auth-message">
            <h1>Profil belum tersedia</h1>
            <p>Silakan masuk terlebih dahulu untuk melihat dan melengkapi profil.</p>
          </section>
        ) : (
          <>
            <ProfileHero
              user={activeUser}
              onEdit={() => document.getElementById("profile-details")?.scrollIntoView({ behavior: "smooth" })}
              onCustomize={() => navigate('/character-customization')}
            />
            <div className="profile-content">
              <ProfileSummary user={activeUser} />
              <ProfileAchievements user={activeUser} />
              <ProfileDetails
                profile={visibleProfile}
                profileDisabled={isProfileLoading || Boolean(profileLoadError) || !profileReadyForCurrentAccount}
                profileLoading={isProfileLoading}
                profileLoadError={profileLoadError}
                onRetryProfile={() => {
                  setProfileLoadError("");
                  setLoadedProfileAccount("");
                  setIsProfileLoading(true);
                  setProfileReloadKey((current) => current + 1);
                }}
                onChange={handleChange}
                onSubmit={handleSubmit}
                isSaving={isSaving}
                message={message}
                user={activeUser}
                onRoleSave={handleRoleSave}
                isRoleSaving={isRoleSaving}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
