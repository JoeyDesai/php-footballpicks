const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

console.log('Seeding database with sample data...');

db.serialize(async () => {
  // Create a test user
  const hashedPassword = await bcrypt.hash('password', 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (email, password, nickname, realName) 
    VALUES ('test@test.com', ?, 'TestUser', 'Test User')
  `, [hashedPassword]);

  db.run(`
    INSERT OR IGNORE INTO users (email, password, nickname, realName) 
    VALUES ('joe', ?, 'Joe', 'Joe Smith')
  `, [hashedPassword]);

  // Insert NFL teams
  const teams = [
    { name: 'Cardinals', city: 'Arizona', abbr: 'ARI' },
    { name: 'Falcons', city: 'Atlanta', abbr: 'ATL' },
    { name: 'Ravens', city: 'Baltimore', abbr: 'BAL' },
    { name: 'Bills', city: 'Buffalo', abbr: 'BUF' },
    { name: 'Panthers', city: 'Carolina', abbr: 'CAR' },
    { name: 'Bears', city: 'Chicago', abbr: 'CHI' },
    { name: 'Bengals', city: 'Cincinnati', abbr: 'CIN' },
    { name: 'Browns', city: 'Cleveland', abbr: 'CLE' },
    { name: 'Cowboys', city: 'Dallas', abbr: 'DAL' },
    { name: 'Broncos', city: 'Denver', abbr: 'DEN' },
    { name: 'Lions', city: 'Detroit', abbr: 'DET' },
    { name: 'Packers', city: 'Green Bay', abbr: 'GB' },
    { name: 'Texans', city: 'Houston', abbr: 'HOU' },
    { name: 'Colts', city: 'Indianapolis', abbr: 'IND' },
    { name: 'Jaguars', city: 'Jacksonville', abbr: 'JAX' },
    { name: 'Chiefs', city: 'Kansas City', abbr: 'KC' },
    { name: 'Raiders', city: 'Las Vegas', abbr: 'LV' },
    { name: 'Chargers', city: 'Los Angeles', abbr: 'LAC' },
    { name: 'Rams', city: 'Los Angeles', abbr: 'LAR' },
    { name: 'Dolphins', city: 'Miami', abbr: 'MIA' },
    { name: 'Vikings', city: 'Minnesota', abbr: 'MIN' },
    { name: 'Patriots', city: 'New England', abbr: 'NE' },
    { name: 'Saints', city: 'New Orleans', abbr: 'NO' },
    { name: 'Giants', city: 'New York', abbr: 'NYG' },
    { name: 'Jets', city: 'New York', abbr: 'NYJ' },
    { name: 'Eagles', city: 'Philadelphia', abbr: 'PHI' },
    { name: 'Steelers', city: 'Pittsburgh', abbr: 'PIT' },
    { name: '49ers', city: 'San Francisco', abbr: 'SF' },
    { name: 'Seahawks', city: 'Seattle', abbr: 'SEA' },
    { name: 'Buccaneers', city: 'Tampa Bay', abbr: 'TB' },
    { name: 'Titans', city: 'Tennessee', abbr: 'TEN' },
    { name: 'Commanders', city: 'Washington', abbr: 'WAS' }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO teams (name, city, abbr, wins, losses, ties) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  teams.forEach(team => {
    const wins = Math.floor(Math.random() * 12) + 2; // 2-13 wins
    const losses = 17 - wins; // Total 17 games
    const ties = 0;
    stmt.run([team.name, team.city, team.abbr, wins, losses, ties]);
  });

  stmt.finalize();

  // Create sample weeks for 2025
  const weekStmt = db.prepare(`
    INSERT OR IGNORE INTO weeks (number, year, startDate, factor) 
    VALUES (?, 2025, ?, 1.0)
  `);

  // Create 18 weeks (17 regular season + 1 playoff week)
  for (let i = 1; i <= 18; i++) {
    const startDate = new Date(2025, 8, 7 + (i - 1) * 7); // Start Sept 7, 2025
    weekStmt.run([i, startDate.toISOString()]);
  }

  weekStmt.finalize();

  // Create sample games for Week 1
  db.all('SELECT id FROM teams ORDER BY RANDOM() LIMIT 32', (err, teamRows) => {
    if (err || teamRows.length < 32) {
      console.log('Not enough teams to create games');
      return;
    }

    const gameStmt = db.prepare(`
      INSERT OR IGNORE INTO games (week, home, away, date) 
      VALUES (1, ?, ?, ?)
    `);

    // Create 16 games (32 teams / 2)
    for (let i = 0; i < 16; i++) {
      const homeTeam = teamRows[i * 2].id;
      const awayTeam = teamRows[i * 2 + 1].id;
      const gameDate = new Date(2025, 8, 7 + Math.floor(i / 4), 13 + (i % 4) * 3); // Spread games across Sunday
      
      gameStmt.run([homeTeam, awayTeam, gameDate.toISOString()]);
    }

    gameStmt.finalize();
    console.log('Sample data seeded successfully!');
    console.log('Test users created:');
    console.log('  Email: test@test.com, Password: password');
    console.log('  Email: joe, Password: password');
  });
});

db.close();