import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Award, Sparkles, Clock } from 'lucide-react';
import { DailyChallenge } from '../types';
import {
  loadDailyChallenges,
  loadPlayerProfile,
  saveDailyChallenges,
  savePlayerProfile,
  PlayerProfile,
} from '../game/challenges';
import { sound } from '../game/audio';

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({ isOpen, onClose }) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      const data = loadDailyChallenges();
      setChallenges(data.challenges);
      setProfile(loadPlayerProfile());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimReward = (id: string) => {
    const nextChallenges = challenges.map((c) => {
      if (c.id === id && c.completed && !c.claimed) {
        sound.playVictory();
        return { ...c, claimed: true };
      }
      return c;
    });

    const target = challenges.find((c) => c.id === id);
    if (target && profile) {
      const nextProfile = {
        ...profile,
        xp: profile.xp + target.rewardXP,
      };
      savePlayerProfile(nextProfile);
      setProfile(nextProfile);
    }

    saveDailyChallenges(nextChallenges);
    setChallenges(nextChallenges);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            <span>Daily Engagements</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-wide mt-1">
            Daily Challenges
          </h2>
          <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resets daily at midnight · Earn XP & Badges</span>
          </div>
        </div>

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {challenges.map((c) => {
            const percent = Math.min(100, Math.round((c.current / c.target) * 100));

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border transition-all ${
                  c.claimed
                    ? 'bg-stone-950/40 border-stone-800/60 opacity-60'
                    : c.completed
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                    : 'bg-stone-950/70 border-stone-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-100">{c.title}</h4>
                      {c.completed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{c.description}</p>
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                    +{c.rewardXP} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-stone-400 font-semibold">
                    <span>Progress</span>
                    <span>
                      {c.current} / {c.target}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Claim CTA */}
                {c.completed && !c.claimed && (
                  <button
                    onClick={() => handleClaimReward(c.id)}
                    className="w-full mt-3 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Claim {c.rewardXP} XP Reward</span>
                  </button>
                )}

                {c.claimed && (
                  <div className="mt-2 text-center text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                    ✓ Claimed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
