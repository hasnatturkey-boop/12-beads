import React, { useState, useEffect, useRef } from 'react';
import {
  BOARD_CONNECTIONS,
  BOARD_SIZE,
  getAllLegalMoves,
} from '../game/engine';
import { BoardTheme, GameMode, GameSettings, GameState, Move, PlayerId } from '../types';
import { sound } from '../game/audio';
import {
  Volume2,
  VolumeX,
  MessageCircle,
  Flag,
  Lightbulb,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export interface PendingRemoteMove {
  move: Move;
  isOpponent: boolean;
  onComplete: () => void;
}

interface GameBoardProps {
  gameState: GameState;
  onMakeMove: (move: Move) => void;
  onEndChainJump: () => void;
  onResign: () => void;
  onHint?: () => void;
  hintMove: Move | null;
  mode: GameMode;
  userRole: PlayerId; // 'P1' (Gold) or 'P2' (Jade)
  opponentName: string;
  userName: string;
  isAiThinking?: boolean;
  settings: GameSettings;
  onToggleSound: () => void;
  onToggleChat?: () => void;
  unreadChatCount?: number;
  onBackToMenu: () => void;
  pendingRemoteMove?: PendingRemoteMove | null;
}

interface ActiveMoveAnim {
  from: number;
  to: number;
  player: PlayerId;
  isCapture: boolean;
  capturedPos?: number;
  isOpponent: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  curX: number;
  curY: number;
  scale: number;
  shadowY: number;
  progress: number;
  phase: 'moving' | 'impact';
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onMakeMove,
  onEndChainJump,
  onResign,
  onHint,
  hintMove,
  mode,
  userRole,
  opponentName,
  userName,
  isAiThinking,
  settings,
  onToggleSound,
  onToggleChat,
  unreadChatCount = 0,
  onBackToMenu,
  pendingRemoteMove,
}) => {
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [animState, setAnimState] = useState<ActiveMoveAnim | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const pendingRemoteMoveProcessed = useRef<PendingRemoteMove | null>(null);

  // Synchronize internal selection with chain-jumping if applicable
  useEffect(() => {
    if (gameState.isChainJumping && gameState.chainJumpingPos !== null) {
      setSelectedPos(gameState.chainJumpingPos);
      setValidMoves(gameState.validMoves);
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  }, [gameState.isChainJumping, gameState.chainJumpingPos, gameState.validMoves, gameState.turn]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const isMyTurn = mode === 'local_pass' ? true : gameState.turn === userRole;

  // Board layout constants
  const VIEW_SIZE = 500;
  const PADDING = 50;
  const SPACING = (VIEW_SIZE - 2 * PADDING) / 4; // 100px per cell

  /**
   * BOARD ORIENTATION:
   * "make our beads down and computer beads up"
   * In standard setup:
   * P1 starts at rows 0 & 1 (top of grid).
   * P2 starts at rows 3 & 4 (bottom of grid).
   *
   * If user is P1, we rotate the board view 180 degrees (isFlipped = true)
   * so that P1's beads are physically rendered DOWN at the bottom (rows 4 & 3)
   * and the computer's beads (P2) are physically rendered UP at the top (rows 0 & 1).
   *
   * If user is P2, P2's beads are already at the bottom (rows 3 & 4),
   * so isFlipped = false.
   *
   * Result: In ALL games, YOUR beads are ALWAYS DOWN and COMPUTER beads are ALWAYS UP!
   */
  const isFlipped = mode === 'local_pass' ? false : userRole === 'P1';

  const getCoordinates = (index: number) => {
    const r = Math.floor(index / BOARD_SIZE);
    const c = index % BOARD_SIZE;
    const displayR = isFlipped ? 4 - r : r;
    const displayC = isFlipped ? 4 - c : c;
    return {
      x: PADDING + displayC * SPACING,
      y: PADDING + displayR * SPACING,
      r: displayR,
      c: displayC,
    };
  };

  /**
   * Easing function: smooth cubic ease-out for tactile physical gliding
   */
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  /**
   * Smooth, slow movement animation with synchronized sound
   */
  const startMoveAnimation = (
    move: Move,
    isOpponent: boolean,
    onComplete: () => void
  ) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const start = getCoordinates(move.from);
    const end = getCoordinates(move.to);
    const movingPiece =
      gameState.board[move.from] ||
      (isOpponent ? (userRole === 'P1' ? 'P2' : 'P1') : userRole);

    // 1. Play subtle wooden friction slide sound at start of movement
    sound.playBeadSlide();

    // Duration: 520ms for smooth, deliberate travel; 580ms for jump capture
    const duration = move.isCapture ? 580 : 500;
    const startTime = performance.now();

    const initialAnim: ActiveMoveAnim = {
      from: move.from,
      to: move.to,
      player: movingPiece,
      isCapture: move.isCapture,
      capturedPos: move.capturedPos,
      isOpponent,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      curX: start.x,
      curY: start.y,
      scale: 1,
      shadowY: 5,
      progress: 0,
      phase: 'moving',
    };

    setAnimState(initialAnim);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(rawT);

      const curX = start.x + (end.x - start.x) * ease;
      const baseY = start.y + (end.y - start.y) * ease;

      // Parabolic jump arc if capture
      const arc = move.isCapture ? Math.sin(rawT * Math.PI) * 34 : 0;
      const curY = baseY - arc;

      // Dynamic scale and shadow elevation
      const scale = move.isCapture
        ? 1 + Math.sin(rawT * Math.PI) * 0.28
        : 1 + Math.sin(rawT * Math.PI) * 0.12;

      const shadowY = move.isCapture
        ? 5 + Math.sin(rawT * Math.PI) * 16
        : 5 + Math.sin(rawT * Math.PI) * 8;

      setAnimState((prev) =>
        prev
          ? {
              ...prev,
              curX,
              curY,
              scale,
              shadowY,
              progress: rawT,
            }
          : null
      );

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Bead has reached destination!
        if (move.isCapture) {
          // Play realistic capture sound on impact!
          sound.playBeadCapture(isOpponent);

          // Impact phase: brief 160ms flash/shrink for captured bead
          setAnimState((prev) => (prev ? { ...prev, phase: 'impact' } : null));

          setTimeout(() => {
            setAnimState(null);
            onComplete();
          }, 180);
        } else {
          // Play realistic wooden landing clack
          sound.playBeadMove();
          setAnimState(null);
          onComplete();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Watch for remote or computer move dispatched from App.tsx
  useEffect(() => {
    if (
      pendingRemoteMove &&
      pendingRemoteMove !== pendingRemoteMoveProcessed.current &&
      !animState
    ) {
      pendingRemoteMoveProcessed.current = pendingRemoteMove;
      startMoveAnimation(
        pendingRemoteMove.move,
        pendingRemoteMove.isOpponent,
        pendingRemoteMove.onComplete
      );
    }
  }, [pendingRemoteMove, animState]);

  // Handle clicking on a board position
  const handlePointClick = (index: number) => {
    if (gameState.winner || isAiThinking || animState) return;
    if (!isMyTurn) return;

    const piece = gameState.board[index];

    // If in chain jump mode, cannot pick another bead; only jump with the active bead or end turn
    if (gameState.isChainJumping) {
      const matchingMove = validMoves.find((m) => m.to === index);
      if (matchingMove) {
        startMoveAnimation(matchingMove, false, () => onMakeMove(matchingMove));
      }
      return;
    }

    // If clicking own bead, select it and show legal moves
    if (piece === gameState.turn) {
      sound.playBeadSelect();
      setSelectedPos(index);
      const moves = getAllLegalMoves(gameState.board, gameState.turn, null).filter((m) => m.from === index);
      setValidMoves(moves);
      return;
    }

    // If clicking a destination for currently selected bead
    if (selectedPos !== null) {
      const matchingMove = validMoves.find((m) => m.to === index);
      if (matchingMove) {
        setSelectedPos(null);
        setValidMoves([]);
        startMoveAnimation(matchingMove, false, () => onMakeMove(matchingMove));
      } else {
        // Deselect if clicked invalid empty spot
        setSelectedPos(null);
        setValidMoves([]);
      }
    }
  };

  // Extract unique lines to draw on the board
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
  const lineSet = new Set<string>();

  for (let u = 0; u < 25; u++) {
    const { x: x1, y: y1 } = getCoordinates(u);
    for (const v of BOARD_CONNECTIONS[u]) {
      const min = Math.min(u, v);
      const max = Math.max(u, v);
      const key = `${min}-${max}`;
      if (!lineSet.has(key)) {
        lineSet.add(key);
        const { x: x2, y: y2 } = getCoordinates(v);
        lines.push({ x1, y1, x2, y2, key });
      }
    }
  }

  // Board theme classes
  const getThemeBackground = (theme: BoardTheme) => {
    switch (theme) {
      case 'brass':
        return 'bg-board-brass border-amber-900/60 shadow-amber-950/40';
      case 'slate':
        return 'bg-board-slate border-slate-700/60 shadow-slate-950/50';
      case 'emerald':
        return 'bg-board-emerald border-emerald-800/60 shadow-emerald-950/50';
      case 'wood':
      default:
        return 'bg-board-wood border-[#542d1e] shadow-amber-950/60';
    }
  };

  // Colors determination
  const userBeadColor = userRole === 'P1' ? 'Gold' : 'Jade';
  const opponentBeadColor = userRole === 'P1' ? 'Jade' : 'Gold';
  const userBeadsCount = userRole === 'P1' ? gameState.p1BeadsCount : gameState.p2BeadsCount;
  const opponentBeadsCount = userRole === 'P1' ? gameState.p2BeadsCount : gameState.p1BeadsCount;

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between items-center px-3 py-3 sm:py-4 bg-stone-950 text-stone-100 select-none">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-radial from-stone-900/40 via-stone-950 to-stone-950 pointer-events-none" />

      {/* TOP HUD BAR */}
      <header className="relative z-10 w-full max-w-xl flex items-center justify-between gap-2 px-1 pb-2">
        <button
          onClick={() => {
            sound.playButtonClick();
            onBackToMenu();
          }}
          className="px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-bold transition cursor-pointer"
        >
          ← Menu
        </button>

        {/* Turn status pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/95 border border-stone-800 shadow-md">
          <div
            className={`w-3 h-3 rounded-full ${
              gameState.turn === 'P1'
                ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
            } ${gameState.isChainJumping ? 'animate-ping' : ''}`}
          />
          <span className="text-xs font-extrabold tracking-wide text-stone-200">
            {gameState.winner
              ? 'Game Ended'
              : animState
              ? 'Moving...'
              : isAiThinking
              ? 'AI Thinking...'
              : gameState.isChainJumping
              ? 'Chain Jump Available!'
              : isMyTurn
              ? 'Your Turn (Move Bead)'
              : `${opponentName}'s Turn`}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {mode === 'computer' && onHint && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onHint();
              }}
              disabled={!isMyTurn || isAiThinking || Boolean(animState)}
              className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 text-amber-400 transition cursor-pointer"
              title="Get Move Hint"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}

          {onToggleChat && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onToggleChat();
              }}
              className="relative p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 transition cursor-pointer"
              title="Chat"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-stone-950 text-[9px] font-black flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onToggleSound}
            className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 transition cursor-pointer"
            title="Toggle Sound"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              if (window.confirm('Are you sure you want to resign this match?')) {
                onResign();
              }
            }}
            disabled={Boolean(gameState.winner)}
            className="p-2 rounded-full bg-stone-900/80 hover:bg-red-950/60 border border-stone-800 text-stone-400 hover:text-red-400 transition cursor-pointer disabled:opacity-30"
            title="Resign Match"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* OPPONENT / COMPUTER TRAY (UP / TOP OF BOARD) */}
      <div className="relative z-10 w-full max-w-xl flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-900/70 border border-stone-800/80 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
              opponentBeadColor === 'Jade'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-800 text-stone-950 border border-emerald-400/40'
                : 'bg-gradient-to-br from-amber-400 to-amber-700 text-stone-950 border border-amber-400/40'
            }`}
          >
            {opponentName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-200">{opponentName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 font-semibold uppercase">
                UP (Top)
              </span>
              {mode === 'computer' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-mono uppercase">
                  {settings.aiDifficulty}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400">
              {opponentBeadColor} Beads · Top Positions
            </span>
          </div>
        </div>

        {/* Opponent Remaining count */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-stone-400">Beads Left</div>
            <div className="text-sm font-black text-stone-100 font-mono">
              {opponentBeadsCount} / 12
            </div>
          </div>
          <div className="flex gap-0.5 max-w-[120px] flex-wrap justify-end">
            {Array.from({ length: 12 - opponentBeadsCount }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-red-500/80 border border-red-400/40 shadow-sm"
                title="Captured Bead"
              />
            ))}
          </div>
        </div>
      </div>

      {/* MAIN GAME BOARD AREA */}
      <div className="relative z-10 w-full max-w-[480px] aspect-square flex items-center justify-center p-2 sm:p-4">
        {/* Board Wooden Frame Container */}
        <div
          className={`relative w-full h-full rounded-3xl p-3 sm:p-5 border-4 shadow-2xl flex items-center justify-center transition-all ${getThemeBackground(
            settings.boardTheme
          )}`}
        >
          {/* Subtle wood grain overlay */}
          <div className="absolute inset-0 rounded-3xl wood-pattern pointer-events-none" />

          {/* Antique Brass Rivets in four corners */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 border border-amber-950 shadow-md" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 border border-amber-950 shadow-md" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 border border-amber-950 shadow-md" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 border border-amber-950 shadow-md" />

          {/* SVG Board Lines & Intersections */}
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            style={{ touchAction: 'none' }}
          >
            {/* Draw all board lines with engraved brass/carved wood styling */}
            <g stroke="#9a7b56" strokeWidth="4.5" strokeLinecap="round" opacity="0.85">
              {lines.map((l) => (
                <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>

            {/* Inner highlight for engraved lines */}
            <g stroke="#23120b" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
              {lines.map((l) => (
                <line key={`shadow-${l.key}`} x1={l.x1} y1={l.y1 + 1} x2={l.x2} y2={l.y2 + 1} />
              ))}
            </g>

            {/* Hint move visual guide */}
            {hintMove && (
              <line
                x1={getCoordinates(hintMove.from).x}
                y1={getCoordinates(hintMove.from).y}
                x2={getCoordinates(hintMove.to).x}
                y2={getCoordinates(hintMove.to).y}
                stroke="#eab308"
                strokeWidth="4"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            )}

            {/* Intersection eyelet points */}
            {Array.from({ length: 25 }).map((_, idx) => {
              const { x, y } = getCoordinates(idx);
              const piece = gameState.board[idx];
              const isSelected = selectedPos === idx;
              const isValidTarget = validMoves.some((m) => m.to === idx);
              const isHintSource = hintMove?.from === idx;
              const isHintTarget = hintMove?.to === idx;

              // Hide piece during movement animation
              const isOriginOfMovingPiece = animState?.from === idx;
              const isBeingCaptured =
                animState?.phase === 'impact' && animState?.capturedPos === idx;

              return (
                <g key={`point-${idx}`} onClick={() => handlePointClick(idx)} className="cursor-pointer">
                  {/* Point Eyelet (Metallic socket) */}
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill="#1e130c"
                    stroke="#a37844"
                    strokeWidth="2"
                    opacity={piece ? 0.35 : 0.85}
                  />
                  <circle cx={x} cy={y} r={3} fill="#42220f" opacity={piece ? 0.2 : 0.9} />

                  {/* Valid move target destination ring */}
                  {isValidTarget && !animState && (
                    <g>
                      <circle
                        cx={x}
                        cy={y}
                        r={22}
                        fill="rgba(234, 179, 8, 0.25)"
                        stroke="#eab308"
                        strokeWidth="2.5"
                        strokeDasharray="4,3"
                        className="animate-spin"
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '6s' }}
                      />
                      <circle cx={x} cy={y} r={7} fill="#f59e0b" className="animate-pulse" />
                    </g>
                  )}

                  {/* Hint target destination */}
                  {isHintTarget && (
                    <circle
                      cx={x}
                      cy={y}
                      r={18}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                  )}

                  {/* Captured Bead Impact Shockwave Ring */}
                  {isBeingCaptured && (
                    <g>
                      <circle
                        cx={x}
                        cy={y}
                        r={26}
                        fill="rgba(239, 68, 68, 0.4)"
                        stroke="#ef4444"
                        strokeWidth="3"
                        className="animate-ping"
                        style={{ transformOrigin: `${x}px ${y}px` }}
                      />
                    </g>
                  )}

                  {/* 3D Static Bead Rendering (if not currently in flight) */}
                  {piece && !isOriginOfMovingPiece && (
                    <g
                      className={
                        isSelected
                          ? 'animate-bounce-subtle'
                          : isBeingCaptured
                          ? 'transition-all duration-200 opacity-0 scale-0'
                          : ''
                      }
                      style={
                        isBeingCaptured
                          ? { transformOrigin: `${x}px ${y}px`, transform: 'scale(0)', opacity: 0 }
                          : undefined
                      }
                    >
                      {/* Drop shadow */}
                      <circle cx={x + 2} cy={y + 5} r={19} fill="rgba(0, 0, 0, 0.55)" />

                      {/* Selection aura */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={25}
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="3.5"
                          className="animate-pulse"
                        />
                      )}

                      {/* Hint source indicator */}
                      {isHintSource && (
                        <circle
                          cx={x}
                          cy={y}
                          r={24}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          strokeDasharray="3,3"
                        />
                      )}

                      {/* The Bead Sphere */}
                      {piece === 'P1' ? (
                        // GOLD BEAD
                        <g>
                          <defs>
                            <radialGradient id={`gold-grad-${idx}`} cx="35%" cy="35%" r="65%">
                              <stop offset="0%" stopColor="#fef08a" />
                              <stop offset="40%" stopColor="#f59e0b" />
                              <stop offset="85%" stopColor="#b45309" />
                              <stop offset="100%" stopColor="#78350f" />
                            </radialGradient>
                          </defs>
                          <circle
                            cx={x}
                            cy={y}
                            r={20}
                            fill={`url(#gold-grad-${idx})`}
                            stroke="#d97706"
                            strokeWidth="1.5"
                          />
                          <ellipse
                            cx={x - 5}
                            cy={y - 6}
                            rx={6}
                            ry={3.5}
                            fill="rgba(255, 255, 255, 0.7)"
                            transform={`rotate(-25 ${x - 5} ${y - 6})`}
                          />
                          <circle cx={x} cy={y} r={7} fill="none" stroke="#78350f" strokeWidth="1.2" opacity="0.7" />
                          <circle cx={x} cy={y} r={2} fill="#78350f" opacity="0.8" />
                        </g>
                      ) : (
                        // JADE BEAD
                        <g>
                          <defs>
                            <radialGradient id={`jade-grad-${idx}`} cx="35%" cy="35%" r="65%">
                              <stop offset="0%" stopColor="#a7f3d0" />
                              <stop offset="40%" stopColor="#10b981" />
                              <stop offset="85%" stopColor="#047857" />
                              <stop offset="100%" stopColor="#064e3b" />
                            </radialGradient>
                          </defs>
                          <circle
                            cx={x}
                            cy={y}
                            r={20}
                            fill={`url(#jade-grad-${idx})`}
                            stroke="#059669"
                            strokeWidth="1.5"
                          />
                          <ellipse
                            cx={x - 5}
                            cy={y - 6}
                            rx={6}
                            ry={3.5}
                            fill="rgba(255, 255, 255, 0.65)"
                            transform={`rotate(-25 ${x - 5} ${y - 6})`}
                          />
                          <circle cx={x} cy={y} r={7} fill="none" stroke="#064e3b" strokeWidth="1.2" opacity="0.7" />
                          <circle cx={x} cy={y} r={2} fill="#064e3b" opacity="0.8" />
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* ACTIVE SMOOTH MOVING BEAD IN FLIGHT */}
            {animState && (
              <g
                style={{
                  transformOrigin: `${animState.curX}px ${animState.curY}px`,
                  transform: `scale(${animState.scale})`,
                }}
              >
                {/* Dynamic elevated drop shadow */}
                <circle
                  cx={animState.curX + 2}
                  cy={animState.curY + animState.shadowY}
                  r={19}
                  fill="rgba(0, 0, 0, 0.65)"
                  opacity={0.8}
                />

                {/* The Flying Bead */}
                {animState.player === 'P1' ? (
                  // Flying Gold Bead
                  <g>
                    <defs>
                      <radialGradient id="flying-gold-grad" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="40%" stopColor="#f59e0b" />
                        <stop offset="85%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#78350f" />
                      </radialGradient>
                    </defs>
                    <circle
                      cx={animState.curX}
                      cy={animState.curY}
                      r={20}
                      fill="url(#flying-gold-grad)"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                    <ellipse
                      cx={animState.curX - 5}
                      cy={animState.curY - 6}
                      rx={6}
                      ry={3.5}
                      fill="rgba(255, 255, 255, 0.85)"
                      transform={`rotate(-25 ${animState.curX - 5} ${animState.curY - 6})`}
                    />
                    <circle cx={animState.curX} cy={animState.curY} r={7} fill="none" stroke="#78350f" strokeWidth="1.2" opacity="0.8" />
                    <circle cx={animState.curX} cy={animState.curY} r={2} fill="#78350f" opacity="0.9" />
                  </g>
                ) : (
                  // Flying Jade Bead
                  <g>
                    <defs>
                      <radialGradient id="flying-jade-grad" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#a7f3d0" />
                        <stop offset="40%" stopColor="#10b981" />
                        <stop offset="85%" stopColor="#047857" />
                        <stop offset="100%" stopColor="#064e3b" />
                      </radialGradient>
                    </defs>
                    <circle
                      cx={animState.curX}
                      cy={animState.curY}
                      r={20}
                      fill="url(#flying-jade-grad)"
                      stroke="#34d399"
                      strokeWidth="2"
                    />
                    <ellipse
                      cx={animState.curX - 5}
                      cy={animState.curY - 6}
                      rx={6}
                      ry={3.5}
                      fill="rgba(255, 255, 255, 0.85)"
                      transform={`rotate(-25 ${animState.curX - 5} ${animState.curY - 6})`}
                    />
                    <circle cx={animState.curX} cy={animState.curY} r={7} fill="none" stroke="#064e3b" strokeWidth="1.2" opacity="0.8" />
                    <circle cx={animState.curX} cy={animState.curY} r={2} fill="#064e3b" opacity="0.9" />
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* DEDICATED TURN & END TURN SECTION */}
      <div className="relative z-10 w-full max-w-xl my-1.5 flex flex-col gap-1.5">
        {/* CHAIN JUMP ACTIVE: Prominent End Turn Action */}
        {gameState.isChainJumping && isMyTurn ? (
          <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-stone-900/90 border-2 border-amber-400 shadow-xl shadow-amber-500/25 animate-pulse-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Chain Jump Active!</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div className="text-[11px] text-stone-200">
                  Jump again to capture more beads, or finish your turn.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playButtonClick();
                onEndChainJump();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/40 transform active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>End Your Turn</span>
            </button>
          </div>
        ) : (
          /* REGULAR TURN STATUS BAR */
          <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-900/80 border border-stone-800/80">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  gameState.winner
                    ? 'bg-stone-500'
                    : isMyTurn
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                    : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                }`}
              />
              <span className="text-xs font-bold text-stone-200">
                {gameState.winner ? (
                  <span className="text-stone-400">Match Concluded</span>
                ) : isMyTurn ? (
                  <span className="text-emerald-300 font-extrabold">
                    YOUR TURN · <span className="font-medium text-stone-300">Tap your bead (bottom) then select target</span>
                  </span>
                ) : (
                  <span className="text-amber-300 font-extrabold">
                    {opponentName.toUpperCase()}&apos;S TURN ·{' '}
                    <span className="font-medium text-stone-400">
                      {isAiThinking ? 'Calculating optimal move...' : 'Waiting for move...'}
                    </span>
                  </span>
                )}
              </span>
            </div>
            <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>Turn #{gameState.moveHistory.length + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* PLAYER TRAY (DOWN / BOTTOM OF BOARD) */}
      <div className="relative z-10 w-full max-w-xl flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-900/70 border border-stone-800/80 mt-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
              userBeadColor === 'Gold'
                ? 'bg-gradient-to-br from-amber-400 to-amber-700 text-stone-950 border border-amber-400/40'
                : 'bg-gradient-to-br from-emerald-500 to-teal-800 text-stone-950 border border-emerald-400/40'
            }`}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-200">{userName} (You)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">
                DOWN (Bottom)
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              {userBeadColor} Beads · Your Positions
            </span>
          </div>
        </div>

        {/* Player Remaining beads count */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-stone-400">Beads Left</div>
            <div className="text-sm font-black text-stone-100 font-mono">
              {userBeadsCount} / 12
            </div>
          </div>
          <div className="flex gap-0.5 max-w-[120px] flex-wrap justify-end">
            {Array.from({ length: 12 - userBeadsCount }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-red-500/80 border border-red-400/40 shadow-sm"
                title="Lost Bead"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
