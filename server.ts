import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  applyMove,
  createInitialGameState,
  getAllLegalMoves,
} from './src/game/engine';
import { ChatMessage, GameState, LeaderboardEntry, Move, PlayerId } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

// Global seeded Leaderboard
const leaderboardData: LeaderboardEntry[] = [
  { id: 'lb-1', rank: 1, name: 'Hasnat (Grandmaster)', rating: 2240, wins: 182, losses: 14, streak: 19, beadsCaptured: 1640, country: 'PK' },
  { id: 'lb-2', rank: 2, name: 'Arjun Verma', rating: 2110, wins: 145, losses: 26, streak: 8, beadsCaptured: 1390, country: 'IN' },
  { id: 'lb-3', rank: 3, name: 'Tanvir Hossain', rating: 2045, wins: 130, losses: 31, streak: 6, beadsCaptured: 1180, country: 'BD' },
  { id: 'lb-4', rank: 4, name: 'Zainab Malik', rating: 1980, wins: 115, losses: 38, streak: 4, beadsCaptured: 990, country: 'PK' },
  { id: 'lb-5', rank: 5, name: 'Aarav Sharma', rating: 1920, wins: 104, losses: 42, streak: 5, beadsCaptured: 895, country: 'IN' },
  { id: 'lb-6', rank: 6, name: 'Bilal Khan', rating: 1875, wins: 92, losses: 40, streak: 3, beadsCaptured: 810, country: 'PK' },
  { id: 'lb-7', rank: 7, name: 'Rahim Chowdhury', rating: 1830, wins: 88, losses: 45, streak: 2, beadsCaptured: 740, country: 'BD' },
  { id: 'lb-8', rank: 8, name: 'Elena Rostova', rating: 1790, wins: 76, losses: 39, streak: 3, beadsCaptured: 680, country: 'US' },
  { id: 'lb-9', rank: 9, name: 'Devendra Patel', rating: 1740, wins: 69, losses: 44, streak: 1, beadsCaptured: 615, country: 'IN' },
  { id: 'lb-10', rank: 10, name: 'Usman Ghani', rating: 1690, wins: 62, losses: 48, streak: 2, beadsCaptured: 550, country: 'PK' },
];

// Room state definition
interface ServerPlayer {
  id: string;
  name: string;
  ws: WebSocket;
  role: PlayerId;
  connected: boolean;
}

interface ServerRoom {
  code: string;
  p1: ServerPlayer;
  p2?: ServerPlayer;
  spectators: WebSocket[];
  gameState: GameState;
  rematchRequestedBy?: string;
  createdAt: number;
}

const rooms = new Map<string, ServerRoom>();
const matchmakingQueue: Array<{ id: string; name: string; ws: WebSocket }> = [];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const fullCode = `GOTI-${code}`;
  if (rooms.has(fullCode)) return generateRoomCode();
  return fullCode;
}

function broadcastToRoom(room: ServerRoom, payload: unknown, excludeWs?: WebSocket) {
  const message = JSON.stringify(payload);
  if (room.p1.ws.readyState === WebSocket.OPEN && room.p1.ws !== excludeWs) {
    room.p1.ws.send(message);
  }
  if (room.p2 && room.p2.ws.readyState === WebSocket.OPEN && room.p2.ws !== excludeWs) {
    room.p2.ws.send(message);
  }
  for (const spec of room.spectators) {
    if (spec.readyState === WebSocket.OPEN && spec !== excludeWs) {
      spec.send(message);
    }
  }
}

// REST API endpoints
app.get('/api/leaderboard', (_req, res) => {
  res.json({ success: true, leaderboard: leaderboardData });
});

app.post('/api/leaderboard/submit', (req, res) => {
  const { name, isWin, captures } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  let existing = leaderboardData.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
  if (!existing) {
    existing = {
      id: `lb-user-${Date.now()}`,
      rank: leaderboardData.length + 1,
      name: String(name).slice(0, 24),
      rating: 1200,
      wins: 0,
      losses: 0,
      streak: 0,
      beadsCaptured: 0,
      country: 'GLOBAL',
    };
    leaderboardData.push(existing);
  }

  if (isWin) {
    existing.wins += 1;
    existing.streak += 1;
    existing.rating += 25;
  } else {
    existing.losses += 1;
    existing.streak = 0;
    existing.rating = Math.max(800, existing.rating - 15);
  }
  existing.beadsCaptured += captures || 0;

  // Re-sort leaderboard
  leaderboardData.sort((a, b) => b.rating - a.rating || b.wins - a.wins);
  leaderboardData.forEach((item, index) => {
    item.rank = index + 1;
  });

  res.json({ success: true, entry: existing });
});

