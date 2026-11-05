import React, { useState, useEffect } from 'react';
import { Users, Bot, Key, Copy, Check, ArrowRight, X, Sparkles, Swords, RefreshCw, Play, RotateCcw } from 'lucide-react';
import { AIDifficulty, PlayerId } from '../types';
import { sound } from '../game/audio';

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartComputerGame: (difficulty: AIDifficulty, playerColor: PlayerId) => void;
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (code: string) => void;
  onStartMatchmaking: () => void;
  onStartLocalPass: () => void;
  initialRoomCode?: string;
  hasPausedGame?: boolean;
  onResumeGame?: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  isOpen,
  onClose,
  onStartComputerGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onStartMatchmaking,
  onStartLocalPass,
  initialRoomCode = '',
  hasPausedGame = false,
  onResumeGame,
}) => {
  const [selectedMainOption, setSelectedMainOption] = useState<'friend' | 'computer' | null>(null);
  
  // Computer mode options
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal');
  const [playerSide, setPlayerSide] = useState<PlayerId>('P1');

  // Friend mode options
  const [friendSubTab, setFriendSubTab] = useState<'create' | 'join' | 'matchmaking'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialRoomCode);
  const [joinError, setJoinError] = useState<string>('');

  // Reset modal state whenever it is opened so the 3 main options are always presented
  useEffect(() => {
    if (isOpen) {
      setSelectedMainOption(null);
      setFriendSubTab('create');
      setJoinCodeInput(initialRoomCode);
      setJoinError('');
    }
  }, [isOpen, initialRoomCode]);

  const handleClose = () => {
    sound.playButtonClick();
    setSelectedMainOption(null);
    setFriendSubTab('create');
    setJoinError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Select Game Mode
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-wide mt-1">
            Choose Your Match
          </h2>
        </div>

        {/* Level 1: If neither selected yet or back */}
        {!selectedMainOption ? (
          <div className="flex flex-col gap-4">
            {/* OPTION 1: PLAY WITH FRIEND */}
            <button
              onClick={() => {
                sound.playButtonClick();
                setSelectedMainOption('friend');
              }}
              className="group relative flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-stone-800/90 to-stone-800/50 hover:from-amber-950/40 hover:to-stone-800/80 border border-stone-700 hover:border-amber-500/60 shadow-lg transition-all duration-200 cursor-pointer text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                      Play with Friend
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      Online
                    </span>
                  </div>
                  <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                    Share room code, enter friend's code, or random matchmaking
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </button>

            {/* OPTION 2: PLAY WITH COMPUTER */}
            <button
              onClick={() => {
                sound.playButtonClick();
                setSelectedMainOption('computer');
              }}
              className="group relative flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-stone-800/90 to-stone-800/50 hover:from-emerald-950/40 hover:to-stone-800/80 border border-stone-700 hover:border-emerald-500/60 shadow-lg transition-all duration-200 cursor-pointer text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-100 group-hover:text-emerald-300 transition-colors">
                      Play with Computer
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      AI Offline
                    </span>
                  </div>
                  <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                    Practice with 3 difficulty levels: Easy, Normal & Hard
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </button>

            {/* PASS & PLAY OPTION */}
            <div className="pt-2">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  onStartLocalPass();
                }}
                className="w-full py-3 px-4 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Swords className="w-4 h-4 text-stone-400" />
                <span>Pass & Play (Same Device 2-Player)</span>
              </button>
            </div>
          </div>
        ) : selectedMainOption === 'friend' ? (
          /* PLAY WITH FRIEND CONFIGURATION */
          <div className="space-y-5">
            <button
              onClick={() => {
                sound.playButtonClick();
                setSelectedMainOption(null);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              ← Back to options
            </button>

            {/* Sub Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-800 text-xs font-bold">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setFriendSubTab('create');
                }}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  friendSubTab === 'create'
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setFriendSubTab('join');
                }}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  friendSubTab === 'join'
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Enter Code
              </button>
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setFriendSubTab('matchmaking');
                }}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  friendSubTab === 'matchmaking'
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Matchmaking
              </button>
            </div>

            {/* Sub Tab: Create Room */}
            {friendSubTab === 'create' && (
              <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-100">Host a Private Room</h4>
                  <p className="text-stone-400 text-xs mt-1">
                    Generate an instant invite code to send to your friend on any device.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onCreateOnlineRoom();
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Generate Room Code
                </button>
              </div>
            )}

            {/* Sub Tab: Enter Code */}
            {friendSubTab === 'join' && (
              <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-4">
                <div className="text-center">
                  <h4 className="text-base font-bold text-stone-100">Enter Friend's Code</h4>
                  <p className="text-stone-400 text-xs mt-1">
                    Type the 6-character room code shared by your friend (e.g. GOTI-A2B4)
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setJoinError('');
                    }}
                    placeholder="e.g. GOTI-ABCD"
                    maxLength={12}
                    className="w-full text-center py-3 px-4 rounded-xl bg-stone-900 border border-stone-700 text-amber-300 font-mono text-lg font-bold tracking-widest focus:outline-none focus:border-amber-400 uppercase"
                  />
                  {joinError && <p className="text-red-400 text-xs mt-1.5 text-center">{joinError}</p>}
                </div>

                <button
                  onClick={() => {
                    const clean = joinCodeInput.trim().toUpperCase();
                    if (!clean) {
                      setJoinError('Please enter a room code');
                      return;
                    }
                    sound.playButtonClick();
                    onJoinOnlineRoom(clean);
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Join Match Now
                </button>
              </div>
            )}

            {/* Sub Tab: Matchmaking */}
            {friendSubTab === 'matchmaking' && (
              <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-100">Global Matchmaking</h4>
                  <p className="text-stone-400 text-xs mt-1">
                    Instantly pair with another active player waiting online.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onStartMatchmaking();
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-extrabold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Find Opponent
                </button>
              </div>
            )}
          </div>
        ) : (
          /* PLAY WITH COMPUTER CONFIGURATION */
          <div className="space-y-5">
            <button
              onClick={() => {
                sound.playButtonClick();
                setSelectedMainOption(null);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              ← Back to options
            </button>

            {/* Resume In-Progress Paused Match */}
            {hasPausedGame && onResumeGame && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-stone-900 border border-emerald-500/50 space-y-2.5 shadow-lg shadow-emerald-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-emerald-300">Paused Match in Progress</h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">Resume your ongoing match vs Computer right where you left off</p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onResumeGame();
                    }}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/30 active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>
            )}

            {/* Difficulty Level Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {hasPausedGame ? 'Or Start a New Game · AI Difficulty' : 'AI Difficulty Level'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'normal', 'hard'] as AIDifficulty[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      sound.playButtonClick();
                      setDifficulty(lvl);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border transition cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950'
                        : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {lvl === 'easy' && '🌱 Easy'}
                    {lvl === 'normal' && '⚔️ Normal'}
                    {lvl === 'hard' && '🔥 Hard'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-400 italic">
                {difficulty === 'easy' && 'Casual play, forgiving moves, occasional capture jumps.'}
                {difficulty === 'normal' && 'Tactical play with capture foresight and balanced positioning.'}
                {difficulty === 'hard' && 'Ruthless Minimax master: hunts chain captures and punishes mistakes!'}
              </p>
            </div>

            {/* Bead Color & First Move */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Your Beads & Turn
                </label>
                <span className="text-[10px] text-amber-400 font-semibold">
                  Your beads: DOWN · Computer: UP
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    setPlayerSide('P1');
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    playerSide === 'P1'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Gold (P1)</div>
                    <div className="text-[10px] opacity-75">You Move 1st · Down</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    sound.playButtonClick();
                    setPlayerSide('P2');
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    playerSide === 'P2'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-700 shadow" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Jade (P2)</div>
                    <div className="text-[10px] opacity-75">Computer 1st · Down</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Start Match CTA */}
            <button
              onClick={() => {
                sound.playButtonClick();
                onStartComputerGame(difficulty, playerSide);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 text-stone-950 font-extrabold text-base uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <span>Play vs Computer</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
