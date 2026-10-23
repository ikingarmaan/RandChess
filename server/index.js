import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  perMessageDeflate: false,
  allowUpgrades: true,
  pingInterval: 10000,
  pingTimeout: 5000,
  httpCompression: false
});

const PORT = process.env.PORT || 3000;

// Active rooms storage: roomId -> { chess, whitePlayer, blackPlayer, whitePlayerId, blackPlayerId, timeControl, timers, startedAt, status }
const rooms = new Map();

// Active Ludo multiplayer rooms storage
const ludoRooms = new Map();

// Quick match matchmaking for Ludo
let ludoQuickMatchRoom = null;
let ludoQuickMatchTimer = null;

const LUDO_SAFE_TRACK = [0, 8, 13, 21, 26, 34, 39, 47];

const LUDO_COLOR_CONFIG = {
  2: [
    { name: 'Red', hex: '#ef4444', startIdx: 0 },
    { name: 'Yellow', hex: '#facc15', startIdx: 26 }
  ],
  3: [
    { name: 'Red', hex: '#ef4444', startIdx: 0 },
    { name: 'Green', hex: '#22c55e', startIdx: 13 },
    { name: 'Yellow', hex: '#facc15', startIdx: 26 }
  ],
  4: [
    { name: 'Red', hex: '#ef4444', startIdx: 0 },
    { name: 'Green', hex: '#22c55e', startIdx: 13 },
    { name: 'Yellow', hex: '#facc15', startIdx: 26 },
    { name: 'Orange', hex: '#f97316', startIdx: 39 }
  ]
};

// Dynamically updates player seats and colors in waiting room
function updateLudoWaitingRoomSeats(room) {
  const count = Math.min(4, Math.max(2, room.players.length));
  const config = LUDO_COLOR_CONFIG[count];
  room.players.forEach((p, idx) => {
    p.seatIndex = idx;
    p.color = config[idx].name.toLowerCase();
    p.colorHex = config[idx].hex;
  });
}

function getLegalLudoTokens(tokens, dice, playerIdx) {
  const legal = [];
  const playerTokens = tokens[playerIdx] || [];
  for (let t = 0; t < 4; t++) {
    const step = playerTokens[t];
    if (step === -1) {
      if (dice === 6) legal.push(t);
    } else if (step >= 0 && step < 56) {
      if (step + dice <= 56) legal.push(t);
    }
  }
  return legal;
}

function checkLudoCapture(room, movingPlayerIdx, newStep) {
  if (newStep >= 51) return null;

  const config = LUDO_COLOR_CONFIG[room.maxPlayers] || LUDO_COLOR_CONFIG[4];
  const movingStart = config[movingPlayerIdx].startIdx;
  const globalTrackIdx = (movingStart + newStep) % 52;

  if (LUDO_SAFE_TRACK.includes(globalTrackIdx)) return null;

  for (let p = 0; p < room.players.length; p++) {
    if (p === movingPlayerIdx) continue;
    const oppStart = config[p].startIdx;
    for (let t = 0; t < 4; t++) {
      const oppStep = room.tokens[p][t];
      if (oppStep >= 0 && oppStep < 51) {
        const oppGlobalIdx = (oppStart + oppStep) % 52;
        if (oppGlobalIdx === globalTrackIdx) {
          room.tokens[p][t] = -1;
          return { capturedPlayer: p, capturedToken: t };
        }
      }
    }
  }
  return null;
}

function advanceLudoTurn(room) {
  let next = (room.turnIndex + 1) % room.players.length;
  let attempts = 0;
  while (attempts < room.players.length && room.tokens[next].every(st => st === 56)) {
    next = (next + 1) % room.players.length;
    attempts++;
  }
  room.turnIndex = next;
  room.dice = null;
  room.diceRolled = false;
  room.consecutiveSixes = 0;
}

