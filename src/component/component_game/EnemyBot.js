import React, { useState, useEffect, useRef } from 'react';
import { TILE_SIZE } from './utils';
import './EnemyBot.css';

// 1. Blood Monster_A Assets (Left, Right)
import bloodIdleLeft from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Idle_direction_left.png';
import bloodIdleRight from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Idle_direction_right.png';

import bloodWalkLeft from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Walk_direction_left.png';
import bloodWalkRight from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Walk_direction_right.png';

import bloodAttack01Left from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Attack01_direction_left.png';
import bloodAttack01Right from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Attack01_direction_right.png';

import bloodAttack02Left from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Attack02_direction_left.png';
import bloodAttack02Right from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Attack02_direction_right.png';

import bloodHurtLeft from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Hurt_direction_left.png';
import bloodHurtRight from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Hurt_direction_right.png';

import bloodDeathLeft from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Death_direction_left.png';
import bloodDeathRight from '../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Death_direction_right.png';

// 2. Demon_A Assets (Left, Right)
import demonIdleLeft from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Idle_direction_left.png';
import demonIdleRight from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Idle_direction_right.png';

import demonWalkLeft from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Walk_direction_left.png';
import demonWalkRight from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Walk_direction_right.png';

import demonAttack01Left from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Attack01_direction_left.png';
import demonAttack01Right from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Attack01_direction_right.png';

import demonAttack02Left from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Attack02_direction_left.png';
import demonAttack02Right from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Attack02_direction_right.png';

import demonHurtLeft from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Hurt_direction_left.png';
import demonHurtRight from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Hurt_direction_right.png';

import demonDeathLeft from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Death_direction_left.png';
import demonDeathRight from '../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Death_direction_right.png';

// 3. Orc Assets (Left, Right)
import orcIdleLeft from '../../images/asset_game/character/bot_enemy/Orc/Orc_Idle_Left.png';
import orcIdleRight from '../../images/asset_game/character/bot_enemy/Orc/Orc_Idle_direction_right.png';

import orcWalkLeft from '../../images/asset_game/character/bot_enemy/Orc/Orc_Walk_Left.png';
import orcWalkRight from '../../images/asset_game/character/bot_enemy/Orc/Orc_Walk_direction_right.png';

import orcAttack01Left from '../../images/asset_game/character/bot_enemy/Orc/Orc_Attack01_Left.png';
import orcAttack01Right from '../../images/asset_game/character/bot_enemy/Orc/Orc_Attack01_direction_right.png';

import orcAttack02Left from '../../images/asset_game/character/bot_enemy/Orc/Orc_Attack02_Left.png';
import orcAttack02Right from '../../images/asset_game/character/bot_enemy/Orc/Orc_Attack02_direction_right.png';

import orcHitLeft from '../../images/asset_game/character/bot_enemy/Orc/Orc_Hit_Left.png';
import orcHitRight from '../../images/asset_game/character/bot_enemy/Orc/Orc_Hit_direction_right.png';

import orcDeathLeft from '../../images/asset_game/character/bot_enemy/Orc/Orc_Death_Left.png';
import orcDeathRight from '../../images/asset_game/character/bot_enemy/Orc/Orc_Death_direction_right.png';

// 4. Emperor_Samurai ("Manusia yang Tersesat") Assets (Left, Right)
import samuraiIdleLeft from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/IDLE_direction_left.png';
import samuraiIdleRight from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/IDLE_direction_right.png';

import samuraiRunLeft from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/RUN_direction_left.png';
import samuraiRunRight from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/RUN_direction_right.png';

import samuraiAttack01Left from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/ATTACK_1_direction_left.png';
import samuraiAttack01Right from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/ATTACK 1_direction_right.png';

import samuraiHurtLeft from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/HURT_direction_left.png';
import samuraiHurtRight from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/HURT_direction_right.png';

import samuraiDeathLeft from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/DEATH_direction_left.png';
import samuraiDeathRight from '../../images/asset_game/character/bot_enemy/Emperor_Samurai/DEATH_direction_right.png';

