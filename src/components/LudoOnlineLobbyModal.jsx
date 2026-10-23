import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Copy,
  Check,
  Users,
  ArrowRight,
  X,
  Clock,
  Zap,
  Clipboard,
  Loader2,
  Sparkles,
  Bot,
  Play,
  Shield,
  Dice5
} from 'lucide-react';
import { TimerSelector } from './TimerSelector';

export const LudoOnlineLobbyModal = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onStartMatch,
  onLeaveRoom,
  onFindQuickMatch,
  onCancelQuickMatch,
  isSearchingQuickMatch = false,
  quickCountdown = null,
  room,
  roomCode,
  isHost = false,
  onlineStatus,
  isConnected = true
}) => {
  const [tab, setTab] = useState('quick'); // 'quick' | 'create' | 'join'
  const [inputCode, setInputCode] = useState('');
  const [turnTimerChoice, setTurnTimerChoice] = useState(30);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
  }, [isOpen, roomCode, isSearchingQuickMatch, onlineStatus]);

  if (!isOpen) return null;

  const shareUrl = roomCode ? `${window.location.origin}?game=ludo&room=${roomCode}` : '';

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
        let clean = text.trim();
        const urlMatch = clean.match(/room=([A-Za-z0-9_-]+)/i);
        if (urlMatch && urlMatch[1]) {
          clean = urlMatch[1];
        } else {
          clean = clean.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 10);
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
    onCreateRoom({ maxPlayers: 4, timeControl: turnTimerChoice });
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (clean && isConnected && !isSubmitting) {
      setIsSubmitting(true);
      onJoinRoom(clean);
    }
  };

  const handleQuickMatch = () => {
    if (!isConnected || isSubmitting) return;
    setIsSubmitting(true);
    if (onFindQuickMatch) onFindQuickMatch();
  };

  // Connected players count in active room
  const joinedPlayers = room?.players || [];
  const playerCount = joinedPlayers.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 modal-backdrop-anim select-none"
      style={{ overscrollBehavior: 'contain' }}
      onClick={() => {
        if (!roomCode && !isSearchingQuickMatch) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white border-4 border-black p-4 sm:p-6 brutal-shadow-xl modal-content-anim relative text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#f97316] border-2 border-black flex items-center justify-center text-white text-base font-black brutal-shadow-sm font-mono">
              🎲
            </div>
            <div>
              <h3 className="font-brutal font-black text-base sm:text-lg uppercase tracking-tight">
                Ludo Online Multiplayer
              </h3>
              <p className="font-mono text-[10px] text-neutral-500">
                2 TO 4 PLAYERS • DYNAMIC ROOM ADAPTATION • ZERO BLUE
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isSearchingQuickMatch && onCancelQuickMatch) onCancelQuickMatch();
              onClose();
            }}
            className="brutal-press p-1.5 hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Close Lobby"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Server Connection Alert */}
        {!isConnected && (
          <div className="mb-4 p-2.5 bg-red-100 border-2 border-red-600 text-red-900 font-mono text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            Connecting to game server... Please wait a moment.
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE 1: ACTIVE ROOM LOBBY (WAITING ROOM WITH DYNAMIC SEATS)   */}
        {/* ============================================================== */}
        {roomCode ? (
          <div className="space-y-4">
            
            {/* Room Code Showcase */}
            <div className="p-3.5 bg-[#fef08a] border-3 border-black brutal-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-700 block">
                  BATTLEFIELD ROOM CODE
                </span>
                <span className="font-mono text-2xl font-black tracking-wider text-black">
                  {roomCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="brutal-press flex items-center gap-1 px-2.5 py-1.5 bg-white text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'COPIED' : 'COPY CODE'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="brutal-press flex items-center gap-1 px-2.5 py-1.5 bg-black text-white hover:text-[#facc15] border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
                  title="Copy 1-Click Join Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'LINK COPIED' : 'SHARE LINK'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Seats Grid (2 to 4 Players) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-brutal font-black text-xs uppercase tracking-wider">
                  PLAYERS IN ROOM ({playerCount} / 4)
                </span>
                <span className="font-mono text-[10px] text-neutral-500 font-bold">
                  {playerCount === 1
                    ? 'WAITING FOR PLAYERS (MIN 2)'
                    : playerCount === 2
                    ? '⚡ READY FOR 2-PLAYER OR WAIT'
                    : playerCount === 3
                    ? '⚡ READY FOR 3-PLAYER OR WAIT'
                    : '🔥 ROOM FULL (4/4)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((seatIdx) => {
                  const player = joinedPlayers[seatIdx];
                  const seatColors = [
                    { name: 'Red', hex: '#ef4444' },
                    { name: playerCount === 2 ? 'Yellow' : 'Green', hex: playerCount === 2 ? '#facc15' : '#22c55e' },
                    { name: 'Yellow', hex: '#facc15' },
                    { name: 'Orange', hex: '#f97316' }
                  ];
                  const colorInfo = seatColors[seatIdx];

                  return (
                    <div
                      key={seatIdx}
                      className={`p-2.5 border-2 border-black flex items-center gap-2.5 ${
                        player
                          ? 'bg-neutral-50 brutal-shadow-sm'
                          : 'bg-neutral-100/60 border-dashed opacity-60'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-black text-xs text-black shrink-0"
                        style={{ backgroundColor: colorInfo.hex }}
                      >
                        {seatIdx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-brutal font-black text-xs truncate">
                          {player ? player.name : `Open Seat ${seatIdx + 1}`}
                        </div>
                        <div className="font-mono text-[9px] text-neutral-500 uppercase">
                          {player ? (seatIdx === 0 ? '👑 Room Host' : 'Joined Player') : 'Waiting...'}
                        </div>
                      </div>

                      {player && (
                        <span className="w-2 h-2 rounded-full bg-green-500 border border-black shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Match Countdown Alert if in Quick Mode */}
            {quickCountdown && (
              <div className="p-2.5 bg-[#facc15] border-2 border-black font-mono text-xs font-black text-center animate-pulse">
                ⏳ STARTING IN {quickCountdown.seconds}s WITH {quickCountdown.playerCount} PLAYERS...
              </div>
            )}

            {/* Dynamic Host Controls (Adapt to 2, 3, or 4 Players) */}
            {isHost && (
              <div className="pt-2 border-t-2 border-black space-y-2">
                {playerCount === 2 && (
                  <button
                    onClick={() => onStartMatch({ roomId: roomCode, fillBots: false, targetCount: 2 })}
                    className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START 2-PLAYER MATCH (RED vs YELLOW)</span>
                  </button>
                )}

                {playerCount === 3 && (
                  <button
                    onClick={() => onStartMatch({ roomId: roomCode, fillBots: false, targetCount: 3 })}
                    className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START 3-PLAYER MATCH</span>
                  </button>
                )}

                {playerCount === 4 && (
                  <button
                    onClick={() => onStartMatch({ roomId: roomCode, fillBots: false, targetCount: 4 })}
                    className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START 4-PLAYER MATCH (ROOM FULL)</span>
                  </button>
                )}

                {playerCount < 4 && (
                  <button
                    onClick={() => onStartMatch({ roomId: roomCode, fillBots: true, targetCount: 4 })}
                    className="brutal-press w-full py-2 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>FILL REMAINING WITH BOTS & START (4P)</span>
                  </button>
                )}
              </div>
            )}

            {!isHost && (
              <div className="p-3 bg-neutral-100 border-2 border-black font-mono text-xs text-center flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for Room Host to start the battle...</span>
              </div>
            )}

            {/* Leave Room Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={onLeaveRoom}
                className="brutal-press px-4 py-1.5 bg-neutral-200 hover:bg-red-500 hover:text-white border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
              >
                LEAVE ROOM
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE 2: LOBBY TABS (QUICK MATCH / CREATE ROOM / JOIN ROOM)     */
          /* ============================================================== */
          <div>
            {/* Tabs Selector */}
            <div className="flex border-2 border-black bg-black p-0.5 mb-4">
              <button
                onClick={() => setTab('quick')}
                className={`flex-1 py-1.5 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                  tab === 'quick' ? 'bg-[#facc15] text-black' : 'bg-black text-white hover:text-[#facc15]'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>QUICK MATCH</span>
              </button>
              <button
                onClick={() => setTab('create')}
                className={`flex-1 py-1.5 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                  tab === 'create' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>CREATE ROOM</span>
              </button>
              <button
                onClick={() => setTab('join')}
                className={`flex-1 py-1.5 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                  tab === 'join' ? 'bg-[#f97316] text-white' : 'bg-black text-white hover:text-[#f97316]'
                }`}
              >
                <ArrowRight className="w-3 h-3" />
                <span>JOIN ROOM</span>
              </button>
            </div>

            {/* TAB 1: QUICK MATCH */}
            {tab === 'quick' && (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-100 border-2 border-black text-center space-y-2">
                  <div className="w-12 h-12 mx-auto bg-[#facc15] border-2 border-black flex items-center justify-center text-2xl font-black brutal-shadow-sm">
                    ⚡
                  </div>
                  <h4 className="font-brutal font-black text-base uppercase">
                    INSTANT ONLINE MATCHMAKING
                  </h4>
                  <p className="font-mono text-xs text-neutral-600 max-w-sm mx-auto">
                    Jump straight into action. Pairs you with active players online. If 2 players are found, launches automatically or scales up to 4!
                  </p>
                </div>

                {isSearchingQuickMatch ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-[#22c55e]/20 border-2 border-black flex items-center justify-center gap-2 font-mono text-xs font-bold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>SEARCHING FOR OPPONENTS ACROSS THE ARENA...</span>
                    </div>
                    <button
                      onClick={onCancelQuickMatch}
                      className="brutal-press w-full py-2 bg-neutral-200 hover:bg-neutral-300 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
                    >
                      CANCEL MATCHMAKING
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleQuickMatch}
                    disabled={!isConnected || isSubmitting}
                    className="brutal-press w-full py-3.5 bg-[#facc15] hover:bg-yellow-400 text-black border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-md flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>FIND QUICK MATCH NOW</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: CREATE PRIVATE ROOM */}
            {tab === 'create' && (
              <div className="space-y-4">
                <div>
                  <div className="font-brutal font-black text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-black" />
                    <span>TURN TIME LIMIT</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { secs: 15, label: '15s (Blitz)' },
                      { secs: 30, label: '30s (Rapid)' },
                      { secs: 60, label: '60s (Standard)' },
                      { secs: 0, label: 'Unlimited' }
                    ].map((opt) => (
                      <button
                        key={opt.secs}
                        onClick={() => setTurnTimerChoice(opt.secs)}
                        className={`py-2 px-1 border-2 border-black font-mono text-[11px] font-bold text-center cursor-pointer transition-colors ${
                          turnTimerChoice === opt.secs
                            ? 'bg-black text-white brutal-shadow-sm'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-neutral-100 border-2 border-black font-mono text-xs text-neutral-600">
                  <strong className="text-black uppercase block mb-1">
                    ⚡ Dynamic 2 to 4 Players:
                  </strong>
                  Your room accepts up to 4 players. Once 2 players join, you can launch immediately as a 2-Player match or wait for 3 and 4 players!
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!isConnected || isSubmitting}
                  className="brutal-press w-full py-3.5 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-md flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>CREATE BATTLE ROOM</span>
                </button>
              </div>
            )}

            {/* TAB 3: JOIN BY CODE */}
            {tab === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-brutal font-black text-xs uppercase tracking-wider">
                      ENTER 6-DIGIT ROOM CODE
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="font-mono text-[10px] text-neutral-600 hover:text-black underline cursor-pointer uppercase flex items-center gap-1"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>{pasteNotice ? 'PASTED!' : 'PASTE FROM CLIPBOARD'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="E.G. LUDO-7K2X"
                    maxLength={10}
                    className="w-full py-3 px-3 bg-neutral-100 border-3 border-black font-mono text-lg font-black uppercase tracking-wider focus:outline-none focus:bg-white text-center"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputCode.trim() || !isConnected || isSubmitting}
                  className="brutal-press w-full py-3.5 bg-[#f97316] hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-md flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>JOIN ROOM NOW</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Status Error / Info Notice */}
        {onlineStatus && (
          <div className="mt-3 p-2 bg-red-100 border-2 border-red-600 font-mono text-xs font-bold text-red-900 text-center">
            {onlineStatus}
          </div>
        )}
      </div>
    </div>
  );
};

