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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const shareUrl = roomCode ? `${window.location.origin}?room=${roomCode}` : '';

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-black border-4 border-black p-5 sm:p-6 brutal-shadow-xl max-w-md w-full space-y-5 relative select-none">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center">
              <Wifi className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-brutal text-base sm:text-lg font-black uppercase tracking-tight">
                Online Multiplayer
              </h2>
              <p className="text-[11px] font-mono text-neutral-600">
                P2P low-latency WebSockets matchmaker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="brutal-press p-1.5 bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If waiting for opponent in an active room */}
        {isWaiting && roomCode ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-[#22c55e] border-3 border-black flex items-center justify-center mx-auto brutal-shadow-sm">
              <Users className="w-7 h-7 text-black animate-pulse" />
            </div>

            <div>
              <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-[#facc15] border-2 border-black">
                [ ROOM ACTIVE // WAITING FOR OPPONENT ]
              </span>
              <p className="text-xs text-neutral-600 font-mono mt-2">
                Share this match code or direct URL with your opponent:
              </p>
            </div>

            {/* Room Code Display Block */}
            <div className="p-3 bg-black text-white border-3 border-black flex items-center justify-between">
              <div className="text-left font-mono">
                <span className="text-[10px] text-neutral-400 uppercase">Match Code</span>
                <div className="text-2xl font-black text-[#22c55e] tracking-widest">{roomCode}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="brutal-press px-3 py-1.5 bg-white text-black hover:bg-[#22c55e] font-mono text-xs font-black uppercase border-2 border-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="brutal-press w-full py-2 bg-[#f4f4eb] hover:bg-neutral-200 border-2 border-black font-mono text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#15803d]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'INVITE LINK COPIED!' : 'COPY DIRECT INVITATION LINK'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Chooser */}
            <div className="grid grid-cols-2 gap-2 border-2 border-black p-1 bg-[#f4f4eb]">
              <button
                onClick={() => setTab('create')}
                className={`py-1.5 font-brutal text-xs font-black uppercase transition-all cursor-pointer ${
                  tab === 'create'
                    ? 'bg-black text-white brutal-shadow-sm'
                    : 'bg-transparent text-black hover:bg-neutral-200'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-1.5 font-brutal text-xs font-black uppercase transition-all cursor-pointer ${
                  tab === 'join'
                    ? 'bg-black text-white brutal-shadow-sm'
                    : 'bg-transparent text-black hover:bg-neutral-200'
                }`}
              >
                Join with Code
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-3.5">
                {/* Time Control */}
                <div className="space-y-1">
                  <label className="font-brutal text-xs font-black uppercase">
                    Clock Duration
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-black">
                    {[
                      { label: '1 MIN', val: 60 },
                      { label: '3 MIN', val: 180 },
                      { label: '5 MIN', val: 300 },
                      { label: '10 MIN', val: 600 }
                    ].map((t) => (
                      <button
                        key={t.val}
                        onClick={() => setTimeChoice(t.val)}
                        className={`brutal-press py-1.5 border-2 border-black cursor-pointer ${
                          timeChoice === t.val ? 'bg-[#22c55e] text-black brutal-shadow-sm' : 'bg-[#f4f4eb] text-black'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Color */}
                <div className="space-y-1">
                  <label className="font-brutal text-xs font-black uppercase">
                    Play As
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs font-black">
                    {[
                      { label: 'WHITE', val: 'w' },
                      { label: 'RANDOM', val: 'random' },
                      { label: 'BLACK', val: 'b' }
                    ].map((c) => (
                      <button
                        key={c.val}
                        onClick={() => setColorChoice(c.val)}
                        className={`brutal-press py-1.5 border-2 border-black cursor-pointer ${
                          colorChoice === c.val ? 'bg-[#22c55e] text-black brutal-shadow-sm' : 'bg-[#f4f4eb] text-black'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm"
                >
                  CREATE MATCH ROOM ▶
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="font-brutal text-xs font-black uppercase">
                    Enter 6-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A9X4K2"
                    maxLength={6}
                    className="w-full p-2.5 text-center font-mono text-lg font-black uppercase bg-[#f4f4eb] text-black border-3 border-black outline-none tracking-widest placeholder:text-neutral-400"
                  />
                </div>

                {onlineStatus && (
                  <div className="p-2 bg-red-100 border-2 border-red-600 font-mono text-xs text-red-700 font-black">
                    {onlineStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="brutal-press w-full py-3 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm"
                >
                  JOIN MATCH NOW ▶
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
