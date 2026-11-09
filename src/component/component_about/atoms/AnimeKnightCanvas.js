import { useRef, useEffect } from "react";
import rigData from './farhanKnightRig.json';
import './AnimeKnightCanvas.css';

/**
 * Execute a path command array on a 2D canvas context
 */
function renderCommands(ctx, commands, deformFn = null) {
  ctx.beginPath();
  commands.forEach((cmd) => {
    const type = cmd[0];
    if (type === 'M') {
      const p = deformFn ? deformFn(cmd[1], cmd[2]) : { x: cmd[1], y: cmd[2] };
      ctx.moveTo(p.x, p.y);
    } else if (type === 'L') {
      const p = deformFn ? deformFn(cmd[1], cmd[2]) : { x: cmd[1], y: cmd[2] };
      ctx.lineTo(p.x, p.y);
    } else if (type === 'C') {
      const cp1 = deformFn ? deformFn(cmd[1], cmd[2]) : { x: cmd[1], y: cmd[2] };
      const cp2 = deformFn ? deformFn(cmd[3], cmd[4]) : { x: cmd[3], y: cmd[4] };
      const end = deformFn ? deformFn(cmd[5], cmd[6]) : { x: cmd[5], y: cmd[6] };
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    } else if (type === 'Q') {
      const cp = deformFn ? deformFn(cmd[1], cmd[2]) : { x: cmd[1], y: cmd[2] };
      const end = deformFn ? deformFn(cmd[3], cmd[4]) : { x: cmd[3], y: cmd[4] };
      ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
    } else if (type === 'Z') {
      ctx.closePath();
    }
  });
}

/**
 * Helper to draw a glowing 4-point anime lens flare / star glint
 */
function drawStarGlint(ctx, cx, cy, radius, rotation = 0, color = '#FFFFFF', outerColor = 'rgba(56, 189, 248, 0.8)') {
  if (radius <= 0.2) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, outerColor);
  grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  for (let i = 0; i < 2; i++) {
    ctx.rotate((Math.PI / 2) * i);
    ctx.beginPath();
    ctx.moveTo(-radius * 1.6, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius * 0.25);
    ctx.quadraticCurveTo(0, 0, radius * 1.6, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius * 0.25);
    ctx.quadraticCurveTo(0, 0, -radius * 1.6, 0);
    ctx.fill();
  }

  ctx.rotate(Math.PI / 4);
  for (let i = 0; i < 2; i++) {
    ctx.rotate((Math.PI / 2) * i);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius * 0.18);
    ctx.quadraticCurveTo(0, 0, radius * 0.9, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius * 0.18);
    ctx.quadraticCurveTo(0, 0, -radius * 0.9, 0);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * AnimeKnightCanvas
 * 
 * CLEAN ANIME CEL-SHADED VECTOR ENGINE.
 * Reads clean Bézier contours and shaded fills from farhanKnightRig.json:
 * - Completely smooth outlines (zero jagged cutout noise or choppy artifacts)
 * - Articulated shoulder sword arm with interactive slash attack
 * - Dynamic cloth wave displacement on cape
 * - Interactive cursor gaze tracking
 * - Real-time metallic blade sheen sweep with 4-point star lens flare
 * - ZERO raster/bitmap assets
 */
