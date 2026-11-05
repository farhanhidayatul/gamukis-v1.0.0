// Frontend/src/utils/expRankSystem.js
// Sistem Rank & EXP Berjenjang (Non-linear Difficulty Scaling)

import lencanaNewbie from '../images/lencana_newbie_resolusi_tinggi.png';
import lencanaRookie from '../images/lencana_rookie_resolusi_tinggi.png';
import lencanaCommon from '../images/lencana_common_resolusi_tinggi.png';
import lencanaBeginner from '../images/lencana_beginner_resolusi_tinggi.png';
import lencanaLegendary from '../images/lencana_legendary_resolusi_tinggi.png';

import rankBadgeNewbie from '../images/RANK_NEWBIE.png';
import rankBadgeRookie from '../images/Rank_Rookie.png';
import rankBadgeCommon from '../images/Rank_Common.png';
import rankBadgeBeginner from '../images/Rank_Begginer.png';
import rankBadgeLegendary from '../images/RANK_LEGENDARY.png';

/**
 * Konfigurasi 5 Tingkatan Rank Utama dengan EXP Scaling Non-linear:
 * - Newbie: 100 EXP per tier (5 sub-tier = 500 EXP total)
 * - Rookie: 250 EXP per tier (5 sub-tier = 1250 EXP total, kumulatif: 1750 EXP)
 * - Common: 500 EXP per tier (5 sub-tier = 2500 EXP total, kumulatif: 4250 EXP)
 * - Beginner: 1000 EXP per tier (5 sub-tier = 5000 EXP total, kumulatif: 9250 EXP)
 * - Legendary: 2000 EXP per tier (5 sub-tier = 10000 EXP total, kumulatif: 19250 EXP)
 */
export const RANK_CONFIG = [
  {
    id: 'newbie',
    name: 'Newbie',
    nextName: 'Rookie',
    expPerTier: 100,
    subTiers: 5,
    cumulativeStartExp: 0,
    cumulativeEndExp: 500,
    minAccuracy: 20,
    minGameScore: 15,
    ruleMode: 'any',
    maxPenaltyExp: 15,
    requirementText: 'Min. Akurasi 20% atau 15 Poin',
    badge: rankBadgeNewbie,
    medal: lencanaNewbie,
    themeClass: 'newbie',
    colorGradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
  },
  {
    id: 'rookie',
    name: 'Rookie',
    nextName: 'Common',
    expPerTier: 250,
    subTiers: 5,
    cumulativeStartExp: 500,
    cumulativeEndExp: 1750,
    minAccuracy: 40,
    minGameScore: 40,
    ruleMode: 'any',
    maxPenaltyExp: 35,
    requirementText: 'Min. Akurasi 40% atau 40 Poin',
    badge: rankBadgeRookie,
    medal: lencanaRookie,
    themeClass: 'rookie',
    colorGradient: 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)'
  },
  {
    id: 'common',
    name: 'Common',
    nextName: 'Beginner',
    expPerTier: 500,
    subTiers: 5,
    cumulativeStartExp: 1750,
    cumulativeEndExp: 4250,
    minAccuracy: 55,
    minGameScore: 60,
    ruleMode: 'both',
    maxPenaltyExp: 75,
    requirementText: 'Min. Akurasi 55% & 60 Poin',
    badge: rankBadgeCommon,
    medal: lencanaCommon,
    themeClass: 'common',
    colorGradient: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)'
  },
  {
    id: 'beginner',
    name: 'Beginner',
    nextName: 'Legendary',
    expPerTier: 1000,
    subTiers: 5,
    cumulativeStartExp: 4250,
    cumulativeEndExp: 9250,
    minAccuracy: 70,
    minGameScore: 100,
    ruleMode: 'both',
    maxPenaltyExp: 150,
    requirementText: 'Min. Akurasi 70% & 100 Poin',
    badge: rankBadgeBeginner,
    medal: lencanaBeginner,
    themeClass: 'beginner',
    colorGradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    id: 'legendary',
    name: 'Legendary',
    nextName: 'Max',
    expPerTier: 2000,
    subTiers: 5,
    cumulativeStartExp: 9250,
    cumulativeEndExp: 19250,
    minAccuracy: 80,
    minGameScore: 150,
    ruleMode: 'both',
    maxPenaltyExp: 300,
    requirementText: 'Min. Akurasi 80% & 150 Poin',
    badge: rankBadgeLegendary,
    medal: lencanaLegendary,
    themeClass: 'legendary',
    colorGradient: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)'
  }
];

/**
 * Menentukan objek konfigurasi rank aktif berdasarkan total EXP atau ID rank.
 */
