import React, { useEffect, useState } from "react";
import "./stats.css";
import { auth, onAuthStateChanged } from "../../database/firebaseAuth";
import { getManualUser, getManualProfile } from "../../database/manualAuth";
import { getBackendAccount, getBackendProfile } from "../../database/firebaseDatabase";
import { fetchUserGameStats } from "../../database/leaderboardData";
import { calculateExpTierProgress } from "../../utils/expRankSystem";
import DefaultProfile from "../../images/people-profile.png";

// Assets lencana & medal resolusi tinggi
import lencanaNewbie from "../../images/lencana_newbie_resolusi_tinggi.png";
import lencanaRookie from "../../images/lencana_rookie_resolusi_tinggi.png";
import lencanaCommon from "../../images/lencana_common_resolusi_tinggi.png";
import lencanaBeginner from "../../images/lencana_beginner_resolusi_tinggi.png";
import lencanaLegendary from "../../images/lencana_legendary_resolusi_tinggi.png";

// Rank bar badges
import rankBadgeNewbie from "../../images/RANK_NEWBIE.png";
import rankBadgeRookie from "../../images/Rank_Rookie.png";
import rankBadgeCommon from "../../images/Rank_Common.png";
import rankBadgeBeginner from "../../images/Rank_Begginer.png";
import rankBadgeLegendary from "../../images/RANK_LEGENDARY.png";

// Level tiers definition: Newbie (1-5), Rookie (1-5), Common (1-5), Beginner (1-5), Legendary (1-5)
const RANKS = [
  {
    id: "newbie",
    name: "Newbie",
    nextName: "Rookie",
    minGames: 0,
    maxGames: 5,
    badge: rankBadgeNewbie,
    medal: lencanaNewbie,
    themeClass: "newbie"
  },
  {
    id: "rookie",
    name: "Rookie",
    nextName: "Common",
    minGames: 5,
    maxGames: 15,
    badge: rankBadgeRookie,
    medal: lencanaRookie,
    themeClass: "rookie"
  },
  {
    id: "common",
    name: "Common",
    nextName: "Beginner",
    minGames: 15,
    maxGames: 30,
    badge: rankBadgeCommon,
    medal: lencanaCommon,
    themeClass: "common"
  },
  {
    id: "beginner",
    name: "Beginner",
    nextName: "Legendary",
    minGames: 30,
    maxGames: 55,
    badge: rankBadgeBeginner,
    medal: lencanaBeginner,
    themeClass: "beginner"
  },
  {
    id: "legendary",
    name: "Legendary",
    nextName: "Max",
    minGames: 55,
    maxGames: 100,
    badge: rankBadgeLegendary,
    medal: lencanaLegendary,
    themeClass: "legendary"
  }
];

export const calculateTierProgress = (gamesPlayed) => {
  const count = Math.max(0, parseInt(gamesPlayed, 10) || 0);

  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (count >= RANKS[i].minGames) {
      currentRank = RANKS[i];
      break;
    }
  }

  const rankRange = currentRank.maxGames - currentRank.minGames;
  const progressInRank = Math.min(rankRange, Math.max(0, count - currentRank.minGames));
  const subTierStep = rankRange / 5;
  const subTier = Math.min(5, Math.floor(progressInRank / subTierStep) + 1);

  const subTierStart = (subTier - 1) * subTierStep;
  const progressInSubTier = Math.min(subTierStep, Math.max(0, progressInRank - subTierStart));
  const percent = Math.min(100, Math.round((progressInSubTier / subTierStep) * 100));

  const nextSubTierName = subTier < 5
    ? `${currentRank.name} ${subTier + 1}`
    : (currentRank.nextName !== "Max" ? `${currentRank.nextName} 1` : "Max");

  return {
    rankId: currentRank.id,
    rankName: currentRank.name,
    subTier,
    fullRankName: `${currentRank.name} ${subTier}`,
    nextRankName: nextSubTierName,
    percent,
    gamesPlayed: count,
    badgeImg: currentRank.badge,
    medalImg: currentRank.medal,
    themeClass: currentRank.themeClass
  };
};

