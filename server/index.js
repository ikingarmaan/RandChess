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
  }
});

const PORT = process.env.PORT || 3000;

// Active rooms storage: roomId -> { chess, whitePlayer, blackPlayer, timeControl, timers, startedAt }
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  // 1. Create Room
  socket.on('create_room', ({ timeControl = 300, preferredColor = 'random' }, callback) => {
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
      timers: {
        w: timeControl,
        b: timeControl,
        lastTurnTimestamp: Date.now()
      },
      status: 'waiting'
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

  // 2. Join Room
  socket.on('join_room', ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found. Check code.' });
      return;
    }

    if (room.whitePlayer && room.blackPlayer) {
      if (callback) callback({ success: false, error: 'Room is already full.' });
      return;
    }

    let playerColor = 'w';
    if (!room.whitePlayer) {
      room.whitePlayer = socket.id;
      playerColor = 'w';
    } else {
      room.blackPlayer = socket.id;
      playerColor = 'b';
    }

    room.status = 'playing';
    room.timers.lastTurnTimestamp = Date.now();
    socket.join(roomId);
    socket.roomId = roomId;

    if (callback) {
      callback({
        success: true,
        roomId,
        color: playerColor,
        timeControl: room.timeControl,
        fen: room.chess.fen()
      });
    }

    // Notify all players in room that match is ready to start
    io.to(roomId).emit('game_started', {
      roomId,
      whitePlayer: room.whitePlayer,
      blackPlayer: room.blackPlayer,
      timeControl: room.timeControl,
      fen: room.chess.fen()
    });
  });

  // 3. Make Move
  socket.on('make_move', ({ roomId, move }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentTurn = room.chess.turn();
    const isWhiteTurn = currentTurn === 'w';
    const playerSocketId = isWhiteTurn ? room.whitePlayer : room.blackPlayer;

    if (socket.id !== playerSocketId) {
      if (callback) callback({ success: false, error: 'Not your turn.' });
      return;
    }

    try {
      const result = room.chess.move(move);
      if (!result) {
        if (callback) callback({ success: false, error: 'Invalid move' });
        return;
      }

      // Update timer deduction
      const now = Date.now();
      const elapsed = Math.floor((now - room.timers.lastTurnTimestamp) / 1000);
      room.timers[currentTurn] = Math.max(0, room.timers[currentTurn] - elapsed);
      room.timers.lastTurnTimestamp = now;

      const isGameOver = room.chess.isGameOver();
      let gameOverInfo = null;
      if (isGameOver) {
        if (room.chess.isCheckmate()) {
          gameOverInfo = { type: 'checkmate', winner: currentTurn, reason: 'Checkmate' };
        } else if (room.chess.isDraw()) {
          gameOverInfo = { type: 'draw', winner: null, reason: 'Draw' };
        }
      }

      // Broadcast move to opponent
      socket.to(roomId).emit('opponent_move', {
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

  // 4. Resign
  socket.on('resign', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const resigningColor = socket.id === room.whitePlayer ? 'w' : 'b';
    const winnerColor = resigningColor === 'w' ? 'b' : 'w';

    io.to(roomId).emit('game_over', {
      type: 'resignation',
      winner: winnerColor,
      reason: `${resigningColor === 'w' ? 'White' : 'Black'} resigned`
    });
  });

  // 5. Offer Draw
  socket.on('offer_draw', ({ roomId }) => {
    socket.to(roomId).emit('draw_offered');
  });

  socket.on('accept_draw', ({ roomId }) => {
    io.to(roomId).emit('game_over', {
      type: 'draw',
      winner: null,
      reason: 'Draw agreed by both players'
    });
  });

  // 6. Handle Disconnect
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      socket.to(roomId).emit('opponent_disconnected');
      rooms.delete(roomId);
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
