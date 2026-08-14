import React, { useEffect, useState } from 'react';

// Toast type configs: icon + background color
const TOAST_TYPES = {
  success: {
    icon: '✅',
    bg: 'bg-green-50',
    border: 'border-green-500',
    bar: 'bg-green-500',
    text: 'text-green-800',
  },
  error: {
    icon: '❌',
    bg: 'bg-red-50',
    border: 'border-red-500',
    bar: 'bg-red-500',
    text: 'text-red-800',
  },
  warning: {
    icon: '⚠️',
    bg: 'bg-retro-orange/10',
    border: 'border-retro-orange',
    bar: 'bg-retro-orange',
    text: 'text-retro-dark',
  },
  info: {
    icon: 'ℹ️',
    bg: 'bg-retro-blue/10',
    border: 'border-retro-blue',
    bar: 'bg-retro-blue',
    text: 'text-retro-dark',
  },
};

// Single Toast item
function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        ${config.bg} border-2 ${config.border} rounded-2xl shadow-retro-md
        p-4 pr-10
        ${exiting ? 'animate-toast-out' : 'animate-toast-in'}
        transition-all
      `}
    >
      {/* Icon */}
      <span className="text-xl leading-none shrink-0 mt-0.5">{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-black text-sm leading-tight ${config.text}`}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p className={`text-xs font-semibold mt-0.5 leading-snug ${config.text} opacity-80`}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full
          border-2 ${config.border} ${config.text} text-xs font-black
          hover:scale-110 active:scale-95 transition-transform cursor-pointer select-none`}
        aria-label="Tutup notifikasi"
      >
        ×
      </button>

      {/* Progress bar — shrinks from full to 0 over toast.duration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl">
        <div
          className={`h-full ${config.bar} origin-left`}
          style={{
            animation: `toastProgress ${toast.duration || 4000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// Toast container — sits fixed at bottom-right
export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notifikasi"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
