import React, { useRef, useEffect } from 'react';
import { CustomCharacterRenderer } from '../../component_game/playerInfo';
import AnimeKnightCanvas from '../atoms/AnimeKnightCanvas';
import charHeinSvg from '../../../images/char_hein.svg';
import './BitdsulAnimeModal.css';

/**
 * Character metadata profile for BITDSUL anime spotlight
 */
export const BITDSUL_ANIME_PROFILES = {
  3: {
    animeTitle: 'The Code Vanguard & Knight',
    element: 'STEEL / AETHER',
    elementIcon: '⚔️',
    themeColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    avatarClass: 'Grandmaster Knight Dev',
    ultimateSkill: 'Excalibur Code Slash',
    skillDesc: 'Menebas latensi server dan mengompilasi arena inGame dengan presisi pedang baja dan jubah aether.',
    powerStats: { INT: 98, AGI: 96, DEF: 94, CRE: 97 },
    vectorArtwork: charHeinSvg,
    isKnightCodeCanvas: false
  },
  2: {
    animeTitle: 'The Diplomat Orator',
    element: 'WATER / TIDAL',
    elementIcon: '💧',
    themeColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    avatarClass: 'Vice Commander',
    ultimateSkill: 'Rhetoric Shield',
    skillDesc: 'Menjembatani gagasan tim dengan retorika tenang dan eksekusi administrasi terarah.',
    powerStats: { INT: 92, AGI: 89, DEF: 94, CRE: 91 },
    characterAppearance: {
      gender: 'Laki-laki',
      skinColor: 2,
      hairStyle: 'short',
      hairColor: 'blue',
      shirt: 'char_male_shirt_color_blue',
      pants: 'char_male_pants_color_navy',
      shoes: 'char_male_shoes_color_white'
    }
  },
  5: {
    animeTitle: 'The Grand Scribe',
    element: 'EARTH / ARCHIVE',
    elementIcon: '📜',
    themeColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    avatarClass: 'Elder Counselor',
    ultimateSkill: 'Archive Invariant',
    skillDesc: 'Menjaga keutuhan dokumen, struktur naskah, dan integritas blueprint organisasi.',
    powerStats: { INT: 96, AGI: 85, DEF: 96, CRE: 89 },
    characterAppearance: {
      gender: 'Laki-laki',
      skinColor: 1,
      hairStyle: 'medium',
      hairColor: 'purple',
      shirt: 'char_male_shirt_color_purple',
      pants: 'char_male_pants_color_black',
      shoes: 'char_male_shoes_color_black'
    }
  },
  1: {
    animeTitle: 'The Aegis Warden',
    element: 'IRON / ICE',
    elementIcon: '🛡️',
    themeColor: '#10B981',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    avatarClass: 'Treasury Guardian',
    ultimateSkill: 'Ledger Fortress',
    skillDesc: 'Membangun perisai proteksi anggaran, kepatuhan kas, dan disiplin pertahanan tim.',
    powerStats: { INT: 90, AGI: 87, DEF: 99, CRE: 85 },
    characterAppearance: {
      gender: 'Laki-laki',
      skinColor: 3,
      hairStyle: 'short',
      hairColor: 'green',
      shirt: 'char_male_shirt_color_green',
      pants: 'char_male_pants_color_gray',
      shoes: 'char_male_shoes_color_white'
    }
  },
  4: {
    animeTitle: 'The Chrono Lens',
    element: 'LIGHT / VISION',
    elementIcon: '🔮',
    themeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    avatarClass: 'Time Recorder',
    ultimateSkill: 'Memory Shutter',
    skillDesc: 'Membekukan momen bersejarah dan detail perjalanan tim ke dalam arsip visual abadi.',
    powerStats: { INT: 91, AGI: 93, DEF: 86, CRE: 95 },
    characterAppearance: {
      gender: 'Laki-laki',
      skinColor: 1,
      hairStyle: 'short',
      hairColor: 'pink',
      shirt: 'char_male_shirt_color_pink',
      pants: 'char_male_pants_color_black',
      shoes: 'char_male_shoes_color_white'
    }
  },
  6: {
    animeTitle: 'The Visual Conjurer',
    element: 'ETHER / PALETTE',
    elementIcon: '🎨',
    themeColor: '#FCD03E',
    glowColor: 'rgba(252, 208, 62, 0.45)',
    avatarClass: 'Lead Stylist',
    ultimateSkill: 'Pixel Metamorphosis',
    skillDesc: 'Meniupkan jiwa estetika anime ke dalam setiap antarmuka pengguna Gamukis.',
    powerStats: { INT: 89, AGI: 94, DEF: 87, CRE: 99 },
    characterAppearance: {
      gender: 'Laki-laki',
      skinColor: 2,
      hairStyle: 'spiky',
      hairColor: 'orange',
      shirt: 'char_male_shirt_color_yellow',
      pants: 'char_male_pants_color_black',
      shoes: 'char_male_shoes_color_black'
    }
  }
};

/**
 * Canvas background particles inside modal
 */
