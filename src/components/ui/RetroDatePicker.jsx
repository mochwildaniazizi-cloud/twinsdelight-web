import React, { useState, useEffect, useRef } from 'react';

export default function RetroDatePicker({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse initial date or default to today's date context
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);

  // Sync viewDate when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  // Close calendar popover on click outside
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
  
  // Previous month details
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Create days grid (42 cells to cover a full calendar grid layout)
  const days = [];
  
  // Padding from previous month (Sunday is index 0)
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Padding for next month to complete the row
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dayObj) => {
    const formattedMonth = String(dayObj.month + 1).padStart(2, '0');
    const formattedDay = String(dayObj.day).padStart(2, '0');
    const dateStr = `${dayObj.year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Pilih Tanggal...';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Pilih Tanggal...';
    const day = String(d.getDate()).padStart(2, '0');
    const m = monthNames[d.getMonth()];
    const y = d.getFullYear();
    return `${day} ${m} ${y}`;
  };

  const isSelected = (dayObj) => {
    if (!value) return false;
    const d = new Date(value);
    return (
      d.getDate() === dayObj.day &&
      d.getMonth() === dayObj.month &&
      d.getFullYear() === dayObj.year
    );
  };

  const isToday = (dayObj) => {
    const today = new Date();
    return (
      today.getDate() === dayObj.day &&
      today.getMonth() === dayObj.month &&
      today.getFullYear() === dayObj.year
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Date Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border-2 border-retro-dark rounded-xl px-4 py-3 text-sm font-bold shadow-retro-sm hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-retro-md active:shadow-retro-sm transition-all duration-150 text-left cursor-pointer focus:outline-none focus:ring-4 focus:ring-retro-blue/30"
      >
        <span>{formatDateDisplay(value)}</span>
        {/* Calendar Icon */}
        <svg
          className="w-5 h-5 text-retro-dark"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 md:left-auto md:right-0 bg-white border-2 border-retro-dark rounded-2xl shadow-retro-md p-4 w-[280px] sm:w-[300px] animate-fade-in">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 px-2 bg-white border-2 border-retro-dark rounded-lg text-xs font-extrabold hover:bg-retro-orange active:translate-y-0.5 shadow-retro-sm transition-all"
            >
              &larr;
            </button>
            <span className="font-extrabold text-xs sm:text-sm text-retro-dark select-none">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 px-2 bg-white border-2 border-retro-dark rounded-lg text-xs font-extrabold hover:bg-retro-orange active:translate-y-0.5 shadow-retro-sm transition-all"
            >
              &rarr;
            </button>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 mb-2 select-none border-b-2 border-retro-dark border-dashed pb-1">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj, index) => {
              const selected = isSelected(dayObj);
              const today = isToday(dayObj);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => dayObj.isCurrentMonth && handleSelectDay(dayObj)}
                  className={`aspect-square text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center ${
                    !dayObj.isCurrentMonth
                      ? 'text-gray-300 border-transparent cursor-default pointer-events-none'
                      : selected
                      ? 'bg-retro-blue text-white border-retro-dark shadow-retro-sm'
                      : today
                      ? 'bg-retro-bg text-retro-dark border-retro-dark border-dashed hover:bg-retro-orange'
                      : 'bg-white text-retro-dark border-transparent hover:bg-retro-orange hover:border-retro-dark hover:shadow-retro-sm'
                  }`}
                >
                  {dayObj.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
