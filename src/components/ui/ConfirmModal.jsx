import React from 'react';

/**
 * ConfirmModal — Modal konfirmasi neobrutalist
 *
 * Props:
 *  - isOpen      : boolean
 *  - title       : string  — judul modal (e.g. "Hapus Pesanan?")
 *  - message     : string  — pesan deskripsi
 *  - confirmText : string  — label tombol konfirmasi (default: "Ya, Hapus")
 *  - cancelText  : string  — label tombol batal     (default: "Batal")
 *  - confirmType : 'danger' | 'primary' | 'warning' (default: 'danger')
 *  - onConfirm   : () => void
 *  - onCancel    : () => void
 */
export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi',
  message = 'Apakah kamu yakin?',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  confirmType = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const confirmStyles = {
    danger:  'bg-red-500 hover:bg-red-600 text-white border-retro-dark',
    primary: 'bg-retro-blue hover:bg-blue-600 text-white border-retro-dark',
    warning: 'bg-retro-orange hover:bg-yellow-500 text-retro-dark border-retro-dark',
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onCancel}
    >
      {/* Modal card */}
      <div
        className="
          bg-white border-2 border-retro-dark rounded-2xl shadow-retro-lg
          w-full max-w-sm animate-fade-in
          flex flex-col overflow-hidden
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header stripe */}
        <div className="bg-retro-dark px-5 py-3 flex items-center gap-2">
          <span className="text-lg">
            {confirmType === 'danger' ? '🗑️' : confirmType === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <h2 className="text-white font-black text-base leading-tight">{title}</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-retro-dark font-semibold text-sm leading-relaxed">{message}</p>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-retro-dark/10 mx-5" />

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4">
          {/* Cancel — secondary style */}
          <button
            onClick={onCancel}
            className="
              flex-1 py-2.5 px-4 rounded-xl border-2 border-retro-dark
              bg-white text-retro-dark font-bold text-sm
              shadow-[3px_3px_0px_#1a1a1a]
              hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a1a1a]
              active:translate-y-1 active:shadow-[1px_1px_0px_#1a1a1a]
              transition-all duration-150 cursor-pointer
            "
          >
            {cancelText}
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className={`
              flex-1 py-2.5 px-4 rounded-xl border-2 font-bold text-sm
              shadow-[3px_3px_0px_#1a1a1a]
              hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a1a1a]
              active:translate-y-1 active:shadow-[1px_1px_0px_#1a1a1a]
              transition-all duration-150 cursor-pointer
              ${confirmStyles[confirmType] || confirmStyles.danger}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