const AnimeKnightCanvas = ({
  width = 210,
  height = 270,
  glowColor = 'rgba(56, 189, 248, 0.5)'
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let time = 0;

    let mousePos = { x: width / 2, y: height / 2 };
    let smoothGazeX = 0;
    let smoothGazeY = 0;

    let slashState = {
      active: false,
      progress: 0
    };

    const slashSparks = [];

    const embers = Array.from({ length: 18 }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: -(Math.random() * 0.8 + 0.4),
      speedX: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.7 + 0.3,
      isFront: idx % 2 === 0
    }));

    const windLines = Array.from({ length: 5 }, () => ({
      x: width + Math.random() * 50,
      y: Math.random() * (height * 0.6),
      length: Math.random() * 40 + 25,
      speed: -(Math.random() * 4 + 3),
      alpha: Math.random() * 0.4 + 0.2
    }));

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mousePos.x = width / 2;
      mousePos.y = height / 2;
    };

    const handleClick = () => {
      slashState.active = true;
      slashState.progress = 0;

      for (let i = 0; i < 18; i++) {
        slashSparks.push({
          x: width * 0.35 + (Math.random() - 0.5) * 40,
          y: height * 0.65 + (Math.random() - 0.5) * 50,
          vx: -(Math.random() * 5 + 2),
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          decay: Math.random() * 0.05 + 0.03,
          size: Math.random() * 2.5 + 1.2
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    const { viewBox, parts, bones } = rigData;
    const boneMap = {};
    (bones || []).forEach((b) => {
      boneMap[b.id] = b;
    });

    const sortedParts = [...(parts || [])].sort((a, b) => a.z - b.z);

    const scaleFactor = (width * 0.94) / (viewBox ? viewBox.width : 320);
    const globalOffsetX = (width - (viewBox ? viewBox.width : 320) * scaleFactor) / 2;
    const globalOffsetY = (height - (viewBox ? viewBox.height : 400) * scaleFactor) / 2 + 6;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.038;

      const targetGazeX = ((mousePos.x - width / 2) / (width / 2)) * 0.12;
      const targetGazeY = ((mousePos.y - height / 2) / (height / 2)) * 0.08;
      smoothGazeX += (targetGazeX - smoothGazeX) * 0.08;
      smoothGazeY += (targetGazeY - smoothGazeY) * 0.08;

      let swordSlashAngle = 0;
      let slashArcProgress = 0;
      if (slashState.active) {
        slashState.progress += 0.055;
        const p = slashState.progress;
        if (p < 0.25) {
          swordSlashAngle = -(p / 0.25) * 0.4;
        } else if (p < 0.65) {
          const strikeT = (p - 0.25) / 0.4;
          swordSlashAngle = -0.4 + (1 - Math.pow(1 - strikeT, 3)) * 1.1;
          slashArcProgress = strikeT;
        } else if (p < 1.0) {
          const recoverT = (p - 0.65) / 0.35;
          swordSlashAngle = 0.7 * Math.cos(recoverT * Math.PI * 1.5) * Math.exp(-recoverT * 3);
        } else {
          slashState.active = false;
          slashState.progress = 0;
        }
      }

      // 1. DYNAMIC GROUND SHADOW
      const shadowCenterX = width * 0.52;
      const shadowCenterY = height * 0.94;
      const shadowRadiusX = (width * 0.34) * (1 + Math.sin(time * 2.2) * 0.03);
      const shadowRadiusY = 11 * (1 + Math.sin(time * 2.2) * 0.03);

      ctx.save();
      ctx.translate(shadowCenterX, shadowCenterY);
      const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, shadowRadiusX);
      shadowGrad.addColorStop(0, 'rgba(7, 12, 24, 0.78)');
      shadowGrad.addColorStop(0.6, 'rgba(7, 12, 24, 0.4)');
      shadowGrad.addColorStop(1, 'rgba(7, 12, 24, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.scale(1, shadowRadiusY / shadowRadiusX);
      ctx.arc(0, 0, shadowRadiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. BACK WIND GUST LINES
      windLines.forEach((w) => {
        w.x += w.speed;
        if (w.x < -w.length) {
          w.x = width + Math.random() * 40;
          w.y = Math.random() * (height * 0.65);
        }
        ctx.save();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = w.alpha;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + w.length, w.y - 4);
        ctx.stroke();
        ctx.restore();
      });

      // 3. BACK AETHER PARTICLES
      embers.forEach((p) => {
        if (p.isFront) return;
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.fillStyle = '#38BDF8';
        ctx.globalAlpha = p.alpha * (0.4 + 0.3 * Math.sin(time * 2 + p.x));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. RENDER CLEAN ANIME CEL-SHADED RIG
      ctx.save();
      ctx.translate(globalOffsetX, globalOffsetY);
      ctx.scale(scaleFactor, scaleFactor);

      const breathY = Math.sin(time * 2.2) * 2.8;
      const breathScaleX = 1 + Math.sin(time * 2.2) * 0.008;
      const breathScaleY = 1 - Math.sin(time * 2.2) * 0.012;

      sortedParts.forEach((part) => {
        const bone = boneMap[part.bone];
        const pivot = bone ? bone.pivot : [160, 200];

        ctx.save();

        if (part.deform === 'wave_cloth') {
          // Cape cloth wave physics
          const capeWaveDeform = (x, y) => {
            const factor = Math.max(0, (y - 110) / 150);
            const wx = Math.sin(time * 4.2 + (y * 0.05)) * factor * 14;
            const wy = Math.cos(time * 3.1 + (x * 0.05)) * factor * 5;
            return { x: x + wx, y: y + wy };
          };

          (part.paths || []).forEach((pathCmds) => {
            ctx.fillStyle = part.fill;
            ctx.strokeStyle = part.stroke;
            ctx.lineWidth = part.lineWidth || 2.4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            renderCommands(ctx, pathCmds, capeWaveDeform);
            ctx.fill();
            ctx.stroke();
          });

          if (part.shading) {
            part.shading.forEach((sh) => {
              ctx.fillStyle = sh.fill;
              (sh.paths || []).forEach((pCmds) => {
                renderCommands(ctx, pCmds, capeWaveDeform);
                ctx.fill();
              });
            });
          }
        } else if (part.bone === 'swordArm') {
          // Articulated sword arm with interactive slash
          const idleSway = Math.sin(time * 1.8) * 0.035;
          const totalAngle = idleSway + swordSlashAngle;

          ctx.translate(pivot[0], pivot[1]);
          ctx.rotate(totalAngle);
          ctx.translate(-pivot[0], -pivot[1]);

          (part.paths || []).forEach((pathCmds) => {
            ctx.fillStyle = part.fill;
            ctx.strokeStyle = part.stroke;
            ctx.lineWidth = part.lineWidth || 2.4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            renderCommands(ctx, pathCmds);
            ctx.fill();
            ctx.stroke();
          });

          if (part.overlays) {
            part.overlays.forEach((ov) => {
              ctx.fillStyle = ov.fill;
              ctx.strokeStyle = ov.stroke;
              ctx.lineWidth = ov.lineWidth || 2.4;
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              (ov.paths || []).forEach((pCmds) => {
                renderCommands(ctx, pCmds);
                ctx.fill();
                ctx.stroke();
              });
              if (ov.shading) {
                ov.shading.forEach((sh) => {
                  ctx.fillStyle = sh.fill;
                  (sh.paths || []).forEach((pCmds) => {
                    renderCommands(ctx, pCmds);
                    ctx.fill();
                  });
                });
              }
            });
          }

          // Real-time blade metallic glint sweep
          const sweepPeriod = 2.2;
          const sweepProgress = (time % sweepPeriod) / sweepPeriod;
          const bladeHilt = [70, 215];
          const bladeTip = [8, 325];

          if (sweepProgress < 0.75) {
            const t = sweepProgress / 0.75;
            const gx = bladeHilt[0] + (bladeTip[0] - bladeHilt[0]) * t;
            const gy = bladeHilt[1] + (bladeTip[1] - bladeHilt[1]) * t;

            ctx.save();
            const beamGrad = ctx.createRadialGradient(gx, gy, 1, gx, gy, 16);
            beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            beamGrad.addColorStop(0.35, 'rgba(125, 211, 252, 0.75)');
            beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.arc(gx, gy, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            const tipT = (sweepProgress - 0.75) / 0.25;
            const radius = Math.sin(tipT * Math.PI) * 14;
            drawStarGlint(ctx, bladeTip[0], bladeTip[1], radius, time * 2, '#FFFFFF', 'rgba(56, 189, 248, 0.9)');
          }
        } else if (part.bone === 'head') {
          // Head nod & cursor gaze tracking
          const headBobY = Math.sin(time * 2.2) * 2.5;
          ctx.translate(pivot[0], pivot[1] + headBobY);
          ctx.rotate(smoothGazeX + Math.sin(time * 1.4) * 0.025);
          ctx.translate(-pivot[0], -pivot[1] + smoothGazeY * 15);

          if (part.overlays) {
            part.overlays.forEach((ov) => {
              if (ov.fill) ctx.fillStyle = ov.fill;
              if (ov.stroke) {
                ctx.strokeStyle = ov.stroke;
                ctx.lineWidth = ov.lineWidth || 2.4;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
              }
              (ov.paths || []).forEach((pCmds) => {
                renderCommands(ctx, pCmds);
                if (ov.fill) ctx.fill();
                if (ov.stroke) ctx.stroke();
              });
              if (ov.shading) {
                ov.shading.forEach((sh) => {
                  if (sh.fill) ctx.fillStyle = sh.fill;
                  if (sh.stroke) {
                    ctx.strokeStyle = sh.stroke;
                    ctx.lineWidth = sh.lineWidth || 1.6;
                  }
                  (sh.paths || []).forEach((pCmds) => {
                    renderCommands(ctx, pCmds);
                    if (sh.fill) ctx.fill();
                    if (sh.stroke) ctx.stroke();
                  });
                });
              }
            });
          }

          // Eye glint
          const eyeCycle = (time * 0.8) % 3.6;
          if (eyeCycle > 3.1) {
            const sparkT = (eyeCycle - 3.1) / 0.5;
            const radius = Math.sin(sparkT * Math.PI) * 7;
            drawStarGlint(ctx, 160, 95, radius, Math.PI / 4, '#FFFFFF', 'rgba(125, 211, 252, 0.95)');
          }
        } else if (part.id === 'steel_cuirass' || part.id === 'cape_cowl_scarf') {
          // Chest breathing
          ctx.translate(pivot[0], pivot[1] + breathY);
          ctx.scale(breathScaleX, breathScaleY);
          ctx.translate(-pivot[0], -pivot[1]);

          (part.paths || []).forEach((pathCmds) => {
            ctx.fillStyle = part.fill;
            ctx.strokeStyle = part.stroke;
            ctx.lineWidth = part.lineWidth || 2.6;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            renderCommands(ctx, pathCmds);
            ctx.fill();
            ctx.stroke();
          });

          if (part.shading) {
            part.shading.forEach((sh) => {
              if (sh.fill) ctx.fillStyle = sh.fill;
              if (sh.stroke) {
                ctx.strokeStyle = sh.stroke;
                ctx.lineWidth = sh.lineWidth || 1.8;
              }
              (sh.paths || []).forEach((pCmds) => {
                renderCommands(ctx, pCmds);
                if (sh.fill) ctx.fill();
                if (sh.stroke) ctx.stroke();
              });
            });
          }
        } else {
          // Lower body & legs
          (part.paths || []).forEach((pathCmds) => {
            ctx.fillStyle = part.fill;
            ctx.strokeStyle = part.stroke;
            ctx.lineWidth = part.lineWidth || 2.6;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            renderCommands(ctx, pathCmds);
            ctx.fill();
            ctx.stroke();
          });

          if (part.overlays) {
            part.overlays.forEach((ov) => {
              ctx.fillStyle = ov.fill;
              ctx.strokeStyle = ov.stroke;
              ctx.lineWidth = ov.lineWidth || 2.6;
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              (ov.paths || []).forEach((pCmds) => {
                renderCommands(ctx, pCmds);
                ctx.fill();
                ctx.stroke();
              });
              if (ov.shading) {
                ov.shading.forEach((sh) => {
                  ctx.fillStyle = sh.fill;
                  (sh.paths || []).forEach((pCmds) => {
                    renderCommands(ctx, pCmds);
                    ctx.fill();
                  });
                });
              }
            });
          }
        }

        ctx.restore();
      });

      // 5. RADIANT CRESCENT SWORD SLASH ARC (When attack is triggered)
      if (slashArcProgress > 0.05 && slashArcProgress < 0.95) {
        ctx.save();
        const arcProgress = slashArcProgress;
        const arcCenter = { x: 120, y: 220 };
        const radius = 180;
        const startAngle = Math.PI * 0.6 - (arcProgress * 0.8);
        const endAngle = startAngle + 0.75;

        const slashGrad = ctx.createLinearGradient(
          arcCenter.x - radius, arcCenter.y,
          arcCenter.x, arcCenter.y + radius
        );
        slashGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        slashGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        slashGrad.addColorStop(1, 'rgba(125, 211, 252, 0.85)');

        ctx.strokeStyle = slashGrad;
        ctx.lineWidth = 7 * (1 - Math.abs(arcProgress - 0.5) * 1.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(arcCenter.x, arcCenter.y, radius, startAngle, endAngle);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(arcCenter.x, arcCenter.y, radius, startAngle + 0.1, endAngle - 0.1);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore(); // End transformed rig

      // 6. UPDATE & DRAW SLASH SPARK PARTICLES
      for (let i = slashSparks.length - 1; i >= 0; i--) {
        const s = slashSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0) {
          slashSparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.6 * s.life, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 7. FOREGROUND AETHER PARTICLES
      embers.forEach((p) => {
        if (!p.isFront) return;
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.fillStyle = '#7DD3FC';
        ctx.globalAlpha = p.alpha * (0.5 + 0.4 * Math.sin(time * 2.5 + p.y));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [width, height, glowColor]);

  return (
    <div
      className="anime-knight-canvas-wrapper"
      title="Farhan - The Code Vanguard Knight (Arahkan kursor untuk menatap, Klik untuk Serangan Tebasan Pedang!)"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="anime-knight-canvas"
      />
    </div>
  );
};

export default AnimeKnightCanvas;
