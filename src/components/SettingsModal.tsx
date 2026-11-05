import React from 'react';
import { X, Volume2, VolumeX, Sparkles, Sliders, Music, Zap } from 'lucide-react';
import { AIDifficulty, BoardTheme, GameSettings, SoundStyle } from '../types';
import { sound } from '../game/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleSoundToggle = () => {
    const next = !settings.soundEnabled;
    sound.enabled = next;
    onUpdateSettings({ soundEnabled: next });
    if (next) sound.playButtonClick();
  };

  const handleVolumeChange = (vol: number) => {
    sound.volume = vol;
    onUpdateSettings({ soundVolume: vol });
  };

  const handleStyleChange = (style: SoundStyle) => {
    sound.style = style;
    onUpdateSettings({ soundStyle: style });
    sound.playBeadMove(style);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Sliders className="w-4 h-4" />
            <span>Game Preferences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-wide mt-1">
            Settings
          </h2>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: SOUND & REALISTIC AUDIO */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-200">Sound Effects</h3>
                  <p className="text-xs text-stone-400">Realistic bead clicks & capture impacts</p>
                </div>
              </div>

              <button
                onClick={handleSoundToggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-stone-800'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-stone-950 transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <>
                {/* Volume slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-stone-400 font-medium">
                    <span>Volume</span>
                    <span>{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Sound Style (Realistic Materials) */}
                <div className="space-y-2 pt-2 border-t border-stone-900">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Bead Material Sound
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'wood' as SoundStyle, label: '🪵 Classic Wood' },
                      { id: 'marble' as SoundStyle, label: '⚪ Polished Marble' },
                      { id: 'brass' as SoundStyle, label: '🔔 Antique Brass' },
                    ].map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => handleStyleChange(mat.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          settings.soundStyle === mat.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {mat.label}
                      </button>
                    ))}
                  </div>

                  {/* Sound Test Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => sound.playBeadMove(settings.soundStyle)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition cursor-pointer"
                    >
                      ▶ Test Move Clack
                    </button>
                    <button
                      onClick={() => sound.playBeadCapture(false)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition cursor-pointer"
                    >
                      💥 Test Capture Snap
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SECTION 2: DEFAULT DIFFICULTY */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Default AI Difficulty</h3>
            <p className="text-xs text-stone-400">Level used when playing against computer</p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'easy' as AIDifficulty, label: 'Easy', emoji: '🌱' },
                { id: 'normal' as AIDifficulty, label: 'Normal', emoji: '⚔️' },
                { id: 'hard' as AIDifficulty, label: 'Hard', emoji: '🔥' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    sound.playButtonClick();
                    onUpdateSettings({ aiDifficulty: lvl.id });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wide border transition cursor-pointer flex flex-col items-center gap-1 ${
                    settings.aiDifficulty === lvl.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="text-base">{lvl.emoji}</span>
                  <span>{lvl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: BOARD VISUAL THEME */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Board Finish Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'wood' as BoardTheme, name: 'Mahogany', bg: 'bg-[#27140e]' },
                { id: 'brass' as BoardTheme, name: 'Brass & Leather', bg: 'bg-[#2b251f]' },
                { id: 'slate' as BoardTheme, name: 'Midnight Slate', bg: 'bg-[#0f172a]' },
                { id: 'emerald' as BoardTheme, name: 'Royal Velvet', bg: 'bg-[#064e3b]' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    sound.playButtonClick();
                    onUpdateSettings({ boardTheme: theme.id });
                  }}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                    settings.boardTheme === theme.id
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${theme.bg} border border-stone-700 shadow-inner`} />
                  <span className="text-[11px] font-bold text-stone-300">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: PLAYER PROFILE NAME */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-2">
            <h3 className="text-sm font-bold text-stone-200">Your Gamer Nickname</h3>
            <input
              type="text"
              value={settings.playerName}
              maxLength={20}
              onChange={(e) => onUpdateSettings({ playerName: e.target.value })}
              placeholder="Hasnat Champion"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-sm focus:outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-stone-500">
              Shown to opponents in multiplayer rooms and recorded on the global leaderboard.
            </p>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-6 pt-4 border-t border-stone-800">
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm uppercase tracking-wider transition cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
