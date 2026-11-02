import React, { useState, useEffect } from "react";
import { auth, onAuthStateChanged } from "../../database/firebaseAuth";
import { getManualUser } from "../../database/manualAuth";
import { fetchLeaderboard } from "../../database/leaderboardData";
import "./leaderboard.css";
import No1 from "../../images/Icon-Win-1.png";
import No2 from "../../images/Icon-win-2.png";
import No3 from "../../images/Icon-win-3.png";
import DefaultProfile from "../../images/people-profile.png";

/**
 * Calculates star rating (0 to 5) based on answer accuracy.
 * Rule: "setiap 1 bintang itu 20% dari total yang di jawab benar"
 */
export const calculateStarCount = (accuracy) => {
  if (accuracy === null || accuracy === undefined) return 0;
  const num = Number(accuracy);
  if (isNaN(num) || num <= 0) return 0;
  return Math.min(5, Math.max(0, Math.floor(num / 20)));
};

/**
 * Formats a player's display name on the leaderboard.
 * Unauthenticated / guest players whose names are raw IDs or numbers default to "Guest" or "Unknown".
 * Renamed or registered players display their custom or account names.
 */
export const formatLeaderboardPlayerName = (player) => {
  if (!player) return 'Unknown';
  const name = typeof player === 'string' ? player : (player.name || player.username || '');
  const trimmed = String(name).trim();

  // If empty or explicitly Unknown/Guest
  if (!trimmed) return 'Guest';
  if (/^(unknown|guest)$/i.test(trimmed)) return 'Guest';

  // Check if player is a guest or unauthenticated
  const isGuest = Boolean(
    player.isGuest ||
    player.authType === 'guest' ||
    (typeof player.id === 'string' && player.id.startsWith('guest_'))
  );

  // If guest, check if the name matches raw IDs or numeric/random patterns
  if (isGuest) {
    if (player.hasCustomName || player.isRenamed) {
      return trimmed;
    }
    if (/^guest[_-]?\d+/i.test(trimmed) || /^\d{5,}$/.test(trimmed) || /^[0-9a-f]{8,}$/i.test(trimmed)) {
      return 'Guest';
    }
    return trimmed;
  }

  // If registered or legacy player, check if name is raw guest ID format
  if (/^guest[_-]?\d+/i.test(trimmed) || /^\d{6,}$/.test(trimmed) || /^[0-9a-f]{16,}$/i.test(trimmed)) {
    return 'Guest';
  }

  return trimmed;
};

const dedupeAndSortPlayers = (rawPlayers) => {
  const list = typeof rawPlayers === 'object' && rawPlayers !== null
    ? (Array.isArray(rawPlayers) ? rawPlayers : Object.values(rawPlayers))
    : [];
  const byId = new Map();
  const bySessionId = new Map();

  list.filter(Boolean).forEach((p, idx) => {
    const rawCoins = p.coins !== undefined ? p.coins : (p.score !== undefined ? p.score : 0);
    const coins = Math.max(0, Number(rawCoins) || 0);
    const key = String(p.id || p.userId || `idx_${idx}`);
    const normalized = {
      ...p,
      id: key,
      name: p.name || p.username || 'Guest',
      coins,
      profilePic: p.profilePic || p.avatarUrl || null,
      accuracy: p.accuracy !== undefined ? Number(p.accuracy) : null
    };

    if (p.sessionId && bySessionId.has(p.sessionId)) {
      const prevKey = bySessionId.get(p.sessionId);
      const prev = byId.get(prevKey);
      if (coins >= (Number(prev?.coins) || 0)) {
        byId.delete(prevKey);
        byId.set(key, normalized);
        bySessionId.set(p.sessionId, key);
      }
      return;
    }
    const existing = byId.get(key);
    if (!existing || coins >= (Number(existing.coins) || 0)) {
      byId.set(key, normalized);
      if (p.sessionId) bySessionId.set(p.sessionId, key);
    }
  });

  return Array.from(byId.values()).sort(
    (a, b) => ((b && b.coins) || 0) - ((a && a.coins) || 0)
  );
};

