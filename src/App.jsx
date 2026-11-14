import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Gamepad2,
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun
} from 'lucide-react';

import { SettingsModal } from './components/SettingsModal';
import { FloatingPiecesBackground } from './components/FloatingPiecesBackground';
import { GameCatalogueModal } from './components/GameCatalogueModal';
import { GameCatalogueHub } from './components/GameCatalogueHub';
import { ChessGame } from './components/ChessGame';
import { TicTacToeGame } from './components/TicTacToeGame';
import { PongGame } from './components/PongGame';
import { SnakeGame } from './components/SnakeGame';
import { ErrorBoundary } from './components/ErrorBoundary';

import { sound } from './utils/sound';

// Metadata dictionary for the 4 core playable games in the Brutalist suite
const GAME_METADATA = {
  chess: {
    title: 'RandChess',
    badge: 'MINIMAX v2.0',
    icon: '♞',
    iconBg: 'bg-[#22c55e] text-black',
    sub: 'ZERO BLUE • STOCKFISH CALIBRATED • 100% TACTICAL',
    footer: 'RandChess v2.0 // HIGH-EFFICIENCY MINIMAX',
    footerSub: 'NO BLUE • 64 SQUARES • TACTICAL RADAR'
  },
  tictactoe: {
    title: 'Brutal Tic-Tac-Toe',
    badge: 'UNBEATABLE AI',
    icon: '✕◯',
    iconBg: 'bg-[#facc15] text-black',
    sub: 'ZERO BLUE • 3x3 TACTICAL GRID • FAST ACTION',
    footer: 'Brutal Tic-Tac-Toe // 3x3 UNBEATABLE MINIMAX',
    footerSub: 'NO BLUE • 3x3 GRID • INSTANT ACTION'
  },
  snake: {
    title: 'Snake Arena Duel',
    badge: 'RETRO SURVIVAL',
    icon: '🐍🍎',
    iconBg: 'bg-[#22c55e] text-black',
    sub: 'ZERO BLUE • 20x20 ARENA • 1v1 TRON DUEL',
    footer: 'Snake Arena Duel // 20x20 GRID DUEL',
    footerSub: 'NO BLUE • SOLO SURVIVAL & 1v1 TRON ARENA'
  },
  pong: {
    title: 'Cyber Pong 1v1',
    badge: '60 FPS ARCADE',
    icon: '🏓⚡',
    iconBg: 'bg-[#22c55e] text-black',
    sub: 'ZERO BLUE • VECTOR PHYSICS • SPIN DEFLECTION',
    footer: 'Cyber Pong 1v1 // 60 FPS VECTOR ARENA',
    footerSub: 'NO BLUE • 1v1 SAME KEYBOARD • REACTIVE BOT'
  }
};

// Persistent client player identity for resilient room reconnection
const getPlayerId = () => {
  try {
    let id = localStorage.getItem('randchess_player_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('randchess_player_id', id);
    }
    return id;
  } catch (e) {
    return 'usr_' + Math.random().toString(36).substring(2, 11);
  }
};

