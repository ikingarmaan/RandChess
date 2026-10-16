import React, { useState } from 'react';
import { Wifi, Copy, Check, Users, ArrowRight, X, Clock, ShieldCheck } from 'lucide-react';

export const OnlineLobbyModal = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  roomCode,
  isWaiting,
  onlineStatus
}) => {
  const [tab, setTab] = useState('create');
  const [inputCode, setInputCode] = useState('');
  const [timeChoice, setTimeChoice] = useState(300); // 5 mins
  const [colorChoice, setColorChoice] = useState('random');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = roomCode ? `${window.location.origin}?room=${roomCode}` : '';

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreate = () => {
    onCreateRoom({ timeControl: timeChoice, preferredColor: colorChoice });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinRoom(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-neutral-700/80 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-w-md w-full space-y-5 relative ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h2 className="font-serif-master text-base sm:text-lg font-bold text-white tracking-wide">
              Online Grandmaster Salon
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If waiting for opponent in an active room */}
        {isWaiting && roomCode ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <Users className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif-master text-base font-bold text-white tracking-wide">
                Awaiting Opponent's Arrival
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Share this match code or invitation link with your adversary
              </p>
            </div>

            {/* Room Code Display */}
            <div className="p-4 rounded-2xl bg-black/50 border border-neutral-800 space-y-3 tray-inset">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium">Room Code:</span>
                <span className="text-xl font-mono font-black text-emerald-400 tracking-wider">
                  {roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 transition-all cursor-pointer border border-neutral-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-xs">
                <span className="text-neutral-400 truncate max-w-[200px] font-mono text-[11px]">{shareUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Low-latency WebSocket channel active</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1 mb-4">
              <button
                onClick={() => setTab('create')}
                className={`flex-1 py-2 text-xs font-serif-master font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  tab === 'create'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setTab('join')}
                className={`flex-1 py-2 text-xs font-serif-master font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  tab === 'join'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Join Match
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-4">
                {/* Time Control */}
                <div className="space-y-2">
                  <label className="font-serif-master text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Chronometer Control
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '1 min', val: 60 },
                      { label: '3 min', val: 180 },
                      { label: '5 min', val: 300 },
                      { label: '10 min', val: 600 }
                    ].map((t) => (
                      <button
                        key={t.val}
                        onClick={() => setTimeChoice(t.val)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                          timeChoice === t.val
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Choice */}
                <div className="space-y-2">
                  <label className="font-serif-master text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Play As
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'w', label: 'White' },
                      { id: 'random', label: 'Random' },
                      { id: 'b', label: 'Black' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setColorChoice(c.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          colorChoice === c.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-serif-master font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  Create & Launch Match Room
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-serif-master text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Enter Invitation Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. GRAND-88"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-neutral-800 text-white font-mono uppercase text-center tracking-widest text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tray-inset"
                  />
                </div>

                {onlineStatus && (
                  <p className="text-xs text-amber-400 text-center font-medium font-sans">
                    {onlineStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-serif-master font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Connect to Match</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