export const resolveRankConfig = (currentExp = 0, rankId = null) => {
  if (rankId) {
    const found = RANK_CONFIG.find(
      (r) => r.id === String(rankId).toLowerCase() || r.name.toLowerCase() === String(rankId).toLowerCase()
    );
    if (found) return found;
  }
  const safeExp = Math.max(0, parseInt(currentExp, 10) || 0);
  for (let i = RANK_CONFIG.length - 1; i >= 0; i--) {
    if (safeExp >= RANK_CONFIG[i].cumulativeStartExp) {
      return RANK_CONFIG[i];
    }
  }
  return RANK_CONFIG[0];
};

/**
 * Mengevaluasi apakah performa pertandingan memenuhi ketentuan minimum rank saat ini.
 * Jika tidak mencapai ketentuan rank, menghasilkan penalti pengurangan EXP (-EXP).
 */
export const evaluateRankPerformance = ({
  coins = 0,
  botKills = 0,
  playerKills = 0,
  accuracy = 0,
  correctAnswers = 0,
  score = null,
  currentExp = 0,
  rankId = null
} = {}) => {
  const c = Math.max(0, parseInt(coins, 10) || 0);
  const b = Math.max(0, parseInt(botKills, 10) || 0);
  const p = Math.max(0, parseInt(playerKills, 10) || 0);
  const acc = Math.max(0, Math.min(100, parseFloat(accuracy) || 0));
  const ca = Math.max(0, parseInt(correctAnswers, 10) || 0);

  const computedScore = score !== null && score !== undefined
    ? Math.max(0, parseInt(score, 10) || 0)
    : (c * 5) + (b * 15) + (p * 30);

  const targetRank = resolveRankConfig(currentExp, rankId);

  const meetsAccuracy = acc >= targetRank.minAccuracy || (targetRank.id === 'newbie' && ca >= 1);
  const meetsScore = computedScore >= targetRank.minGameScore;
  const passed = targetRank.ruleMode === 'any'
    ? (meetsAccuracy || meetsScore)
    : (meetsAccuracy && meetsScore);

  if (passed) {
    return {
      passed: true,
      penaltyExp: 0,
      deficitRatio: 0,
      rank: targetRank,
      computedScore,
      accuracy: acc,
      requirementText: targetRank.requirementText
    };
  }

  const accDeficit = targetRank.minAccuracy > 0
    ? Math.max(0, (targetRank.minAccuracy - acc) / targetRank.minAccuracy)
    : 0;
  const scoreDeficit = targetRank.minGameScore > 0
    ? Math.max(0, (targetRank.minGameScore - computedScore) / targetRank.minGameScore)
    : 0;

  const deficitRatio = targetRank.ruleMode === 'any'
    ? Math.min(1, (accDeficit + scoreDeficit) / 2)
    : Math.min(1, Math.max(accDeficit, scoreDeficit));

  const penaltyExp = -Math.max(5, Math.round(targetRank.maxPenaltyExp * Math.max(0.25, deficitRatio)));

  return {
    passed: false,
    penaltyExp,
    deficitRatio,
    rank: targetRank,
    computedScore,
    accuracy: acc,
    requirementText: targetRank.requirementText
  };
};

/**
 * Menghitung perolehan EXP berdasarkan performa permainan:
 * - Koin: 5 EXP per koin
 * - Monster (bot kill): 15 EXP per kill
 * - Player kill: 30 EXP per kill
 * - Akurasi: hingga 50 EXP (accuracy * 0.5)
 * - Jawaban kuis benar: 10 EXP per jawaban benar
 * - Base bonus match: 20 EXP
 * - Jika enforceRankPenalty / currentExp / rankId diberikan dan nilai tidak mencapai ketentuan rank,
 *   mengembalikan nilai pengurangan EXP negatif (-EXP).
 */
export const calculateMatchExp = ({
  coins = 0,
  botKills = 0,
  playerKills = 0,
  accuracy = 0,
  correctAnswers = 0,
  score = null,
  currentExp = null,
  rankId = null,
  enforceRankPenalty = false
} = {}) => {
  const c = Math.max(0, parseInt(coins, 10) || 0);
  const b = Math.max(0, parseInt(botKills, 10) || 0);
  const p = Math.max(0, parseInt(playerKills, 10) || 0);
  const acc = Math.max(0, Math.min(100, parseFloat(accuracy) || 0));
  const ca = Math.max(0, parseInt(correctAnswers, 10) || 0);

  if (enforceRankPenalty || currentExp !== null || rankId !== null) {
    const evalResult = evaluateRankPerformance({
      coins: c,
      botKills: b,
      playerKills: p,
      accuracy: acc,
      correctAnswers: ca,
      score,
      currentExp: currentExp ?? 0,
      rankId
    });
    if (!evalResult.passed) {
      return evalResult.penaltyExp;
    }
  }

  const coinExp = c * 5;
  const botExp = b * 15;
  const playerExp = p * 30;
  const correctBonus = ca * 10;
  const accuracyBonus = Math.round(acc * 0.5);
  const baseBonus = 20;

  const total = coinExp + botExp + playerExp + correctBonus + accuracyBonus + baseBonus;
  return Math.max(10, total);
};

