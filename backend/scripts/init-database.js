const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

console.log('Initializing database...');

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      realName TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Teams table
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      abbr TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      ties INTEGER DEFAULT 0
    )
  `);

  // Weeks table
  db.run(`
    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      startDate DATETIME NOT NULL,
      factor REAL DEFAULT 1.0
    )
  `);

  // Games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week INTEGER NOT NULL,
      home INTEGER NOT NULL,
      away INTEGER NOT NULL,
      date DATETIME NOT NULL,
      winner INTEGER,
      awayScore INTEGER,
      homeScore INTEGER,
      FOREIGN KEY (week) REFERENCES weeks(id),
      FOREIGN KEY (home) REFERENCES teams(id),
      FOREIGN KEY (away) REFERENCES teams(id),
      FOREIGN KEY (winner) REFERENCES teams(id)
    )
  `);

  // Picks table
  db.run(`
    CREATE TABLE IF NOT EXISTS picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picker INTEGER NOT NULL,
      game INTEGER NOT NULL,
      guess INTEGER NOT NULL,
      weight INTEGER NOT NULL,
      FOREIGN KEY (picker) REFERENCES users(id),
      FOREIGN KEY (game) REFERENCES games(id),
      FOREIGN KEY (guess) REFERENCES teams(id),
      UNIQUE(picker, game)
    )
  `);

  // Scores table (calculated scores for each user/week)
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picker INTEGER NOT NULL,
      week INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      numright INTEGER DEFAULT 0,
      FOREIGN KEY (picker) REFERENCES users(id),
      FOREIGN KEY (week) REFERENCES weeks(id),
      UNIQUE(picker, week)
    )
  `);

  console.log('Database tables created successfully!');
});

db.close();