const Stats = ({
  isGuest,
  isLoggedIn,
  onLoginClick,
  onRegisterClick
} = {}) => {
  const [firebaseUser, setFirebaseUser] = useState(() => {
    const fb = auth?.currentUser;
    return fb && !fb.isAnonymous ? fb : null;
  });
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [profileDetail, setProfileDetail] = useState(null);
  const [gameStats, setGameStats] = useState(() => {
    let initialExp = null;
    if (typeof window !== "undefined") {
      try {
        const manual = getManualUser();
        const fb = auth?.currentUser;
        const acc = (fb && !fb.isAnonymous ? fb : null) || manual;
        const uid = acc?.uid || acc?.id;
        const stored = (uid && window.localStorage.getItem(`gamukis_user_exp_${uid}`))
          || window.localStorage.getItem("gamukis_user_accumulated_exp");
        if (stored !== null) {
          initialExp = Math.max(0, parseInt(stored, 10) || 0);
        }
      } catch (e) {}
    }
    return {
      gamesPlayed: 0,
      totalScore: 0,
      maxScore: 0,
      avgAccuracy: 0,
      totalExp: initialExp,
      exp: initialExp
    };
  });

  // Track Firebase auth state
  useEffect(() => {
    if (typeof onAuthStateChanged === "function" && auth) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user && !user.isAnonymous ? user : null);
        });
        return unsubscribe;
      } catch (e) {}
    }
  }, []);

  // Track manual auth storage changes & EXP synchronization
  useEffect(() => {
    const refreshManualUser = () => setManualUser(getManualUser());
    const handleStorageChange = (e) => {
      if (e.key === "gamukis_manual_user" || e.key === "gamukis_manual_token") {
        refreshManualUser();
      }
      if (e.key === "gamukis_user_accumulated_exp" || (e.key && e.key.startsWith("gamukis_user_exp_"))) {
        const val = Math.max(0, parseInt(e.newValue, 10) || 0);
        setGameStats((prev) => ({ ...prev, totalExp: val, exp: val }));
      }
    };
    const handleExpUpdated = (e) => {
      if (e?.detail?.exp !== undefined && e.detail.exp !== null) {
        const val = Math.max(0, parseInt(e.detail.exp, 10) || 0);
        setGameStats((prev) => ({ ...prev, totalExp: val, exp: val }));
      }
    };

    window.addEventListener("gamukis-manual-auth-change", refreshManualUser);
    window.addEventListener("gamukis-exp-updated", handleExpUpdated);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("gamukis-manual-auth-change", refreshManualUser);
      window.removeEventListener("gamukis-exp-updated", handleExpUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch detailed profile (school, class, etc.) and game stats
  useEffect(() => {
    let isCurrent = true;
    const activeAccount = firebaseUser || manualUser;

    if (!activeAccount) {
      setProfileDetail(null);
      // For guest/offline mode, fallback to anonymous cache stats if available
      try {
        let guestExp = 0;
        const stored = window.localStorage?.getItem("gamukis_user_accumulated_exp");
        if (stored !== null) {
          guestExp = Math.max(0, parseInt(stored, 10) || 0);
        }
        const lastResult = window.sessionStorage?.getItem("gamukis_last_game_result");
        if (lastResult) {
          const parsed = JSON.parse(lastResult);
          if (parsed && isCurrent) {
            setGameStats({
              gamesPlayed: 1,
              totalScore: parsed.coins ? parsed.coins * 5 : 0,
              maxScore: parsed.coins ? parsed.coins * 5 : 0,
              avgAccuracy: 0,
              totalExp: guestExp,
              exp: guestExp
            });
          }
        } else if (guestExp > 0 && isCurrent) {
          setGameStats((prev) => ({ ...prev, totalExp: guestExp, exp: guestExp }));
        }
      } catch (e) {}
      return undefined;
    }

    const userId = activeAccount.uid || activeAccount.id;
    const isFirebase = Boolean(firebaseUser);

    // Cek localStorage segera untuk sinkronisasi instan sebelum fetch selesai
    try {
      const stored = window.localStorage?.getItem(`gamukis_user_exp_${userId}`)
        || window.localStorage?.getItem("gamukis_user_accumulated_exp");
      if (stored !== null) {
        const expVal = Math.max(0, parseInt(stored, 10) || 0);
        setGameStats((prev) => ({ ...prev, totalExp: expVal, exp: expVal }));
      }
    } catch (e) {}

    // 1. Fetch user detailed profile
    const loadProfile = isFirebase ? getBackendProfile : getManualProfile;
    const profilePromise = typeof loadProfile === 'function' ? loadProfile() : null;
    if (profilePromise && typeof profilePromise.then === 'function') {
      profilePromise
        .then((res) => {
          if (isCurrent && res?.profile) {
            setProfileDetail(res.profile);
          }
        })
        .catch(() => {});
    }

    // Also check account info from getBackendAccount / getManualAccount
    if (isFirebase && typeof getBackendAccount === 'function') {
      const accountPromise = getBackendAccount();
      if (accountPromise && typeof accountPromise.then === 'function') {
        accountPromise
          .then((res) => {
            if (isCurrent && res?.user) {
              setProfileDetail((prev) => ({
                ...(prev || {}),
                fullName: res.user.fullName || res.user.full_name || prev?.fullName,
                school: res.user.school || res.user.school_name || prev?.school
              }));
            }
          })
          .catch(() => {});
      }
    }

    // 2. Fetch game stats from backend match history
    const statsPromise = typeof fetchUserGameStats === 'function' ? fetchUserGameStats(userId) : null;
    if (statsPromise && typeof statsPromise.then === 'function') {
      statsPromise
        .then((stats) => {
          if (isCurrent && stats) {
            setGameStats((prev) => {
              let resolvedExp = stats.totalExp !== undefined && stats.totalExp !== null
                ? Number(stats.totalExp)
                : (stats.exp !== undefined && stats.exp !== null ? Number(stats.exp) : null);

              try {
                const stored = window.localStorage?.getItem(`gamukis_user_exp_${userId}`)
                  || window.localStorage?.getItem("gamukis_user_accumulated_exp");
                if (stored !== null) {
                  const localVal = Math.max(0, parseInt(stored, 10) || 0);
                  if (resolvedExp === null || localVal > resolvedExp) {
                    resolvedExp = localVal;
                  }
                }
              } catch (e) {}

              if (resolvedExp === null) {
                resolvedExp = prev.totalExp !== undefined ? prev.totalExp : null;
              }

              return {
                ...stats,
                totalExp: resolvedExp,
                exp: resolvedExp
              };
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      isCurrent = false;
    };
  }, [firebaseUser, manualUser]);

  const activeAccount = firebaseUser || manualUser;

  // Resolve display name prioritizing profile full name, displayName, username, or fallback
  const displayName =
    profileDetail?.fullName?.trim() ||
    profileDetail?.full_name?.trim() ||
    activeAccount?.displayName?.trim() ||
    activeAccount?.username?.trim() ||
    activeAccount?.email?.split("@")[0] ||
    "Ahmad Syarukan";

  // Resolve school / education info prioritizing profile school, account school, or fallback
  const schoolName =
    profileDetail?.school?.trim() ||
    profileDetail?.school_name?.trim() ||
    activeAccount?.school?.trim() ||
    activeAccount?.school_name?.trim() ||
    (activeAccount ? "Belum ada sekolah" : "SMA Negeri 1 Cangkringan - VIII IPA 1");

  // Resolve profile image prioritizing user's photoURL, then DefaultProfile, or char-man-1 svg fallback
  const profileImage =
    activeAccount?.photoURL ||
    profileDetail?.picture ||
    (activeAccount ? DefaultProfile : require("../../images/char-man-1.svg").default);

  const isDefaultSvg = !activeAccount?.photoURL && !profileDetail?.picture && !activeAccount;

  // Resolve user total EXP from backend gameStats or localStorage cache
  const resolvedExp = (() => {
    if (gameStats?.totalExp !== undefined && gameStats.totalExp !== null) {
      return Number(gameStats.totalExp);
    }
    if (gameStats?.exp !== undefined && gameStats.exp !== null) {
      return Number(gameStats.exp);
    }
    if (typeof window !== "undefined") {
      try {
        const userId = activeAccount?.uid || activeAccount?.id;
        const stored = (userId && window.localStorage.getItem(`gamukis_user_exp_${userId}`))
          || window.localStorage.getItem("gamukis_user_accumulated_exp");
        if (stored !== null) {
          return Math.max(0, parseInt(stored, 10) || 0);
        }
      } catch (e) {}
    }
    if (gameStats?.totalScore || gameStats?.totalCoins) {
      return (Number(gameStats.totalScore) || 0) + (Number(gameStats.totalCoins) ? Number(gameStats.totalCoins) * 5 : 0);
    }
    return null;
  })();

  // Compute tier progress based on accumulated EXP, or fallback to gamesPlayed count
  const progress = resolvedExp !== null
    ? calculateExpTierProgress(resolvedExp)
    : calculateTierProgress(gameStats.gamesPlayed);

  const isUserGuest = (() => {
    if (isGuest !== undefined && isGuest !== null) {
      return Boolean(isGuest);
    }
    if (isLoggedIn !== undefined && isLoggedIn !== null) {
      return !isLoggedIn;
    }
    return !activeAccount;
  })();

  const handleLoginClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onLoginClick === 'function') {
      onLoginClick();
    } else if (typeof window !== 'undefined' && window.location) {
      try {
        window.location.href = '/login';
      } catch (e) {}
    }
  };

  const handleRegisterClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onRegisterClick === 'function') {
      onRegisterClick();
    } else if (typeof window !== 'undefined' && window.location) {
      try {
        window.location.href = '/register';
      } catch (e) {}
    }
  };

  return (
    <section className="stats" aria-labelledby="stats-title">
      <h1 id="stats-title">Pencapaian</h1>
      <div className={`stats-card ${isUserGuest ? "stats-guest-mode" : ""}`} data-testid="stats-card">
        <div
          className={`stats-card-body ${isUserGuest ? "is-blurred" : ""}`}
          aria-hidden={isUserGuest ? "true" : undefined}
        >
          <div className="stats-avatar" aria-hidden="true">
            <img
              src={profileImage}
              alt={`Profil ${displayName}`}
              className={!isDefaultSvg ? "stats-avatar-img-photo" : ""}
              draggable="false"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DefaultProfile;
              }}
            />
          </div>

          <div className="stats-profile">
            <h2>{displayName}</h2>
            <p>{schoolName}</p>
            <span className={`stats-rank rank-${progress.themeClass}`}>
              {progress.badgeImg && (
                <img
                  src={progress.badgeImg}
                  alt={progress.fullRankName}
                  className="stats-rank-icon img-crisp-hires"
                  draggable="false"
                />
              )}
              {progress.fullRankName}
            </span>
          </div>

          <div className="stats-progress">
            <div className="stats-progress-label">
              <span>Level up!</span>
              <strong className={`text-${progress.themeClass}`}>{progress.percent}%</strong>
              <span>to {progress.nextRankName}</span>
            </div>
            <div
              className="stats-progress-track"
              role="progressbar"
              aria-label={`Progress menuju level ${progress.nextRankName}`}
              aria-valuenow={progress.percent}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span
                className={`stats-progress-value bar-${progress.themeClass}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <img
            className="stats-medal"
            src={progress.medalImg || require("../../images/Icon-Win-1.png")}
            alt={`Lencana ${progress.fullRankName}`}
            draggable="false"
          />
        </div>

        {/* Overlay Tombol Login / Registrasi jika belum login */}
        {isUserGuest && (
          <div
            className="stats-guest-overlay rank-guest-overlay"
            onClick={(e) => e.stopPropagation()}
            data-testid="stats-guest-overlay"
          >
            <div className="stats-guest-lock-pill rank-guest-lock-pill">
              <span className="stats-lock-icon rank-lock-icon" aria-hidden="true">🔒</span>
              <span>Fitur Pencapaian Terkunci</span>
            </div>
            <h3 className="stats-guest-title rank-guest-title">Login untuk Melihat Pencapaian</h3>
            <p className="stats-guest-desc rank-guest-desc">
              Masuk atau daftar akun untuk menyimpan progres EXP, meningkatkan level rank, dan memantau pencapaian belajar Anda!
            </p>
            <div className="stats-guest-buttons">
              <button
                type="button"
                className="stats-guest-login-btn rank-guest-login-btn"
                onClick={handleLoginClick}
                data-testid="stats-login-button"
              >
                <span className="stats-login-btn-icon rank-login-btn-icon" aria-hidden="true">🚀</span>
                <span>Login untuk Melihat Pencapaian</span>
              </button>
              <button
                type="button"
                className="stats-guest-register-btn"
                onClick={handleRegisterClick}
                data-testid="stats-register-button"
              >
                <span>Daftar Akun Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Stats;