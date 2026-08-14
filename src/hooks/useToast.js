import { useState, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Convenience helpers
  const toast = {
    success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
    error:   (title, message, duration) => addToast({ type: 'error',   title, message, duration }),
    warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
    info:    (title, message, duration) => addToast({ type: 'info',    title, message, duration }),
  };

  return { toasts, removeToast, toast };
}
