const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'questions.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

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
};

module.exports = { db, queries };