function pickBestBotToken(room, botIdx, legalTokens, dice) {
  if (legalTokens.length === 1) return legalTokens[0];

  const config = LUDO_COLOR_CONFIG[room.maxPlayers] || LUDO_COLOR_CONFIG[4];
  const myStart = config[botIdx].startIdx;

  let bestToken = legalTokens[0];
  let bestScore = -Infinity;

  for (const t of legalTokens) {
    const currentStep = room.tokens[botIdx][t];
    let score = 0;

    if (currentStep === -1) {
      score += 70;
    } else {
      const nextStep = currentStep + dice;
      if (nextStep === 56) {
        score += 150;
      } else if (nextStep >= 51) {
        score += 85;
      } else {
        const nextGlobalIdx = (myStart + nextStep) % 52;
        if (LUDO_SAFE_TRACK.includes(nextGlobalIdx)) {
          score += 65;
        }

        for (let p = 0; p < room.players.length; p++) {
          if (p === botIdx) continue;
          const oppStart = config[p].startIdx;
          for (let ot = 0; ot < 4; ot++) {
            const oppStep = room.tokens[p][ot];
            if (oppStep >= 0 && oppStep < 51) {
              const oppGlobal = (oppStart + oppStep) % 52;
              if (oppGlobal === nextGlobalIdx) {
                score += 120;
              }
            }
          }
        }
        score += nextStep * 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestToken = t;
    }
  }

  return bestToken;
}

function triggerServerBotTurn(room) {
  if (room.status !== 'playing') return;
  const active = room.players[room.turnIndex];
  if (!active || !active.isBot) return;

  setTimeout(() => {
    if (room.status !== 'playing') return;
    const currentActive = room.players[room.turnIndex];
    if (!currentActive || !currentActive.isBot) return;

    const dice = 1 + Math.floor(Math.random() * 6);
    room.dice = dice;
    room.diceRolled = true;

    if (dice === 6) {
      room.consecutiveSixes = (room.consecutiveSixes || 0) + 1;
    } else {
      room.consecutiveSixes = 0;
    }

    if (room.consecutiveSixes >= 3) {
      room.consecutiveSixes = 0;
      room.dice = null;
      room.diceRolled = false;
      advanceLudoTurn(room);
      io.to(room.id).emit('ludo_dice_rolled', { dice, legalTokens: [], forfeit: true });
      io.to(room.id).emit('ludo_state_update', room);
      if (room.players[room.turnIndex]?.isBot) {
        triggerServerBotTurn(room);
      }
      return;
    }

    const legalTokens = getLegalLudoTokens(room.tokens, dice, room.turnIndex);
    io.to(room.id).emit('ludo_dice_rolled', { dice, legalTokens, turnIndex: room.turnIndex });

    if (legalTokens.length === 0) {
      setTimeout(() => {
        advanceLudoTurn(room);
        io.to(room.id).emit('ludo_state_update', room);
        if (room.players[room.turnIndex]?.isBot) {
          triggerServerBotTurn(room);
        }
      }, 1000);
      return;
    }

    const chosenToken = pickBestBotToken(room, room.turnIndex, legalTokens, dice);

    setTimeout(() => {
      const currentStep = room.tokens[room.turnIndex][chosenToken];
      const newStep = currentStep === -1 ? 0 : currentStep + dice;
      room.tokens[room.turnIndex][chosenToken] = newStep;

      let extraTurn = dice === 6;
      const captured = checkLudoCapture(room, room.turnIndex, newStep);
      if (captured) extraTurn = true;

      if (newStep === 56) {
        extraTurn = true;
        if (room.tokens[room.turnIndex].every(st => st === 56)) {
          if (!room.rankings.includes(room.turnIndex)) room.rankings.push(room.turnIndex);
          if (room.winner === null) room.winner = room.turnIndex;
          if (room.rankings.length >= room.players.length - 1) room.status = 'ended';
        }
      }

      room.dice = null;
      room.diceRolled = false;

      if (!extraTurn) {
        advanceLudoTurn(room);
      }

      io.to(room.id).emit('ludo_state_update', room);

      if (room.status === 'playing' && room.players[room.turnIndex]?.isBot) {
        triggerServerBotTurn(room);
      }
    }, 700);
  }, 650);
}

// Quick match queue: { socketId, socket, playerId, timeControl, preferredColor }
let quickMatchQueue = null;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  // 1. Instant Quick Match (1-click matchmaking)
  socket.on('find_quick_match', ({ timeControl = 300, preferredColor = 'random', playerId } = {}, callback) => {
    // If someone is already waiting in queue and not the exact same player
    if (quickMatchQueue && quickMatchQueue.socketId !== socket.id && (!playerId || quickMatchQueue.playerId !== playerId)) {
      const opponent = quickMatchQueue;
      quickMatchQueue = null;

      // Verify opponent is still connected
      if (opponent.socket.connected) {
        let roomId = generateRoomCode();
        while (rooms.has(roomId)) {
          roomId = generateRoomCode();
        }

        let hostColor = 'w';
        if (preferredColor === 'b') hostColor = 'b';
        else if (preferredColor === 'w') hostColor = 'w';
        else if (opponent.preferredColor === 'w') hostColor = 'b';
        else if (opponent.preferredColor === 'b') hostColor = 'w';
        else hostColor = Math.random() < 0.5 ? 'w' : 'b';

        const chosenTC = timeControl !== undefined ? timeControl : (opponent.timeControl !== undefined ? opponent.timeControl : 300);
        const roomData = {
          id: roomId,
          chess: new Chess(),
          timeControl: chosenTC,
          whitePlayer: hostColor === 'w' ? socket.id : opponent.socketId,
          blackPlayer: hostColor === 'b' ? socket.id : opponent.socketId,
          whitePlayerId: hostColor === 'w' ? playerId : opponent.playerId,
          blackPlayerId: hostColor === 'b' ? playerId : opponent.playerId,
          timers: {
            w: chosenTC,
            b: chosenTC,
            lastTurnTimestamp: Date.now()
          },
          status: 'playing',
          createdAt: Date.now()
        };

        rooms.set(roomId, roomData);
        socket.join(roomId);
        opponent.socket.join(roomId);
        socket.roomId = roomId;
        opponent.socket.roomId = roomId;

        if (callback) {
          callback({
            success: true,
            matched: true,
            roomId,
            color: hostColor,
            timeControl: roomData.timeControl
          });
        }

        // Notify both players immediately with exact identities
        io.to(roomId).emit('game_started', {
          roomId,
          whitePlayer: roomData.whitePlayer,
          whitePlayerId: roomData.whitePlayerId,
          blackPlayer: roomData.blackPlayer,
          blackPlayerId: roomData.blackPlayerId,
          timeControl: roomData.timeControl,
          fen: roomData.chess.fen()
        });
        return;
      }
    }

    // Otherwise place player in waiting queue
    quickMatchQueue = {
      socketId: socket.id,
      socket,
      playerId,
      timeControl,
      preferredColor
    };

    if (callback) {
      callback({ success: true, matched: false, waiting: true });
    }
  });

  socket.on('cancel_quick_match', (callback) => {
    if (quickMatchQueue && quickMatchQueue.socketId === socket.id) {
      quickMatchQueue = null;
    }
    if (callback) callback({ success: true });
  });

  // 2. Create Private Room
  socket.on('create_room', ({ timeControl = 300, preferredColor = 'random', playerId }, callback) => {
    let roomId = generateRoomCode();
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    let hostColor = 'w';
    if (preferredColor === 'b') hostColor = 'b';
    else if (preferredColor === 'random') hostColor = Math.random() < 0.5 ? 'w' : 'b';

    const roomData = {
      id: roomId,
      chess: new Chess(),
      timeControl,
      whitePlayer: hostColor === 'w' ? socket.id : null,
      blackPlayer: hostColor === 'b' ? socket.id : null,
      whitePlayerId: hostColor === 'w' ? playerId : null,
      blackPlayerId: hostColor === 'b' ? playerId : null,
      hostId: socket.id,
      hostPlayerId: playerId,
      timers: {
        w: timeControl,
        b: timeControl,
        lastTurnTimestamp: Date.now()
      },
      status: 'waiting',
      createdAt: Date.now()
    };

    rooms.set(roomId, roomData);
    socket.join(roomId);
    socket.roomId = roomId;

    if (callback) {
      callback({
        success: true,
        roomId,
        color: hostColor,
        timeControl
      });
    }
  });

  // 3. Join Private Room
  socket.on('join_room', ({ roomId, playerId }, callback) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found. Check code.' });
      return;
    }

    // Check if original host is reconnecting to waiting room
    if (room.status === 'waiting' && playerId && room.hostPlayerId === playerId) {
      socket.join(cleanRoomId);
      socket.roomId = cleanRoomId;
      if (room.whitePlayerId === playerId) room.whitePlayer = socket.id;
      if (room.blackPlayerId === playerId) room.blackPlayer = socket.id;
      if (callback) {
        callback({
          success: true,
          roomId: cleanRoomId,
          color: room.whitePlayerId === playerId ? 'w' : 'b',
          timeControl: room.timeControl,
          waiting: true
        });
      }
      return;
    }

    // If game already playing, check if existing player is reconnecting
    if (room.status === 'playing') {
      let reconnectedColor = null;
      if (playerId && room.whitePlayerId === playerId) {
        room.whitePlayer = socket.id;
        reconnectedColor = 'w';
      } else if (playerId && room.blackPlayerId === playerId) {
        room.blackPlayer = socket.id;
        reconnectedColor = 'b';
      } else if (room.whitePlayer === socket.id) {
        reconnectedColor = 'w';
      } else if (room.blackPlayer === socket.id) {
        reconnectedColor = 'b';
      }

      if (reconnectedColor) {
        socket.join(cleanRoomId);
        socket.roomId = cleanRoomId;
        if (callback) {
          callback({
            success: true,
            roomId: cleanRoomId,
            color: reconnectedColor,
            timeControl: room.timeControl,
            fen: room.chess.fen()
          });
        }
        return;
      }

      if (callback) callback({ success: false, error: 'Room is already full.' });
      return;
    }

    // Room is waiting for an opponent to join
    let playerColor = 'w';
    if (!room.whitePlayer && !room.whitePlayerId) {
      room.whitePlayer = socket.id;
      room.whitePlayerId = playerId;
      playerColor = 'w';
    } else if (!room.blackPlayer && !room.blackPlayerId) {
      room.blackPlayer = socket.id;
      room.blackPlayerId = playerId;
      playerColor = 'b';
    } else {
      if (callback) callback({ success: false, error: 'Room is already full.' });
      return;
    }

    room.status = 'playing';
    room.timers.lastTurnTimestamp = Date.now();
    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;

    if (callback) {
      callback({
        success: true,
        roomId: cleanRoomId,
        color: playerColor,
        timeControl: room.timeControl,
        fen: room.chess.fen()
      });
    }

    // Notify all players in room that match is ready to start
    io.to(cleanRoomId).emit('game_started', {
      roomId: cleanRoomId,
      whitePlayer: room.whitePlayer,
      whitePlayerId: room.whitePlayerId,
      blackPlayer: room.blackPlayer,
      blackPlayerId: room.blackPlayerId,
      timeControl: room.timeControl,
      fen: room.chess.fen()
    });
  });

  // 4. Make Move (Ultra-low latency direct broadcast)
  socket.on('make_move', ({ roomId, move, playerId }, callback) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    const currentTurn = room.chess.turn();
    const isWhiteTurn = currentTurn === 'w';
    const playerSocketId = isWhiteTurn ? room.whitePlayer : room.blackPlayer;
    const expectedPlayerId = isWhiteTurn ? room.whitePlayerId : room.blackPlayerId;

    // Verify turn by socket id or persistent player id
    const isAuthorized = socket.id === playerSocketId || (playerId && playerId === expectedPlayerId);
    if (!isAuthorized) {
      if (callback) callback({ success: false, error: 'Not your turn.' });
      return;
    }

    // Refresh socket association if reconnected
    if (socket.id !== playerSocketId) {
      if (isWhiteTurn) room.whitePlayer = socket.id;
      else room.blackPlayer = socket.id;
      socket.join(cleanRoomId);
      socket.roomId = cleanRoomId;
    }

    try {
      const movePayload = typeof move === 'string'
        ? move
        : {
            from: move.from,
            to: move.to,
            promotion: move.promotion || undefined
          };

      const result = room.chess.move(movePayload);
      if (!result) {
        if (callback) callback({ success: false, error: 'Invalid move' });
        return;
      }

      // Update timer deduction if game is timed
      if (room.timeControl !== null && room.timeControl !== undefined) {
        const now = Date.now();
        const elapsed = Math.floor((now - room.timers.lastTurnTimestamp) / 1000);
        room.timers[currentTurn] = Math.max(0, (room.timers[currentTurn] ?? room.timeControl) - elapsed);
        room.timers.lastTurnTimestamp = now;
      }

      const isGameOver = room.chess.isGameOver();
      let gameOverInfo = null;
      if (isGameOver) {
        if (room.chess.isCheckmate()) {
          gameOverInfo = { type: 'checkmate', winner: currentTurn, reason: 'Checkmate' };
        } else if (room.chess.isDraw()) {
          gameOverInfo = { type: 'draw', winner: null, reason: 'Draw' };
        }
      } else if (room.timeControl !== null && room.timeControl !== undefined && room.timers[currentTurn] <= 0) {
        gameOverInfo = {
          type: 'timeout',
          winner: currentTurn === 'w' ? 'b' : 'w',
          reason: `${currentTurn === 'w' ? 'White' : 'Black'} ran out of time`
        };
      }

      // Ensure socket is in room before emitting
      socket.join(cleanRoomId);

      // Fast uncompressed broadcast to opponent immediately
      socket.to(cleanRoomId).emit('opponent_move', {
        move: result,
        fen: room.chess.fen(),
        timers: room.timers,
        gameOver: gameOverInfo
      });

      if (callback) {
        callback({
          success: true,
          fen: room.chess.fen(),
          timers: room.timers,
          gameOver: gameOverInfo
        });
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // 5. Resign
  socket.on('resign', ({ roomId, playerId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;
    const isWhite = socket.id === room.whitePlayer || (playerId && playerId === room.whitePlayerId);
    const resigningColor = isWhite ? 'w' : 'b';
    const winnerColor = resigningColor === 'w' ? 'b' : 'w';

    io.to(cleanRoomId).emit('game_over', {
      type: 'resignation',
      winner: winnerColor,
      reason: `${resigningColor === 'w' ? 'White' : 'Black'} resigned`
    });
  });

  // 6. Draw Negotiation
  socket.on('offer_draw', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    socket.to(cleanRoomId).emit('draw_offered');
  });

  socket.on('decline_draw', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    socket.to(cleanRoomId).emit('draw_declined');
  });

  socket.on('accept_draw', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    io.to(cleanRoomId).emit('game_over', {
      type: 'draw',
      winner: null,
      reason: 'Draw agreed by mutual consent'
    });
  });

  // 7. Rematch Negotiation
  socket.on('offer_rematch', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    socket.to(cleanRoomId).emit('rematch_offered');
  });

  socket.on('decline_rematch', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    socket.to(cleanRoomId).emit('rematch_declined');
  });

  socket.on('accept_rematch', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;
    // Swap colors for rematch
    const prevWhite = room.whitePlayer;
    const prevWhiteId = room.whitePlayerId;
    room.whitePlayer = room.blackPlayer;
    room.whitePlayerId = room.blackPlayerId;
    room.blackPlayer = prevWhite;
    room.blackPlayerId = prevWhiteId;
    room.chess = new Chess();
    room.timers = {
      w: room.timeControl,
      b: room.timeControl,
      lastTurnTimestamp: Date.now()
    };
    room.status = 'playing';

    io.to(cleanRoomId).emit('game_started', {
      roomId: cleanRoomId,
      whitePlayer: room.whitePlayer,
      whitePlayerId: room.whitePlayerId,
      blackPlayer: room.blackPlayer,
      blackPlayerId: room.blackPlayerId,
      timeControl: room.timeControl,
      fen: room.chess.fen()
    });
  });

  // 8. Leave / Cancel Room
  socket.on('leave_room', ({ roomId } = {}) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    if (cleanRoomId && rooms.has(cleanRoomId)) {
      const room = rooms.get(cleanRoomId);
      socket.leave(cleanRoomId);
      if (room.status === 'waiting') {
        rooms.delete(cleanRoomId);
      } else {
        socket.to(cleanRoomId).emit('opponent_disconnected');
        rooms.delete(cleanRoomId);
      }
    }
  });

  // 9. Handle Disconnect with Grace Period
  socket.on('disconnect', () => {
    if (quickMatchQueue && quickMatchQueue.socketId === socket.id) {
      quickMatchQueue = null;
    }

    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.status === 'waiting') {
        // DO NOT delete waiting room instantly!
        // When a user on mobile copies the code or switches apps, OS temporarily suspends websockets.
        // Keep waiting rooms alive for 5 minutes.
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom && currentRoom.status === 'waiting') {
            const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
            if (!socketsInRoom || socketsInRoom.size === 0) {
              rooms.delete(roomId);
            }
          }
        }, 5 * 60 * 1000);
      } else {
        socket.to(roomId).emit('opponent_connection_status', { connected: false });
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom && (currentRoom.whitePlayer === socket.id || currentRoom.blackPlayer === socket.id)) {
            const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
            if (!socketsInRoom || socketsInRoom.size <= 1) {
              socket.to(roomId).emit('opponent_disconnected');
              rooms.delete(roomId);
            }
          }
        }, 30000);
      }
    }

    // Ludo room disconnect handler
    const ludoRoomId = socket.ludoRoomId;
    if (ludoRoomId && ludoRooms.has(ludoRoomId)) {
      const ludoRoom = ludoRooms.get(ludoRoomId);
      const playerIdx = ludoRoom.players.findIndex(p => p.id === socket.id);
      if (playerIdx !== -1) {
        if (ludoRoom.status === 'waiting') {
          // If in waiting room, remove player or clean up if empty
          ludoRoom.players = ludoRoom.players.filter(p => p.id !== socket.id);
          if (ludoRoom.players.length === 0) {
            ludoRooms.delete(ludoRoomId);
          } else {
            io.to(ludoRoomId).emit('ludo_state_update', ludoRoom);
          }
        } else {
          // If match is active, convert disconnected human player into an AI bot
          ludoRoom.players[playerIdx].connected = false;
          ludoRoom.players[playerIdx].isBot = true;
          io.to(ludoRoomId).emit('ludo_state_update', ludoRoom);
          if (ludoRoom.turnIndex === playerIdx) {
            triggerServerBotTurn(ludoRoom);
          }
        }
      }
    }
  });

  // ==========================================
  // LUDO MULTIPLAYER SOCKET PROTOCOL
  // ==========================================

  // 1. Create Ludo Room
  socket.on('ludo_create_room', ({ maxPlayers = 4, timeControl = 30, playerId, playerName }, callback) => {
    const validCount = Math.min(4, Math.max(2, Number(maxPlayers) || 4));
    let roomId = 'LUDO-' + generateRoomCode().substring(0, 4);
    while (ludoRooms.has(roomId)) {
      roomId = 'LUDO-' + generateRoomCode().substring(0, 4);
    }

    const config = LUDO_COLOR_CONFIG[validCount];
    const initialTokens = Array.from({ length: validCount }, () => [-1, -1, -1, -1]);
    const players = [
      {
        id: socket.id,
        playerId,
        name: playerName || 'Player 1 (Host)',
        seatIndex: 0,
        color: config[0].name.toLowerCase(),
        colorHex: config[0].hex,
        isBot: false,
        connected: true
      }
    ];

    const roomData = {
      id: roomId,
      maxPlayers: validCount,
      timeControl: Number(timeControl),
      players,
      hostId: socket.id,
      hostPlayerId: playerId,
      tokens: initialTokens,
      turnIndex: 0,
      dice: null,
      diceRolled: false,
      consecutiveSixes: 0,
      status: 'waiting',
      winner: null,
      rankings: [],
      createdAt: Date.now()
    };

    ludoRooms.set(roomId, roomData);
    socket.join(roomId);
    socket.ludoRoomId = roomId;

    if (callback) {
      callback({
        success: true,
        roomId,
        seatIndex: 0,
        room: roomData
      });
    }
  });

  // 2. Join Ludo Room (Dynamic seat adaptation)
  socket.on('ludo_join_room', ({ roomId, playerId, playerName }, callback) => {
    const cleanId = (roomId || '').trim().toUpperCase();
    const room = ludoRooms.get(cleanId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Ludo room not found. Check code.' });
      return;
    }

    // Reconnection check
    const existingIndex = room.players.findIndex(p => p.playerId === playerId);
    if (existingIndex !== -1) {
      room.players[existingIndex].id = socket.id;
      room.players[existingIndex].connected = true;
      socket.join(cleanId);
      socket.ludoRoomId = cleanId;
      if (callback) callback({ success: true, roomId: cleanId, seatIndex: existingIndex, room });
      io.to(cleanId).emit('ludo_state_update', room);
      return;
    }

    if (room.status !== 'waiting') {
      if (callback) callback({ success: false, error: 'Match already in progress.' });
      return;
    }

    if (room.players.length >= 4) {
      if (callback) callback({ success: false, error: 'Room is already full.' });
      return;
    }

    const newSeatIndex = room.players.length;
    const newPlayer = {
      id: socket.id,
      playerId,
      name: playerName || `Player ${newSeatIndex + 1}`,
      seatIndex: newSeatIndex,
      color: 'yellow',
      colorHex: '#facc15',
      isBot: false,
      connected: true
    };

    room.players.push(newPlayer);
    socket.join(cleanId);
    socket.ludoRoomId = cleanId;

    // Dynamically update seats and colors according to current count
    updateLudoWaitingRoomSeats(room);

    // Auto-launch if full (4 players)
    if (room.players.length === 4) {
      room.maxPlayers = 4;
      room.tokens = Array.from({ length: 4 }, () => [-1, -1, -1, -1]);
      room.status = 'playing';
      room.turnIndex = 0;
    }

    if (callback) {
      callback({
        success: true,
        roomId: cleanId,
        seatIndex: newSeatIndex,
        room
      });
    }

    io.to(cleanId).emit('ludo_state_update', room);
  });

  // 3. Start Ludo Match with Current Players (+ Optional Bots)
  // Dynamically switches to 2, 3, or 4 players based on lobby count
  socket.on('ludo_start_match', ({ roomId, fillBots = false, targetCount }, callback) => {
    const cleanId = (roomId || '').trim().toUpperCase();
    const room = ludoRooms.get(cleanId);
    if (!room || (room.status !== 'waiting' && room.status !== 'playing')) {
      if (callback) callback({ success: false, error: 'Cannot start match.' });
      return;
    }

    let activeCount = room.players.length;
    if (fillBots) {
      const desired = Math.min(4, Math.max(2, Number(targetCount) || 4));
      const config = LUDO_COLOR_CONFIG[desired];
      while (room.players.length < desired) {
        const botIndex = room.players.length;
        room.players.push({
          id: `bot_${botIndex}_${Math.random().toString(36).substring(2, 7)}`,
          playerId: `bot_${botIndex}`,
          name: `Bot ${config[botIndex].name}`,
          seatIndex: botIndex,
          color: config[botIndex].name.toLowerCase(),
          colorHex: config[botIndex].hex,
          isBot: true,
          connected: true
        });
      }
      activeCount = desired;
    } else {
      activeCount = Math.min(4, Math.max(2, room.players.length));
    }

    if (activeCount < 2) {
      if (callback) callback({ success: false, error: 'Need at least 2 players to start.' });
      return;
    }

    // Dynamically reconfigure room and colors
    room.maxPlayers = activeCount;
    const finalConfig = LUDO_COLOR_CONFIG[activeCount];
    room.players.forEach((p, idx) => {
      p.seatIndex = idx;
      p.color = finalConfig[idx].name.toLowerCase();
      p.colorHex = finalConfig[idx].hex;
    });

    room.tokens = Array.from({ length: activeCount }, () => [-1, -1, -1, -1]);
    room.status = 'playing';
    room.turnIndex = 0;
    room.winner = null;
    room.rankings = [];

    if (callback) callback({ success: true, room });
    io.to(cleanId).emit('ludo_state_update', room);

    // If first turn is a bot, trigger it
    if (room.players[0].isBot) {
      triggerServerBotTurn(room);
    }
  });

  // 4. Quick Match (Instant Matchmaking with dynamic countdown)
  socket.on('ludo_find_quick_match', ({ playerId, playerName } = {}, callback) => {
    // Check if open quick match room exists
    if (ludoQuickMatchRoom && ludoRooms.has(ludoQuickMatchRoom.id)) {
      const room = ludoRooms.get(ludoQuickMatchRoom.id);
      const existingIndex = room.players.findIndex(p => p.playerId === playerId || p.id === socket.id);
      if (existingIndex === -1 && room.players.length < 4) {
        const newSeatIndex = room.players.length;
        room.players.push({
          id: socket.id,
          playerId,
          name: playerName || `Player ${newSeatIndex + 1}`,
          seatIndex: newSeatIndex,
          color: 'yellow',
          colorHex: '#facc15',
          isBot: false,
          connected: true
        });
        socket.join(room.id);
        socket.ludoRoomId = room.id;
        updateLudoWaitingRoomSeats(room);

        // If 4 players, launch instantly
        if (room.players.length === 4) {
          if (ludoQuickMatchTimer) clearTimeout(ludoQuickMatchTimer);
          ludoQuickMatchTimer = null;
          ludoQuickMatchRoom = null;
          room.maxPlayers = 4;
          room.tokens = Array.from({ length: 4 }, () => [-1, -1, -1, -1]);
          room.status = 'playing';
          room.turnIndex = 0;
          io.to(room.id).emit('ludo_state_update', room);
        } else if (room.players.length >= 2) {
          // Dynamic launch countdown
          if (ludoQuickMatchTimer) clearTimeout(ludoQuickMatchTimer);
          io.to(room.id).emit('ludo_quick_countdown', { seconds: 4, playerCount: room.players.length });
          ludoQuickMatchTimer = setTimeout(() => {
            if (room.status === 'waiting' && room.players.length >= 2) {
              const count = room.players.length;
              room.maxPlayers = count;
              const finalConfig = LUDO_COLOR_CONFIG[count];
              room.players.forEach((p, idx) => {
                p.seatIndex = idx;
                p.color = finalConfig[idx].name.toLowerCase();
                p.colorHex = finalConfig[idx].hex;
              });
              room.tokens = Array.from({ length: count }, () => [-1, -1, -1, -1]);
              room.status = 'playing';
              room.turnIndex = 0;
              ludoQuickMatchRoom = null;
              ludoQuickMatchTimer = null;
              io.to(room.id).emit('ludo_state_update', room);
            }
          }, 4000);
        }

        if (callback) callback({ success: true, roomId: room.id, seatIndex: newSeatIndex, room });
        io.to(room.id).emit('ludo_state_update', room);
        return;
      }
    }

    // Create a new Quick Match room
    let roomId = 'LUDO-' + generateRoomCode().substring(0, 4);
    while (ludoRooms.has(roomId)) {
      roomId = 'LUDO-' + generateRoomCode().substring(0, 4);
    }

    const newRoom = {
      id: roomId,
      maxPlayers: 4,
      timeControl: 30,
      players: [
        {
          id: socket.id,
          playerId,
          name: playerName || 'Player 1',
          seatIndex: 0,
          color: 'red',
          colorHex: '#ef4444',
          isBot: false,
          connected: true
        }
      ],
      hostId: socket.id,
      hostPlayerId: playerId,
      tokens: Array.from({ length: 4 }, () => [-1, -1, -1, -1]),
      turnIndex: 0,
      dice: null,
      diceRolled: false,
      consecutiveSixes: 0,
      status: 'waiting',
      winner: null,
      rankings: [],
      createdAt: Date.now()
    };

    ludoRooms.set(roomId, newRoom);
    ludoQuickMatchRoom = newRoom;
    socket.join(roomId);
    socket.ludoRoomId = roomId;

    if (callback) {
      callback({
        success: true,
        roomId,
        seatIndex: 0,
        room: newRoom
      });
    }
  });

  socket.on('ludo_cancel_quick_match', (callback) => {
    if (ludoQuickMatchRoom && socket.ludoRoomId === ludoQuickMatchRoom.id) {
      if (ludoQuickMatchRoom.players.length <= 1) {
        if (ludoQuickMatchTimer) clearTimeout(ludoQuickMatchTimer);
        ludoQuickMatchTimer = null;
        ludoRooms.delete(ludoQuickMatchRoom.id);
        ludoQuickMatchRoom = null;
      }
    }
    if (callback) callback({ success: true });
  });

  // 4. Roll Dice
  socket.on('ludo_roll_dice', ({ roomId }, callback) => {
    const cleanId = (roomId || '').trim().toUpperCase();
    const room = ludoRooms.get(cleanId);
    if (!room || room.status !== 'playing') {
      if (callback) callback({ success: false, error: 'Invalid game state.' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    if (!activePlayer || activePlayer.id !== socket.id) {
      if (callback) callback({ success: false, error: 'Not your turn.' });
      return;
    }

    if (room.diceRolled) {
      if (callback) callback({ success: false, error: 'Dice already rolled.' });
      return;
    }

    const dice = 1 + Math.floor(Math.random() * 6);
    room.dice = dice;
    room.diceRolled = true;

    if (dice === 6) {
      room.consecutiveSixes = (room.consecutiveSixes || 0) + 1;
    } else {
      room.consecutiveSixes = 0;
    }

    // 3 consecutive sixes forfeits turn
    if (room.consecutiveSixes >= 3) {
      room.consecutiveSixes = 0;
      room.dice = null;
      room.diceRolled = false;
      advanceLudoTurn(room);
      io.to(cleanId).emit('ludo_dice_rolled', { dice, legalTokens: [], forfeit: true });
      io.to(cleanId).emit('ludo_state_update', room);
      if (callback) callback({ success: true, dice, legalTokens: [] });
      return;
    }

    const legalTokens = getLegalLudoTokens(room.tokens, dice, room.turnIndex);

    io.to(cleanId).emit('ludo_dice_rolled', { dice, legalTokens, turnIndex: room.turnIndex });

    if (callback) callback({ success: true, dice, legalTokens });

    // If no legal moves, advance turn after brief 1s pause
    if (legalTokens.length === 0) {
      setTimeout(() => {
        advanceLudoTurn(room);
        io.to(cleanId).emit('ludo_state_update', room);
      }, 1000);
    }
  });

  // 5. Move Token
  socket.on('ludo_move_token', ({ roomId, tokenIndex }, callback) => {
    const cleanId = (roomId || '').trim().toUpperCase();
    const room = ludoRooms.get(cleanId);
    if (!room || room.status !== 'playing' || !room.diceRolled) {
      if (callback) callback({ success: false, error: 'Cannot move right now.' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    if (!activePlayer || activePlayer.id !== socket.id) {
      if (callback) callback({ success: false, error: 'Not your turn.' });
      return;
    }

    const legalTokens = getLegalLudoTokens(room.tokens, room.dice, room.turnIndex);
    if (!legalTokens.includes(tokenIndex)) {
      if (callback) callback({ success: false, error: 'Illegal token move.' });
      return;
    }

    const dice = room.dice;
    const currentStep = room.tokens[room.turnIndex][tokenIndex];
    let newStep = currentStep === -1 ? 0 : currentStep + dice;
    room.tokens[room.turnIndex][tokenIndex] = newStep;

    let extraTurn = dice === 6;

    // Check Capture
    const captured = checkLudoCapture(room, room.turnIndex, newStep);
    if (captured) {
      extraTurn = true;
    }

    // Check if token reached Home goal (56)
    if (newStep === 56) {
      extraTurn = true;
      // Check if all 4 tokens finished
      if (room.tokens[room.turnIndex].every(st => st === 56)) {
        if (!room.rankings.includes(room.turnIndex)) {
          room.rankings.push(room.turnIndex);
        }
        if (room.winner === null) {
          room.winner = room.turnIndex;
        }
        if (room.rankings.length >= room.players.length - 1) {
          room.status = 'ended';
        }
      }
    }

    room.dice = null;
    room.diceRolled = false;

    if (!extraTurn) {
      advanceLudoTurn(room);
    }

    if (callback) callback({ success: true, room });
    io.to(cleanId).emit('ludo_state_update', room);

    // If next turn is a bot and match is active, trigger bot
    if (room.status === 'playing' && room.players[room.turnIndex]?.isBot) {
      triggerServerBotTurn(room);
    }
  });

  // 6. Leave Ludo Room
  socket.on('ludo_leave_room', ({ roomId }) => {
    const cleanId = (roomId || '').trim().toUpperCase();
    const room = ludoRooms.get(cleanId);
    if (room) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        if (room.status === 'waiting') {
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length === 0) {
            ludoRooms.delete(cleanId);
          } else {
            io.to(cleanId).emit('ludo_state_update', room);
          }
        } else {
          room.players[idx].connected = false;
          room.players[idx].isBot = true;
          io.to(cleanId).emit('ludo_state_update', room);
          if (room.turnIndex === idx) {
            triggerServerBotTurn(room);
          }
        }
      }
    }
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

// Serve static frontend in production if built
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all handler to serve index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Chess Master Backend API is running. Build frontend with npm run build.');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});
