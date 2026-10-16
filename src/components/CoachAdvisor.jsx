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
      className={`w-full rounded-xl p-2.5 sm:p-3 transition-all duration-200 border-2 ${
        coachEnabled
          ? 'bg-[#16161f] border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          : 'bg-[#14141a] border-neutral-600 shadow-md'
      }`}
    >
      {/* Top Header: Title & High-Contrast Large Switch */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              coachEnabled
                ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase font-serif-master truncate">
              AI Coach & Explainer
            </h2>
            <p className="text-[10px] text-neutral-200 font-sans hidden sm:block truncate">
              Calculates best move & explains <strong>why</strong> in real-time
            </p>
          </div>
        </div>

        {/* Large, High-Contrast Physical Toggle Button */}
        <button
          onClick={() => onToggleCoach(!coachEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm border-2 shrink-0 ${
            coachEnabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-500'
          }`}
          title="Click to toggle AI Coach mode ON or OFF"
        >
          <Power className={`w-3.5 h-3.5 ${coachEnabled ? 'text-white' : 'text-neutral-400'}`} />
          <span>{coachEnabled ? 'COACH: ON' : 'COACH: OFF'}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              coachEnabled ? 'bg-white animate-ping' : 'bg-neutral-500'
            }`}
          />
        </button>
      </div>

      {/* Main Content Body */}
      {!coachEnabled ? (
        /* Clear explanation when OFF */
        <div className="py-3 px-2 text-center flex items-center justify-between gap-3">
          <div className="text-left">
            <h3 className="text-xs font-bold text-white uppercase font-serif-master">
              AI Coach Mode is Switched OFF
            </h3>
            <p className="text-[11px] text-neutral-300 font-sans">
              Turn ON to receive real-time candidate moves & Grandmaster explanations.
            </p>
          </div>
          <button
            onClick={() => onToggleCoach(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Turn ON</span>
          </button>
        </div>
      ) : isThinking ? (
        <div className="py-4 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono font-bold text-emerald-400 tracking-wider animate-pulse">
            Calculating best move & tactical explanation...
          </p>
        </div>
      ) : (
        <div className="pt-2 space-y-2">
          {/* Top Recommendation Plaque */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-[#1a1a24] border border-neutral-700 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {/* Move Badge */}
              <div className="w-10 h-10 rounded-lg bg-emerald-500/25 border-2 border-emerald-400 flex flex-col items-center justify-center text-white font-mono shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                <span className="font-black text-base leading-none text-emerald-300">{analysis?.bestMove?.san || 'e4'}</span>
                <span className="text-[9px] text-neutral-200 font-bold font-mono">
                  {analysis?.bestMove ? `${analysis.bestMove.from}→${analysis.bestMove.to}` : 'e2→e4'}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                    {analysis?.title || 'Center Dominance: Pawn to e4'}
                  </span>
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400 shrink-0">
                    {analysis?.theme || 'Center Control'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-200 font-mono mt-0.5">
                  <span className="text-emerald-400 font-bold">Eval: {analysis?.evalPawns || '+0.20'}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-300 truncate">{analysis?.evalAssessment || 'Equal position'}</span>
                </div>
              </div>
            </div>

            {/* Quick Tactical Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {analysis?.bestMove && onApplyBestMove && (
                <button
                  onClick={onApplyBestMove}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 cursor-pointer border border-emerald-300"
                  title="Automatically play the coach's best move"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              )}

              {/* Voice Commentary Button */}
              <button
                onClick={handleSpeech}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-xs font-bold cursor-pointer ${
                  isSpeaking
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600'
                }`}
                title={isSpeaking ? 'Stop voice readout' : 'Listen to Coach explanation'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 animate-pulse text-neutral-950" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-neutral-200" />
                )}
                <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Voice'}</span>
              </button>

              {/* Board Vector Arrow Visibility Toggle */}
              <button
                onClick={onToggleArrow}
                className={`p-1 rounded-lg border transition-all text-xs cursor-pointer ${
                  showArrow
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
                title={showArrow ? 'Hide board vector arrow' : 'Show board vector arrow'}
              >
                {showArrow ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Master Strategic Reason Card - "WHY THIS MOVE?" */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-[#1a1a24] border border-neutral-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Target className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-300 font-serif-master">
                Why This Move? (Grandmaster Explanation)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-white leading-snug font-sans font-semibold pl-1">
              {analysis?.primaryReason ||
                "Occupies the critical central e4 square, establishes dominant board control, and unleashes diagonal lines of development for the Queen and Bishop."}
            </p>

            {/* Key Strategic Objectives */}
            {analysis?.keyBenefits && analysis.keyBenefits.length > 0 && (
              <div className="pt-1 border-t border-neutral-800 space-y-1">
                {analysis.keyBenefits.slice(0, 2).map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-100 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Threat Warning (Strict Ruby Red) */}
            {analysis?.threatWarning && (
              <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-950/60 border border-red-500/60 text-red-200 text-[11px] font-sans">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="leading-tight font-medium">
                  <strong className="text-red-300 uppercase font-black">Threat: </strong>
                  {analysis.threatWarning}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
