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
    badge: rankBadgeLegendary,
    medal: lencanaLegendary,
    themeClass: 'legendary',
    colorGradient: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)'
  }
];

/**
 * Menghitung perolehan EXP berdasarkan performa permainan:
 * - Koin: 5 EXP per koin
 * - Monster (bot kill): 15 EXP per kill
 * - Player kill: 30 EXP per kill
 * - Akurasi: hingga 50 EXP (accuracy * 0.5)
 * - Jawaban kuis benar: 10 EXP per jawaban benar
 * - Base bonus match: 20 EXP
 */
export const calculateMatchExp = ({
  coins = 0,
  botKills = 0,
  playerKills = 0,
  accuracy = 0,
  correctAnswers = 0,
  score = 0
} = {}) => {
  const c = Math.max(0, parseInt(coins, 10) || 0);
  const b = Math.max(0, parseInt(botKills, 10) || 0);
  const p = Math.max(0, parseInt(playerKills, 10) || 0);
  const acc = Math.max(0, Math.min(100, parseFloat(accuracy) || 0));
  const ca = Math.max(0, parseInt(correctAnswers, 10) || 0);

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

