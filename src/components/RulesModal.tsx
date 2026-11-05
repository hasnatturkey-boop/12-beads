import React from 'react';
import { X, BookOpen, Check, Target, Zap, Trophy, Shield } from 'lucide-react';
import { sound } from '../game/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            <span>How to Play</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-wide mt-1">
            Rules of 12 Beads (12 Goti)
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Traditional two-player South Asian abstract strategy game (Baro Guti).
          </p>
        </div>

        {/* Rules Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-stone-300 leading-relaxed">
          {/* Rule 1: Board & Setup */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>1. Board & Initial Setup</span>
            </div>
            <p>
              The game is played on a 5×5 intersection grid containing 25 points. Each player starts with 12 beads (Gold vs Jade). Player 1 fills the top rows, Player 2 fills the bottom rows, and the center intersection point is left empty at the start.
            </p>
          </div>

          {/* Rule 2: Basic Movement */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Check className="w-4 h-4" />
              <span>2. Basic Movement</span>
            </div>
            <p>
              On your turn, tap your bead and tap an adjacent empty point connected by a line. You can move along horizontal, vertical, and marked diagonal lines in any direction.
            </p>
          </div>

          {/* Rule 3: Capturing Opponent Beads */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <Target className="w-4 h-4" />
              <span>3. Captures (Jumping)</span>
            </div>
            <p>
              To capture an opponent's bead, jump over it in a straight line along a marked path into the vacant point immediately beyond. The captured bead is removed from the board.
            </p>
          </div>

          {/* Rule 4: Chain Jumps */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>4. Chain Jumps (Combo Captures)</span>
            </div>
            <p>
              If your bead lands in a position where it can make another capture jump immediately, you are granted a chain jump! You can keep jumping to capture multiple enemy beads in a single turn.
            </p>
          </div>

          {/* Rule 5: Winning the Game */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Trophy className="w-4 h-4" />
              <span>5. Winning the Match</span>
            </div>
            <p>
              The first player to eliminate all 12 of their opponent's beads or completely trap the opponent with zero legal moves wins the match!
            </p>
          </div>
        </div>

        {/* Got it CTA */}
        <div className="mt-4 pt-3 border-t border-stone-800">
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            I Understand, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
