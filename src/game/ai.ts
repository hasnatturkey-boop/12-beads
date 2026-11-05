import { AIDifficulty, BeadType, Move, PlayerId } from '../types';
import {
  applyMove,
  BOARD_CONNECTIONS,
  createInitialGameState,
  getAllLegalMoves,
  getCapturesFromPos,
} from './engine';

// Strategic weights for board positions (0..24)
// Center point 12 is the most powerful junction on the board (8 connections!)
const POSITION_WEIGHTS: number[] = [
  2, 1, 3, 1, 2,
  1, 4, 3, 4, 1,
  3, 3, 8, 3, 3,
  1, 4, 3, 4, 1,
  2, 1, 3, 1, 2,
];

/**
 * Evaluates board state from perspective of aiPlayer
 */
function evaluateBoard(board: BeadType[], aiPlayer: PlayerId): number {
  const opponent: PlayerId = aiPlayer === 'P1' ? 'P2' : 'P1';

  let aiBeads = 0;
  let oppBeads = 0;
  let aiPositionScore = 0;
  let oppPositionScore = 0;

  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (piece === aiPlayer) {
      aiBeads++;
      aiPositionScore += POSITION_WEIGHTS[i];
    } else if (piece === opponent) {
      oppBeads++;
      oppPositionScore += POSITION_WEIGHTS[i];
    }
  }

  // Win / loss terminal evaluation
  if (oppBeads === 0) return 100000;
  if (aiBeads === 0) return -100000;

  // Material weight is paramount in 12 Goti
  const materialScore = (aiBeads - oppBeads) * 300;
  const positionDiff = (aiPositionScore - oppPositionScore) * 8;

  // Mobility evaluation (number of available moves)
  const aiMoves = getAllLegalMoves(board, aiPlayer, null).length;
  const oppMoves = getAllLegalMoves(board, opponent, null).length;
  const mobilityDiff = (aiMoves - oppMoves) * 12;

  return materialScore + positionDiff + mobilityDiff;
}

/**
 * Minimax with Alpha-Beta pruning
 */
function minimax(
  board: BeadType[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: PlayerId,
  chainPos: number | null = null
): number {
  const currentPlayer: PlayerId = isMaximizing ? aiPlayer : (aiPlayer === 'P1' ? 'P2' : 'P1');
  const legalMoves = getAllLegalMoves(board, currentPlayer, chainPos);

  if (legalMoves.length === 0) {
    return isMaximizing ? -90000 : 90000;
  }

  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  // Move ordering: put captures first for fast alpha-beta cutoffs
  legalMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      // Simulate move
      const simState = createInitialGameState();
      simState.board = [...board];
      simState.turn = currentPlayer;
      const nextState = applyMove(simState, move);

      let evaluation: number;
      if (nextState.isChainJumping && nextState.chainJumpingPos !== null) {
        // Still maximizing player's turn (chain jump)
        evaluation = minimax(nextState.board, depth, alpha, beta, true, aiPlayer, nextState.chainJumpingPos);
      } else {
        evaluation = minimax(nextState.board, depth - 1, alpha, beta, false, aiPlayer, null);
      }

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const simState = createInitialGameState();
      simState.board = [...board];
      simState.turn = currentPlayer;
      const nextState = applyMove(simState, move);

      let evaluation: number;
      if (nextState.isChainJumping && nextState.chainJumpingPos !== null) {
        evaluation = minimax(nextState.board, depth, alpha, beta, false, aiPlayer, nextState.chainJumpingPos);
      } else {
        evaluation = minimax(nextState.board, depth - 1, alpha, beta, true, aiPlayer, null);
      }

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Decides best move for the AI given difficulty level
 */
export function getAIMove(
  board: BeadType[],
  aiPlayer: PlayerId,
  difficulty: AIDifficulty,
  chainJumpingPos: number | null = null
): Move | null {
  const legalMoves = getAllLegalMoves(board, aiPlayer, chainJumpingPos);
  if (legalMoves.length === 0) return null;

  const captures = legalMoves.filter((m) => m.isCapture);

  // EASY DIFFICULTY:
  // Random choice with 65% bias toward captures
  if (difficulty === 'easy') {
    if (captures.length > 0 && Math.random() < 0.65) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // NORMAL DIFFICULTY:
  // Minimax depth 2 search with slight randomness among top moves
  if (difficulty === 'normal') {
    let bestMoves: Move[] = [];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      const simState = createInitialGameState();
      simState.board = [...board];
      simState.turn = aiPlayer;
      const nextState = applyMove(simState, move);

      let score: number;
      if (nextState.isChainJumping && nextState.chainJumpingPos !== null) {
        score = minimax(nextState.board, 2, -Infinity, Infinity, true, aiPlayer, nextState.chainJumpingPos);
      } else {
        score = minimax(nextState.board, 1, -Infinity, Infinity, false, aiPlayer, null);
      }

      // Small positional bias
      if (move.isCapture) score += 40;

      if (score > bestScore + 15) {
        bestScore = score;
        bestMoves = [move];
      } else if (Math.abs(score - bestScore) <= 15) {
        bestMoves.push(move);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)] || legalMoves[0];
  }

  // HARD DIFFICULTY:
  // Deeper Minimax depth 3-4 with strict alpha-beta pruning and deep capture analysis
  let bestMove: Move = legalMoves[0];
  let bestScore = -Infinity;

  // Move ordering: captures first
  const sortedMoves = [...legalMoves].sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  for (const move of sortedMoves) {
    const simState = createInitialGameState();
    simState.board = [...board];
    simState.turn = aiPlayer;
    const nextState = applyMove(simState, move);

    let score: number;
    if (nextState.isChainJumping && nextState.chainJumpingPos !== null) {
      score = minimax(nextState.board, 3, -Infinity, Infinity, true, aiPlayer, nextState.chainJumpingPos);
    } else {
      score = minimax(nextState.board, 3, -Infinity, Infinity, false, aiPlayer, null);
    }

    // Heavy rewards for multi-captures and king safety
    if (move.isCapture) {
      score += 50;
      // Bonus if it leads to additional chain captures
      const extraJumps = getCapturesFromPos(nextState.board, move.to, aiPlayer);
      if (extraJumps.length > 0) score += 120;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
