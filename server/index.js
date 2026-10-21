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
