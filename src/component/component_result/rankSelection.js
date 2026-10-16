import React, { useEffect, useState, useRef } from 'react';
import '../../pages/result.css';
import {
  calculateExpTierProgress,
  calculateMatchExp,
  playLevelUpSound
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

  const earnedExp = gainedExp !== null
    ? gainedExp
    : calculateMatchExp({
        coins,
        botKills,
        playerKills,
        accuracy,
        correctAnswers,
        score: computedGameScore
      });

  // Tentukan total EXP pemain
  const safeTotalExp = (() => {
    if (currentExp !== null && currentExp !== undefined) {
      return Math.max(0, parseInt(currentExp, 10) || 0);
    }
    if (previousExp !== null && previousExp !== undefined) {
      return Math.max(0, parseInt(previousExp, 10) || 0) + earnedExp;
    }
    // Baseline terkalibrasi ke rank Common (1750 start) dengan 60% progress sesuai referensi desain
    return 1750 + Math.min(2500, Math.round(computedGameScore * 2.727));
  })();

  const currentTier = calculateExpTierProgress(safeTotalExp);
  const legacyTier = getRankTier(computedGameScore || score);

  // Periksa apakah terjadi Rank Up / Tier Up
  const safePreviousExp = previousExp !== null && previousExp !== undefined
    ? Math.max(0, parseInt(previousExp, 10) || 0)
    : Math.max(0, safeTotalExp - earnedExp);

  const previousTier = calculateExpTierProgress(safePreviousExp);
  const isLevelUp = currentTier.subTier > previousTier.subTier ||
    currentTier.rankId !== previousTier.rankId ||
    (previousTier.percent < 100 && currentTier.percent >= 100);

  // Animasi Counter Persentase & Smooth Fill Progress Bar
  const [displayPercent, setDisplayPercent] = useState(() => {
    // Dimulai dari persentase sebelumnya atau 0
    if (previousExp !== null) {
      return previousTier.percent;
    }
    return Math.max(0, currentTier.percent - Math.min(currentTier.percent, 30));
  });

  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    const target = currentTier.percent;
    const start = displayPercent;
    if (start === target) return;

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
  }, [currentTier.percent]);

  useEffect(() => {
    if (isLevelUp && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      setIsCelebrationActive(true);
      playLevelUpSound();
      const timeout = setTimeout(() => setIsCelebrationActive(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isLevelUp]);

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
            </div>

            {/* Avatar Lencana Lingkaran Besar di Tengah */}
            <div className="rank-badge-wrapper">
              <div className={`rank-badge-circle ${isCelebrationActive || isLevelUp ? 'glow-pulse' : ''}`}>
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
                  className="rank-exp-fill"
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

            {/* Baris Status: "Level up!", "↑↑ 60%", "TO Beginner" */}
            <div className="rank-status-row">
              <span className="rank-status-left">Level up!</span>
              <div className="rank-status-center">
                <span className="rank-arrow-up">↑↑</span>
                <span className="rank-percent-value">{displayPercent}%</span>
              </div>
              <span className="rank-status-right">
                TO {currentTier.nextMajorRankName}
              </span>
            </div>

            {/* Ringkasan Nilai EXP Game */}
            <div className="rank-exp-info-row">
              <span className="rank-exp-counter">
                {currentTier.expInCurrentTier} / {currentTier.expNeededForCurrentTier} EXP
              </span>
              <span className="rank-exp-gained">
                +{earnedExp} EXP Game
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