export default function App() {
  // Always open catalogue hub first by default
  const [activeGame, setActiveGame] = useState(null); // null (Catalogue Hub) | 'chess' | 'tictactoe' | 'snake' | 'pong'
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);

  // Global Audio, Theme & Settings State
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [boardTheme, setBoardTheme] = useState('neo_emerald');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Online Multiplayer Socket
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Sync sound settings with audio manager
  useEffect(() => {
    sound.enabled = soundEnabled;
    sound.voiceEnabled = voiceEnabled;
    sound.setVolume(soundVolume);
  }, [soundEnabled, voiceEnabled, soundVolume]);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // Online Multiplayer Socket Setup
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      autoConnect: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setSocketConnected(true);
      // Auto-open chess if user followed a direct room link ?room=XYZ
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setActiveGame('chess');
      }
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', () => {
      setSocketConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const currentMeta = (activeGame && GAME_METADATA[activeGame]) || {
    title: 'RandGames Arena',
    badge: '4 PLAYABLE ARENAS',
    icon: '🎮',
    iconBg: 'bg-black text-[#22c55e]',
    sub: 'ZERO BLUE • MULTIPLAYER GAMING ARENA • MINIMAX ENGINES',
    footer: 'RandGames Arena // 4 PLAYABLE TACTICAL ARENAS',
    footerSub: 'NO BLUE • ZERO BLUE NEO-BRUTALISM • 100% PLAYABLE'
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-between selection:bg-[#22c55e] selection:text-black font-brutal overflow-x-hidden ${isDarkTheme ? 'bg-[#0f0f12] text-white' : 'bg-[#f4f4ec] text-black'}`}>
      {/* Neo-Brutalist Grid Background */}
      <FloatingPiecesBackground isDark={isDarkTheme} />

      {/* Top Universal Neo-Brutalist Masthead */}
      <header className={`relative z-30 border-b-3 border-black px-2.5 sm:px-5 py-2 flex items-center justify-between shadow-md shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          {/* Active Game Brand Icon */}
          <div className={`w-7 h-7 sm:w-8 sm:h-8 border-2 border-black flex items-center justify-center font-black text-base sm:text-lg brutal-shadow-sm shrink-0 font-mono ${currentMeta.iconBg}`}>
            {currentMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-brutal text-xs sm:text-base font-black uppercase tracking-tight">
                {currentMeta.title}
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1 py-0.2 bg-[#facc15] text-black border border-black hidden sm:inline">
                {currentMeta.badge}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 hidden md:block">
              {currentMeta.sub}
            </p>
          </div>

          {/* ALL GAMES / CATALOGUE BUTTON */}
          {activeGame !== null ? (
            <button
              onClick={() => setActiveGame(null)}
              className="brutal-press flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm shrink-0 ml-1 sm:ml-3"
              title="Return to Game Hub & Browse All Games"
            >
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-black">ALL GAMES</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCatalogueOpen(true)}
              className="brutal-press flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm shrink-0 ml-1 sm:ml-3"
              title="Quick Game Catalogue"
            >
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-black">CATALOGUE</span>
            </button>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Quick Mute / Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e]" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ef4444]" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Toggle Dark / Light Brutalism"
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#facc15]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="System Preferences & Board Themes"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Main Body: Active Game Area or Game Hub */}
      <ErrorBoundary onReturnHub={() => setActiveGame(null)}>
        {activeGame === null ? (
          <GameCatalogueHub
            onSelectGame={(id) => setActiveGame(id)}
            isDarkTheme={isDarkTheme}
          />
        ) : activeGame === 'chess' ? (
          <ChessGame
            isDarkTheme={isDarkTheme}
            soundEnabled={soundEnabled}
            onOpenCatalogue={() => setActiveGame(null)}
            socket={socket}
            socketConnected={socketConnected}
            playerId={getPlayerId()}
            boardTheme={boardTheme}
            onSelectTheme={setBoardTheme}
          />
        ) : activeGame === 'tictactoe' ? (
          <TicTacToeGame
            isDarkTheme={isDarkTheme}
            soundEnabled={soundEnabled}
            onOpenCatalogue={() => setActiveGame(null)}
          />
        ) : activeGame === 'snake' ? (
          <SnakeGame
            isDarkTheme={isDarkTheme}
            soundEnabled={soundEnabled}
            onOpenCatalogue={() => setActiveGame(null)}
          />
        ) : activeGame === 'pong' ? (
          <PongGame
            isDarkTheme={isDarkTheme}
            soundEnabled={soundEnabled}
            onOpenCatalogue={() => setActiveGame(null)}
          />
        ) : (
          <GameCatalogueHub
            onSelectGame={(id) => setActiveGame(id)}
            isDarkTheme={isDarkTheme}
          />
        )}
      </ErrorBoundary>

      {/* Brutalist Footer Strip */}
      <footer className={`border-t-3 border-black py-1.5 px-4 flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-widest shrink-0 ${isDarkTheme ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <span>{currentMeta.footer}</span>
        <span className="hidden sm:inline">{currentMeta.footerSub}</span>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardTheme={boardTheme}
        onSelectTheme={setBoardTheme}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        soundVolume={soundVolume}
        onChangeVolume={setSoundVolume}
        voiceEnabled={voiceEnabled}
        onToggleVoice={setVoiceEnabled}
        isDarkTheme={isDarkTheme}
        onToggleDarkTheme={setIsDarkTheme}
      />

      {/* Game Catalogue Modal */}
      <GameCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        activeGame={activeGame}
        onSelectGame={(gameId) => {
          setActiveGame(gameId);
          setIsCatalogueOpen(false);
        }}
      />
    </div>
  );
}
