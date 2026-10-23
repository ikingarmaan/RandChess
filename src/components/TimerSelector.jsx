import React, { useState, useEffect } from 'react';
import { Clock, Sliders, Check, Plus, Minus } from 'lucide-react';

/**
 * Neo-Brutalist Customizable Match Timer Selector.
 * Supports quick presets (None/Unlimited, 1m, 3m, 5m, 10m, 15m, 30m)
 * AND a custom time picker for choosing ANY duration in minutes and seconds.
 */
export const TimerSelector = ({
  value = 300, // seconds or null for unlimited
  onChange,
  label = 'Match Timer',
  allowUnlimited = true,
  compact = false
}) => {
  const PRESETS = [
    ...(allowUnlimited ? [{ label: '∞ NONE', val: null, desc: 'Casual' }] : []),
    { label: '1 MIN', val: 60, desc: 'Bullet' },
    { label: '3 MIN', val: 180, desc: 'Blitz' },
    { label: '5 MIN', val: 300, desc: 'Rapid' },
    { label: '10 MIN', val: 600, desc: 'Rapid' },
    { label: '15 MIN', val: 900, desc: 'Classical' },
    { label: '30 MIN', val: 1800, desc: 'Classical' }
  ];

  const isStandardPreset = PRESETS.some((p) => p.val === value);
  const [isCustomMode, setIsCustomMode] = useState(!isStandardPreset && value !== null);

  // Minutes and seconds for custom mode
  const initialMins = value ? Math.floor(value / 60) : 5;
  const initialSecs = value ? value % 60 : 0;
  const [customMins, setCustomMins] = useState(initialMins);
  const [customSecs, setCustomSecs] = useState(initialSecs);

  // Synchronize state if external value changes to a custom value
  useEffect(() => {
    if (!PRESETS.some((p) => p.val === value) && value !== null) {
      setIsCustomMode(true);
      setCustomMins(Math.floor(value / 60));
      setCustomSecs(value % 60);
    } else if (isStandardPreset || value === null) {
      setIsCustomMode(false);
    }
  }, [value]);

  const handleSelectPreset = (val) => {
    setIsCustomMode(false);
    if (onChange) onChange(val);
  };

  const handleApplyCustom = (mins, secs) => {
    const m = Math.max(0, parseInt(mins, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(secs, 10) || 0));
    const totalSeconds = m * 60 + s;
    const finalSeconds = Math.max(5, Math.min(10800, totalSeconds)); // between 5 sec and 3 hours
    setCustomMins(Math.floor(finalSeconds / 60));
    setCustomSecs(finalSeconds % 60);
    if (onChange) onChange(finalSeconds);
  };

  const stepMinutes = (delta) => {
    const currentM = parseInt(customMins, 10) || 0;
    const newM = Math.max(0, Math.min(180, currentM + delta));
    setCustomMins(newM);
    handleApplyCustom(newM, customSecs);
  };

  // Formatted display of current time
  const getFormattedCurrentTime = () => {
    if (value === null) return 'UNLIMITED (∞)';
    const m = Math.floor(value / 60);
    const s = value % 60;
    if (m === 0) return `${s} SEC`;
    if (s === 0) return `${m} MIN`;
    return `${m}M ${s}S`;
  };

  return (
    <div className="space-y-2 select-none">
      {/* Header with Title and Current Clock Display */}
      <div className="flex items-center justify-between gap-2">
        <label className="font-brutal text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>{label}</span>
        </label>
        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-[#22c55e] border border-black">
          {getFormattedCurrentTime()}
        </span>
      </div>

      {/* Preset Options Grid */}
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-4'} gap-1.5 font-mono text-xs font-black`}>
        {PRESETS.map((p) => {
          const isSelected = !isCustomMode && value === p.val;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handleSelectPreset(p.val)}
              className={`brutal-press py-1.5 px-1 border-2 border-black cursor-pointer flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[#22c55e] text-black font-black brutal-shadow-sm ring-1 ring-black'
                  : 'bg-white hover:bg-neutral-100 text-black font-black'
              }`}
              title={p.desc}
            >
              <span className="text-[11px] font-black">{p.label}</span>
              <span className="text-[9px] font-mono opacity-80">{p.desc}</span>
            </button>
          );
        })}

        {/* CUSTOM TIME BUTTON */}
        <button
          type="button"
          onClick={() => {
            setIsCustomMode(true);
            handleApplyCustom(customMins, customSecs);
          }}
          className={`brutal-press py-1.5 px-1 border-2 border-black cursor-pointer flex flex-col items-center justify-center transition-all ${
            isCustomMode
              ? 'bg-[#facc15] text-black font-black brutal-shadow-sm ring-2 ring-black'
              : 'bg-white hover:bg-yellow-100 text-black font-black'
          }`}
          title="Pick any custom minutes or seconds"
        >
          <span className="text-[11px] font-black flex items-center gap-0.5">
            <Sliders className="w-3 h-3" />
            <span>CUSTOM</span>
          </span>
          <span className="text-[9px] font-mono opacity-80">Any Time</span>
        </button>
      </div>

      {/* CUSTOM TIME PICKER PANEL (Revealed when CUSTOM is chosen) */}
      {isCustomMode && (
        <div className="p-2.5 bg-[#fefce8] border-2 border-black space-y-2 brutal-shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-brutal text-[10px] font-black uppercase text-black">
              Enter Custom Duration:
            </span>
            <span className="font-mono text-[9px] font-black px-1.5 py-0.2 bg-black text-[#facc15]">
              MAX: 180 MIN
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Minutes Input */}
            <div className="flex-1 space-y-0.5">
              <label htmlFor="custom-timer-mins" className="font-mono text-[9px] font-bold text-neutral-700 uppercase">
                MINUTES
              </label>
              <div className="flex items-center">
                <input
                  id="custom-timer-mins"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customMins}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setCustomMins(clean);
                  }}
                  onBlur={() => handleApplyCustom(customMins, customSecs)}
                  className="w-full bg-white text-black font-mono font-black text-sm px-2 py-1 border-2 border-black text-center focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
            </div>

            {/* Separator */}
            <span className="font-mono font-black text-base text-black mt-3">:</span>

            {/* Seconds Input */}
            <div className="flex-1 space-y-0.5">
              <label htmlFor="custom-timer-secs" className="font-mono text-[9px] font-bold text-neutral-700 uppercase">
                SECONDS
              </label>
              <div className="flex items-center">
                <input
                  id="custom-timer-secs"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customSecs < 10 && typeof customSecs === 'number' ? `0${customSecs}` : customSecs}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setCustomSecs(clean);
                  }}
                  onBlur={() => handleApplyCustom(customMins, customSecs)}
                  className="w-full bg-white text-black font-mono font-black text-sm px-2 py-1 border-2 border-black text-center focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
            </div>

            {/* Quick Apply Button */}
            <button
              type="button"
              onClick={() => handleApplyCustom(customMins, customSecs)}
              className="brutal-press mt-3.5 px-3 py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1 shrink-0"
              title="Set this clock duration"
            >
              <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>SET</span>
            </button>
          </div>

          {/* Stepper Buttons for Quick Mobile Adjustment */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-300">
            <span className="font-mono text-[9px] font-bold text-neutral-600">QUICK STEP:</span>
            <div className="flex gap-1 font-mono text-[10px] font-black">
              <button
                type="button"
                onClick={() => stepMinutes(-5)}
                className="px-1.5 py-0.5 bg-white border border-black hover:bg-neutral-100 cursor-pointer"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={() => stepMinutes(-1)}
                className="px-1.5 py-0.5 bg-white border border-black hover:bg-neutral-100 cursor-pointer"
              >
                -1m
              </button>
              <button
                type="button"
                onClick={() => stepMinutes(1)}
                className="px-1.5 py-0.5 bg-white border border-black hover:bg-neutral-100 cursor-pointer"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => stepMinutes(5)}
                className="px-1.5 py-0.5 bg-white border border-black hover:bg-neutral-100 cursor-pointer"
              >
                +5m
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

