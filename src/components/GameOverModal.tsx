import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Share2, Award, Zap } from 'lucide-react';
import { GameMode, GameState, PlayerId } from '../types';
import { sound } from '../game/audio';

interface GameOverModalProps {
  isOpen: boolean;
  gameState: GameState;
  userRole: PlayerId;
  mode: GameMode;
  opponentName: string;
  userName: string;
  onRematch: () => void;
  onReturnToMenu: () => void;
  rematchRequested?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  gameState,
  userRole,
  mode,
  opponentName,
  userName,
  onRematch,
  onReturnToMenu,
  rematchRequested,
}) => {
  const isWinner =
    gameState.winner === 'DRAW'
      ? false
      : mode === 'local_pass'
      ? true
      : gameState.winner === userRole;

  const isDraw = gameState.winner === 'DRAW';

  useEffect(() => {
    if (isOpen) {
      if (isWinner && !isDraw) {
        sound.playVictory();
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#fbbf24', '#34d399', '#ffffff'],
          });
        } catch {}
      } else if (!isDraw) {
        sound.playDefeat();
      }
    }
  }, [isOpen, isWinner, isDraw]);

  if (!isOpen) return null;

  const winnerTitle = isDraw
    ? 'Stalemate Draw'
    : mode === 'local_pass'
    ? `${gameState.winner === 'P1' ? 'Gold (P1)' : 'Jade (P2)'} Wins!`
    : isWinner
    ? 'Magnificent Victory!'
    : 'Defeated';

  const p1Captures = 12 - gameState.p2BeadsCount;
  const p2Captures = 12 - gameState.p1BeadsCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 text-center overflow-hidden">
        {/* Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-amber-500/20' : 'bg-red-500/15'
          }`}
        />

        {/* Big Trophy / Outcome Icon */}
        <div className="relative mb-4">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
              isWinner
                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 shadow-amber-500/30'
                : isDraw
                ? 'bg-stone-800 text-stone-300'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            <Trophy className="w-10 h-10 fill-current" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-black tracking-wide text-stone-100 mb-1">
          {winnerTitle}
        </h2>
        <p className="text-xs text-stone-400 font-medium mb-6">
          {isDraw
            ? 'Neither player has captured beads for 40 consecutive moves.'
            : isWinner
            ? `Outstanding tactical supremacy against ${opponentName}!`
            : `${opponentName} captured your forces. Train hard and revenge!`}
        </p>

        {/* Match Statistics Card */}
        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 mb-6 space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Turns</span>
              <span className="text-base font-black font-mono text-stone-200">
                {gameState.moveHistory.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Captures</span>
              <span className="text-base font-black font-mono text-amber-400">
                {userRole === 'P1' ? p1Captures : p2Captures}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">XP Earned</span>
              <span className="text-base font-black font-mono text-amber-300">
                {isWinner ? '+500 XP' : isDraw ? '+150 XP' : '+100 XP'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Rating ELO</span>
              <span
                className={`text-base font-black font-mono ${
                  isWinner ? 'text-emerald-400' : isDraw ? 'text-stone-400' : 'text-red-400'
                }`}
              >
                {isWinner ? '+25' : isDraw ? '±0' : '-15'}
              </span>
            </div>
          </div>
        </div>

        {/* Rematch alert notice if remote opponent requested it */}
        {rematchRequested && (
          <div className="mb-4 py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
            ⚡ {opponentName} has requested a Rematch!
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sound.playButtonClick();
              onRematch();
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{rematchRequested ? 'Accept Rematch' : 'Play Rematch'}</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onReturnToMenu();
            }}
            className="w-full py-3 px-6 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