export const SPRITE_CONFIG = {
  blood: {
    idle: {
      left: { img: bloodIdleLeft, frames: 6, width: 600, duration: 0.8 },
      right: { img: bloodIdleRight, frames: 6, width: 600, duration: 0.8 }
    },
    walk: {
      left: { img: bloodWalkLeft, frames: 8, width: 800, duration: 0.8 },
      right: { img: bloodWalkRight, frames: 8, width: 800, duration: 0.8 }
    },
    attack1: {
      left: { img: bloodAttack01Left, frames: 8, width: 800, duration: 0.4 },
      right: { img: bloodAttack01Right, frames: 8, width: 800, duration: 0.4 }
    },
    attack2: {
      left: { img: bloodAttack02Left, frames: 8, width: 800, duration: 0.4 },
      right: { img: bloodAttack02Right, frames: 8, width: 800, duration: 0.4 }
    },
    hurt: {
      left: { img: bloodHurtLeft, frames: 4, width: 400, duration: 0.35 },
      right: { img: bloodHurtRight, frames: 4, width: 400, duration: 0.35 }
    },
    death: {
      left: { img: bloodDeathLeft, frames: 4, width: 400, duration: 0.9 },
      right: { img: bloodDeathRight, frames: 4, width: 400, duration: 0.9 },
      default: { img: bloodDeathRight, frames: 4, width: 400, duration: 0.9 }
    }
  },
  demon: {
    idle: {
      left: { img: demonIdleLeft, frames: 6, width: 600, duration: 0.8 },
      right: { img: demonIdleRight, frames: 6, width: 600, duration: 0.8 }
    },
    walk: {
      left: { img: demonWalkLeft, frames: 7, width: 700, duration: 0.8 },
      right: { img: demonWalkRight, frames: 8, width: 800, duration: 0.8 }
    },
    attack1: {
      left: { img: demonAttack01Left, frames: 7, width: 700, duration: 0.4 },
      right: { img: demonAttack01Right, frames: 7, width: 700, duration: 0.4 }
    },
    attack2: {
      left: { img: demonAttack02Left, frames: 7, width: 700, duration: 0.4 },
      right: { img: demonAttack02Right, frames: 7, width: 700, duration: 0.4 }
    },
    hurt: {
      left: { img: demonHurtLeft, frames: 4, width: 400, duration: 0.35 },
      right: { img: demonHurtRight, frames: 4, width: 400, duration: 0.35 }
    },
    death: {
      left: { img: demonDeathLeft, frames: 4, width: 400, duration: 0.9 },
      right: { img: demonDeathRight, frames: 4, width: 400, duration: 0.9 },
      default: { img: demonDeathRight, frames: 4, width: 400, duration: 0.9 }
    }
  },
  orc: {
    idle: {
      left: { img: orcIdleLeft, frames: 6, width: 600, duration: 0.8 },
      right: { img: orcIdleRight, frames: 6, width: 600, duration: 0.8 }
    },
    walk: {
      left: { img: orcWalkLeft, frames: 8, width: 800, duration: 0.8 },
      right: { img: orcWalkRight, frames: 8, width: 800, duration: 0.8 }
    },
    attack1: {
      left: { img: orcAttack01Left, frames: 6, width: 600, duration: 0.4 },
      right: { img: orcAttack01Right, frames: 6, width: 600, duration: 0.4 }
    },
    attack2: {
      left: { img: orcAttack02Left, frames: 6, width: 600, duration: 0.4 },
      right: { img: orcAttack02Right, frames: 6, width: 600, duration: 0.4 }
    },
    hurt: {
      left: { img: orcHitLeft, frames: 5, width: 500, duration: 0.35 },
      right: { img: orcHitRight, frames: 5, width: 500, duration: 0.35 }
    },
    death: {
      left: { img: orcDeathLeft, frames: 4, width: 400, duration: 0.9 },
      right: { img: orcDeathRight, frames: 4, width: 400, duration: 0.9 },
      default: { img: orcDeathRight, frames: 4, width: 400, duration: 0.9 }
    }
  },
  samurai: {
    idle: {
      left: { img: samuraiIdleLeft, frames: 10, width: 960, duration: 0.8 },
      right: { img: samuraiIdleRight, frames: 10, width: 960, duration: 0.8 }
    },
    walk: {
      left: { img: samuraiRunLeft, frames: 16, width: 1536, duration: 0.8 },
      right: { img: samuraiRunRight, frames: 16, width: 1536, duration: 0.8 }
    },
    attack1: {
      left: { img: samuraiAttack01Left, frames: 7, width: 672, duration: 0.4 },
      right: { img: samuraiAttack01Right, frames: 7, width: 672, duration: 0.4 }
    },
    attack2: {
      left: { img: samuraiAttack01Left, frames: 7, width: 672, duration: 0.4 },
      right: { img: samuraiAttack01Right, frames: 7, width: 672, duration: 0.4 }
    },
    hurt: {
      left: { img: samuraiHurtLeft, frames: 4, width: 384, duration: 0.35 },
      right: { img: samuraiHurtRight, frames: 4, width: 384, duration: 0.35 }
    },
    death: {
      left: { img: samuraiDeathLeft, frames: 10, width: 960, duration: 0.9 },
      right: { img: samuraiDeathRight, frames: 10, width: 960, duration: 0.9 },
      default: { img: samuraiDeathRight, frames: 10, width: 960, duration: 0.9 }
    }
  }
};

