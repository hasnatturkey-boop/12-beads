export type PlayerId = 'P1' | 'P2';

export interface BoardPoint {
  index: number;
  row: number;
  col: number;
}

export type BeadType = PlayerId | null;

export interface Move {
  from: number;
  to: number;
  isCapture: boolean;
  capturedPos?: number;
  subsequentJumps?: Move[];
}

export type AIDifficulty = 'easy' | 'normal' | 'hard';

export type GameMode = 'computer' | 'friend_room' | 'matchmaking' | 'local_pass';

export type SoundStyle = 'wood' | 'marble' | 'brass';

export type BoardTheme = 'wood' | 'brass' | 'slate' | 'emerald';

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  soundStyle: SoundStyle;
  aiDifficulty: AIDifficulty;
  boardTheme: BoardTheme;
  playerName: string;
}

export interface ChatMessage {
  id: string;
  sender: PlayerId | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: number;
  isQuickEmote?: boolean;
}

export interface GameState {
  board: BeadType[];
  turn: PlayerId;
  winner: PlayerId | 'DRAW' | null;
  p1BeadsCount: number;
  p2BeadsCount: number;
  moveHistory: Array<{
    turn: PlayerId;
    from: number;
    to: number;
    capturedPos?: number;
  }>;
  selectedPos: number | null;
  validMoves: Move[];
  isChainJumping: boolean;
  chainJumpingPos: number | null;
  turnStartTime: number;
  consecutiveNonCaptureMoves: number;
}

export interface RoomState {
  code: string;
  p1: { id: string; name: string; ready: boolean; connected: boolean };
  p2?: { id: string; name: string; ready: boolean; connected: boolean };
  gameState: GameState;
  rematchRequestedBy?: string;
  spectatorsCount: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  beadsCaptured: number;
  country: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewardXP: number;
  claimed: boolean;
}
