import { BeadType, GameState, Move, PlayerId } from '../types';

export const BOARD_SIZE = 5;
export const TOTAL_POINTS = 25;

// Precompute line connections for the 5x5 Alquerque / 12 Goti board
export const BOARD_CONNECTIONS: number[][] = Array.from({ length: TOTAL_POINTS }, () => []);

// Precompute valid straight-line jumps for every (from, captured) pair -> landing point
// Map: key = `${from}->${captured}` => target landing index
export const JUMP_TARGETS: Map<string, number> = new Map();
// Reverse map: key = `${from}->${landing}` => captured index
export const JUMP_CAPTURES: Map<string, number> = new Map();

function initBoardGeometry() {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx = r * BOARD_SIZE + c;
      const neighbors: number[] = [];

      // Orthogonal neighbors
      const orthos = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];

      for (const [nr, nc] of orthos) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          neighbors.push(nr * BOARD_SIZE + nc);
        }
      }

      // Diagonal neighbors only on intersections where (r + c) % 2 === 0
      if ((r + c) % 2 === 0) {
        const diags = [
          [r - 1, c - 1],
          [r - 1, c + 1],
          [r + 1, c - 1],
          [r + 1, c + 1],
        ];
        for (const [nr, nc] of diags) {
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            neighbors.push(nr * BOARD_SIZE + nc);
          }
        }
      }

      BOARD_CONNECTIONS[idx] = neighbors;
    }
  }

  // Precompute straight jumps
  for (let from = 0; from < TOTAL_POINTS; from++) {
    const fr = Math.floor(from / BOARD_SIZE);
    const fc = from % BOARD_SIZE;

    for (const mid of BOARD_CONNECTIONS[from]) {
      const mr = Math.floor(mid / BOARD_SIZE);
      const mc = mid % BOARD_SIZE;

      const dr = mr - fr;
      const dc = mc - fc;

      const tr = mr + dr;
      const tc = mc + dc;

      // Ensure landing is within bounds
      if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
        const target = tr * BOARD_SIZE + tc;

        // If it was a diagonal jump, ensure both (fr, fc), (mr, mc), and (tr, tc) are on the diagonal line
        if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
          if ((tr + tc) % 2 === 0 && BOARD_CONNECTIONS[mid].includes(target)) {
            JUMP_TARGETS.set(`${from}->${mid}`, target);
            JUMP_CAPTURES.set(`${from}->${target}`, mid);
          }
        } else {
          // Orthogonal straight jump
          if (BOARD_CONNECTIONS[mid].includes(target)) {
            JUMP_TARGETS.set(`${from}->${mid}`, target);
            JUMP_CAPTURES.set(`${from}->${target}`, mid);
          }
        }
      }
    }
  }
}

initBoardGeometry();

/**
 * Creates initial 12 Beads board setup
 * P1 (top/amber): rows 0, 1 and (2,0), (2,1)
 * Center (2,2): empty
 * P2 (bottom/jade): (2,3), (2,4) and rows 3, 4
 */
export function createInitialBoard(): BeadType[] {
  const board: BeadType[] = new Array(TOTAL_POINTS).fill(null);

  // Row 0
  for (let c = 0; c < 5; c++) board[0 * 5 + c] = 'P1';
  // Row 1
  for (let c = 0; c < 5; c++) board[1 * 5 + c] = 'P1';
  // Row 2
  board[2 * 5 + 0] = 'P1';
  board[2 * 5 + 1] = 'P1';
  board[2 * 5 + 2] = null; // empty center
  board[2 * 5 + 3] = 'P2';
  board[2 * 5 + 4] = 'P2';
  // Row 3
  for (let c = 0; c < 5; c++) board[3 * 5 + c] = 'P2';
  // Row 4
  for (let c = 0; c < 5; c++) board[4 * 5 + c] = 'P2';

  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'P1',
    winner: null,
    p1BeadsCount: 12,
    p2BeadsCount: 12,
    moveHistory: [],
    selectedPos: null,
    validMoves: [],
    isChainJumping: false,
    chainJumpingPos: null,
    turnStartTime: Date.now(),
    consecutiveNonCaptureMoves: 0,
  };
}

/**
 * Get all available captures from a specific point for a player
 */
export function getCapturesFromPos(board: BeadType[], from: number, player: PlayerId): Move[] {
  const moves: Move[] = [];
  const opponent: PlayerId = player === 'P1' ? 'P2' : 'P1';

  for (const mid of BOARD_CONNECTIONS[from]) {
    if (board[mid] === opponent) {
      const target = JUMP_TARGETS.get(`${from}->${mid}`);
      if (target !== undefined && board[target] === null) {
        moves.push({
          from,
          to: target,
          isCapture: true,
          capturedPos: mid,
        });
      }
    }
  }

  return moves;
}