SPRITE_CONFIG['blood_monster'] = SPRITE_CONFIG.blood;
SPRITE_CONFIG['emperor_samurai'] = SPRITE_CONFIG.samurai;
SPRITE_CONFIG['human'] = SPRITE_CONFIG.samurai;
SPRITE_CONFIG['lost_human'] = SPRITE_CONFIG.samurai;

const resolveBotType = (variantStr, nameStr) => {
  const v = String(variantStr || '').toLowerCase();
  const n = String(nameStr || '').toLowerCase();
  if (v === 'samurai' || v.includes('samurai') || v.includes('human') || n.includes('samurai') || n.includes('tersesat') || n.includes('manusia')) {
    return 'samurai';
  }
  if (v === 'orc' || n.includes('orc')) {
    return 'orc';
  }
  if (v === 'blood' || n.includes('blood')) {
    return 'blood';
  }
  if (v === 'demon' || n.includes('demon') || n.includes('fiend') || n.includes('imp')) {
    return 'demon';
  }
  return 'blood';
};

const getDefaultName = (type) => {
  switch (type) {
    case 'samurai':
      return 'Manusia yang Tersesat (Emperor Samurai)';
    case 'orc':
      return 'Orc';
    case 'demon':
      return 'Demon';
    case 'blood':
    default:
      return 'Blood Monster';
  }
};