const ModalVortexCanvas = ({ themeColor, glowColor }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let time = 0;
    const width = 380;
    const height = 480;

    const stars = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.8 + 0.3),
      speedX: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.7 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Draw subtle anime energy waves
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 220);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(10, 15, 30, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw floating starlight particles
      stars.forEach((s) => {
        s.y += s.speedY;
        s.x += s.speedX;
        if (s.y < 0) s.y = height;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;

        ctx.save();
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = s.alpha * (0.6 + 0.4 * Math.sin(time + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [themeColor, glowColor]);

  return <canvas ref={canvasRef} className="bitdsul-modal-canvas" width={380} height={480} aria-hidden="true" />;
};

/**
 * BitdsulAnimeModal Component
 */
const BitdsulAnimeModal = ({ member, bitdsulPhoto, onClose }) => {

  if (!member) return null;

  const profile = BITDSUL_ANIME_PROFILES[member.id] || BITDSUL_ANIME_PROFILES[3];
  const { cropSize = 480, portraitSize = 100 } = { cropSize: 480, portraitSize: 100 };
  const scale = portraitSize / cropSize;
  const backgroundWidth = 4032 * scale;
  const backgroundHeight = 3024 * scale;

  return (
    <div className="bitdsul-anime-backdrop" role="dialog" aria-modal="true" aria-label={`Anime Card ${member.name}`}>
      <div className="bitdsul-anime-modal" style={{ '--anime-theme': profile.themeColor, '--anime-glow': profile.glowColor }}>
        {/* Dynamic canvas backdrop */}
        <ModalVortexCanvas themeColor={profile.themeColor} glowColor={profile.glowColor} />

        {/* Close button */}
        <button type="button" className="bitdsul-modal-close" onClick={onClose} aria-label="Tutup kartu anime">
          ✕
        </button>

        {/* Card Content Header */}
        <div className="bitdsul-anime-badge-row">
          <span className="bitdsul-anime-element">
            {profile.elementIcon} {profile.element}
          </span>
          <span className="bitdsul-anime-class">{profile.avatarClass}</span>
        </div>

        {/* Hero Character Visual: Animated Anime Knight Canvas / Vector Artwork / Sprite & Real Photo Duo */}
        <div className="bitdsul-anime-hero-duo">
          {/* Living 100% Vector Character Artwork (char_hein.svg for Farhan) or Game Sprite */}
          <div className="bitdsul-anime-sprite-box">
            {profile.vectorArtwork ? (
              <img
                src={profile.vectorArtwork}
                alt={`${member.name} Vector Spotlight`}
                className="bitdsul-anime-vector-img"
              />
            ) : profile.isKnightCodeCanvas ? (
              <AnimeKnightCanvas
                width={200}
                height={260}
                glowColor={profile.glowColor}
              />
            ) : (
              <CustomCharacterRenderer
                appearance={profile.characterAppearance}
                direction="down"
                isMoving={true}
                isSkillActive={true}
                style={{ width: '80px', height: '120px' }}
              />
            )}
          </div>

          {/* Real Photo Avatar with Rotating Anime Halo */}
          <div className="bitdsul-anime-avatar-hero">
            <div className="bitdsul-anime-halo" />
            <div
              className="bitdsul-anime-hero-img"
              style={{
                backgroundImage: `url("${bitdsulPhoto}")`,
                backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
                backgroundPosition: `${portraitSize / 2 - member.x * scale}px ${portraitSize / 2 - member.y * scale}px`
              }}
            />
          </div>
        </div>

        {/* Character Titles & Name */}
        <div className="bitdsul-anime-info">
          <span className="bitdsul-anime-subtitle">{profile.animeTitle}</span>
          <h2 className="bitdsul-anime-name">{member.name}</h2>
          <p className="bitdsul-anime-role">{member.role}</p>
        </div>

        {/* Ultimate Skill Showcase */}
        <div className="bitdsul-anime-skill-box">
          <div className="bitdsul-skill-label">
            <span className="bitdsul-skill-tag">ULTIMATE SKILL</span>
            <strong>{profile.ultimateSkill}</strong>
          </div>
          <p className="bitdsul-skill-desc">{profile.skillDesc}</p>
        </div>

        {/* Power Stats Matrix */}
        <div className="bitdsul-anime-stats-grid">
          {Object.entries(profile.powerStats).map(([stat, val]) => (
            <div className="bitdsul-stat-pill" key={stat}>
              <span className="stat-name">{stat}</span>
              <div className="stat-bar-track">
                <div className="stat-bar-fill" style={{ width: `${val}%` }} />
              </div>
              <span className="stat-val">{val}</span>
            </div>
          ))}
        </div>

        {/* Quote & Social Link */}
        <p className="bitdsul-anime-quote">{member.quote}</p>
        <a className="bitdsul-anime-btn" href={member.linkedin} target="_blank" rel="noopener noreferrer">
          Buka LinkedIn Profil ↗
        </a>
      </div>
    </div>
  );
};

export default BitdsulAnimeModal;
