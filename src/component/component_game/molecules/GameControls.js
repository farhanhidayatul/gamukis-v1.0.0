import React, { useEffect, useRef } from 'react';
import SkillButton from '../atoms/SkillButton';
import { skillTypes } from '../skill';

const DirectionButton = ({ label, symbol, onMove, onMoveStart, onMoveEnd, x, y }) => {
  const timeoutRef = useRef(null);
  const onMoveRef = useRef(onMove);
  const onMoveEndRef = useRef(onMoveEnd);
  onMoveRef.current = onMove;
  onMoveEndRef.current = onMoveEnd;

  const stopMoving = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onMoveEndRef.current?.();
  };

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const startMoving = (event) => {
    event.preventDefault();
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    stopMoving();
    onMoveStart?.();
    const scheduleNextMove = (delay = 220) => {
      timeoutRef.current = window.setTimeout(() => {
        const nextDelay = onMoveRef.current(x, y);
        scheduleNextMove(Number.isFinite(nextDelay) ? nextDelay : 220);
      }, delay);
    };
    scheduleNextMove(onMoveRef.current(x, y));
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={startMoving}
      onPointerUp={stopMoving}
      onPointerCancel={stopMoving}
      onLostPointerCapture={stopMoving}
      onClick={(event) => {
        if (event.detail === 0) onMoveRef.current(x, y);
      }}
    >
      {symbol}
    </button>
  );
};

const GameControls = ({ onMove, onMoveStart, onMoveEnd, onCastSkill, skill, isCoolingDown }) => (
  <div className="controls" aria-label="Kontrol permainan">
    <div className="movement-pad" aria-label="Arah gerak">
      <div className="row">
        <DirectionButton label="Bergerak ke atas" symbol="↑" onMove={onMove} onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} x={0} y={-1} />
      </div>
      <div className="row">
        <DirectionButton label="Bergerak ke kiri" symbol="←" onMove={onMove} onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} x={-1} y={0} />
        <DirectionButton label="Bergerak ke kanan" symbol="→" onMove={onMove} onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} x={1} y={0} />
      </div>
      <div className="row">
        <DirectionButton label="Bergerak ke bawah" symbol="↓" onMove={onMove} onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} x={0} y={1} />
      </div>
    </div>
    <div className="mobile-skill-grid" aria-label="Pilih jurus">
      {skillTypes.map((skillType, index) => (
        <button
          key={skillType.name}
          type="button"
          className={`mobile-skill-button ${skillType.className}`}
          onClick={() => onCastSkill(index)}
          disabled={isCoolingDown}
          aria-label={`Gunakan jurus ${skillType.name}`}
        >
          <span>{index + 1}</span>
          {skillType.name}
        </button>
      ))}
    </div>
    <div className="desktop-skill-control">
      <SkillButton skill={skill} isCoolingDown={isCoolingDown} onClick={() => onCastSkill()} />
    </div>
  </div>
);

export default GameControls;
