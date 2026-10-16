import React, { useState } from 'react';
import { Sparkles, Lightbulb, Volume2, VolumeX, Eye, EyeOff, Play, ShieldAlert, Target, CheckCircle2, Power, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

export const CoachAdvisor = ({
  coachEnabled,
  onToggleCoach,
  analysis,
  onApplyBestMove,
  showArrow,
  onToggleArrow,
  turnColor = 'White',
  isThinking = false
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeech = () => {
    if (!analysis) return;
    if (isSpeaking) {
      sound.stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      sound.speak(analysis.speechText || analysis.primaryReason);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div
      className={`w-full border-3 border-black p-3 transition-all select-none ${
        coachEnabled
          ? 'bg-white brutal-shadow'
          : 'bg-[#f4f4eb] brutal-shadow-sm'
      }`}
    >
      {/* Header with Title & Big Power Switch */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 border-2 border-black flex items-center justify-center shrink-0 ${
              coachEnabled ? 'bg-[#22c55e] text-black' : 'bg-neutral-300 text-black'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black uppercase font-brutal truncate">
              GM Tactical Advisor
            </h2>
            <p className="text-[10px] text-neutral-600 font-mono hidden sm:block truncate">
              Positional evaluation & blunder radar
            </p>
          </div>
        </div>

        {/* Brutalist Toggle Button */}
        <button
          onClick={() => onToggleCoach(!coachEnabled)}
          className={`brutal-press flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm ${
            coachEnabled
              ? 'bg-[#22c55e] text-black'
              : 'bg-black text-white'
          }`}
          title="Toggle AI Coach ON or OFF"
        >
          <Power className="w-3.5 h-3.5" />
          <span>{coachEnabled ? 'COACH: ON' : 'COACH: OFF'}</span>
        </button>
      </div>

      {/* Main Content Body */}
      {!coachEnabled ? (
        <div className="py-4 text-center text-neutral-600 font-mono text-xs">
          <span className="font-bold uppercase">[ TACTICAL ADVICE PAUSED ]</span>
          <p className="text-[11px] text-neutral-500 mt-1">
            Turn ON above to calculate real-time best moves and explanations
          </p>
        </div>
      ) : isThinking ? (
        <div className="py-4 flex flex-col items-center justify-center gap-1.5 font-mono text-xs">
          <div className="w-4 h-4 border-2 border-black border-t-[#22c55e] rounded-full animate-spin" />
          <span className="font-black uppercase tracking-wider">Evaluating Position...</span>
        </div>
      ) : analysis ? (
        <div className="pt-2.5 space-y-2">
          {/* Top Recommendation Banner (Hazard Yellow & Bold Black) */}
          <div className="bg-[#facc15] border-2 border-black p-2 flex items-center justify-between gap-2 brutal-shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-black text-white shrink-0">
                RECOMMENDED
              </span>
              <span className="font-mono text-sm font-black text-black truncate">
                {analysis.bestMove?.san || `${analysis.bestMove?.from} ➔ ${analysis.bestMove?.to}`}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Play Move Button */}
              {onApplyBestMove && (
                <button
                  onClick={onApplyBestMove}
                  className="brutal-press flex items-center gap-1 px-2.5 py-1 bg-black text-white hover:bg-[#22c55e] hover:text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
                  title="Execute this recommended move directly on board"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>PLAY MOVE</span>
                </button>
              )}
            </div>
          </div>

          {/* Tactical Explanation & Plan */}
          <div className="bg-[#f4f4eb] border-2 border-black p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase font-brutal">
              <Lightbulb className="w-3.5 h-3.5 text-black" />
              <span>Tactical Assessment</span>
            </div>
            <p className="text-xs font-mono font-medium text-black leading-relaxed">
              {analysis.primaryReason}
            </p>
          </div>

          {/* Sub-Actions: Voice & Arrow Controls */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/20 text-xs font-mono">
            <button
              onClick={handleSpeech}
              className="brutal-press flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-neutral-100 border-2 border-black text-black font-black uppercase cursor-pointer brutal-shadow-sm"
              title="Voice coach explanation"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'STOP VOICE' : 'VOICE CO-PILOT'}</span>
            </button>

            <button
              onClick={onToggleArrow}
              className="brutal-press flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-neutral-100 border-2 border-black text-black font-black uppercase cursor-pointer brutal-shadow-sm"
              title="Toggle tactical arrow on board"
            >
              {showArrow ? <Eye className="w-3.5 h-3.5 text-[#22c55e]" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>ARROW: {showArrow ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-3 text-center font-mono text-xs text-neutral-500">
          Play a move to receive grandmaster tactical guidance
        </div>
      )}
    </div>
  );
};
