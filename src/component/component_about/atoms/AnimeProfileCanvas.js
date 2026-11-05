import React, { useRef, useEffect } from 'react';
import './AnimeProfileCanvas.css';

/**
 * AnimeProfileCanvas
 * 
 * Interactive HTML5 Canvas component rendering anime-themed aura rings,
 * drifting sakura petals, and magical anime sparkle particles around team avatars.
 * Designed with atomic design principles and zero-leak requestAnimationFrame loop.
 */
const AnimeProfileCanvas = ({
  width = 110,
  height = 110,
  isHovered = false,
  memberId = 1
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let angle = 0;

    // Distinct anime aura hues per member role/ID
    const auraColors = [
      { primary: '#FCD03E', glow: 'rgba(252, 208, 62, 0.45)', sakura: '#FFB7C5' }, // 1: Golden Sun
      { primary: '#38BDF8', glow: 'rgba(56, 189, 248, 0.45)', sakura: '#BAE6FD' },  // 2: Cyan Sky
      { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.50)', sakura: '#FDE68A' },  // 3: Leader Ember
      { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.45)', sakura: '#A7F3D0' }, // 4: Emerald Nature
      { primary: '#A855F7', glow: 'rgba(168, 85, 247, 0.45)', sakura: '#E9D5FF' }, // 5: Mystic Purple
      { primary: '#EC4899', glow: 'rgba(236, 72, 153, 0.45)', sakura: '#FBCFE8' }  // 6: Sakura Blossom
    ];

    const colorTheme = auraColors[(memberId - 1) % auraColors.length];

    // Seed 14 particles (sakura petals and anime sparkles)
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = 42;

    const particles = Array.from({ length: 18 }, (_, i) => ({
      x: centerX + (Math.random() - 0.5) * 80,
      y: centerY + (Math.random() - 0.5) * 80,
      radius: Math.random() * 2.8 + 1.2,
      speedY: -(Math.random() * 0.7 + 0.4),
      speedX: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI,
      type: i % 2 === 0 ? 'sakura' : 'sparkle'
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const speedMultiplier = isHovered ? 2.5 : 1.0;
      angle += 0.03 * speedMultiplier;

      // 1. Draw Anime Magic Aura Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      const auraRadius = isHovered ? baseRadius + 4 : baseRadius;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.strokeStyle = colorTheme.primary;
      ctx.lineWidth = isHovered ? 4.0 : 2.5;
      ctx.shadowColor = colorTheme.primary;
      ctx.shadowBlur = isHovered ? 18 : 10;
      ctx.stroke();

      // Dashed rotating anime energy ring
      ctx.beginPath();
      ctx.setLineDash([8, 10]);
      ctx.arc(0, 0, auraRadius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = colorTheme.glow;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();

      // 2. Draw Floating Sakura Petals & Magical Sparkles
      particles.forEach((p) => {
        p.y += p.speedY * speedMultiplier;
        p.x += Math.sin(p.pulse) * p.speedX;
        p.pulse += 0.04;

        // Reset particle if it floats past top
        if (p.y < 4) {
          p.y = height - 8;
          p.x = centerX + (Math.random() - 0.5) * 70;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (p.type === 'sakura') {
          // Anime Sakura Petal shape
          ctx.beginPath();
          ctx.fillStyle = colorTheme.sakura;
          ctx.ellipse(p.x, p.y, p.radius * 1.6, p.radius, Math.PI / 4 + Math.sin(p.pulse), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Anime Diamond Sparkle
          ctx.beginPath();
          ctx.fillStyle = colorTheme.primary;
          const s = p.radius * (isHovered ? 1.4 : 1.0);
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s * 0.6, p.y);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s * 0.6, p.y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [width, height, isHovered, memberId]);

  return (
    <canvas
      ref={canvasRef}
      className={`bitdsul-anime-canvas ${isHovered ? 'is-burst' : ''}`}
      width={width}
      height={height}
      aria-hidden="true"
    />
  );
};

export default AnimeProfileCanvas;
