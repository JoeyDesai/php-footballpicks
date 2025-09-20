const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'football-picks-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files (team images)
app.use('/images', express.static(path.join(__dirname, '../images')));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// Routes

// Check session
app.get('/api/check-session', (req, res) => {
  if (req.session.userId) {
    db.get('SELECT id, email, nickname, realName FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err || !user) {
        return res.json({ authenticated: false });
      }
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          realName: user.realName
        }
      });
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.json({ success: false, error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    if (!user) {
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        realName: user.realName
      }
    });
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, error: 'Could not log out' });
    }
    res.json({ success: true });
  });
});

// Create account
app.post('/api/create-account', async (req, res) => {
  const { email, realName, nickName, password, sitePassword } = req.body;
  
  // Simple site password check
  if (sitePassword !== 'cowboys') {
    return res.json({ success: false, error: 'Invalid site password' });
  }

  if (!email || !realName || !nickName || !password) {
    return res.json({ success: false, error: 'All fields are required' });
  }

  // Check if email already exists
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    if (existingUser) {
      return res.json({ success: false, error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, nickname, realName) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, nickName, realName],
      function(err) {
        if (err) {
          return res.json({ success: false, error: 'Could not create account' });
        }
        res.json({ success: true, message: 'Account created successfully' });
      }
    );
  });
});

// Get weeks
app.get('/api/weeks', requireAuth, (req, res) => {
  db.all(`
    SELECT id, number, startDate, 
           datetime(startDate) > datetime('now') as future,
           datetime(startDate) < datetime('now') as completed,
           factor
    FROM weeks 
    WHERE year = 2025 
    ORDER BY startDate
  `, (err, weeks) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    const formattedWeeks = weeks.map(week => ({
      id: week.id,
      number: week.number,
      startDate: week.startDate,
      future: week.future === 1,
      completed: week.completed === 1,
      current: week.future === 0 && week.completed === 0,
      factor: week.factor || 1
    }));
    
    res.json({ success: true, weeks: formattedWeeks });
  });
});

// Get games for a week
app.get('/api/games/:weekId', requireAuth, (req, res) => {
  const { weekId } = req.params;
  
  db.all(`
    SELECT g.id, g.date, g.winner,
           h.id as home_id, h.city as home_city, h.name as home_name, 
           h.wins as home_wins, h.losses as home_losses, h.ties as home_ties,
           a.id as away_id, a.city as away_city, a.name as away_name,
           a.wins as away_wins, a.losses as away_losses, a.ties as away_ties
    FROM games g
    JOIN teams h ON g.home = h.id
    JOIN teams a ON g.away = a.id
    WHERE g.week = ?
    ORDER BY g.date, a.city
  `, [weekId], (err, games) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    // Check if week has started (read-only)
    db.get('SELECT datetime(startDate) < datetime("now") as started FROM weeks WHERE id = ?', [weekId], (err, week) => {
      if (err) {
        return res.json({ success: false, error: 'Database error' });
      }
      
      res.json({ 
        success: true, 
        games,
        readOnly: week ? week.started === 1 : false
      });
    });
  });
});

// Get picks for a week
app.get('/api/picks/:weekId', requireAuth, (req, res) => {
  const { weekId } = req.params;
  const userId = req.session.userId;
  
  db.all(`
    SELECT p.game, p.guess, p.weight
    FROM picks p
    JOIN games g ON p.game = g.id
    WHERE g.week = ? AND p.picker = ?
  `, [weekId, userId], (err, picks) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    res.json({ success: true, picks });
  });
});

// Submit picks for a week
app.post('/api/picks/:weekId', requireAuth, (req, res) => {
  const { weekId } = req.params;
  const userId = req.session.userId;
  const picks = req.body;
  
  // Check if week has started
  db.get('SELECT datetime(startDate) < datetime("now") as started FROM weeks WHERE id = ?', [weekId], (err, week) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    if (week && week.started === 1) {
      return res.json({ success: false, error: 'Week has already started' });
    }
    
    // Get games for this week
    db.all('SELECT id FROM games WHERE week = ?', [weekId], (err, games) => {
      if (err) {
        return res.json({ success: false, error: 'Database error' });
      }
      
      // Validate picks
      const gameIds = games.map(g => g.id);
      const usedValues = new Set();
      const errors = [];
      
      gameIds.forEach(gameId => {
        const pick = picks[`GAME${gameId}`];
        const value = picks[`VAL${gameId}`];
        
        if (!pick) {
          errors.push(`Missing pick for game ${gameId}`);
        }
        
        if (!value || value === 0) {
          errors.push(`Missing value for game ${gameId}`);
        } else if (usedValues.has(value)) {
          errors.push(`Value ${value} used multiple times`);
        } else {
          usedValues.add(value);
        }
      });
      
      if (errors.length > 0) {
        return res.json({ success: false, error: errors.join('. ') });
      }
      
      // Delete existing picks for this week
      db.run(`
        DELETE FROM picks 
        WHERE picker = ? AND game IN (SELECT id FROM games WHERE week = ?)
      `, [userId, weekId], (err) => {
        if (err) {
          return res.json({ success: false, error: 'Database error' });
        }
        
        // Insert new picks
        const stmt = db.prepare('INSERT INTO picks (picker, game, guess, weight) VALUES (?, ?, ?, ?)');
        
        gameIds.forEach(gameId => {
          const pick = picks[`GAME${gameId}`];
          const value = picks[`VAL${gameId}`];
          stmt.run([userId, gameId, pick, value]);
        });
        
        stmt.finalize((err) => {
          if (err) {
            return res.json({ success: false, error: 'Could not save picks' });
          }
          res.json({ success: true, message: 'Picks saved successfully' });
        });
      });
    });
  });
});

