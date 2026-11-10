import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import { auth, onAuthStateChanged } from "../database/firebaseAuth";
import { getManualAccount, getManualProfile, getManualUser, saveManualProfile, updateManualRole } from "../database/manualAuth";
import { getBackendAccount, getBackendProfile, saveBackendProfile, updateBackendRole } from "../database/firebaseDatabase";
import ProfileHero from "../component/component_profile/profileHero";
import ProfileSummary from "../component/component_profile/profileSummary";
import ProfileAchievements from "../component/component_profile/profileAchievements";
import ProfileDetails from "../component/component_profile/profileDetails";
import SavedCharacterList from "../component/component_customization_char/molecules/SavedCharacterList";
import { fetchCharacters, setActiveCharacter, deleteCharacter } from "../database/characterApi";
import "./profile.css";

const loadStoredAppearance = () => {
  try {
    const raw = window.localStorage.getItem('gamukis_character_appearance');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const rawOutfit = window.localStorage.getItem('gamukis_character_outfit');
    if (rawOutfit) {
      try {
        parsed.outfit = { ...parsed.outfit, ...JSON.parse(rawOutfit) };
      } catch (e) { console.warn("[profile] Fallback:", e?.message || e); }
    }
    return parsed;
  } catch (_e) {
    return null;
  }
};

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
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [maxSlots, setMaxSlots] = useState(5);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [characterFeedback, setCharacterFeedback] = useState("");

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
        if (response?.user) {
          if (isFirebaseAccount) {
            setFirebaseAccount((prev) => ({ ...prev, ...response.user }));
          } else {
            setManualUser((prev) => ({ ...prev, ...response.user }));
          }
        }
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

  const activeUser = useMemo(() => {
    if (firebaseUser && !firebaseUser.isAnonymous) {
      return { ...firebaseUser, ...firebaseAccount, role: firebaseAccount?.role ?? null };
    }
    return manualUser;
  }, [firebaseUser, firebaseAccount, manualUser]);

  const refreshUserCharacters = useCallback(async () => {
    if (!activeUser) return;
    setIsLoadingCharacters(true);
    try {
      const res = await fetchCharacters();
      let list = Array.isArray(res?.characters) ? res.characters : [];
      const localApp = loadStoredAppearance();
      if (list.length === 0 && localApp) {
        list = [{
          id: 'local-1',
          name: 'Karakter Saya',
          data: localApp,
          isActive: true
        }];
      }
      setSavedCharacters(list);
      if (res?.max) setMaxSlots(res.max);
    } catch (e) {
      console.warn("Failed to load user characters in profile:", e.message);
      const localApp = loadStoredAppearance();
      if (localApp) {
        setSavedCharacters([{
          id: 'local-1',
          name: 'Karakter Saya',
          data: localApp,
          isActive: true
        }]);
      }
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [activeUser]);

  useEffect(() => {
    refreshUserCharacters();
  }, [refreshUserCharacters]);

  const activeCharacter = useMemo(() => (
    savedCharacters.find((c) => c.isActive) || savedCharacters[0] || null
  ), [savedCharacters]);

  const handleActivateCharacter = async (id) => {
    try {
      await setActiveCharacter(id);
      const target = savedCharacters.find((c) => c.id === id);
      if (target?.data) {
        window.localStorage.setItem('gamukis_character_appearance', JSON.stringify(target.data));
        if (target.data.outfit) {
          window.localStorage.setItem('gamukis_character_outfit', JSON.stringify(target.data.outfit));
        }
      }
      await refreshUserCharacters();
      setCharacterFeedback("Karakter aktif berhasil diubah!");
      setTimeout(() => setCharacterFeedback(""), 3500);
    } catch (e) {
      setCharacterFeedback(e.message || "Gagal mengaktifkan karakter.");
    }
  };

  const handleDeleteCharacter = async (id) => {
    if (!window.confirm("Yakin ingin menghapus karakter ini?")) return;
    try {
      await deleteCharacter(id);
      await refreshUserCharacters();
      setCharacterFeedback("Karakter berhasil dihapus.");
      setTimeout(() => setCharacterFeedback(""), 3500);
    } catch (e) {
      setCharacterFeedback(e.message || "Gagal menghapus karakter.");
    }
  };

  const handleLoadCharacter = (char) => {
    navigate('/character-customization', { state: { character: char } });
  };

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
            <section className="profile-characters-card" aria-label="Daftar karakter tersimpan">
              {characterFeedback && (
                <div className="profile-character-feedback">
                  {characterFeedback}
                </div>
              )}
              <div className="profile-characters-layout">
                <SavedCharacterList
                  characters={savedCharacters}
                  maxSlots={maxSlots}
                  activeCharacterId={activeCharacter?.id}
                  onActivate={handleActivateCharacter}
                  onLoad={handleLoadCharacter}
                  onDelete={handleDeleteCharacter}
                  isLoading={isLoadingCharacters}
                />
              </div>
            </section>
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
