import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Flame, Target, Search, User } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { loadPlayerProfile, PlayerProfile } from '../game/challenges';
import { sound } from '../game/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProfile(loadPlayerProfile());
      fetch('/api/leaderboard')
        .then((res) => res.json())
        .then((data) => {
          if (data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
          setLoading(false);
        })
        .catch(() => {
          // Fallback initial list
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = leaderboard.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

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
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-widest">
            <Trophy className="w-4 h-4" />
            <span>World Standings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-wide mt-1">
            Global Leaderboard
          </h2>
        </div>

        {/* Player's Own Card */}
        {profile && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-800/80 to-stone-900 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-300">{profile.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    Lv. {profile.level}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">{profile.title}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Rating</div>
                <div className="text-sm font-black text-amber-400 font-mono">{profile.rating}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Wins</div>
                <div className="text-sm font-black text-emerald-400 font-mono">{profile.wins}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Captures</div>
                <div className="text-sm font-black text-stone-200 font-mono">{profile.totalCaptures}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading standings...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">No players found</div>
          ) : (
            filtered.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isTop3
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-stone-950/40 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        entry.rank === 1
                          ? 'bg-yellow-400 text-stone-950 shadow-md shadow-yellow-500/40'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-stone-950'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-stone-100'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-200">{entry.name}</span>
                        {entry.streak >= 3 && (
                          <span className="flex items-center text-[10px] text-amber-400 font-bold">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {entry.streak}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {entry.wins}W / {entry.losses}L · {entry.beadsCaptured} captures
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-amber-400">
                      {entry.rating}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400">
                      ELO
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
