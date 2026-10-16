import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './toastNotification.css';

const TOAST_EVENT = 'gamukis-toast-event';

/**
 * Global helper to trigger toast notification from any game event or handler.
 * @param {string} message - Text notification to display.
 * @param {'info'|'success'|'warning'|'error'|'danger'} [type='info'] - Severity variant.
 * @param {number} [duration=3000] - Lifespan in milliseconds.
 */
export const emitToast = (message, type = 'info', duration = 3000) => {
  if (typeof window === 'undefined' || !message) return;
  const detail = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message,
    type,
    duration
  };
  try {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
  } catch (e) {
    // In restricted or headless test environments without CustomEvent
  }
};

export const showToast = emitToast;

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return '✨';
    case 'warning':
      return '⚠️';
    case 'error':
    case 'danger':
      return '💥';
    case 'info':
    default:
      return '🔔';
  }
};

/**
 * ToastNotification Component.
 * Can be mounted once in the InGame view. It automatically listens for `emitToast` events.
 */
const ToastNotification = ({ maxVisible = 4 }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const addToast = useCallback((toast) => {
    setToasts((current) => {
      const next = [...current, toast];
      if (next.length > maxVisible) {
        return next.slice(next.length - maxVisible);
      }
      return next;
    });

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 3000);

    timeoutsRef.current[toast.id] = timer;
  }, [maxVisible, removeToast]);

  useEffect(() => {
    const handleToastEvent = (event) => {
      if (event?.detail) {
        addToast(event.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToastEvent);
      // Clean up all active timers
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="gamukis-toast-container" data-testid="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`gamukis-toast-item gamukis-toast-${toast.type || 'info'}`}
          data-testid="toast-item"
        >
          <span className="gamukis-toast-icon">{getIcon(toast.type)}</span>
          <span className="gamukis-toast-message">{toast.message}</span>
          <button
            type="button"
            className="gamukis-toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

ToastNotification.propTypes = {
  maxVisible: PropTypes.number
};

export default ToastNotification;

