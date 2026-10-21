import React from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX, Eye, Palette, X, Check, Sliders, Moon, Sun, Keyboard, Shield, Clock } from 'lucide-react';
import { BOARD_THEMES } from './ChessBoard';
import { TimerSelector } from './TimerSelector';

export const SettingsModal = ({
  isOpen,
  onClose,
  boardTheme,
  onSelectTheme,
  timeControl = 300,
  onChangeTimeControl,
  soundEnabled,
  onToggleSound,
  soundVolume = 0.7,
  onChangeVolume,
  voiceEnabled,
  onToggleVoice,
  showLegalDots,
  onToggleLegalDots,
  showCoordinates,
  onToggleCoordinates,
  showLastMoveHighlight,
  onToggleLastMoveHighlight,
  autoQueen,
  onToggleAutoQueen,
  blindfoldMode,
  onToggleBlindfold,
  isDarkTheme,
  onToggleDarkTheme
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 modal-backdrop-anim"
      style={{ overscrollBehavior: 'contain' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-black border-4 border-black p-5 sm:p-6 brutal-shadow-lg max-w-lg w-full space-y-5 relative select-none max-h-[90vh] overflow-y-auto modal-content-anim">
        {/* Header with Hazard Accent */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-brutal text-base sm:text-lg font-black uppercase tracking-tight">
                System Controls & Settings
              </h2>
              <p className="text-[11px] font-mono text-neutral-600">
                Calibrate board, audio, display & blindfold engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="brutal-press p-1.5 bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Palette Selector */}
        <div className="space-y-2">
          <label className="font-brutal text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-black" />
            Board Visual Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(BOARD_THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`brutal-press flex flex-col items-center gap-2 p-2 border-3 transition-all cursor-pointer relative ${
                  boardTheme === key
                    ? 'border-black bg-[#22c55e] text-black brutal-shadow-sm font-black'
                    : 'border-black bg-[#f4f4eb] text-black hover:bg-neutral-200'
                }`}
              >
                {/* 2x2 Preview squares */}
                <div className="grid grid-cols-2 grid-rows-2 w-10 h-10 border-2 border-black overflow-hidden">
                  <div className={t.light.split(' ')[0]} />
                  <div className={t.dark.split(' ')[0]} />
                  <div className={t.dark.split(' ')[0]} />
                  <div className={t.light.split(' ')[0]} />
                </div>
                <span className="font-mono text-[10px] font-black uppercase text-center">
                  {t.name}
                </span>

                {boardTheme === key && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-black text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Match Clock & Custom Timer Settings */}
        <div className="space-y-2.5 border-t-2 border-black pt-3">
          <label className="font-brutal text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-black" />
            Match Clock & Default Timer
          </label>
          <div className="bg-[#f4f4eb] border-2 border-black p-3">
            <TimerSelector
              value={timeControl}
              onChange={onChangeTimeControl}
              label="Default Game Clock"
              allowUnlimited={true}
            />
          </div>
        </div>

        {/* 3. Audio & Master Volume */}
        <div className="space-y-2.5 border-t-2 border-black pt-3">
          <label className="font-brutal text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-black" />
            Audio & Speech Engine
          </label>
          
          {/* Master Volume Slider */}
          <div className="bg-[#f4f4eb] border-2 border-black p-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono font-black">
              <span>MASTER VOLUME</span>
              <span>{Math.round((soundVolume || 0.7) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => onChangeVolume && onChangeVolume(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onToggleSound(!soundEnabled)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black text-xs font-mono font-black uppercase cursor-pointer ${
                soundEnabled ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Sound Effects</span>
              <span>{soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleVoice(!voiceEnabled)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black text-xs font-mono font-black uppercase cursor-pointer ${
                voiceEnabled ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Voice Coach</span>
              <span>{voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* 3. Tactical & Visual Helpers */}
        <div className="space-y-2.5 border-t-2 border-black pt-3">
          <label className="font-brutal text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-black" />
            Tactical & Visual Helpers
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-black uppercase">
            <button
              onClick={() => onToggleLegalDots(!showLegalDots)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black cursor-pointer ${
                showLegalDots ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Legal Move Dots</span>
              <span>{showLegalDots ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleCoordinates(!showCoordinates)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black cursor-pointer ${
                showCoordinates ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Coordinates</span>
              <span>{showCoordinates ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleLastMoveHighlight(!showLastMoveHighlight)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black cursor-pointer ${
                showLastMoveHighlight ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Last Move Glow</span>
              <span>{showLastMoveHighlight ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleAutoQueen(!autoQueen)}
              className={`brutal-press flex items-center justify-between p-2 border-2 border-black cursor-pointer ${
                autoQueen ? 'bg-[#22c55e] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>Auto-Queen</span>
              <span>{autoQueen ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleBlindfold(!blindfoldMode)}
              className={`brutal-press col-span-2 flex items-center justify-between p-2 border-2 border-black cursor-pointer ${
                blindfoldMode ? 'bg-[#facc15] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Blindfold Mode (Hide Pieces for Brain Training)</span>
              </div>
              <span>{blindfoldMode ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* 4. Keyboard Shortcuts Reference */}
        <div className="border-t-2 border-black pt-3 space-y-1.5">
          <label className="font-brutal text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-black" />
            Tactical Hotkeys
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono font-bold bg-[#f4f4eb] border-2 border-black p-2">
            <div><span className="bg-black text-white px-1">←</span> Prev Move</div>
            <div><span className="bg-black text-white px-1">→</span> Next Move</div>
            <div><span className="bg-black text-white px-1">↓</span> Initial Start</div>
            <div><span className="bg-black text-white px-1">↑</span> Jump to Live</div>
            <div><span className="bg-black text-white px-1">Z</span> Undo Move</div>
            <div><span className="bg-black text-white px-1">F</span> Flip Board</div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="brutal-press w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-brutal text-sm font-black uppercase tracking-wider border-2 border-black cursor-pointer brutal-shadow-sm"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
