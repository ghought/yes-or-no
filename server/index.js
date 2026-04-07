require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

// ---------- Email Helper ----------
function getMailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.log('SMTP credentials missing:', { user: !!user, pass: !!pass });
    return null;
  }
  // Strip spaces from app passwords (Gmail shows them as "xxxx xxxx xxxx xxxx")
  const cleanPass = pass.replace(/\s/g, '');
  console.log(`SMTP configured: ${user} via ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user, pass: cleanPass },
  });
}

async function sendSubmissionEmail(questionText, submitterName) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log('SMTP not configured — skipping email notification');
    return;
  }
  const adminUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/admin`
    : 'https://yes-or-no-production.up.railway.app/admin';

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL || 'ALEX@ALEXCRAWFORDPHOTO.COM',
      subject: `YES OR NO: New question submitted by ${submitterName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">New Question Submission</h2>
          <p style="font-size: 14px; color: #666;">Submitted by <strong>${submitterName}</strong></p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 16px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #1a1a2e; margin: 0;">${questionText}</p>
          </div>
          <a href="${adminUrl}" style="display: inline-block; background: #e2ff3f; color: #1a1a2e; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
            Review in Admin Panel
          </a>
        </div>
      `,
    });
    console.log('Submission notification email sent');
  } catch (err) {
    console.error('Failed to send email:', err.message, err.code || '', err.responseCode || '');
  }
}

// ---------- Admin Question CRUD ----------
app.get('/api/questions', requireAdmin, (req, res) => {
  const status = req.query.status;
  let questions;
  if (status) {
    questions = queries.getByStatus(status);
  } else {
    questions = queries.getAllPublished.all();
  }
  // Enrich with deck assignments
  const enriched = questions.map(q => ({
    ...q,
    decks: queries.getDecksForQuestion.all(q.id),
  }));
  res.json({ questions: enriched, count: enriched.length });
});

app.get('/api/questions/counts', requireAdmin, (req, res) => {
  res.json({
    published: queries.getCountByStatus('published'),
    draft: queries.getCountByStatus('draft'),
    rejected: queries.getCountByStatus('rejected'),
  });
});

app.post('/api/questions', requireAdmin, (req, res) => {
  const { text, category } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Question text is required' });
  try {
    const result = queries.addQuestion.run(text.trim(), category || null, 'admin', 'published');
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
      const result = insert.run(text.trim(), null, 'admin', 'published');
      if (result.changes > 0) added++;
    }
  }
  const count = queries.getPublishedCount.get().count;
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

app.post('/api/questions/:id/approve', requireAdmin, (req, res) => {
  const question = queries.getQuestionById.get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  queries.updateStatus.run('published', req.params.id);
  res.json({ success: true });
});

app.post('/api/questions/:id/reject', requireAdmin, (req, res) => {
  const question = queries.getQuestionById.get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  queries.updateStatus.run('rejected', req.params.id);
  res.json({ success: true });
});

app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  const result = queries.deleteQuestion.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Question not found' });
  res.json({ success: true });
});

// ---------- Public Question Submission ----------
app.post('/api/submit', (req, res) => {
  const { name, question } = req.body;
  if (!name?.trim() || !question?.trim()) {
    return res.status(400).json({ error: 'Name and question are required' });
  }
  try {
    const result = queries.submitQuestion.run(question.trim(), name.trim());
    if (result.changes === 0) {
      return res.status(409).json({ error: 'This question has already been submitted' });
    }
    // Send email notification (non-blocking)
    sendSubmissionEmail(question.trim(), name.trim());
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Deck CRUD (Admin) ----------
app.get('/api/decks', (req, res) => {
  const decks = queries.getAllDecks.all();
  // Add question counts
  const result = decks.map(d => ({
    ...d,
    questionCount: queries.getDeckQuestionCount.get(d.id).count,
  }));
  res.json({ decks: result });
});

app.post('/api/decks', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Deck name is required' });
  try {
    const result = queries.createDeck.run(name.trim(), description || null);
    const deck = queries.getDeckById.get(result.lastInsertRowid);
    res.status(201).json(deck);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Deck name already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/decks/:id', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Deck name is required' });
  const result = queries.updateDeck.run(name.trim(), description || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Deck not found' });
  const deck = queries.getDeckById.get(req.params.id);
  res.json(deck);
});

app.delete('/api/decks/:id', requireAdmin, (req, res) => {
  const result = queries.deleteDeck.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Deck not found' });
  res.json({ success: true });
});

// Set decks for a question (replaces all assignments)
app.put('/api/questions/:id/decks', requireAdmin, (req, res) => {
  const { deckIds } = req.body;
  if (!Array.isArray(deckIds)) return res.status(400).json({ error: 'deckIds must be an array' });
  const questionId = req.params.id;
  queries.clearQuestionDecks.run(questionId);
  for (const deckId of deckIds) {
    queries.assignQuestionToDeck.run(questionId, deckId);
  }
  const decks = queries.getDecksForQuestion.all(questionId);
  res.json({ decks });
});

// ---------- Quick Play (public, no auth) ----------
app.get('/api/quickplay/questions', (req, res) => {
  const deckId = req.query.deckId;
  let questions;
  if (deckId && deckId !== 'all') {
    questions = queries.getRandomQuestionsByDeck(parseInt(deckId), 95);
  } else {
    questions = queries.getRandomQuestions(95);
  }
  res.json({ questions: questions.map(q => ({ id: q.id, text: q.text })) });
});

// ---------- Socket.IO Game Logic ----------
// Track which room each socket is in
const socketRooms = new Map();

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('host:create', ({ name, deckId } = {}) => {
    const room = rooms.createRoom(socket.id, deckId || null);
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
