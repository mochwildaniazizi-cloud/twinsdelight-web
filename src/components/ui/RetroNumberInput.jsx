import React from 'react';

export default function RetroNumberInput({ label, value, onChange, min = 0, max = 8, className = '' }) {
  return (
    <div className={`flex-1 flex flex-col items-center ${className}`}>
      {label && <label className="text-[10px] font-bold text-gray-500 text-center block mb-1">{label}</label>}
      <input
        type="number"
        min={min}
        max={max}
        value={value === 0 ? '' : value}
        onChange={onChange}
        className="w-full border-2 border-retro-dark rounded-md px-1 py-1 text-sm font-bold text-center focus:outline-none focus:bg-retro-bg"
      />
    </div>
  );
}