// WebSocket Handler
wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let playerRole: PlayerId | null = null;
  let playerId = `user-${Math.random().toString(36).substring(2, 9)}`;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. CREATE ROOM
      if (msg.type === 'create_room') {
        const playerName = (msg.name || 'Player 1').slice(0, 20);
        const code = generateRoomCode();
        const initialGame = createInitialGameState();

        const room: ServerRoom = {
          code,
          p1: {
            id: playerId,
            name: playerName,
            ws,
            role: 'P1',
            connected: true,
          },
          spectators: [],
          gameState: initialGame,
          createdAt: Date.now(),
        };

        rooms.set(code, room);
        currentRoomCode = code;
        playerRole = 'P1';

        ws.send(
          JSON.stringify({
            type: 'room_created',
            code,
            role: 'P1',
            name: playerName,
            gameState: initialGame,
          })
        );
      }

      // 2. JOIN ROOM
      else if (msg.type === 'join_room') {
        const code = String(msg.code || '').trim().toUpperCase();
        const playerName = (msg.name || 'Player 2').slice(0, 20);
        const room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check code.' }));
          return;
        }

        if (!room.p2) {
          // Join as P2
          room.p2 = {
            id: playerId,
            name: playerName,
            ws,
            role: 'P2',
            connected: true,
          };
          currentRoomCode = code;
          playerRole = 'P2';

          // Notify P2
          ws.send(
            JSON.stringify({
              type: 'room_joined',
              code,
              role: 'P2',
              opponentName: room.p1.name,
              gameState: room.gameState,
            })
          );

          // Notify P1
          room.p1.ws.send(
            JSON.stringify({
              type: 'opponent_joined',
              opponentName: playerName,
              gameState: room.gameState,
            })
          );
        } else if (room.p1.id === playerId) {
          // Reconnect as P1
          room.p1.ws = ws;
          room.p1.connected = true;
          currentRoomCode = code;
          playerRole = 'P1';
          ws.send(
            JSON.stringify({
              type: 'room_reconnected',
              code,
              role: 'P1',
              opponentName: room.p2?.name,
              gameState: room.gameState,
            })
          );
        } else if (room.p2?.id === playerId) {
          // Reconnect as P2
          room.p2.ws = ws;
          room.p2.connected = true;
          currentRoomCode = code;
          playerRole = 'P2';
          ws.send(
            JSON.stringify({
              type: 'room_reconnected',
              code,
              role: 'P2',
              opponentName: room.p1.name,
              gameState: room.gameState,
            })
          );
        } else {
          // Join as spectator
          room.spectators.push(ws);
          currentRoomCode = code;
          ws.send(
            JSON.stringify({
              type: 'spectator_joined',
              code,
              p1Name: room.p1.name,
              p2Name: room.p2.name,
              gameState: room.gameState,
            })
          );
        }
      }

      // 3. MATCHMAKING
      else if (msg.type === 'join_matchmaking') {
        const playerName = (msg.name || 'Challenger').slice(0, 20);

        // Clean stale queue entries
        const cleanQueue = matchmakingQueue.filter((item) => item.ws.readyState === WebSocket.OPEN);
        matchmakingQueue.length = 0;
        matchmakingQueue.push(...cleanQueue);

        if (matchmakingQueue.length > 0) {
          const opponent = matchmakingQueue.shift()!;
          const code = generateRoomCode();
          const initialGame = createInitialGameState();

          const room: ServerRoom = {
            code,
            p1: {
              id: opponent.id,
              name: opponent.name,
              ws: opponent.ws,
              role: 'P1',
              connected: true,
            },
            p2: {
              id: playerId,
              name: playerName,
              ws,
              role: 'P2',
              connected: true,
            },
            spectators: [],
            gameState: initialGame,
            createdAt: Date.now(),
          };

          rooms.set(code, room);
          currentRoomCode = code;
          playerRole = 'P2';

          // Notify both
          opponent.ws.send(
            JSON.stringify({
              type: 'match_found',
              code,
              role: 'P1',
              opponentName: playerName,
              gameState: initialGame,
            })
          );

          ws.send(
            JSON.stringify({
              type: 'match_found',
              code,
              role: 'P2',
              opponentName: opponent.name,
              gameState: initialGame,
            })
          );
        } else {
          matchmakingQueue.push({ id: playerId, name: playerName, ws });
          ws.send(JSON.stringify({ type: 'matchmaking_waiting' }));
        }
      }

      // 4. CANCEL MATCHMAKING
      else if (msg.type === 'cancel_matchmaking') {
        const idx = matchmakingQueue.findIndex((item) => item.ws === ws);
        if (idx !== -1) matchmakingQueue.splice(idx, 1);
        ws.send(JSON.stringify({ type: 'matchmaking_cancelled' }));
      }

      // 5. GAME MOVE
      else if (msg.type === 'make_move') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !playerRole) return;

        // Verify turn
        if (room.gameState.turn !== playerRole) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn!' }));
          return;
        }

        const move: Move = msg.move;
        const newState = applyMove(room.gameState, move);
        room.gameState = newState;

        broadcastToRoom(room, {
          type: 'move_made',
          move,
          gameState: newState,
          by: playerRole,
        });
      }

      // 6. END CHAIN JUMP TURN
      else if (msg.type === 'end_chain_jump') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !playerRole) return;

        if (room.gameState.turn === playerRole && room.gameState.isChainJumping) {
          const nextTurn: PlayerId = playerRole === 'P1' ? 'P2' : 'P1';
          const opponentMoves = getAllLegalMoves(room.gameState.board, nextTurn, null);
          let winner: PlayerId | 'DRAW' | null = null;
          if (room.gameState.p1BeadsCount === 0) winner = 'P2';
          else if (room.gameState.p2BeadsCount === 0) winner = 'P1';
          else if (opponentMoves.length === 0) winner = playerRole;

          room.gameState = {
            ...room.gameState,
            turn: nextTurn,
            winner,
            selectedPos: null,
            validMoves: [],
            isChainJumping: false,
            chainJumpingPos: null,
            turnStartTime: Date.now(),
          };

          broadcastToRoom(room, {
            type: 'chain_jump_ended',
            gameState: room.gameState,
          });
        }
      }

      // 7. IN-GAME CHAT & EMOTES
      else if (msg.type === 'chat_message') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !playerRole) return;

        const senderName = playerRole === 'P1' ? room.p1.name : (room.p2?.name || 'Player 2');
        const chatMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sender: playerRole,
          senderName,
          text: String(msg.text || '').slice(0, 150),
          timestamp: Date.now(),
          isQuickEmote: Boolean(msg.isQuickEmote),
        };

        broadcastToRoom(room, {
          type: 'chat_received',
          message: chatMsg,
        });
      }

      // 8. REMATCH
      else if (msg.type === 'request_rematch') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        room.rematchRequestedBy = playerId;
        broadcastToRoom(room, {
          type: 'rematch_requested',
          by: playerRole,
        }, ws);
      } else if (msg.type === 'accept_rematch') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const freshState = createInitialGameState();
        room.gameState = freshState;
        room.rematchRequestedBy = undefined;

        broadcastToRoom(room, {
          type: 'rematch_started',
          gameState: freshState,
        });
      }

      // 9. RESIGN
      else if (msg.type === 'resign') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !playerRole) return;

        const winner = playerRole === 'P1' ? 'P2' : 'P1';
        room.gameState.winner = winner;

        broadcastToRoom(room, {
          type: 'player_resigned',
          resignedBy: playerRole,
          winner,
          gameState: room.gameState,
        });
      }
    } catch {
      // JSON parse error ignored
    }
  });

  ws.on('close', () => {
    // Remove from matchmaking queue
    const qIdx = matchmakingQueue.findIndex((item) => item.ws === ws);
    if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

    // Notify room
    if (currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        if (room.p1.ws === ws) {
          room.p1.connected = false;
          broadcastToRoom(room, {
            type: 'opponent_disconnected',
            role: 'P1',
          }, ws);
        } else if (room.p2 && room.p2.ws === ws) {
          room.p2.connected = false;
          broadcastToRoom(room, {
            type: 'opponent_disconnected',
            role: 'P2',
          }, ws);
        }
      }
    }
  });
});

// Full-Stack Server Integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`12 Beads server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
