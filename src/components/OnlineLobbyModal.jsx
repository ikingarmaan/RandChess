import React, { useState, useEffect } from 'react';
import { Wifi, Copy, Check, Users, ArrowRight, X, Clock, Zap, Clipboard, Loader2, Sparkles } from 'lucide-react';
import { TimerSelector } from './TimerSelector';

export const OnlineLobbyModal = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onFindQuickMatch,
  onCancelQuickMatch,
  isSearchingQuickMatch = false,
  roomCode,
  isWaiting,
  onlineStatus,
  isConnected = true
}) => {
  const [tab, setTab] = useState('quick'); // 'quick' | 'create' | 'join'
  const [inputCode, setInputCode] = useState('');
  const [timeChoice, setTimeChoice] = useState(300); // 5 mins
  const [colorChoice, setColorChoice] = useState('random');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  // Clear submitting state when modal changes state or waiting updates
  useEffect(() => {
    setIsSubmitting(false);
  }, [isOpen, roomCode, isWaiting, isSearchingQuickMatch, onlineStatus]);

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

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Extract 6-character alphanumeric code or from URL
        let clean = text.trim();
        const urlMatch = clean.match(/room=([A-Za-z0-9]{6})/i);
        if (urlMatch && urlMatch[1]) {
          clean = urlMatch[1];
        } else {
          clean = clean.replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
        }
        setInputCode(clean.toUpperCase());
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleCreate = () => {
    if (!isConnected || isSubmitting) return;
    setIsSubmitting(true);
    onCreateRoom({ timeControl: timeChoice, preferredColor: colorChoice });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (clean && isConnected && !isSubmitting) {
      setIsSubmitting(true);
      onJoinRoom(clean);
    }
  };

  const handleStartQuickMatch = () => {
    if (!isConnected || isSubmitting) return;
    setIsSubmitting(true);
    if (onFindQuickMatch) {
      onFindQuickMatch({ timeControl: timeChoice, preferredColor: colorChoice });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 modal-backdrop-anim"
      style={{ overscrollBehavior: 'contain' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isWaiting && !isSearchingQuickMatch) onClose();
      }}
    >
      <div className="bg-white text-black border-4 border-black p-4 sm:p-6 brutal-shadow-xl max-w-md w-full space-y-3.5 relative select-none max-h-[92vh] overflow-y-auto modal-content-anim">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brutal text-sm sm:text-base font-black uppercase tracking-tight">
                  Online Multiplayer
                </h2>
                <span
                  className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 border ${
                    isConnected
                      ? 'bg-[#22c55e] text-black border-black'
                      : 'bg-[#facc15] text-black border-black animate-pulse'
                  }`}
                >
                  {isConnected ? 'LIVE' : 'CONNECTING...'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-600">
                Ultra-low latency direct WebSockets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="brutal-press p-1.5 bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server status alert when connecting */}
        {!isConnected && (
          <div className="p-2.5 bg-[#facc15] border-2 border-black font-mono text-xs text-black font-black flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-black animate-spin shrink-0" />
            <span>Connecting to game server... Ready in seconds!</span>
          </div>
        )}

        {/* Quick Match Searching Screen */}
        {isSearchingQuickMatch ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-[#facc15] border-3 border-black flex items-center justify-center mx-auto brutal-shadow-sm relative">
              <Zap className="w-8 h-8 text-black animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#22c55e] border-2 border-black rounded-full animate-ping" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-black text-[#22c55e] border-2 border-black">
                [ ⚡ SEARCHING OPPONENT... ]
              </span>
              <p className="text-xs text-neutral-700 font-mono pt-2">
                Looking for an available player... Matching is instant once an opponent connects!
              </p>
            </div>

            <button
              onClick={onCancelQuickMatch}
              className="brutal-press w-full py-2.5 bg-neutral-200 hover:bg-[#ef4444] hover:text-white border-2 border-black font-brutal text-xs font-black uppercase transition-colors cursor-pointer"
            >
              CANCEL SEARCH
            </button>
          </div>
        ) : isWaiting && roomCode ? (
          /* Private Room Waiting for Opponent Screen */
          <div className="py-2 text-center space-y-3.5">
            <div className="w-14 h-14 bg-[#22c55e] border-3 border-black flex items-center justify-center mx-auto brutal-shadow-sm">
              <Users className="w-7 h-7 text-black animate-pulse" />
            </div>

            <div>
              <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-[#facc15] border-2 border-black">
                [ ROOM ACTIVE // WAITING FOR OPPONENT ]
              </span>
              <p className="text-xs text-neutral-600 font-mono mt-2">
                Share this match code or direct link with your opponent:
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

            {/* Cancel Waiting Button */}
            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="brutal-press w-full py-2 bg-neutral-200 hover:bg-[#ef4444] hover:text-white border-2 border-black font-brutal text-xs font-black uppercase transition-colors cursor-pointer"
              >
                CANCEL & LEAVE ROOM
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* 3 Brutalist Tabs */}
            <div className="grid grid-cols-3 gap-1 border-2 border-black p-1 bg-[#f4f4eb]">
              <button
                onClick={() => setTab('quick')}
                className={`py-1.5 font-brutal text-[11px] sm:text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  tab === 'quick'
                    ? 'bg-black text-[#22c55e] brutal-shadow-sm'
                    : 'bg-transparent text-black hover:bg-neutral-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Quick Match</span>
              </button>
              <button
                onClick={() => setTab('create')}
                className={`py-1.5 font-brutal text-[11px] sm:text-xs font-black uppercase transition-all cursor-pointer ${
                  tab === 'create'
                    ? 'bg-black text-white brutal-shadow-sm'
                    : 'bg-transparent text-black hover:bg-neutral-200'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-1.5 font-brutal text-[11px] sm:text-xs font-black uppercase transition-all cursor-pointer ${
                  tab === 'join'
                    ? 'bg-black text-white brutal-shadow-sm'
                    : 'bg-transparent text-black hover:bg-neutral-200'
                }`}
              >
                Join Code
              </button>
            </div>

            {/* TAB 1: QUICK MATCH */}
            {tab === 'quick' && (
              <div className="space-y-3">
                <div className="p-2.5 bg-[#f4f4eb] border-2 border-black font-mono text-[11px] text-neutral-700">
                  <div className="font-black text-black flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#15803d]" />
                    <span>INSTANT PAIRING: NO CODE NEEDED</span>
                  </div>
                  <span>Click Find Opponent to match instantly with another player online.</span>
                </div>

                {/* Clock Duration */}
                <TimerSelector
                  value={timeChoice}
                  onChange={setTimeChoice}
                  label="Clock Duration"
                  allowUnlimited={true}
                  compact={true}
                />

                {/* Preferred Color */}
                <div className="space-y-1">
                  <label className="font-brutal text-[11px] font-black uppercase">
                    Preferred Color
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs font-black">
                    {[
                      { label: 'WHITE', val: 'w' },
                      { label: 'RANDOM', val: 'random' },
                      { label: 'BLACK', val: 'b' }
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
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
                  type="button"
                  onClick={handleStartQuickMatch}
                  disabled={!isConnected || isSubmitting}
                  className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:cursor-not-allowed text-black border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>FINDING OPPONENT...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-black" />
                      <span>⚡ FIND OPPONENT NOW ▶</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: CREATE PRIVATE ROOM */}
            {tab === 'create' && (
              <div className="space-y-3">
                {/* Time Control */}
                <TimerSelector
                  value={timeChoice}
                  onChange={setTimeChoice}
                  label="Room Match Clock"
                  allowUnlimited={true}
                  compact={true}
                />

                {/* Preferred Color */}
                <div className="space-y-1">
                  <label className="font-brutal text-[11px] font-black uppercase">
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
                        type="button"
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
                  type="button"
                  onClick={handleCreate}
                  disabled={!isConnected || isSubmitting}
                  className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:cursor-not-allowed text-black border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>GENERATING ROOM...</span>
                    </>
                  ) : (
                    <span>CREATE PRIVATE ROOM ▶</span>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: JOIN WITH CODE */}
            {tab === 'join' && (
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-brutal text-[11px] font-black uppercase">
                      6-Character Room Code
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#f4f4eb] hover:bg-[#22c55e] border border-black flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>{pasteNotice ? 'PASTED!' : 'PASTE CODE'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. A9X4K2"
                      maxLength={6}
                      autoFocus
                      className="w-full p-2.5 text-center font-mono text-xl font-black uppercase bg-[#f4f4eb] text-black border-3 border-black outline-none tracking-widest placeholder:text-neutral-400 focus:bg-white"
                    />
                  </div>
                </div>

                {onlineStatus && (
                  <div className="p-2 bg-red-100 border-2 border-red-600 font-mono text-xs text-red-700 font-black">
                    {onlineStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!inputCode.trim() || !isConnected || isSubmitting}
                  className="brutal-press w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:cursor-not-allowed text-white border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>CONNECTING TO ROOM...</span>
                    </>
                  ) : (
                    <span>JOIN MATCH NOW ▶</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
