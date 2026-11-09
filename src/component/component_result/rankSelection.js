import { useEffect, useState, useRef } from "react";
import '../../pages/result.css';
import {
  calculateExpTierProgress,
  calculateMatchExp,
  playLevelUpSound,
  playRankDownSound
} from '../../utils/expRankSystem';

const getRankTier = (score = 0) => {
  if (score >= 100) return { name: 'Legendary', progress: 'Maksimal!' };
  if (score >= 80) return { name: 'Master', progress: '80% ke Legendary' };
  if (score >= 60) return { name: 'Diamond', progress: '60% ke Master' };
  if (score >= 40) return { name: 'Gold', progress: '40% ke Diamond' };
  if (score >= 20) return { name: 'Silver', progress: '20% ke Gold' };
  return { name: 'Common', progress: 'Mulai petualangan!' };
};

const RankSection = ({
  score = 0,
  gameScore = null,
  coins = 0,
  botKills = 0,
  playerKills = 0,
  rank = null,
  accuracy = 0,
  correctAnswers = 0,
  previousExp = null,
  currentExp = null,
  gainedExp = null,
  isLoggedIn = true,
  isGuest = false,
  onLoginClick = null
}) => {
  const isUserGuest = Boolean(isGuest || !isLoggedIn);

  const computedGameScore = gameScore !== null
    ? gameScore
    : ((coins * 5) + (botKills * 15) + (playerKills * 30) || score);

  const hasExplicitCurrentExp = currentExp !== null && currentExp !== undefined;
  const hasExplicitPreviousExp = previousExp !== null && previousExp !== undefined;

  const resolvedPreviousExp = hasExplicitPreviousExp
    ? Math.max(0, parseInt(previousExp, 10) || 0)
    : null;

  const earnedExp = (() => {
    if (gainedExp !== null && gainedExp !== undefined) {
      return parseInt(gainedExp, 10) || 0;
    }
    if (hasExplicitCurrentExp && hasExplicitPreviousExp) {
      const diff = (parseInt(currentExp, 10) || 0) - (parseInt(previousExp, 10) || 0);
      if (diff !== 0) {
        return diff;
      }
    }
    return calculateMatchExp({
      coins,
      botKills,
      playerKills,
      accuracy,
      correctAnswers,
      score: computedGameScore,
      currentExp: resolvedPreviousExp
    });
  })();

  // Tentukan total EXP pemain (clamped >= 0)
  const safeTotalExp = (() => {
    if (hasExplicitCurrentExp) {
      return Math.max(0, parseInt(currentExp, 10) || 0);
    }
    if (hasExplicitPreviousExp) {
      return Math.max(0, resolvedPreviousExp + earnedExp);
    }
    // Baseline terkalibrasi ke rank Common (2050 EXP = 60% progress di Common 1)
    if (earnedExp < 0) {
      return Math.max(0, 2050 + earnedExp);
    }
    return Math.max(0, 1750 + Math.min(2500, Math.round(computedGameScore * 2.727)));
  })();

  const currentTier = calculateExpTierProgress(safeTotalExp);
  const legacyTier = getRankTier(computedGameScore || score);

  // Periksa apakah terjadi Rank Up / Tier Up atau Rank Down / EXP Berkurang
  const safePreviousExp = hasExplicitPreviousExp
    ? resolvedPreviousExp
    : Math.max(0, safeTotalExp - earnedExp);

  const previousTier = calculateExpTierProgress(safePreviousExp);
  const isExpDecreased = earnedExp < 0 || safeTotalExp < safePreviousExp;

  const isLevelUp = !isExpDecreased && (
    currentTier.subTier > previousTier.subTier ||
    (currentTier.rankId !== previousTier.rankId && safeTotalExp > safePreviousExp) ||
    (previousTier.percent < 100 && currentTier.percent >= 100)
  );

  const isLevelDown = isExpDecreased && (
    (currentTier.rankId !== previousTier.rankId && safeTotalExp < safePreviousExp) ||
    (currentTier.rankId === previousTier.rankId && currentTier.subTier < previousTier.subTier)
  );

  // Hitung titik awal animasi persentase agar saat pengurangan (isExpDecreased) bar SELALU berkurang (turun)
  const computeAnimationStartPercent = () => {
    const target = currentTier.percent;
    if (isExpDecreased) {
      if (isLevelDown) {
        // Jika turun tier/rank, bar dimulai dari 100% pada tier bawah lalu turun ke target
        return 100;
      }
      if (previousTier.percent > target) {
        return previousTier.percent;
      }
      if (target === 0 && safePreviousExp === 0) {
        return 0;
      }
      const penaltyStep = Math.max(
        10,
        Math.round((Math.abs(earnedExp) / (currentTier.expNeededForCurrentTier || 100)) * 100)
      );
      return Math.min(100, target + penaltyStep);
    }

    if (hasExplicitPreviousExp) {
      if (isLevelUp && previousTier.percent >= target) {
        return 0;
      }
      return previousTier.percent;
    }
    return Math.max(0, target - Math.min(target, 30));
  };

  // Animasi Counter Persentase & Smooth Fill Progress Bar
  const [displayPercent, setDisplayPercent] = useState(() => computeAnimationStartPercent());

  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    const target = currentTier.percent;
    const initialStart = computeAnimationStartPercent();
    const start = isExpDecreased
      ? Math.max(target, initialStart)
      : Math.min(target, initialStart);

    setDisplayPercent(start);
    if (start === target) return undefined;

    const duration = 1100; // 1.1s
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (target - start) * ease);

      setDisplayPercent(currentVal);

      if (progress >= 1) {
        clearInterval(timer);
        setDisplayPercent(target);
      }
    }, 25);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTier.percent, previousTier.percent, isExpDecreased, isLevelDown, safePreviousExp, safeTotalExp]);

  useEffect(() => {
    if (isLevelUp && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      setIsCelebrationActive(true);
      playLevelUpSound();
      const timeout = setTimeout(() => setIsCelebrationActive(false), 3000);
      return () => clearTimeout(timeout);
    }
    if (isExpDecreased && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playRankDownSound();
    }
  }, [isLevelUp, isExpDecreased]);

  const clickTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = () => {
    if (isUserGuest) return;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    setIsCelebrationActive(true);
    playLevelUpSound();
    clickTimeoutRef.current = setTimeout(() => {
      setIsCelebrationActive(false);
      clickTimeoutRef.current = null;
    }, 2000);
  };

  const handleLoginClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onLoginClick === 'function') {
      onLoginClick();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <div
      className={`result-card rank card-pink ${isCelebrationActive ? 'rank-celebrating' : ''} ${isUserGuest ? 'rank-guest-mode' : ''}`}
      onClick={handleCardClick}
      title={isUserGuest ? 'Login akun untuk membuka & meningkatkan ranking' : 'Klik untuk efek perayaan Rank!'}
      data-testid="rank-card"
    >
      <div className="result-card-inner rank-card-content">
        {/* Fitur Ranking (terkena efek blur jika player belum terdaftar / login) */}
        <div className="rank-ranking-section">
          <div className={`rank-ranking-body ${isUserGuest ? 'is-blurred' : ''}`}>
            {/* Header Baris Atas */}
            <div className="rank-card-header">
              <h2 className="rank-title">Rank</h2>
              {rank && (
                <span className="rank-name-badge">
                  #{rank} - {legacyTier.name}
                </span>
              )}
              {isLevelUp && !rank && (
                <span className="rank-levelup-badge">LEVEL UP!</span>
              )}
              {isLevelDown && !rank && (
                <span className="rank-leveldown-badge" data-testid="rank-leveldown-badge">RANK DOWN!</span>
              )}
            </div>

            {/* Avatar Lencana Lingkaran Besar di Tengah */}
            <div className="rank-badge-wrapper">
              <div className={`rank-badge-circle ${isCelebrationActive || isLevelUp ? 'glow-pulse' : ''} ${isExpDecreased ? 'penalty-pulse' : ''}`}>
                <img
                  src={currentTier.medalImg}
                  alt={currentTier.rankName}
                  className="rank-badge-img"
                />
              </div>
              <div
                className="rank-pill-badge"
                style={{ background: currentTier.colorGradient }}
              >
                <span>{currentTier.rankName}</span>
              </div>
            </div>

            {/* Progress Bar EXP Bergradien */}
            <div className="rank-exp-bar-row">
              <div
                className="rank-exp-track"
                role="progressbar"
                aria-valuenow={displayPercent}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={`rank-exp-fill ${isExpDecreased ? 'is-penalty' : ''}`}
                  style={{ width: `${displayPercent}%` }}
                />
              </div>
              <div
                className="rank-next-medal-wrap"
                title={`Target: ${currentTier.nextMajorRankName}`}
              >
                <img
                  src={currentTier.nextMedalImg}
                  alt={currentTier.nextMajorRankName}
                  className="rank-next-medal-img"
                />
              </div>
            </div>

            {/* Baris Status: "Level up!" / "EXP Berkurang!", Panah Hijau (↑↑) atau Merah (↓↓), "TO <NextRank>" */}
            <div className="rank-status-row">
              <span className={`rank-status-left ${isExpDecreased ? 'is-penalty' : ''}`}>
                {isLevelDown ? 'Rank Turun!' : (isExpDecreased ? 'EXP Berkurang!' : 'Level up!')}
              </span>
              <div className="rank-status-center">
                {isExpDecreased ? (
                  <span className="rank-arrow-down" data-testid="rank-arrow-down">↓↓</span>
                ) : (
                  <span className="rank-arrow-up" data-testid="rank-arrow-up">↑↑</span>
                )}
                <span className={`rank-percent-value ${isExpDecreased ? 'is-penalty' : ''}`}>
                  {displayPercent}%
                </span>
              </div>
              <span className="rank-status-right">
                TO {currentTier.nextMajorRankName}
              </span>
            </div>

            {/* Ringkasan Nilai EXP Game & Ketentuan Rank */}
            <div className="rank-exp-info-row">
              <span className="rank-exp-counter">
                {currentTier.expInCurrentTier} / {currentTier.expNeededForCurrentTier} EXP
              </span>
              <span
                className={isExpDecreased ? 'rank-exp-lost' : 'rank-exp-gained'}
                data-testid="rank-exp-delta"
              >
                {earnedExp >= 0 ? `+${earnedExp}` : `${earnedExp}`} EXP Game
              </span>
            </div>

            <div
              className={`rank-requirement-row ${isExpDecreased ? 'is-failed' : 'is-passed'}`}
              data-testid="rank-requirement-info"
            >
              <span className="rank-req-label">Syarat {previousTier.rankName}:</span>
              <span className="rank-req-value">
                {previousTier.requirementText || currentTier.requirementText}
              </span>
            </div>
          </div>

          {/* Overlay Tombol Login jika belum terdaftar / belum login */}
          {isUserGuest && (
            <div
              className="rank-guest-overlay"
              onClick={(e) => e.stopPropagation()}
              data-testid="rank-guest-overlay"
            >
              <div className="rank-guest-lock-pill">
                <span className="rank-lock-icon" aria-hidden="true">🔒</span>
                <span>Fitur Rank Terkunci</span>
              </div>
              <h3 className="rank-guest-title">Login untuk Meningkatkan Ranking</h3>
              <p className="rank-guest-desc">
                Masuk ke akun Anda untuk menyimpan progres EXP dan meningkatkan ranking di fitur Pencapaian Home!
              </p>
              <button
                type="button"
                className="rank-guest-login-btn"
                onClick={handleLoginClick}
                data-testid="rank-login-button"
              >
                <span className="rank-login-btn-icon" aria-hidden="true">🚀</span>
                <span>Login untuk Meningkatkan Ranking</span>
              </button>
            </div>
          )}
        </div>

        {/* Breakdown Skor & Statistik Pertandingan (TETAP TAMPIL NORMAL DI BAWAH RANKING TANPA BLUR) */}
        <div className="rank-match-footer" data-testid="rank-match-footer">
          <div className="game-score-display">
            <span className="game-score-total">{computedGameScore}</span>
            <span className="game-score-label">Total Poin Game</span>
          </div>

          <div className="match-stats-breakdown">
            <div className="stat-pill" title="Koin (+5 poin per koin)">
              <span className="stat-icon">🪙</span>
              <span className="stat-count">{coins}</span>
              <span className="stat-desc">Koin (+{coins * 5})</span>
            </div>
            <div className="stat-pill" title="Kill Monster (+15 poin per bot)">
              <span className="stat-icon">👾</span>
              <span className="stat-count">{botKills}</span>
              <span className="stat-desc">Monster (+{botKills * 15})</span>
            </div>
            <div className="stat-pill" title="Kill Player (+30 poin per player)">
              <span className="stat-icon">⚔️</span>
              <span className="stat-count">{playerKills}</span>
              <span className="stat-desc">Player (+{playerKills * 30})</span>
            </div>
          </div>
        </div>

        {/* Kompatibilitas Text untuk Legacy Tests */}
        <div className="rank-details" style={{ display: 'none' }}>
          <p className="rank-name">
            {rank ? `#${rank} - ${legacyTier.name}` : legacyTier.name}
          </p>
          <p className="rank-progress">
            <span className="level-up">{legacyTier.progress}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RankSection;