const Leaderboard = ({
  page,
  playersData,
  playerId: propPlayerId,
  currentUserId: propUserId,
  sessionAnswers = null,
  playerName: propPlayerName = null,
  playerCoins: propCoins = null
}) => {
  const [players, setPlayers] = useState([]);
  const [globalTopPlayers, setGlobalTopPlayers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerHeight && window.innerHeight <= 450) {
      return true;
    }
    return false;
  });
  const isInGame = page !== "gamePage";

  useEffect(() => {
    let unsubscribe = null;
    if (typeof onAuthStateChanged === 'function') {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserId(user.uid);
        } else {
          const manual = getManualUser();
          setCurrentUserId(manual ? (manual.id ? String(manual.id) : null) : null);
        }
      });
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch all-time top players from MySQL leaderboard
  useEffect(() => {
    let isMounted = true;
    const loadGlobal = () => {
      if (typeof fetchLeaderboard !== 'function') return;
      const promise = fetchLeaderboard('alltime', 10);
      if (!promise || typeof promise.then !== 'function') return;
      promise
        .then((data) => {
          if (!isMounted || !Array.isArray(data?.leaderboard)) return;
          const mapped = data.leaderboard.map((item, idx) => ({
            id: item.userId ? String(item.userId) : `top_${idx}`,
            name: item.username || item.name || 'Player',
            coins: Number(item.coins !== undefined ? item.coins : item.score) || 0,
            profilePic: item.avatarUrl || item.profilePic || null,
            accuracy: item.accuracy !== undefined ? Number(item.accuracy) : null,
            isGuest: false
          }));
          setGlobalTopPlayers(mapped);
        })
        .catch(() => {});
    };

    loadGlobal();
    const timer = window.setInterval(loadGlobal, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (playersData && playersData.length > 0) {
      const activeSorted = dedupeAndSortPlayers(playersData);
      if (activeSorted.length < 5 && globalTopPlayers.length > 0) {
        const existingNames = new Set(activeSorted.map((p) => (p.name || p.username || '').toLowerCase()));
        const existingIds = new Set(activeSorted.map((p) => String(p.id)));
        const fillers = globalTopPlayers.filter((g) => (
          !existingIds.has(String(g.id)) && !existingNames.has((g.name || '').toLowerCase())
        ));
        const merged = activeSorted.concat(fillers.slice(0, 5 - activeSorted.length));
        setPlayers(dedupeAndSortPlayers(merged));
      } else {
        setPlayers(activeSorted);
      }
      return;
    }

    if (playersData && playersData.length === 0) {
      if (globalTopPlayers.length > 0) {
        setPlayers(dedupeAndSortPlayers(globalTopPlayers));
      } else if (isInGame && (propPlayerName || propPlayerId || currentUserId)) {
        // Optimistic inGame self fallback so leaderboard list never appears completely blank
        const selfEntry = {
          id: propPlayerId || currentUserId || 'self',
          name: propPlayerName || getManualUser()?.username || 'Pemain',
          coins: Number(propCoins) || 0,
          accuracy: null,
          isGuest: false
        };
        setPlayers([selfEntry]);
      }
      return;
    }

    if (globalTopPlayers.length > 0) {
      setPlayers(dedupeAndSortPlayers(globalTopPlayers));
    } else if (isInGame && (propPlayerName || propPlayerId || currentUserId)) {
      const selfEntry = {
        id: propPlayerId || currentUserId || 'self',
        name: propPlayerName || getManualUser()?.username || 'Pemain',
        coins: Number(propCoins) || 0,
        accuracy: null,
        isGuest: false
      };
      setPlayers([selfEntry]);
    }
  }, [playersData, globalTopPlayers, isInGame, propPlayerName, propPlayerId, currentUserId, propCoins]);

  const effectiveSelfId = propPlayerId || propUserId || currentUserId;
  const effectiveSelfName = (propPlayerName || getManualUser()?.username || '').trim().toLowerCase();

  const playerSelf = players.find((player) => {
    if (!player) return false;
    if (effectiveSelfId && (
      player.id === effectiveSelfId ||
      (typeof effectiveSelfId === 'string' && (player.id === `manual_${effectiveSelfId}` || player.id === effectiveSelfId.replace('manual_', '')))
    )) {
      return true;
    }
    if (effectiveSelfName && (player.name || player.username || '').trim().toLowerCase() === effectiveSelfName) {
      return true;
    }
    return false;
  }) || null;

  const playerRank = playerSelf ? players.findIndex((player) => player.id === playerSelf.id) + 1 : null;

  // Calculates answer accuracy for a player
  const getPlayerAccuracy = (player, isSelf = false) => {
    if (isSelf && Array.isArray(sessionAnswers) && sessionAnswers.length > 0) {
      const correct = sessionAnswers.filter((a) => a.correct).length;
      return (correct / sessionAnswers.length) * 100;
    }
    if (player?.accuracy !== undefined && player?.accuracy !== null) {
      return Number(player.accuracy) || 0;
    }
    if (player?.correctAnswers !== undefined && player?.totalAnswers) {
      const total = Number(player.totalAnswers) || 0;
      const correct = Number(player.correctAnswers) || 0;
      return total > 0 ? (correct / total) * 100 : 0;
    }
    return 0;
  };

  const renderStars = (accuracy, isRankFourFive = false) => {
    const starCount = calculateStarCount(accuracy);
    return (
      <div
        className="leaderboard-stars"
        title={`Akurasi: ${Math.round(Number(accuracy) || 0)}% (${starCount}/5 Bintang)`}
        data-testid="leaderboard-stars"
      >
        {[0, 1, 2, 3, 4].map((idx) => {
          const isFilled = idx < starCount;
          return (
            <span
              key={idx}
              className={`leaderboard-star ${isFilled ? "star-filled" : isRankFourFive ? "star-empty-dark" : "star-empty"}`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        })}
      </div>
    );
  };

  const selfDisplayName = playerSelf
    ? formatLeaderboardPlayerName(playerSelf)
    : (propPlayerName || (getManualUser()?.username) || 'Pemain');
  const selfCoins = playerSelf
    ? (playerSelf.coins !== undefined ? playerSelf.coins : (Number(propCoins) || 0))
    : (Number(propCoins) || 0);
  const selfAccuracy = getPlayerAccuracy(playerSelf, true);

  return (
    <div
      className={`leaderboard ${
        page === "gamePage" ? "leaderboard-gamePage" : "leaderboard-inGame"
      } ${isInGame && isCollapsed ? "is-collapsed" : ""}`}
      data-testid="gamukis-leaderboard"
    >
      <div
        className="leaderboard-header-row"
        onClick={isInGame ? () => setIsCollapsed((prev) => !prev) : undefined}
        style={isInGame ? { cursor: "pointer" } : undefined}
        title={isInGame ? (isCollapsed ? "Klik untuk membuka Leaderboard" : "Klik untuk melipat Leaderboard") : undefined}
      >
        <h2>Score</h2>
        {isInGame && (
          <span className="leaderboard-collapse-toggle" aria-hidden="true">
            {isCollapsed ? "▼" : "▲"}
          </span>
        )}
      </div>

      {(!isInGame || !isCollapsed) && (
        <>
          <div className="leaderboard-container-text">
            <p className="leaderboard-decs-text-1">
              Lorem Ipsum is simply dummy text of the printing and typesetting .
            </p>
          </div>

          <ul className="leaderboard-list">
            {players.slice(0, 5).map((player, index) => {
              const isTopThree = index < 3;
              const accuracy = getPlayerAccuracy(player, player.id === effectiveSelfId);
              return (
                <li
                  key={player.id}
                  className={`leaderboard-item ${isTopThree ? "item-top-three" : "item-four-five"}`}
                >
                  {/* Nomor / Medali dengan Pita */}
                  <div className="rank-leaderboard">
                    {index === 0 ? (
                      <div className="medal-wrapper gold">
                        <img src={No1} alt="Gold Medal" className="medal" />
                      </div>
                    ) : index === 1 ? (
                      <div className="medal-wrapper silver">
                        <img src={No2} alt="Silver Medal" className="medal" />
                      </div>
                    ) : index === 2 ? (
                      <div className="medal-wrapper bronze">
                        <img src={No3} alt="Bronze Medal" className="medal" />
                      </div>
                    ) : (
                      <span className="rank-number">{index + 1}</span>
                    )}
                  </div>

                  {/* Foto Profil dalam Kotak Krem Lembut */}
                  <div className="profile-container">
                    <div className="profile-out-color">
                      <img
                        src={player.profilePic ? player.profilePic : DefaultProfile}
                        alt="Profile"
                        className="profile-pic"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DefaultProfile;
                        }}
                      />
                    </div>
                  </div>

                  {/* Kapsul Pil Biru / Biru Tua */}
                  <div className={`leaderboard-capsule ${isTopThree ? "capsule-top-three" : "capsule-four-five"}`}>
                    <span className="player-name-text" title={formatLeaderboardPlayerName(player)}>
                      {formatLeaderboardPlayerName(player)}
                    </span>
                    {renderStars(accuracy, !isTopThree)}
                    <span className="player-coins-text">
                      {player.coins}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Kartu Status Pemain Sendiri (Dibingkai Kontur Kuning Tebal Sesuai Mockup) */}
          {isInGame && (
            <div className="self-card-wrapper" data-testid="leaderboard-self-card">
              <div className="rank-leaderboard self-rank">
                <span className="rank-number">{playerRank && playerRank <= 5 ? playerRank : '?'}</span>
              </div>
              <div className="profile-container">
                <div className="profile-out-color">
                  <img
                    src={playerSelf?.profilePic ? playerSelf.profilePic : DefaultProfile}
                    alt="Profile"
                    className="profile-pic"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DefaultProfile;
                    }}
                  />
                </div>
              </div>
              <div className="leaderboard-capsule capsule-self">
                <span className="player-name-text" title={selfDisplayName}>
                  {selfDisplayName}
                </span>
                {renderStars(selfAccuracy, false)}
                <span className="player-coins-text">
                  {selfCoins}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