/**
 * Menghitung rank dan progress tier saat ini berdasarkan akumulasi total EXP pemain.
 * @param {number} totalExp - Akumulasi EXP pemain
 * @returns {object} Detail rank, sub-tier (1-5), persentase progress, medal, dan target berikutnya
 */
export const calculateExpTierProgress = (totalExp = 0) => {
  const safeExp = Math.max(0, parseInt(totalExp, 10) || 0);

  const maxRank = RANK_CONFIG[RANK_CONFIG.length - 1];
  if (safeExp >= maxRank.cumulativeEndExp) {
    return {
      rankId: maxRank.id,
      rankName: maxRank.name,
      subTier: 5,
      fullRankName: `${maxRank.name} 5 (Max)`,
      nextRankName: 'Max Level',
      nextMajorRankName: 'Max',
      percent: 100,
      expInCurrentTier: maxRank.expPerTier,
      expNeededForCurrentTier: maxRank.expPerTier,
      expRemainingToNextTier: 0,
      totalExp: safeExp,
      badgeImg: maxRank.badge,
      medalImg: maxRank.medal,
      nextMedalImg: maxRank.medal,
      themeClass: maxRank.themeClass,
      colorGradient: maxRank.colorGradient,
      minAccuracy: maxRank.minAccuracy,
      minGameScore: maxRank.minGameScore,
      ruleMode: maxRank.ruleMode,
      maxPenaltyExp: maxRank.maxPenaltyExp,
      requirementText: maxRank.requirementText,
      isMaxLevel: true
    };
  }

  let currentRank = RANK_CONFIG[0];
  let rankIndex = 0;
  for (let i = RANK_CONFIG.length - 1; i >= 0; i--) {
    if (safeExp >= RANK_CONFIG[i].cumulativeStartExp) {
      currentRank = RANK_CONFIG[i];
      rankIndex = i;
      break;
    }
  }

  const expInRank = safeExp - currentRank.cumulativeStartExp;
  const subTier = Math.min(5, Math.floor(expInRank / currentRank.expPerTier) + 1);

  const subTierStart = (subTier - 1) * currentRank.expPerTier;
  const expInCurrentTier = expInRank - subTierStart;
  const expNeededForCurrentTier = currentRank.expPerTier;
  const expRemainingToNextTier = expNeededForCurrentTier - expInCurrentTier;
  const percent = Math.min(100, Math.floor((expInCurrentTier / expNeededForCurrentTier) * 100));

  let nextRankName = '';
  let nextMajorRankName = currentRank.nextName !== 'Max' ? currentRank.nextName : 'Max';
  let nextMedalImg = currentRank.medal;

  const nextMajor = RANK_CONFIG[rankIndex + 1];
  if (nextMajor) {
    nextMedalImg = nextMajor.medal;
  }

  if (subTier < 5) {
    nextRankName = `${currentRank.name} ${subTier + 1}`;
  } else {
    nextRankName = nextMajor ? `${nextMajor.name} 1` : 'Max Level';
  }

  return {
    rankId: currentRank.id,
    rankName: currentRank.name,
    subTier,
    fullRankName: `${currentRank.name} ${subTier}`,
    nextRankName,
    nextMajorRankName,
    percent,
    expInCurrentTier,
    expNeededForCurrentTier,
    expRemainingToNextTier,
    totalExp: safeExp,
    badgeImg: currentRank.badge,
    medalImg: currentRank.medal,
    nextMedalImg,
    themeClass: currentRank.themeClass,
    colorGradient: currentRank.colorGradient,
    minAccuracy: currentRank.minAccuracy,
    minGameScore: currentRank.minGameScore,
    ruleMode: currentRank.ruleMode,
    maxPenaltyExp: currentRank.maxPenaltyExp,
    requirementText: currentRank.requirementText,
    isMaxLevel: false
  };
};

/**
 * Sintesis audio suara celebratory level-up chime menggunakan Web Audio API.
 * Menghasilkan nada riang arpeggio retro tanpa dependensi file eksternal.
 */
export const playLevelUpSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.24);
    });
  } catch (e) {
    // Abaikan jika Web Audio tidak diizinkan autoplay
  }
};

/**
 * Sintesis audio nada turun (penalty/rank down) menggunakan Web Audio API.
 */
export const playRankDownSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = [440.00, 392.00, 349.23, 293.66]; // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.26);
    });
  } catch (e) {
    // Abaikan jika Web Audio tidak diizinkan autoplay
  }
};


