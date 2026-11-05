import React, { useState } from 'react';
import { Copy, Check, Share2, Loader2, X, Users, Sparkles } from 'lucide-react';
import { sound } from '../game/audio';

interface WaitingRoomModalProps {
  isOpen: boolean;
  roomCode: string;
  isMatchmaking?: boolean;
  onCancel: () => void;
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  roomCode,
  isMatchmaking = false,
  onCancel,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    sound.playButtonClick();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sound.playButtonClick();
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close/Cancel */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onCancel();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isMatchmaking ? (
          /* MATCHMAKING VIEW */
          <div className="py-6 space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black text-stone-100">Finding Opponent...</h3>
              <p className="text-xs text-stone-400 mt-1">
                Searching the matchmaking lobby for an active challenger.
              </p>
            </div>

            <button
              onClick={() => {
                sound.playButtonClick();
                onCancel();
              }}
              className="py-2.5 px-6 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        ) : (
          /* ROOM CODE VIEW */
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Room Created
              </span>
              <h3 className="text-2xl font-black text-stone-100 mt-0.5">Share Room Code</h3>
              <p className="text-xs text-stone-400 mt-1">
                Share this code with your friend on any device to start playing in real-time.
              </p>
            </div>

            {/* Room Code Display Box */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/40 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Room Code</span>
                <span className="text-2xl font-black text-amber-400 font-mono tracking-widest">
                  {roomCode}
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Share Link button */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>{copiedLink ? 'Direct Link Copied to Clipboard!' : 'Copy Direct Game Invite Link'}</span>
            </button>

            {/* Pulsing Waiting State */}
            <div className="flex items-center justify-center gap-2 text-stone-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Waiting for Player 2 to join...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
