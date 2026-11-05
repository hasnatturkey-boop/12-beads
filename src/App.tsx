import React, { useState, useEffect, useRef } from 'react';
import {
  AIDifficulty,
  BoardTheme,
  ChatMessage,
  GameMode,
  GameSettings,
  GameState,
  Move,
  PlayerId,
  SoundStyle,
} from './types';
import {
  applyMove,
  createInitialGameState,
  endChainJumpTurn,
  getAllLegalMoves,
} from './game/engine';
import { getAIMove } from './game/ai';
import { sound } from './game/audio';
import {
  loadDailyChallenges,
  loadPlayerProfile,
  PlayerProfile,
  recordGameEvent,
  savePlayerProfile,
} from './game/challenges';
import { TitleScreen } from './components/TitleScreen';
import { ModeSelectModal } from './components/ModeSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { GameBoard, PendingRemoteMove } from './components/GameBoard';
import { InGameChat } from './components/InGameChat';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ChallengesModal } from './components/ChallengesModal';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { WaitingRoomModal } from './components/WaitingRoomModal';
import { CoinTossModal } from './components/CoinTossModal';

export default function App() {
  // Screen views: 'title' | 'game'
  const [currentScreen, setCurrentScreen] = useState<'title' | 'game'>('title');

  // Player profile state for Level and XP tracking
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => loadPlayerProfile());

  // Coin Toss Modal state
  const [isCoinTossOpen, setIsCoinTossOpen] = useState<boolean>(false);
  const [tossConfig, setTossConfig] = useState<{
    p1Name: string;
    p2Name: string;
    onComplete: (winnerIsP1: boolean, winnerName: string) => void;
  } | null>(null);

  // Modals state
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);
  const [isMatchmakingWaiting, setIsMatchmakingWaiting] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    soundVolume: 0.85,
    soundStyle: 'wood',
    aiDifficulty: 'normal',
    boardTheme: 'wood',
    playerName: 'Hasnat Champion',
  });

  // Game configuration
  const [gameMode, setGameMode] = useState<GameMode>('computer');
  const [userRole, setUserRole] = useState<PlayerId>('P1');
  const [opponentName, setOpponentName] = useState('Computer');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hintMove, setHintMove] = useState<Move | null>(null);

  // Online Multiplayer Room
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [initialUrlCode, setInitialUrlCode] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [rematchRequested, setRematchRequested] = useState<boolean>(false);

  // Pending move animation for opponent or computer
  const [pendingRemoteMove, setPendingRemoteMove] = useState<PendingRemoteMove | null>(null);

  // Paused game state
  const [hasPausedGame, setHasPausedGame] = useState<boolean>(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Daily challenges count
  const [completedChallengesCount, setCompletedChallengesCount] = useState(0);

  // Initialize and check URL query param
  useEffect(() => {
    // Sync sound engine with settings
    sound.enabled = settings.soundEnabled;
    sound.volume = settings.soundVolume;
    sound.style = settings.soundStyle;

    const data = loadDailyChallenges();
    const count = data.challenges.filter((c) => c.completed && !c.claimed).length;
    setCompletedChallengesCount(count);

    const profile = loadPlayerProfile();
    if (profile.name) {
      setSettings((prev) => ({ ...prev, playerName: profile.name }));
    }

    // Check URL parameters for direct room joins (e.g. ?room=GOTI-ABCD)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setInitialUrlCode(roomParam.toUpperCase());
      setIsModeSelectOpen(true);
    }
  }, []);

  // Update sound controller when settings change
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      sound.enabled = updated.soundEnabled;
      sound.volume = updated.soundVolume;
      sound.style = updated.soundStyle;
      if (newSettings.playerName) {
        const p = loadPlayerProfile();
        p.name = newSettings.playerName;
        savePlayerProfile(p);
      }
      return updated;
    });
  };

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    handleUpdateSettings({ soundEnabled: next });
    if (next) sound.playButtonClick();
  };

  // Helper to connect WebSocket
  const getWebSocket = (): Promise<WebSocket> => {
    return new Promise((resolve) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        wsRef.current = socket;
        resolve(socket);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch {}
      };

      socket.onclose = () => {
        wsRef.current = null;
      };
    });
  };

  // Server message dispatcher
  const handleServerMessage = (msg: {
    type: string;
    code?: string;
    role?: PlayerId;
    opponentName?: string;
    p1Name?: string;
    p2Name?: string;
    gameState?: GameState;
    move?: Move;
    by?: PlayerId;
    message?: ChatMessage;
    resignedBy?: PlayerId;
    winner?: PlayerId;
  }) => {
    switch (msg.type) {
      case 'room_created': {
        setOnlineRoomCode(msg.code || '');
        setUserRole('P1');
        setGameState(msg.gameState || createInitialGameState());
        setIsWaitingRoomOpen(true);
        setIsMatchmakingWaiting(false);
        break;
      }

      case 'room_joined':
      case 'match_found': {
        setOnlineRoomCode(msg.code || '');
        const role = msg.role || 'P2';
        setUserRole(role);
        const oppName = msg.opponentName || 'Online Opponent';
        setOpponentName(oppName);
        const initState = msg.gameState || createInitialGameState();
        setGameState(initState);
        setIsWaitingRoomOpen(false);
        setIsMatchmakingWaiting(false);
        setIsModeSelectOpen(false);
        setChatMessages([]);
        setUnreadChatCount(0);
        sound.playVictory();
        recordGameEvent({ type: 'multiplayer_played' });

        // Coin Toss between players before starting match
        setTossConfig({
          p1Name: role === 'P1' ? settings.playerName : oppName,
          p2Name: role === 'P2' ? settings.playerName : oppName,
          onComplete: () => {
            setIsCoinTossOpen(false);
            setCurrentScreen('game');
          },
        });
        setIsCoinTossOpen(true);
        break;
      }

      case 'opponent_joined': {
        const oppName = msg.opponentName || 'Friend';
        setOpponentName(oppName);
        if (msg.gameState) setGameState(msg.gameState);
        setIsWaitingRoomOpen(false);
        setIsModeSelectOpen(false);
        sound.playVictory();
        recordGameEvent({ type: 'multiplayer_played' });

        // Coin Toss between players before starting match
        setTossConfig({
          p1Name: settings.playerName,
          p2Name: oppName,
          onComplete: () => {
            setIsCoinTossOpen(false);
            setCurrentScreen('game');
          },
        });
        setIsCoinTossOpen(true);
        break;
      }

      case 'move_made': {
        if (msg.gameState && msg.move) {
          const move = msg.move;
          const isOpponentMove = msg.by !== userRole;
          const nextState = msg.gameState;

          if (isOpponentMove) {
            setPendingRemoteMove({
              move,
              isOpponent: true,
              onComplete: () => {
                setGameState(nextState);
                setPendingRemoteMove(null);
                if (nextState.winner) {
                  handleGameEnd(nextState.winner === userRole);
                }
              },
            });
          } else {
            setGameState(nextState);
            if (nextState.winner) {
              handleGameEnd(nextState.winner === userRole);
            }
          }
        }
        break;
      }

      case 'chain_jump_ended': {
        if (msg.gameState) {
          setGameState(msg.gameState);
        }
        break;
      }

      case 'chat_received': {
        if (msg.message) {
          setChatMessages((prev) => [...prev, msg.message!]);
          if (!isChatOpen && msg.message.sender !== userRole) {
            setUnreadChatCount((prev) => prev + 1);
            sound.playBeadSelect();
          }
        }
        break;
      }

      case 'rematch_requested': {
        setRematchRequested(true);
        sound.playBeadSelect();
        break;
      }

      case 'rematch_started': {
        if (msg.gameState) {
          setGameState(msg.gameState);
          setRematchRequested(false);
          sound.playVictory();
        }
        break;
      }

      case 'player_resigned': {
        if (msg.gameState) {
          setGameState(msg.gameState);
          handleGameEnd(msg.winner === userRole);
        }
        break;
      }

      case 'error': {
        alert(msg.message || 'Multiplayer error');
        break;
      }
    }
  };

  // Record outcome to leaderboard API & challenges
  const handleGameEnd = (isWin: boolean) => {
    setHasPausedGame(false);
    const captures =
      userRole === 'P1'
        ? 12 - gameState.p2BeadsCount
        : 12 - gameState.p1BeadsCount;

    recordGameEvent({
      type: 'game_finish',
      isWin,
      capturesCount: captures,
      aiDifficulty: settings.aiDifficulty,
    });

    // Submit to server leaderboard
    fetch('/api/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: settings.playerName,
        isWin,
        captures,
      }),
    }).catch(() => {});

    // Refresh player profile (awards +500 XP on win, +100 XP on loss) & challenges
    setPlayerProfile(loadPlayerProfile());
    const data = loadDailyChallenges();
    setCompletedChallengesCount(data.challenges.filter((c) => c.completed && !c.claimed).length);
  };

  // START COMPUTER GAME WITH COIN TOSS
  const handleStartComputerGame = (diff: AIDifficulty, chosenSide: PlayerId) => {
    setIsModeSelectOpen(false);
    handleUpdateSettings({ aiDifficulty: diff });
    const compName = `Computer (${diff.toUpperCase()})`;
    setOpponentName(compName);

    // Launch Coin Toss to determine who moves first
    setTossConfig({
      p1Name: settings.playerName,
      p2Name: compName,
      onComplete: (winnerIsP1) => {
        setIsCoinTossOpen(false);
        setHasPausedGame(false);
        setGameMode('computer');

        // Winner of toss gets first turn (P1).
        // If Player won toss -> Player is P1.
        // If Computer won toss -> Computer is P1 and Player is P2.
        // In both cases, board orientation renders user beads DOWN and computer beads UP!
        const assignedRole: PlayerId = winnerIsP1 ? 'P1' : 'P2';
        setUserRole(assignedRole);

        const initial = createInitialGameState();
        setGameState(initial);
        setHintMove(null);
        setCurrentScreen('game');

        // If Computer moves first (Player is P2), trigger AI turn
        if (assignedRole === 'P2') {
          triggerComputerTurn(initial, diff);
        }
      },
    });
    setIsCoinTossOpen(true);
  };

  // START LOCAL PASS & PLAY WITH COIN TOSS
  const handleStartLocalPass = () => {
    setIsModeSelectOpen(false);

    // Launch Coin Toss between Player 1 and Player 2
    setTossConfig({
      p1Name: 'Player 1 (Gold)',
      p2Name: 'Player 2 (Jade)',
      onComplete: (winnerIsP1) => {
        setIsCoinTossOpen(false);
        setHasPausedGame(false);
        setGameMode('local_pass');
        setUserRole('P1');
        setOpponentName('Player 2 (Local)');

        const initial = createInitialGameState();
        if (!winnerIsP1) {
          // If Player 2 won the toss, Player 2 starts
          initial.turn = 'P2';
        }
        setGameState(initial);
        setHintMove(null);
        setCurrentScreen('game');
      },
    });
    setIsCoinTossOpen(true);
  };

  // ONLINE: CREATE ROOM
  const handleCreateOnlineRoom = async () => {
    setGameMode('friend_room');
    const socket = await getWebSocket();
    socket.send(
      JSON.stringify({
        type: 'create_room',
        name: settings.playerName,
      })
    );
  };

  // ONLINE: JOIN ROOM
  const handleJoinOnlineRoom = async (code: string) => {
    setGameMode('friend_room');
    const socket = await getWebSocket();
    socket.send(
      JSON.stringify({
        type: 'join_room',
        code,
        name: settings.playerName,
      })
    );
  };

  // ONLINE: MATCHMAKING
  const handleStartMatchmaking = async () => {
    setGameMode('matchmaking');
    setIsMatchmakingWaiting(true);
    setIsWaitingRoomOpen(true);
    const socket = await getWebSocket();
    socket.send(
      JSON.stringify({
        type: 'join_matchmaking',
        name: settings.playerName,
      })
    );
  };

  const handleCloseWaitingRoom = () => {
    sound.playButtonClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel_matchmaking' }));
    }
    setIsWaitingRoomOpen(false);
    setIsMatchmakingWaiting(false);
    setIsModeSelectOpen(false);
    setCurrentScreen('title');
  };

  const handleBackToMenu = () => {
    sound.playButtonClick();
    // Pause match if game is still active
    if (!gameState.winner) {
      setHasPausedGame(true);
    }
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAiThinking(false);
    setCurrentScreen('title');
  };

  const handleResumeGame = () => {
    sound.playButtonClick();
    setIsModeSelectOpen(false);
    setCurrentScreen('game');

    // If it was computer's turn when paused, resume computer thought
    if (gameMode === 'computer' && gameState.turn !== userRole && !gameState.winner) {
      triggerComputerTurn(gameState, settings.aiDifficulty);
    }
  };

  // COMPUTER TURN LOGIC
  const triggerComputerTurn = (currentState: GameState, diff: AIDifficulty) => {
    setIsAiThinking(true);
    const aiPlayer: PlayerId = userRole === 'P1' ? 'P2' : 'P1';

    // Delay before AI starts moving (simulating realistic thought)
    const delay = diff === 'hard' ? 550 : diff === 'normal' ? 450 : 350;

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    aiTimeoutRef.current = setTimeout(() => {
      aiTimeoutRef.current = null;
      const bestMove = getAIMove(
        currentState.board,
        aiPlayer,
        diff,
        currentState.chainJumpingPos
      );

      if (!bestMove) {
        // AI has no moves, player wins!
        setGameState((prev) => ({ ...prev, winner: userRole }));
        setIsAiThinking(false);
        handleGameEnd(true);
        return;
      }

      // Calculate next state
      const nextState = applyMove(currentState, bestMove);

      // Trigger smooth, slow animation of the Computer's bead gliding down from the top
      setPendingRemoteMove({
        move: bestMove,
        isOpponent: true,
        onComplete: () => {
          setGameState(nextState);
          setIsAiThinking(false);
          setPendingRemoteMove(null);

          // Check if AI gets consecutive chain jumps
          if (nextState.isChainJumping && nextState.chainJumpingPos !== null) {
            // Brief pause before AI continues next chain jump
            aiTimeoutRef.current = setTimeout(() => {
              aiTimeoutRef.current = null;
              triggerComputerTurn(nextState, diff);
            }, 320);
            return;
          }

          // Check win/loss
          if (nextState.winner) {
            handleGameEnd(nextState.winner === userRole);
          }
        },
      });
    }, delay);
  };

  // PLAYER EXECUTES A MOVE
  const handleMakeMove = (move: Move) => {
    setHintMove(null);

    if (gameMode === 'friend_room' || gameMode === 'matchmaking') {
      // Remote multiplayer move: send to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'make_move',
            move,
          })
        );
      }
      return;
    }

    // Local execution (vs Computer or Pass & Play)
    const nextState = applyMove(gameState, move);

    if (move.isCapture) {
      sound.playBeadCapture(false);
      recordGameEvent({ type: 'capture', capturesCount: 1 });
    } else {
      sound.playBeadMove();
    }

    setGameState(nextState);

    // Check challenge progress
    if (nextState.isChainJumping) {
      recordGameEvent({ type: 'chain_jump' });
    }

    if (nextState.winner) {
      handleGameEnd(nextState.winner === userRole);
      return;
    }

    // If vs Computer and turn switched to Computer
    if (gameMode === 'computer' && !nextState.isChainJumping) {
      triggerComputerTurn(nextState, settings.aiDifficulty);
    }
  };

  // END CHAIN JUMP EARLY
  const handleEndChainJump = () => {
    if (gameMode === 'friend_room' || gameMode === 'matchmaking') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'end_chain_jump' }));
      }
      return;
    }

    const nextState = endChainJumpTurn(gameState);
    setGameState(nextState);

    if (gameMode === 'computer' && !nextState.winner) {
      triggerComputerTurn(nextState, settings.aiDifficulty);
    }
  };

  // RESIGN
  const handleResign = () => {
    setHasPausedGame(false);
    if (gameMode === 'friend_room' || gameMode === 'matchmaking') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resign' }));
      }
      return;
    }

    const winner: PlayerId = userRole === 'P1' ? 'P2' : 'P1';
    const nextState = { ...gameState, winner };
    setGameState(nextState);
    handleGameEnd(false);
  };

  // GET MOVE HINT (in Computer mode)
  const handleHint = () => {
    if (gameMode !== 'computer' || !isMyTurn() || isAiThinking) return;
    const best = getAIMove(gameState.board, userRole, 'hard', gameState.chainJumpingPos);
    if (best) {
      setHintMove(best);
      sound.playBeadSelect();
    }
  };

  const isMyTurn = () => {
    if (gameMode === 'local_pass') return true;
    return gameState.turn === userRole;
  };

  // IN-GAME CHAT SEND
  const handleSendMessage = (text: string, isQuickEmote = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          text,
          isQuickEmote,
        })
      );
    }
  };

  // REMATCH
  const handleRematch = () => {
    if (gameMode === 'friend_room' || gameMode === 'matchmaking') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (rematchRequested) {
          wsRef.current.send(JSON.stringify({ type: 'accept_rematch' }));
        } else {
          wsRef.current.send(JSON.stringify({ type: 'request_rematch' }));
        }
      }
      return;
    }

    // Local / Computer rematch
    const fresh = createInitialGameState();
    setGameState(fresh);
    setHintMove(null);
    sound.playVictory();

    if (gameMode === 'computer' && userRole === 'P2') {
      triggerComputerTurn(fresh, settings.aiDifficulty);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-stone-950 font-sans text-stone-100 overflow-x-hidden">
      {/* SCREEN 1: TITLE SCREEN */}
      {currentScreen === 'title' ? (
        <TitleScreen
          onStartGame={() => setIsModeSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenChallenges={() => setIsChallengesOpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
          settings={settings}
          onToggleSound={handleToggleSound}
          completedChallengesCount={completedChallengesCount}
          hasPausedGame={hasPausedGame}
          onResumeGame={handleResumeGame}
          profile={playerProfile}
        />
      ) : (
        /* SCREEN 2: GAME BOARD */
        <GameBoard
          gameState={gameState}
          onMakeMove={handleMakeMove}
          onEndChainJump={handleEndChainJump}
          onResign={handleResign}
          onHint={handleHint}
          hintMove={hintMove}
          mode={gameMode}
          userRole={userRole}
          opponentName={opponentName}
          userName={settings.playerName}
          isAiThinking={isAiThinking}
          settings={settings}
          onToggleSound={handleToggleSound}
          onToggleChat={
            gameMode === 'friend_room' || gameMode === 'matchmaking'
              ? () => {
                  setIsChatOpen(true);
                  setUnreadChatCount(0);
                }
              : undefined
          }
          unreadChatCount={unreadChatCount}
          onBackToMenu={handleBackToMenu}
          pendingRemoteMove={pendingRemoteMove}
        />
      )}

      {/* MODE SELECT MODAL */}
      <ModeSelectModal
        isOpen={isModeSelectOpen}
        onClose={() => setIsModeSelectOpen(false)}
        onStartComputerGame={handleStartComputerGame}
        onCreateOnlineRoom={handleCreateOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
        onStartMatchmaking={handleStartMatchmaking}
        onStartLocalPass={handleStartLocalPass}
        initialRoomCode={initialUrlCode}
        hasPausedGame={hasPausedGame && gameMode === 'computer'}
        onResumeGame={handleResumeGame}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* LEADERBOARD MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* DAILY CHALLENGES MODAL */}
      <ChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => {
          setIsChallengesOpen(false);
          const data = loadDailyChallenges();
          setCompletedChallengesCount(
            data.challenges.filter((c) => c.completed && !c.claimed).length
          );
          setPlayerProfile(loadPlayerProfile());
        }}
      />

      {/* RULES MODAL */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* WAITING ROOM MODAL */}
      <WaitingRoomModal
        isOpen={isWaitingRoomOpen}
        roomCode={onlineRoomCode}
        isMatchmaking={isMatchmakingWaiting}
        onCancel={handleCloseWaitingRoom}
      />

      {/* IN-GAME CHAT MODAL */}
      <InGameChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUserRole={userRole}
        opponentName={opponentName}
      />

      {/* COIN TOSS MODAL (Decides first move before match start) */}
      {tossConfig && (
        <CoinTossModal
          isOpen={isCoinTossOpen}
          player1Name={tossConfig.p1Name}
          player2Name={tossConfig.p2Name}
          onTossComplete={(winnerIsP1, winnerName) => {
            tossConfig.onComplete(winnerIsP1, winnerName);
          }}
        />
      )}

      {/* GAME OVER MODAL */}
      <GameOverModal
        isOpen={Boolean(gameState.winner)}
        gameState={gameState}
        userRole={userRole}
        mode={gameMode}
        opponentName={opponentName}
        userName={settings.playerName}
        onRematch={handleRematch}
        onReturnToMenu={() => {
          setHasPausedGame(false);
          setCurrentScreen('title');
          setGameState(createInitialGameState());
        }}
        rematchRequested={rematchRequested}
      />
    </div>
  );
}
