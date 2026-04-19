const { queries } = require('./db');

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function createRoom(hostSocketId, deckId = null) {
  const code = generateRoomCode();
  const room = {
    roomCode: code,
    hostId: hostSocketId,
    deckId: deckId,
    players: [],
    questions: [],
    currentQuestionIndex: -1,
    usedQuestionIds: [],
    votes: new Map(),
    state: 'lobby',
    results: [],
  };
  rooms.set(code, room);
  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode?.toUpperCase());
}

function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

function addPlayer(roomCode, player) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const existing = room.players.find(p => p.name.toLowerCase() === player.name.toLowerCase());
  if (existing) {
    const oldSocketId = existing.socketId;
    existing.socketId = player.socketId;
    existing.id = player.socketId;
    existing.connected = true;
    // If the rejoining player was the host, update hostId to new socket id
    if (room.hostId === oldSocketId) {
      room.hostId = player.socketId;
    }
    // Migrate their vote to the new socket id (if they voted before disconnecting)
    if (room.votes && room.votes.has(oldSocketId)) {
      const vote = room.votes.get(oldSocketId);
      room.votes.delete(oldSocketId);
      room.votes.set(player.socketId, vote);
    }
    return room;
  }

  room.players.push({
    id: player.socketId,
    name: player.name,
    socketId: player.socketId,
    connected: true,
  });
  return room;
}

function removePlayer(roomCode, socketId) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.socketId === socketId);
  if (player) {
    player.connected = false;
  }
  return room;
}

function startGame(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const allQuestions = room.deckId
    ? queries.getPublishedQuestionsByDeck(room.deckId)
    : queries.getAllPublished.all();
  // Shuffle
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  room.questions = allQuestions;
  room.currentQuestionIndex = -1;
  room.results = [];
  return nextQuestion(roomCode);
}

function nextQuestion(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.currentQuestionIndex++;
  if (room.currentQuestionIndex >= room.questions.length) {
    room.state = 'ended';
    return room;
  }

  room.votes = new Map();
  room.state = 'voting';
  return room;
}

function castVote(roomCode, socketId, answer) {
  const room = getRoom(roomCode);
  if (!room || room.state !== 'voting') return null;

  room.votes.set(socketId, { odId: socketId, answer });
  return room;
}

function getVoteTally(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  let yesCount = 0;
  let noCount = 0;
  room.votes.forEach(vote => {
    if (vote.answer === 'yes') yesCount++;
    else noCount++;
  });

  return { yesCount, noCount, totalVotes: yesCount + noCount };
}

function revealVotes(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.state = 'reveal';
  const tally = getVoteTally(roomCode);
  const question = room.questions[room.currentQuestionIndex];

  room.results.push({
    questionText: question.text,
    questionNumber: room.currentQuestionIndex + 1,
    ...tally,
  });

  return { room, tally };
}

function getGameSummary(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const results = room.results;
  if (results.length === 0) return { totalQuestions: 0, results: [] };

  let mostDivisive = null;
  let mostUnanimous = null;
  let smallestDiff = Infinity;
  let largestDiff = 0;

  for (const r of results) {
    const diff = Math.abs(r.yesCount - r.noCount);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      mostDivisive = r;
    }
    if (diff > largestDiff) {
      largestDiff = diff;
      mostUnanimous = r;
    }
  }

  return {
    totalQuestions: results.length,
    results,
    mostDivisive,
    mostUnanimous,
  };
}

function getConnectedPlayers(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return [];
  return room.players.filter(p => p.connected);
}

// Track when all players have disconnected so we can expire abandoned rooms
// without deleting rooms where someone is briefly offline (mobile sleep, etc.)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const connected = room.players.filter(p => p.connected);
    if (connected.length === 0) {
      if (!room.abandonedAt) {
        room.abandonedAt = now;
      } else if (now - room.abandonedAt > 10 * 60 * 1000) {
        // Room has had zero connected players for 10+ minutes — clean up
        rooms.delete(code);
      }
    } else if (room.abandonedAt) {
      // Someone reconnected — clear the timer
      delete room.abandonedAt;
    }
  }
}, 60 * 1000);

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  startGame,
  nextQuestion,
  castVote,
  getVoteTally,
  revealVotes,
  getGameSummary,
  getConnectedPlayers,
};