/**
 * Get simple (non-capture) adjacent moves from a specific point
 */
export function getSimpleMovesFromPos(board: BeadType[], from: number): Move[] {
  const moves: Move[] = [];
  for (const to of BOARD_CONNECTIONS[from]) {
    if (board[to] === null) {
      moves.push({
        from,
        to,
        isCapture: false,
      });
    }
  }
  return moves;
}

/**
 * Get all legal moves for a player on the board
 * Note: If in a chain-jump state, only subsequent jumps from chainJumpingPos are allowed.
 */
export function getAllLegalMoves(
  board: BeadType[],
  player: PlayerId,
  chainJumpingPos: number | null = null
): Move[] {
  if (chainJumpingPos !== null) {
    return getCapturesFromPos(board, chainJumpingPos, player);
  }

  const allCaptures: Move[] = [];
  const allSimpleMoves: Move[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    if (board[i] === player) {
      const captures = getCapturesFromPos(board, i, player);
      allCaptures.push(...captures);

      const simples = getSimpleMovesFromPos(board, i);
      allSimpleMoves.push(...simples);
    }
  }

  // In standard 12 Goti rules, capturing is optional but highly advantageous;
  // both captures and simple moves are legal.
  return [...allCaptures, ...allSimpleMoves];
}

/**
 * Applies a move to the game state and returns the new state
 */
export function applyMove(state: GameState, move: Move): GameState {
  const newBoard = [...state.board];
  const player = state.turn;
  const opponent: PlayerId = player === 'P1' ? 'P2' : 'P1';

  // Move bead
  newBoard[move.from] = null;
  newBoard[move.to] = player;

  let captured = false;
  let p1Count = state.p1BeadsCount;
  let p2Count = state.p2BeadsCount;
  let nonCaptureMoves = state.consecutiveNonCaptureMoves;

  if (move.isCapture && move.capturedPos !== undefined) {
    newBoard[move.capturedPos] = null;
    captured = true;
    if (opponent === 'P1') p1Count--;
    else p2Count--;
    nonCaptureMoves = 0;
  } else {
    nonCaptureMoves++;
  }

  const historyEntry = {
    turn: player,
    from: move.from,
    to: move.to,
    capturedPos: move.capturedPos,
  };

  // Check if chain jump is available
  if (captured) {
    const chainJumps = getCapturesFromPos(newBoard, move.to, player);
    if (chainJumps.length > 0) {
      // Chain jump available! Player can jump again
      return {
        ...state,
        board: newBoard,
        p1BeadsCount: p1Count,
        p2BeadsCount: p2Count,
        moveHistory: [...state.moveHistory, historyEntry],
        selectedPos: move.to,
        validMoves: chainJumps,
        isChainJumping: true,
        chainJumpingPos: move.to,
        consecutiveNonCaptureMoves: 0,
      };
    }
  }

  // Turn is complete, switch to opponent
  const nextTurn = opponent;
  const opponentMoves = getAllLegalMoves(newBoard, nextTurn, null);

  let winner: PlayerId | 'DRAW' | null = null;
  if (p1Count === 0) winner = 'P2';
  else if (p2Count === 0) winner = 'P1';
  else if (opponentMoves.length === 0) {
    // Opponent has no moves left
    winner = player;
  } else if (nonCaptureMoves >= 40 || (p1Count === 1 && p2Count === 1)) {
    winner = 'DRAW';
  }

  return {
    board: newBoard,
    turn: nextTurn,
    winner,
    p1BeadsCount: p1Count,
    p2BeadsCount: p2Count,
    moveHistory: [...state.moveHistory, historyEntry],
    selectedPos: null,
    validMoves: [],
    isChainJumping: false,
    chainJumpingPos: null,
    turnStartTime: Date.now(),
    consecutiveNonCaptureMoves: nonCaptureMoves,
  };
}

/**
 * End turn prematurely if player chooses to pass further chain jumps
 */
export function endChainJumpTurn(state: GameState): GameState {
  if (!state.isChainJumping) return state;

  const nextTurn: PlayerId = state.turn === 'P1' ? 'P2' : 'P1';
  const opponentMoves = getAllLegalMoves(state.board, nextTurn, null);

  let winner: PlayerId | 'DRAW' | null = null;
  if (state.p1BeadsCount === 0) winner = 'P2';
  else if (state.p2BeadsCount === 0) winner = 'P1';
  else if (opponentMoves.length === 0) {
    winner = state.turn;
  }

  return {
    ...state,
    turn: nextTurn,
    winner,
    selectedPos: null,
    validMoves: [],
    isChainJumping: false,
    chainJumpingPos: null,
    turnStartTime: Date.now(),
  };
}
