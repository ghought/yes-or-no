const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'questions.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT NULL,
    status TEXT DEFAULT 'published',
    submitted_by TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'admin'
  )
`);

// Add status and submitted_by columns if they don't exist (migration for existing DBs)
try {
  db.exec(`ALTER TABLE questions ADD COLUMN status TEXT DEFAULT 'published'`);
} catch (e) {
  // Column already exists
}
try {
  db.exec(`ALTER TABLE questions ADD COLUMN submitted_by TEXT DEFAULT NULL`);
} catch (e) {
  // Column already exists
}

// Decks tables
db.exec(`
  CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS question_decks (
    question_id INTEGER NOT NULL,
    deck_id INTEGER NOT NULL,
    PRIMARY KEY (question_id, deck_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
  )
`);

// Query helpers
const queries = {
  // Published questions (used in game)
  getAllPublished: db.prepare("SELECT * FROM questions WHERE status = 'published' ORDER BY id ASC"),
  getPublishedCount: db.prepare("SELECT COUNT(*) as count FROM questions WHERE status = 'published'"),
  getRandomQuestions: (limit) => {
    return db.prepare("SELECT * FROM questions WHERE status = 'published' ORDER BY RANDOM() LIMIT ?").all(limit);
  },

  // All questions (admin)
  getAllQuestions: db.prepare('SELECT * FROM questions ORDER BY id ASC'),
  getQuestionCount: db.prepare('SELECT COUNT(*) as count FROM questions'),

  // By status (admin tabs)
  getByStatus: (status) => {
    return db.prepare('SELECT * FROM questions WHERE status = ? ORDER BY created_at DESC').all(status);
  },
  getCountByStatus: (status) => {
    return db.prepare('SELECT COUNT(*) as count FROM questions WHERE status = ?').get(status).count;
  },

  // CRUD
  addQuestion: db.prepare('INSERT OR IGNORE INTO questions (text, category, created_by, status) VALUES (?, ?, ?, ?)'),
  submitQuestion: db.prepare("INSERT OR IGNORE INTO questions (text, category, created_by, status, submitted_by) VALUES (?, NULL, 'user', 'draft', ?)"),
  updateQuestion: db.prepare('UPDATE questions SET text = ?, category = ? WHERE id = ?'),
  updateStatus: db.prepare('UPDATE questions SET status = ? WHERE id = ?'),
  deleteQuestion: db.prepare('DELETE FROM questions WHERE id = ?'),
  getQuestionById: db.prepare('SELECT * FROM questions WHERE id = ?'),

  // Deck queries
  getAllDecks: db.prepare('SELECT * FROM decks ORDER BY name ASC'),
  getDeckById: db.prepare('SELECT * FROM decks WHERE id = ?'),
  createDeck: db.prepare('INSERT INTO decks (name, description) VALUES (?, ?)'),
  updateDeck: db.prepare('UPDATE decks SET name = ?, description = ? WHERE id = ?'),
  deleteDeck: db.prepare('DELETE FROM decks WHERE id = ?'),

  // Deck-question junction
  assignQuestionToDeck: db.prepare('INSERT OR IGNORE INTO question_decks (question_id, deck_id) VALUES (?, ?)'),
  unassignQuestionFromDeck: db.prepare('DELETE FROM question_decks WHERE question_id = ? AND deck_id = ?'),
  clearQuestionDecks: db.prepare('DELETE FROM question_decks WHERE question_id = ?'),
  getDecksForQuestion: db.prepare('SELECT d.id, d.name FROM decks d JOIN question_decks qd ON d.id = qd.deck_id WHERE qd.question_id = ? ORDER BY d.name'),
  getPublishedQuestionsByDeck: (deckId) => {
    return db.prepare("SELECT q.* FROM questions q JOIN question_decks qd ON q.id = qd.question_id WHERE qd.deck_id = ? AND q.status = 'published' ORDER BY RANDOM()").all(deckId);
  },
  getRandomQuestionsByDeck: (deckId, limit) => {
    return db.prepare("SELECT q.* FROM questions q JOIN question_decks qd ON q.id = qd.question_id WHERE qd.deck_id = ? AND q.status = 'published' ORDER BY RANDOM() LIMIT ?").all(deckId, limit);
  },
  getDeckQuestionCount: db.prepare("SELECT COUNT(*) as count FROM question_decks qd JOIN questions q ON q.id = qd.question_id WHERE qd.deck_id = ? AND q.status = 'published'"),
};

module.exports = { db, queries };
