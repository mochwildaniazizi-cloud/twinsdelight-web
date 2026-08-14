import React, { useState, useEffect, useRef } from 'react';

export default function RetroSelect({ options, value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border-2 border-retro-dark rounded-xl px-4 py-3 text-sm font-bold shadow-retro-sm hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-retro-md active:shadow-retro-sm transition-all duration-150 text-left cursor-pointer focus:outline-none focus:ring-4 focus:ring-retro-blue/30"
      >
        <span>{selectedOption ? selectedOption.label : 'Pilih Varian...'}</span>
        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <ul className="absolute z-50 w-full mt-2 bg-white border-2 border-retro-dark rounded-xl shadow-retro-md overflow-hidden animate-fade-in divide-y-2 divide-retro-dark">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors duration-150 focus:outline-none ${
                    isSelected
                      ? 'bg-retro-blue text-white'
                      : 'hover:bg-retro-orange hover:text-retro-dark bg-white text-retro-dark'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
