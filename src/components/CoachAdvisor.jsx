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
      className={`w-full rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 ${
        coachEnabled
          ? 'bg-[#141418] border-emerald-500 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(16,185,129,0.25)]'
          : 'bg-[#141418] border-neutral-700 shadow-xl'
      }`}
    >
      {/* Top Header: Title & High-Contrast Large Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              coachEnabled
                ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase font-serif-master">
              AI Coach & Explainer
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-sans mt-0.5">
              Tells you the best move and explains <strong>why</strong> after every turn
            </p>
          </div>
        </div>

        {/* Large, High-Contrast Physical Toggle Button */}
        <button
          onClick={() => onToggleCoach(!coachEnabled)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-md border-2 ${
            coachEnabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.45)]'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-600'
          }`}
          title="Click to toggle AI Coach mode ON or OFF"
        >
          <Power className={`w-4 h-4 ${coachEnabled ? 'text-white' : 'text-neutral-400'}`} />
          <span>{coachEnabled ? 'COACH: ON' : 'COACH: OFF'}</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              coachEnabled ? 'bg-white animate-ping' : 'bg-neutral-500'
            }`}
          />
        </button>
      </div>

      {/* Main Content Body */}
      {!coachEnabled ? (
        /* Clear explanation when OFF */
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-neutral-400">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase font-serif-master">
              AI Coach Mode Is Currently Switched OFF
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed font-sans">
              Turn this switch <strong>ON</strong> to receive real-time candidate move recommendations, tactical arrows on the board, and Grandmaster explanations of why each move works best.
            </p>
          </div>
          <button
            onClick={() => onToggleCoach(true)}
            className="flex items-center gap-2 mt-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Turn ON AI Coach & Explainer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : isThinking ? (
        <div className="py-10 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono font-bold text-emerald-400 tracking-wider animate-pulse">
            Calculating best move & generating strategic explanation...
          </p>
        </div>
      ) : analysis ? (
        <div className="pt-4 space-y-4">
          {/* Top Recommendation Plaque */}
          <div className="p-4 rounded-xl bg-[#1b1b22] border-2 border-neutral-700 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Move Badge */}
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-300 font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <span className="font-black text-xl leading-none">{analysis.bestMove?.san || '—'}</span>
                <span className="text-[10px] text-neutral-300 font-bold font-mono mt-0.5">
                  {analysis.bestMove ? `${analysis.bestMove.from}→${analysis.bestMove.to}` : ''}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-white tracking-wide">
                    {analysis.title}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400">
                    {analysis.theme}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-300 mt-1 font-mono">
                  <span className="text-emerald-400 font-black">
                    Eval: {analysis.evalPawns}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-200 font-medium">{analysis.evalAssessment}</span>
                </div>
              </div>
            </div>

            {/* Quick Tactical Action Buttons */}
            <div className="flex items-center gap-2">
              {analysis.bestMove && onApplyBestMove && (
                <button
                  onClick={onApplyBestMove}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/35 transition-all active:scale-95 cursor-pointer border border-emerald-400"
                  title="Automatically play the coach's best move"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Move</span>
                </button>
              )}

              {/* Voice Commentary Button */}
              <button
                onClick={handleSpeech}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                  isSpeaking
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600'
                }`}
                title={isSpeaking ? 'Stop voice readout' : 'Listen to Coach explanation'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 animate-pulse" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Voice</span>
                  </>
                )}
              </button>

              {/* Board Vector Arrow Visibility Toggle */}
              <button
                onClick={onToggleArrow}
                className={`p-2.5 rounded-xl border-2 transition-all text-xs cursor-pointer ${
                  showArrow
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
                title={showArrow ? 'Hide board vector arrow' : 'Show board vector arrow'}
              >
                {showArrow ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Master Strategic Reason Card - "WHY THIS MOVE?" */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#1b1b22] border-2 border-neutral-700 space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Target className="w-5 h-5 shrink-0 stroke-[2.5]" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 font-serif-master">
                  Why This Move? (Grandmaster Explanation)
                </h4>
              </div>
              <p className="text-base sm:text-lg text-white leading-relaxed font-sans font-semibold pl-2 sm:pl-7">
                {analysis.primaryReason}
              </p>
            </div>

            {/* Key Strategic Objectives with Emerald Checkmarks */}
            {analysis.keyBenefits && analysis.keyBenefits.length > 0 && (
              <div className="pl-2 sm:pl-7 space-y-2.5 pt-3 border-t border-neutral-700/80">
                <span className="text-xs sm:text-sm font-black text-neutral-200 uppercase tracking-wider font-serif-master">
                  Key Strategic Advantages:
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-neutral-100 font-sans leading-relaxed">
                  {analysis.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="font-semibold flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threat Warning (Strict Ruby Red) */}
            {analysis.threatWarning && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border-2 border-red-500/50 text-red-200 text-xs sm:text-sm font-sans mt-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  <strong className="text-red-300 uppercase font-black tracking-wide">Threat Warning: </strong>
                  {analysis.threatWarning}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Rich Opening Fallback: AI analysis is NEVER blank */
        <div className="pt-4 space-y-4">
          <div className="p-4 rounded-xl bg-[#1b1b22] border-2 border-neutral-700 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-300 font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <span className="font-black text-xl leading-none">e4</span>
                <span className="text-[10px] text-neutral-300 font-bold font-mono mt-0.5">e2→e4</span>
              </div>
              <div>
                <span className="text-sm sm:text-base font-black text-white">Center Dominance: Pawn to e4</span>
                <div className="text-xs text-neutral-300 mt-1 font-mono">Eval: +0.20 • Equal Position (White Initiative)</div>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-[#1b1b22] border-2 border-neutral-700 space-y-3.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 font-serif-master flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
              Why This Move? (Grandmaster Explanation)
            </h4>
            <p className="text-base sm:text-lg text-white font-semibold leading-relaxed pl-2 sm:pl-7">
              Occupies the critical central e4 square, establishes dominant board control, and unleashes radiating diagonal development for both the Queen and King's Bishop.
            </p>
            <div className="pl-2 sm:pl-7 space-y-2 pt-3 border-t border-neutral-700/80">
              <span className="text-xs sm:text-sm font-black text-neutral-200 uppercase tracking-wider font-serif-master">
                Key Strategic Advantages:
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-neutral-100 font-sans leading-relaxed">
                <li className="font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dominates central territory and cramps opposing pieces.</span>
                </li>
                <li className="font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Accelerates piece mobilization towards early kingside castling.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
