import React, { useEffect } from 'react';
import { Play, Settings, Trophy, Calendar, BookOpen, Volume2, VolumeX, Shield, Users, RotateCcw, Award, Sparkles } from 'lucide-react';
import { sound } from '../game/audio';
import { GameSettings } from '../types';
import { PlayerProfile } from '../game/challenges';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onOpenChallenges: () => void;
  onOpenRules: () => void;
  settings: GameSettings;
  onToggleSound: () => void;
  completedChallengesCount: number;
  hasPausedGame?: boolean;
  onResumeGame?: () => void;
  profile: PlayerProfile;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenLeaderboard,
  onOpenChallenges,
  onOpenRules,
  settings,
  onToggleSound,
  completedChallengesCount,
  hasPausedGame = false,
  onResumeGame,
  profile,
}) => {
  const currentLevel = Math.floor(profile.xp / 1000) + 1;
  const xpInCurrentLevel = profile.xp % 1000;
  const xpPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / 1000) * 100));
  // Keyboard shortcut: Space or Enter to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        sound.playButtonClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 py-6 overflow-hidden bg-stone-950 text-stone-100">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-amber-950/20 via-stone-950/80 to-stone-950 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-sm">
            12
          </span>
          <span className="text-xs tracking-widest uppercase font-semibold text-stone-400">
            BARO GOTI · STRATEGY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-medium transition cursor-pointer"
            title="How to Play"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Rules</span>
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 transition cursor-pointer"
            title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </div>
      </header>

      {/* Hero Centerpiece */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl px-2 py-4">
        {/* Ornate decorative emblem */}
        <div className="mb-4 relative">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-900 to-stone-950 p-1 shadow-2xl shadow-amber-900/40 border border-amber-500/30 flex items-center justify-center transform rotate-45 animate-pulse-subtle">
            <div className="w-full h-full rounded-xl bg-stone-950/90 flex items-center justify-center transform -rotate-45">
              {/* Mini visual 12 Beads board representation */}
              <svg className="w-12 h-12 text-amber-400" viewBox="0 0 100 100" fill="currentColor">
                <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                {/* Gold beads (top) */}
                <circle cx="10" cy="10" r="5" fill="#f59e0b" />
                <circle cx="50" cy="10" r="5" fill="#f59e0b" />
                <circle cx="90" cy="10" r="5" fill="#f59e0b" />
                <circle cx="30" cy="30" r="5" fill="#f59e0b" />
                <circle cx="70" cy="30" r="5" fill="#f59e0b" />
                {/* Center empty */}
                <circle cx="50" cy="50" r="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="2,2" />
                {/* Jade beads (bottom) */}
                <circle cx="30" cy="70" r="5" fill="#10b981" />
                <circle cx="70" cy="70" r="5" fill="#10b981" />
                <circle cx="10" cy="90" r="5" fill="#10b981" />
                <circle cx="50" cy="90" r="5" fill="#10b981" />
                <circle cx="90" cy="90" r="5" fill="#10b981" />
              </svg>
            </div>
          </div>
        </div>

        {/* PRIMARY TITLE: Exact requested text in capital letters */}
        <div className="space-y-2 mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)]">
            12 BEADS BY HASNAT
          </h1>
          <p className="text-stone-400 text-sm md:text-base font-medium tracking-wide">
            The Legendary 12 Goti South Asian Strategy Board Game
          </p>
        </div>

        {/* PLAYER LEVEL & XP PROGRESSION (Each level increases when 1000 XP reached) */}
        <div className="w-full max-w-sm mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 border border-amber-500/30 shadow-lg shadow-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                <span>LEVEL {currentLevel}</span>
              </div>
              <span className="text-xs font-bold text-amber-200">
                {profile.title}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="font-bold text-amber-300">{profile.xp}</span>
              <span>XP</span>
            </div>
          </div>

          {/* Progress Bar to next level (1000 XP per level) */}
          <div className="w-full space-y-1">
            <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden border border-stone-700/60 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-500 shadow-sm"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-400 font-medium">
              <span>{xpInCurrentLevel} / 1000 XP to Lvl {currentLevel + 1}</span>
              <span className="text-amber-400 font-semibold">+500 Win · +100 Loss</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons: Resume (if paused), Start and Settings prominently */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {hasPausedGame && onResumeGame && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onResumeGame();
              }}
              className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 text-stone-950 font-extrabold text-lg tracking-wider uppercase shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/50 transform active:scale-98 transition duration-200 flex items-center justify-center gap-3 cursor-pointer animate-pulse-subtle"
            >
              <RotateCcw className="w-6 h-6 fill-current transition-transform group-hover:rotate-45" />
              <span>RESUME GAME</span>
              <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-300/40 pointer-events-none" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playButtonClick();
              onStartGame();
            }}
            className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:via-amber-500 hover:to-yellow-500 text-stone-950 font-extrabold text-lg tracking-wider uppercase shadow-xl shadow-amber-600/30 hover:shadow-amber-500/50 transform active:scale-98 transition duration-200 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current transition-transform group-hover:scale-110" />
            <span>START GAME</span>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/30 pointer-events-none" />
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenSettings();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-200 font-bold text-base tracking-wide flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer"
          >
            <Settings className="w-5 h-5 text-amber-400" />
            <span>SETTINGS</span>
          </button>
        </div>

        {/* Secondary Navigation Features: Leaderboard, Daily Challenges */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenLeaderboard();
            }}
            className="p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800/70 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition hover:text-amber-300 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>LEADERBOARD</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenChallenges();
            }}
            className="relative p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800/70 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition hover:text-amber-300 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>DAILY TASKS</span>
            {completedChallengesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black flex items-center justify-center">
                {completedChallengesCount}
              </span>
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-stone-500 text-xs mt-6 tracking-wide hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono text-[11px] border border-stone-700">ENTER</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono text-[11px] border border-stone-700">SPACE</kbd> to launch
        </p>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2 border-t border-stone-900/80 pt-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            Real-Time Multiplayer
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-stone-400" />
            3 AI Difficulties
          </span>
        </div>
        <div className="text-stone-400 font-medium">
          Created with pride by <span className="text-amber-400 font-bold">Hasnat</span>
        </div>
      </footer>
    </div>
  );
};
