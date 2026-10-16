import React from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX, Eye, Palette, X, Sparkles, Check } from 'lucide-react';
import { BOARD_THEMES } from './ChessBoard';

export const SettingsModal = ({
  isOpen,
  onClose,
  boardTheme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  showLegalDots,
  onToggleLegalDots,
  autoQueen,
  onToggleAutoQueen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-neutral-700/80 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-w-md w-full space-y-6 relative ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="font-serif-master text-base sm:text-lg font-bold text-white tracking-wide">
              Atelier Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board Theme Selector */}
        <div className="space-y-3">
          <label className="font-serif-master text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            Tournament Board Material
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(BOARD_THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  boardTheme === key
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-neutral-800 bg-neutral-900/70 hover:border-neutral-700'
                }`}
              >
                {/* Visual miniature squares preview */}
                <div className="grid grid-cols-2 grid-rows-2 w-12 h-12 rounded-lg overflow-hidden border border-neutral-700 shadow-md">
                  <div className={t.light.split(' ')[0]} />
                  <div className={t.dark.split(' ')[0]} />
                  <div className={t.dark.split(' ')[0]} />
                  <div className={t.light.split(' ')[0]} />
                </div>
                <span className="font-serif-master text-[11px] font-bold text-neutral-200 text-center">
                  {t.name}
                </span>

                {boardTheme === key && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-neutral-800/80 pt-4">
          <label className="font-serif-master text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Audio & Tactical Features
          </label>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              <div>
                <div className="text-xs font-bold text-neutral-200">Kinetic Sound Effects</div>
                <div className="text-[11px] text-neutral-400">Authentic wooden piece taps & checks</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => onToggleSound(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-neutral-700 border-neutral-600 focus:ring-emerald-500 accent-emerald-500"
            />
          </div>

          {/* Voice Coach Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-neutral-200">Grandmaster Voice Readout</div>
                <div className="text-[11px] text-neutral-400">Speaks tactical rationale automatically</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => onToggleVoice(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-neutral-700 border-neutral-600 focus:ring-emerald-500 accent-emerald-500"
            />
          </div>

          {/* Legal Move Indicators Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-neutral-200">Legal Move Markers</div>
                <div className="text-[11px] text-neutral-400">Display jewel targets & capture rings</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showLegalDots}
              onChange={(e) => onToggleLegalDots(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-neutral-700 border-neutral-600 focus:ring-emerald-500 accent-emerald-500"
            />
          </div>

          {/* Auto Queen Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div>
              <div className="text-xs font-bold text-neutral-200">Auto-Coronate Queen</div>
              <div className="text-[11px] text-neutral-400">Instantly promote advancing pawn to Queen</div>
            </div>
            <input
              type="checkbox"
              checked={autoQueen}
              onChange={(e) => onToggleAutoQueen(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-neutral-700 border-neutral-600 focus:ring-emerald-500 accent-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-serif-master font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          Confirm & Return to Match
        </button>
      </div>
    </div>
  );
};
