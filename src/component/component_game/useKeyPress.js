import { useEffect, useRef } from 'react';

const useKeyPress = (keyMappings) => {
  const keyMappingsRef = useRef(keyMappings);
  keyMappingsRef.current = keyMappings;

  useEffect(() => {
    const pressedKeys = new Set();
    const movementTimeouts = new Map();
    const movementCodes = new Set([
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ]);

    const stopMovementKey = (code) => {
      const timeout = movementTimeouts.get(code);
      if (timeout) window.clearTimeout(timeout);
      movementTimeouts.delete(code);
      pressedKeys.delete(code);
    };

    const keydownFunction = (event) => {
      const target = event.target;
      const isEditingText = target instanceof HTMLElement && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );
      if (isEditingText) return;

      if (event.code === 'Backspace') {
        event.preventDefault();
        return;
      }

      const action = keyMappingsRef.current[event.code];
      if (!action) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (event.repeat || pressedKeys.has(event.code)) return;

      pressedKeys.add(event.code);
      if (movementCodes.has(event.code)) {
        const scheduleNextMove = (delay = 220) => {
          movementTimeouts.set(event.code, window.setTimeout(() => {
            const nextDelay = keyMappingsRef.current[event.code]?.();
            scheduleNextMove(Number.isFinite(nextDelay) ? nextDelay : 220);
          }, delay));
        };
        scheduleNextMove(action());
      } else {
        action();
      }
    };

    const keyupFunction = (event) => stopMovementKey(event.code);
    const clearPressedKeys = () => {
      movementTimeouts.forEach((timeout) => window.clearTimeout(timeout));
      movementTimeouts.clear();
      pressedKeys.clear();
    };

    document.addEventListener('keydown', keydownFunction);
    document.addEventListener('keyup', keyupFunction);
    window.addEventListener('blur', clearPressedKeys);

    return () => {
      clearPressedKeys();
      document.removeEventListener('keydown', keydownFunction);
      document.removeEventListener('keyup', keyupFunction);
      window.removeEventListener('blur', clearPressedKeys);
    };
  }, []);

  return null;
};

export default useKeyPress;