// Get overall standings
app.get('/api/overall-standings', requireAuth, (req, res) => {
  db.all(`
    SELECT u.id, u.nickname, 
           COALESCE(SUM(s.score), 0) as score,
           COALESCE(SUM(s.numright), 0) as numright,
           COUNT(DISTINCT s.week) as weeks_played
    FROM users u
    LEFT JOIN scores s ON u.id = s.picker
    WHERE u.active = 1
    GROUP BY u.id, u.nickname
    ORDER BY score DESC, numright DESC
  `, (err, standings) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    res.json({ success: true, standings });
  });
});

// Get weekly standings
app.get('/api/weekly-standings/:weekId', requireAuth, (req, res) => {
  const { weekId } = req.params;
  
  db.all(`
    SELECT u.id, u.nickname, s.score, s.numright
    FROM users u
    JOIN scores s ON u.id = s.picker
    WHERE s.week = ? AND u.active = 1
    ORDER BY s.score DESC, s.numright DESC
  `, [weekId], (err, standings) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    res.json({ success: true, standings });
  });
});

// Get home stats
app.get('/api/home-stats', requireAuth, (req, res) => {
  // Get current week
  db.get(`
    SELECT id, number 
    FROM weeks 
    WHERE year = 2025 AND datetime(startDate) < datetime('now') 
    ORDER BY startDate DESC 
    LIMIT 1
  `, (err, currentWeek) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    if (!currentWeek) {
      return res.json({ 
        success: true, 
        currentWeek: null, 
        weeklyStandings: [],
        overallStandings: []
      });
    }
    
    // Get weekly standings for current week
    db.all(`
      SELECT u.id, u.nickname, s.score, s.numright
      FROM users u
      JOIN scores s ON u.id = s.picker
      WHERE s.week = ? AND u.active = 1
      ORDER BY s.score DESC, s.numright DESC
      LIMIT 5
    `, [currentWeek.id], (err, weeklyStandings) => {
      if (err) {
        return res.json({ success: false, error: 'Database error' });
      }
      
      res.json({
        success: true,
        currentWeek,
        weeklyStandings: weeklyStandings || []
      });
    });
  });
});

// Get team stats
app.get('/api/team-stats', requireAuth, (req, res) => {
  db.all(`
    SELECT t.name,
           COALESCE(won.totalweight, 0) as pointsWon,
           COALESCE(won.totalcount, 0) as correctPicks,
           COALESCE(lost.totalweight, 0) as pointsLost,
           COALESCE(lost.totalcount, 0) as wrongPicks,
           COALESCE(won.totalweight, 0) + COALESCE(lost.totalweight, 0) as totalPoints,
           COALESCE(won.totalcount, 0) + COALESCE(lost.totalcount, 0) as totalPicks
    FROM teams t
    LEFT JOIN (
      SELECT g.winner as team_id, SUM(p.weight) as totalweight, COUNT(*) as totalcount
      FROM games g
      JOIN picks p ON g.id = p.game
      WHERE g.winner = p.guess AND g.winner IS NOT NULL
      GROUP BY g.winner
    ) won ON t.id = won.team_id
    LEFT JOIN (
      SELECT CASE WHEN g.winner = g.home THEN g.away ELSE g.home END as team_id,
             SUM(p.weight) as totalweight, COUNT(*) as totalcount
      FROM games g
      JOIN picks p ON g.id = p.game
      WHERE g.winner IS NOT NULL AND p.guess != g.winner
        AND (p.guess = g.home OR p.guess = g.away)
      GROUP BY team_id
    ) lost ON t.id = lost.team_id
    WHERE COALESCE(won.totalcount, 0) + COALESCE(lost.totalcount, 0) > 0
    ORDER BY totalPoints DESC
  `, (err, stats) => {
    if (err) {
      return res.json({ success: false, error: 'Database error' });
    }
    
    res.json({ success: true, stats });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});