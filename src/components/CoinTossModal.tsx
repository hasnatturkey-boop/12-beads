import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, ArrowRight, Play, Swords } from 'lucide-react';
import { PlayerId } from '../types';
import { sound } from '../game/audio';

interface CoinTossModalProps {
  isOpen: boolean;
  player1Name: string;
  player2Name: string;
  onTossComplete: (winnerIsP1: boolean, tossWinnerName: string) => void;
}

export const CoinTossModal: React.FC<CoinTossModalProps> = ({
  isOpen,
  player1Name,
  player2Name,
  onTossComplete,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossResult, setTossResult] = useState<boolean | null>(null); // true = P1 (Gold), false = P2 (Jade)
  const [rotationDegrees, setRotationDegrees] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsFlipping(false);
      setTossResult(null);
      setRotationDegrees(0);

      // Auto start flip after 400ms
      const timer = setTimeout(() => {
        handleFlip();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTossResult(null);
    sound.playCoinToss();

    // Decide winner randomly (50% chance)
    const winnerIsP1 = Math.random() >= 0.5;

    // Minimum 5 full spins (1800 deg) + final landing side
    // If winner is P1, land on 0 mod 360 (Gold Side)
    // If winner is P2, land on 180 mod 360 (Jade Side)
    const extraSpins = 360 * 5;
    const finalAngle = extraSpins + (winnerIsP1 ? 0 : 180);

    setRotationDegrees(finalAngle);

    setTimeout(() => {
      setIsFlipping(false);
      setTossResult(winnerIsP1);

      // Auto advance after 2 seconds
      setTimeout(() => {
        const winnerName = winnerIsP1 ? player1Name : player2Name;
        onTossComplete(winnerIsP1, winnerName);
      }, 2000);
    }, 1400);
  };

  const winnerName = tossResult === true ? player1Name : player2Name;
  const isP1Winner = tossResult === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Heading */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Swords className="w-3.5 h-3.5" />
            <span>Coin Toss</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-100 tracking-wide">
            Who Moves First?
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Flipping coin between <span className="text-amber-300 font-bold">{player1Name}</span> and <span className="text-emerald-400 font-bold">{player2Name}</span>
          </p>
        </div>

        {/* 3D Animated Coin */}
        <div className="py-6 flex flex-col items-center justify-center perspective-[1000px]">
          <div
            className="relative w-32 h-32 rounded-full cursor-pointer transition-transform duration-1400 ease-out preserve-3d"
            style={{
              transform: `rotateY(${rotationDegrees}deg) ${isFlipping ? 'scale(1.2)' : 'scale(1)'}`,
              transformStyle: 'preserve-3d',
            }}
            onClick={!isFlipping && tossResult === null ? handleFlip : undefined}
          >
            {/* FRONT SIDE: GOLD / P1 */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 border-4 border-yellow-200 shadow-2xl flex flex-col items-center justify-center p-3 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full rounded-full border-2 border-dashed border-amber-900/60 flex flex-col items-center justify-center">
                <span className="text-2xl">👑</span>
                <span className="text-[11px] font-black tracking-widest text-stone-950 uppercase mt-0.5">
                  GOLD
                </span>
                <span className="text-[9px] font-extrabold text-amber-950">1ST TURN</span>
              </div>
            </div>

            {/* BACK SIDE: JADE / P2 */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-600 to-teal-800 border-4 border-emerald-200 shadow-2xl flex flex-col items-center justify-center p-3 backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-950/60 flex flex-col items-center justify-center">
                <span className="text-2xl">⭐</span>
                <span className="text-[11px] font-black tracking-widest text-stone-950 uppercase mt-0.5">
                  JADE
                </span>
                <span className="text-[9px] font-extrabold text-emerald-950">2ND TURN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toss Status & Announcement */}
        <div className="min-h-[70px] flex flex-col items-center justify-center">
          {isFlipping ? (
            <div className="space-y-1 animate-pulse">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Coin is Spinning...
              </span>
              <p className="text-sm font-bold text-stone-300">Determining who starts first!</p>
            </div>
          ) : tossResult !== null ? (
            <div className="space-y-1 animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Toss Winner: {winnerName}!</span>
              </div>
              <p className="text-sm font-extrabold text-stone-100">
                {isP1Winner ? `${player1Name} won the toss and moves first!` : `${player2Name} won the toss and moves first!`}
              </p>
            </div>
          ) : (
            <button
              onClick={handleFlip}
              className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Flip Coin Now
            </button>
          )}
        </div>

        {/* Action button when result is known */}
        {tossResult !== null && (
          <div className="mt-4 pt-3 border-t border-stone-800">
            <button
              onClick={() => {
                sound.playButtonClick();
                onTossComplete(tossResult, winnerName);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Start Match</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
