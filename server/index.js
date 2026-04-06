require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const { queries } = require('./db');
const rooms = require('./rooms');

// Run seed on startup (idempotent)
require('./seed');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ---------- Admin Auth ----------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const adminTokens = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = generateToken();
  adminTokens.add(token);
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies?.admin_token;
  if (token) adminTokens.delete(token);
  res.clearCookie('admin_token');
  res.json({ success: true });
});

app.get('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

// ---------- Admin Question CRUD ----------
app.get('/api/questions', requireAdmin, (req, res) => {
  const questions = queries.getAllQuestions.all();
  const count = queries.getQuestionCount.get().count;
  res.json({ questions, count });
});

app.post('/api/questions', requireAdmin, (req, res) => {
  const { text, category } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Question text is required' });
  try {
    const result = queries.addQuestion.run(text.trim(), category || null, 'admin');
    if (result.changes === 0) return res.status(409).json({ error: 'Question already exists' });
    const question = queries.getQuestionById.get(result.lastInsertRowid);
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions/bulk', requireAdmin, (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: 'Expected array of questions' });

  let added = 0;
  const insert = queries.addQuestion;
  for (const text of questions) {
    if (text?.trim()) {
      const result = insert.run(text.trim(), null, 'admin');
      if (result.changes > 0) added++;
    }
  }
  const count = queries.getQuestionCount.get().count;
  res.json({ added, total: count });
});

app.put('/api/questions/:id', requireAdmin, (req, res) => {
  const { text, category } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Question text is required' });
  const result = queries.updateQuestion.run(text.trim(), category || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Question not found' });
  const question = queries.getQuestionById.get(req.params.id);
  res.json(question);
});

app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  const result = queries.deleteQuestion.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Question not found' });
  res.json({ success: true });
});

// ---------- Quick Play (public, no auth) ----------
app.get('/api/quickplay/questions', (req, res) => {
  const questions = queries.getRandomQuestions(95);
  res.json({ questions: questions.map(q => ({ id: q.id, text: q.text })) });
});

// ---------- Socket.IO Game Logic ----------
// Track which room each socket is in
const socketRooms = new Map();

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('host:create', ({ name } = {}) => {
    const room = rooms.createRoom(socket.id);
    socketRooms.set(socket.id, room.roomCode);
    socket.join(room.roomCode);

    // Add host as a player
    if (name?.trim()) {
      rooms.addPlayer(room.roomCode, { socketId: socket.id, name: name.trim() });
    }

    socket.emit('room:created', { roomCode: room.roomCode });
    socket.emit('room:playerJoined', {
      players: rooms.getConnectedPlayers(room.roomCode).map(p => ({ id: p.id, name: p.name })),
    });
  });

  socket.on('player:join', ({ roomCode, name }) => {
    if (!roomCode || !name?.trim()) {
      return socket.emit('error', { message: 'Room code and name are required' });
    }

    const code = roomCode.toUpperCase();
    const room = rooms.getRoom(code);
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    const updated = rooms.addPlayer(code, { socketId: socket.id, name: name.trim() });
    socketRooms.set(socket.id, code);
    socket.join(code);

    const players = rooms.getConnectedPlayers(code).map(p => ({ id: p.id, name: p.name }));
    io.to(code).emit('room:playerJoined', { players });

    // If game already in progress, send current state to rejoining player
    if (room.state === 'voting' && room.currentQuestionIndex >= 0) {
      const question = room.questions[room.currentQuestionIndex];
      socket.emit('game:question', {
        questionText: question.text,
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
      });
      const connectedCount = rooms.getConnectedPlayers(code).length;
      socket.emit('game:voteProgress', {
        votedCount: room.votes.size,
        totalPlayers: connectedCount,
      });
    } else if (room.state === 'reveal' && room.currentQuestionIndex >= 0) {
      const question = room.questions[room.currentQuestionIndex];
      socket.emit('game:question', {
        questionText: question.text,
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
      });
      const tally = rooms.getVoteTally(code);
      socket.emit('game:reveal', tally);
    }

    // Tell the joining player whether they are the host
    socket.emit('room:role', { isHost: room.hostId === socket.id });
  });

  socket.on('host:startGame', () => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      return socket.emit('error', { message: 'Only the host can start the game' });
    }

    const updated = rooms.startGame(roomCode);
    if (!updated || updated.state === 'ended') {
      return socket.emit('error', { message: 'No questions available' });
    }

    const question = updated.questions[updated.currentQuestionIndex];
    io.to(roomCode).emit('game:question', {
      questionText: question.text,
      questionNumber: updated.currentQuestionIndex + 1,
      totalQuestions: updated.questions.length,
    });
    const connectedCount = rooms.getConnectedPlayers(roomCode).length;
    io.to(roomCode).emit('game:voteProgress', {
      votedCount: 0,
      totalPlayers: connectedCount,
    });
  });

  socket.on('player:vote', ({ answer }) => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.state !== 'voting') {
      return socket.emit('error', { message: 'Voting is not active' });
    }

    // Prevent double voting
    if (room.votes.has(socket.id)) {
      return socket.emit('error', { message: 'You already voted' });
    }

    rooms.castVote(roomCode, socket.id, answer);

    const connectedCount = rooms.getConnectedPlayers(roomCode).length;
    io.to(roomCode).emit('game:voteProgress', {
      votedCount: room.votes.size,
      totalPlayers: connectedCount,
    });

    // Auto-reveal if everyone voted
    if (room.votes.size >= connectedCount) {
      const { tally } = rooms.revealVotes(roomCode);
      io.to(roomCode).emit('game:reveal', tally);
    }
  });

  socket.on('host:forceReveal', () => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.state !== 'voting') return;

    const { tally } = rooms.revealVotes(roomCode);
    io.to(roomCode).emit('game:reveal', tally);
  });

  socket.on('host:skipQuestion', () => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.state !== 'voting') return;

    // Clear votes and advance to next question
    room.votes.clear();
    const updated = rooms.nextQuestion(roomCode);
    if (!updated) return;

    if (updated.state === 'ended') {
      const summary = rooms.getGameSummary(roomCode);
      io.to(roomCode).emit('game:ended', summary);
      return;
    }

    const question = updated.questions[updated.currentQuestionIndex];
    io.to(roomCode).emit('game:question', {
      questionText: question.text,
      questionNumber: updated.currentQuestionIndex + 1,
      totalQuestions: updated.questions.length,
    });
    const connectedCount = rooms.getConnectedPlayers(roomCode).length;
    io.to(roomCode).emit('game:voteProgress', {
      votedCount: 0,
      totalPlayers: connectedCount,
    });
  });

  socket.on('host:nextQuestion', () => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;

    const updated = rooms.nextQuestion(roomCode);
    if (!updated) return;

    if (updated.state === 'ended') {
      const summary = rooms.getGameSummary(roomCode);
      io.to(roomCode).emit('game:ended', summary);
      return;
    }

    const question = updated.questions[updated.currentQuestionIndex];
    io.to(roomCode).emit('game:question', {
      questionText: question.text,
      questionNumber: updated.currentQuestionIndex + 1,
      totalQuestions: updated.questions.length,
    });
    const connectedCount = rooms.getConnectedPlayers(roomCode).length;
    io.to(roomCode).emit('game:voteProgress', {
      votedCount: 0,
      totalPlayers: connectedCount,
    });
  });

  socket.on('host:endGame', () => {
    const roomCode = socketRooms.get(socket.id);
    const room = rooms.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.state = 'ended';
    const summary = rooms.getGameSummary(roomCode);
    io.to(roomCode).emit('game:ended', summary);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    const roomCode = socketRooms.get(socket.id);
    if (roomCode) {
      const room = rooms.getRoom(roomCode);
      if (room) {
        rooms.removePlayer(roomCode, socket.id);
        const players = rooms.getConnectedPlayers(roomCode).map(p => ({ id: p.id, name: p.name }));
        io.to(roomCode).emit('room:playerLeft', { players });

        // If host disconnected, promote someone or clean up
        if (room.hostId === socket.id) {
          const connected = rooms.getConnectedPlayers(roomCode);
          if (connected.length > 0) {
            room.hostId = connected[0].socketId;
            io.to(connected[0].socketId).emit('room:role', { isHost: true });
          } else {
            rooms.deleteRoom(roomCode);
          }
        }
      }
      socketRooms.delete(socket.id);
    }
  });
});

// ---------- Serve Frontend in Production ----------
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`YES OR NO server running on port ${PORT}`);
});
