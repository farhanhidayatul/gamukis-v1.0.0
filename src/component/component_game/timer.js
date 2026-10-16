import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './timer.css';

const Timer = ({ initialMinutes = 0, initialSeconds = 0, onTimeUp, onWarning, warningThreshold = 30 }) => {
  const initialTotalSeconds = initialMinutes * 60 + initialSeconds;
  const initialTotalSecondsRef = useRef(initialTotalSeconds);
  const deadlineRef = useRef(Date.now() + initialTotalSeconds * 1000);
  const onTimeUpRef = useRef(onTimeUp);
  const onWarningRef = useRef(onWarning);
  const lastWarnedSecondRef = useRef(null);
  const [remainingSeconds, setRemainingSeconds] = useState(initialTotalSeconds);
  const [isTimeAlmostUp, setIsTimeAlmostUp] = useState(false);

  onTimeUpRef.current = onTimeUp;
  onWarningRef.current = onWarning;

  useEffect(() => {
    let hasFinished = false;
    const updateTimer = () => {
      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );
      setRemainingSeconds(nextRemainingSeconds);
      setIsTimeAlmostUp(nextRemainingSeconds <= initialTotalSecondsRef.current / 2);

      if (
        nextRemainingSeconds <= warningThreshold &&
        nextRemainingSeconds > 0 &&
        lastWarnedSecondRef.current !== nextRemainingSeconds
      ) {
        lastWarnedSecondRef.current = nextRemainingSeconds;
        onWarningRef.current?.(nextRemainingSeconds);
      }

      if (nextRemainingSeconds === 0 && !hasFinished) {
        hasFinished = true;
        window.clearInterval(timer);
        onTimeUpRef.current?.();
      }
    };

    const timer = window.setInterval(updateTimer, 250);
    updateTimer();

    return () => window.clearInterval(timer);
  }, [warningThreshold]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className={`timer ${isTimeAlmostUp ? 'almost-up' : ''}`}>
      <div className="time-block">
        {minutes < 10 ? `0${minutes}` : minutes}
      </div>
      <div className="colon">:</div>
      <div className="time-block">
        {seconds < 10 ? `0${seconds}` : seconds}
      </div>
    </div>
  );
};

Timer.propTypes = {
  initialMinutes: PropTypes.number.isRequired,
  initialSeconds: PropTypes.number.isRequired,
  onTimeUp: PropTypes.func,
  onWarning: PropTypes.func,
  warningThreshold: PropTypes.number
};

export default Timer;