const EnemyBot = ({ bot, onDeathComplete }) => {
  const isBotValid = Boolean(bot && typeof bot.x === 'number' && typeof bot.y === 'number');
  const rawHealth = isBotValid ? bot.health : 3;
  const rawState = isBotValid ? bot.state : 'idle';
  const rawIsDying = isBotValid ? Boolean(bot.isDying) : false;
  const isDeadProp = isBotValid && (Number(rawHealth) <= 0 || rawState === 'dead' || rawState === 'death' || rawIsDying);
  const botId = isBotValid ? bot.id : undefined;

  const [isDying, setIsDying] = useState(isDeadProp);
  const deathTimerRef = useRef(null);
  const onDeathCompleteRef = useRef(onDeathComplete);
  const botIdRef = useRef(botId);
  const initialFacing = (isBotValid && (bot.direction === 'left' || String(bot.direction).includes('left'))) ? 'left' : 'right';
  const lastFacingRef = useRef(initialFacing);

  onDeathCompleteRef.current = onDeathComplete;
  botIdRef.current = botId;

  const isDead = isDeadProp || isDying;

  useEffect(() => {
    if (isDeadProp && !isDying) {
      setIsDying(true);
    }
  }, [isDeadProp, isDying]);

  useEffect(() => {
    if (isDead) {
      if (!deathTimerRef.current) {
        deathTimerRef.current = setTimeout(() => {
          if (typeof onDeathCompleteRef.current === 'function' && botIdRef.current) {
            onDeathCompleteRef.current(botIdRef.current);
          }
        }, 900);
      }
    } else {
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
        deathTimerRef.current = null;
      }
    }
    return () => {
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
        deathTimerRef.current = null;
      }
    };
  }, [isDead]);

  if (!isBotValid) {
    return null;
  }

  const {
    id,
    name,
    x,
    y,
    health = 3,
    maxHealth = 3,
    state = 'idle',
    direction = 'right',
    variant,
    category: customCategory,
    attackType = 'attack1',
    scaleMultiplier
  } = bot;

  // Resolve bot variant type
  const botType = resolveBotType(variant, name);

  // Default label and normalized category
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : getDefaultName(botType);
  const rawCategory = customCategory || (botType === 'samurai' ? 'Manusia yang Tersesat' : 'Monster');
  const category = (typeof rawCategory === 'string' && rawCategory.toLowerCase() === 'monster')
    ? 'Monster'
    : rawCategory;

  const left = `${TILE_SIZE * x}px`;
  const top = `${TILE_SIZE * y - 12}px`;
  const zIndex = (y + 3) * 10 + 4;

  const isAttacking2 = !isDead && (state === 'attack2' || state === 'attacking2' || (state === 'attacking' && attackType === 'attack2'));
  const isAttacking1 = !isDead && !isAttacking2 && (state === 'attacking' || state === 'attack' || state === 'attack1');
  const isAttacking = isAttacking1 || isAttacking2;
  const isChasing = !isDead && !isAttacking && (state === 'chasing' || state === 'walk' || state === 'moving');
  const isDamaged = !isDead && !isAttacking && !isChasing && (state === 'damaged' || state === 'hurt');
  const hpPercent = Math.max(0, Math.min(100, ((health || 0) / (maxHealth || 3)) * 100));

  const currentConfig = SPRITE_CONFIG[botType] || SPRITE_CONFIG.blood;

  // Direction: strictly horizontal ('left' or 'right') as up and down versions are removed
  let dirKey = lastFacingRef.current || 'right';
  if (direction === 'left' || String(direction).includes('left')) {
    dirKey = 'left';
    lastFacingRef.current = 'left';
  } else if (direction === 'right' || String(direction).includes('right')) {
    dirKey = 'right';
    lastFacingRef.current = 'right';
  } else {
    // When moving up or down, preserve the last horizontal direction (left or right)
    dirKey = lastFacingRef.current || 'right';
  }

  let actionGroup = currentConfig.idle;
  let animName = 'bot-anim-idle';

  if (isDead) {
    actionGroup = currentConfig.death;
    animName = 'bot-anim-death';
  } else if (isAttacking2) {
    actionGroup = currentConfig.attack2;
    animName = 'bot-anim-attack2';
  } else if (isAttacking1) {
    actionGroup = currentConfig.attack1;
    animName = 'bot-anim-attack1';
  } else if (isDamaged) {
    actionGroup = currentConfig.hurt;
    animName = 'bot-anim-hurt';
  } else if (isChasing) {
    actionGroup = currentConfig.walk;
    animName = 'bot-anim-walk';
  }

  const activeAnim = actionGroup[dirKey] || actionGroup.right || actionGroup.default || actionGroup.left;

  // Scaling rule: 3 monsters = scale 10x; Emperor Samurai = only 2x larger (scale 2x)
  const defaultScale = botType === 'samurai' ? 2 : 10;
  const effectiveScale = typeof scaleMultiplier === 'number' && scaleMultiplier > 0 ? scaleMultiplier : defaultScale;
  const deathSteps = Math.max(1, (activeAnim.frames || 4) - 1);

  return (
    <div
      className={`EnemyBot ${isAttacking ? 'attacking' : ''} ${isAttacking2 ? 'attack2' : ''} ${isDamaged ? 'damaged' : ''} ${isDead ? 'dead' : ''} ${botType}`}
      style={{
        transform: `translate3d(${left}, ${top}, 0)`,
        zIndex,
        '--bot-scale': effectiveScale
      }}
      data-testid={`bot-enemy-${id}`}
      data-variant={botType}
      data-category={category}
      aria-label={`${safeName} HP ${health}/${maxHealth}`}
    >
      <div className="EnemyBot_shadow" />

      {isAttacking && (
        <div className={`EnemyBot_attack_effect ${isAttacking2 ? 'combo' : ''}`} />
      )}

      {isDead && (
        <div className="EnemyBot_death_effect" />
      )}

      <div className="EnemyBot_sprite">
        {/* Authentic pixel character sprite sheet */}
        <div
          className={`EnemyBot_sheet_frame ${animName} ${botType} dir-${dirKey} frames-${activeAnim.frames}`}
          data-sprite-src={activeAnim.img}
          style={{
            backgroundImage: `url("${activeAnim.img}")`,
            '--bot-frame-count': activeAnim.frames,
            '--bot-sheet-width': `${activeAnim.width}px`,
            '--bot-anim-duration': `${activeAnim.duration}s`,
            '--bot-death-steps': deathSteps,
            '--bot-death-offset': `calc(-48px * var(--bot-scale, 10) * ${deathSteps})`
          }}
        />

        {/* Fallback & testing SVG monster element */}
        <svg
          className="EnemyBot_svg"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Monster horns */}
          <path d="M8 8L5 2L11 6L8 8Z" fill="#991b1b" stroke="#450a0a" strokeWidth="1" />
          <path d="M24 8L27 2L21 6L24 8Z" fill="#991b1b" stroke="#450a0a" strokeWidth="1" />

          {/* Monster Head & Body */}
          <ellipse cx="16" cy="17" rx="10" ry="11" fill="#4c1d95" stroke="#2e1065" strokeWidth="1.2" />

          {/* Underbelly markings */}
          <ellipse cx="16" cy="20" rx="6" ry="6" fill="#6d28d9" />

          {/* Glowing Red Eyes */}
          <ellipse cx="12" cy="14" rx="2.5" ry="2" fill="#ef4444" />
          <circle cx="12.5" cy="13.8" r="1" fill="#fef08a" />
          <ellipse cx="20" cy="14" rx="2.5" ry="2" fill="#ef4444" />
          <circle cx="20.5" cy="13.8" r="1" fill="#fef08a" />

          {/* Fierce Mouth / Fangs */}
          <path d="M12 21Q16 23 20 21" stroke="#450a0a" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M13.5 21L14.5 23L15.5 21" fill="#ffffff" />
          <path d="M16.5 21L17.5 23L18.5 21" fill="#ffffff" />
        </svg>
      </div>

      <div className="EnemyBot_name_container">
        <span className="EnemyBot_name">{safeName}</span>
        <div className="EnemyBot_hp_bar">
          <div
            className="EnemyBot_hp_fill"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnemyBot;
