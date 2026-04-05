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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'admin'
  )
`);

// Query helpers
const queries = {
  getAllQuestions: db.prepare('SELECT * FROM questions ORDER BY id ASC'),
  getQuestionCount: db.prepare('SELECT COUNT(*) as count FROM questions'),
  getRandomQuestions: (limit) => {
    return db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?').all(limit);
  },
  addQuestion: db.prepare('INSERT OR IGNORE INTO questions (text, category, created_by) VALUES (?, ?, ?)'),
  updateQuestion: db.prepare('UPDATE questions SET text = ?, category = ? WHERE id = ?'),
  deleteQuestion: db.prepare('DELETE FROM questions WHERE id = ?'),
  getQuestionById: db.prepare('SELECT * FROM questions WHERE id = ?'),
};

module.exports = { db, queries };
