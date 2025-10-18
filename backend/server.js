const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

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
app.get('/api/check-session', async (req, res) => {
  try {
    if (req.session.userId) {
      const result = await pool.query(
        'SELECT id, email, nickname, realname FROM pickers WHERE id = $1',
        [req.session.userId]
      );
      
      if (result.rows.length === 0) {
        return res.json({ authenticated: false });
      }
      
      const user = result.rows[0];
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          realName: user.realname
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Session check error:', error);
    res.json({ authenticated: false });
  }
});

// Get user tags
app.get('/api/user-tags', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const result = await pool.query(`
      SELECT t.id, t.name 
      FROM tags t, pickertags p 
      WHERE p.pickerid = $1 AND p.tagid = t.id 
      ORDER BY t.name
    `, [userId]);
    
    const tags = result.rows.map(tag => ({
      id: tag.id,
      name: tag.name
    }));
    
    // Always include "All" option
    tags.unshift({ id: 0, name: 'All' });
    
    res.json({ success: true, tags });
  } catch (error) {
    console.error('Get user tags error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const currentYear = new Date().getFullYear();
    
    if (!email || !password) {
      return res.json({ success: false, error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM pickers WHERE email = $1 AND year = $2',
      [email, currentYear]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    // Check if password is plain text (original system) or bcrypt hashed
    const isPlainText = user.password.length < 20; // bcrypt hashes are typically 60+ chars
    let validPassword = false;
    
    if (isPlainText) {
      // Original system uses plain text passwords
      validPassword = password === user.password;
    } else {
      // New system uses bcrypt
      validPassword = await bcrypt.compare(password, user.password);
    }
    
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
        realName: user.realname
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, error: 'Database error' });
  }
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
  try {
    const { email, realName, nickName, password, sitePassword } = req.body;
    
    // Simple site password check
    if (sitePassword !== 'cowboys') {
      return res.json({ success: false, error: 'Invalid site password' });
    }

    if (!email || !realName || !nickName || !password) {
      return res.json({ success: false, error: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM pickers WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.json({ success: false, error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const currentYear = new Date().getFullYear();
    
    await pool.query(
      'INSERT INTO pickers (email, password, nickname, realname, year) VALUES ($1, $2, $3, $4, $5)',
      [email, hashedPassword, nickName, realName, currentYear]
    );
    
    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    console.error('Create account error:', error);
    res.json({ success: false, error: 'Could not create account' });
  }
});

// Get weeks
app.get('/api/weeks', requireAuth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT id, number, startdate, 
             startdate > NOW() as future,
             startdate < NOW() as completed,
             factor
      FROM weeks 
      WHERE year = $1 
      ORDER BY startdate
    `, [currentYear]);
    
    const formattedWeeks = result.rows.map(week => ({
      id: week.id,
      number: week.number,
      startDate: week.startdate,
      future: week.future,
      completed: week.completed,
      current: !week.future && !week.completed,
      factor: week.factor || 1
    }));
    
    res.json({ success: true, weeks: formattedWeeks });
  } catch (error) {
    console.error('Get weeks error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get games for a week
app.get('/api/games/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    
    const result = await pool.query(`
      SELECT g.id, g.date, g.winner,
             h.id as home_id, h.city as home_city, h.name as home_name, 
             h.wins as home_wins, h.losses as home_losses, h.ties as home_ties,
             a.id as away_id, a.city as away_city, a.name as away_name,
             a.wins as away_wins, a.losses as away_losses, a.ties as away_ties
      FROM games g
      JOIN teams h ON g.home = h.id
      JOIN teams a ON g.away = a.id
      WHERE g.week = $1
      ORDER BY g.date, a.city
    `, [weekId]);
    
    // Check if week has started (read-only)
    const weekResult = await pool.query(
      'SELECT startdate < NOW() as started FROM weeks WHERE id = $1',
      [weekId]
    );
    
    res.json({ 
      success: true, 
      games: result.rows,
      readOnly: weekResult.rows.length > 0 ? weekResult.rows[0].started : false
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get picks for a week
app.get('/api/picks/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.session.userId;
    
    const result = await pool.query(`
      SELECT p.game, p.guess, p.weight
      FROM picks p
      JOIN games g ON p.game = g.id
      WHERE g.week = $1 AND p.picker = $2
    `, [weekId, userId]);
    
    res.json({ success: true, picks: result.rows });
  } catch (error) {
    console.error('Get picks error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Submit picks for a week
app.post('/api/picks/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    const userId = req.session.userId;
    const picks = req.body;
    
    // Check if week has started
    const weekResult = await pool.query(
      'SELECT startdate < NOW() as started FROM weeks WHERE id = $1',
      [weekId]
    );
    
    if (weekResult.rows.length > 0 && weekResult.rows[0].started) {
      return res.json({ success: false, error: 'Week has already started' });
    }
    
    // Get games for this week
    const gamesResult = await pool.query('SELECT id FROM games WHERE week = $1', [weekId]);
    
    // Validate picks
    const gameIds = gamesResult.rows.map(g => g.id);
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
    await pool.query(`
      DELETE FROM picks 
      WHERE picker = $1 AND game IN (SELECT id FROM games WHERE week = $2)
    `, [userId, weekId]);
    
    // Insert new picks
    for (const gameId of gameIds) {
      const pick = picks[`GAME${gameId}`];
      const value = picks[`VAL${gameId}`];
      await pool.query(
        'INSERT INTO picks (picker, game, guess, weight) VALUES ($1, $2, $3, $4)',
        [userId, gameId, pick, value]
      );
    }
    
    res.json({ success: true, message: 'Picks saved successfully' });
  } catch (error) {
    console.error('Submit picks error:', error);
    res.json({ success: false, error: 'Could not save picks' });
  }
});

// Get overall standings
app.get('/api/overall-standings', requireAuth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const tag = req.query.tag || 0;
    
    let tagFilter = '';
    if (tag != 0) {
      tagFilter = ' AND u.id IN (SELECT pickerid FROM pickertags WHERE tagid = $2)';
    }
    
    const result = await pool.query(`
      SELECT u.id, u.nickname, 
             COALESCE(SUM(s.score), 0) as score,
             COALESCE(SUM(s.numright), 0) as numright,
             COUNT(DISTINCT s.week) as weeks_played
      FROM pickers u
      LEFT JOIN scores s ON u.id = s.picker
      LEFT JOIN weeks w ON s.week = w.id
      WHERE u.active = 'y' AND (w.year = $1 OR w.year IS NULL)${tagFilter}
      GROUP BY u.id, u.nickname
      ORDER BY score DESC, numright DESC
    `, tag != 0 ? [currentYear, tag] : [currentYear]);
    
    res.json({ success: true, standings: result.rows });
  } catch (error) {
    console.error('Get overall standings error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get overall standings with weekly breakdown
app.get('/api/overall-standings-detailed', requireAuth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const tag = req.query.tag || 0;
    
    // Get all weeks for the current year that have started
    const weeksResult = await pool.query(`
      SELECT id, number 
      FROM weeks 
      WHERE year = $1 AND startdate < NOW()
      ORDER BY number DESC
    `, [currentYear]);
    
    let tagFilter = '';
    if (tag != 0) {
      tagFilter = ' AND u.id IN (SELECT pickerid FROM pickertags WHERE tagid = $2)';
    }
    
    // Get all users with their weekly scores (only from current year)
    const standingsResult = await pool.query(`
      SELECT u.id, u.nickname, 
             COALESCE(SUM(s.score), 0) as total_score,
             COALESCE(SUM(s.numright), 0) as total_correct,
             COUNT(DISTINCT s.week) as weeks_played
      FROM pickers u
      LEFT JOIN scores s ON u.id = s.picker
      LEFT JOIN weeks w ON s.week = w.id
      WHERE u.active = 'y' AND (w.year = $1 OR w.year IS NULL)${tagFilter}
      GROUP BY u.id, u.nickname
      ORDER BY total_score DESC, total_correct DESC
    `, tag != 0 ? [currentYear, tag] : [currentYear]);
    
    // Get weekly scores for each user (only from current year)
    const weeklyScores = {};
    for (const user of standingsResult.rows) {
      const weeklyResult = await pool.query(`
        SELECT s.week, s.score, s.numright, w.number as week_number
        FROM scores s
        JOIN weeks w ON s.week = w.id
        WHERE s.picker = $1 AND w.year = $2
        ORDER BY w.number DESC
      `, [user.id, currentYear]);
      
      weeklyScores[user.id] = {};
      weeklyResult.rows.forEach(row => {
        weeklyScores[user.id][row.week_number] = {
          score: row.score,
          correct: row.numright
        };
      });
    }
    
    res.json({ 
      success: true, 
      standings: standingsResult.rows,
      weeks: weeksResult.rows,
      weeklyScores: weeklyScores
    });
  } catch (error) {
    console.error('Get detailed overall standings error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get weekly standings
app.get('/api/weekly-standings/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    const tag = req.query.tag || 0;
    
    let tagFilter = '';
    if (tag != 0) {
      tagFilter = ' AND u.id IN (SELECT pickerid FROM pickertags WHERE tagid = $2)';
    }
    
    const result = await pool.query(`
      SELECT u.id, u.nickname, s.score, s.numright
      FROM pickers u
      JOIN scores s ON u.id = s.picker
      WHERE s.week = $1 AND u.active = 'y'${tagFilter}
      ORDER BY s.score DESC, s.numright DESC
    `, tag != 0 ? [weekId, tag] : [weekId]);
    
    res.json({ success: true, standings: result.rows });
  } catch (error) {
    console.error('Get weekly standings error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get weekly standings with detailed breakdown
app.get('/api/weekly-standings-detailed/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    const tag = req.query.tag || 0;
    
    // Get the week info
    const weekResult = await pool.query(`
      SELECT id, number, startdate, factor
      FROM weeks 
      WHERE id = $1
    `, [weekId]);
    
    if (weekResult.rows.length === 0) {
      return res.json({ success: false, error: 'Week not found' });
    }
    
    const week = weekResult.rows[0];
    
    let tagFilter = '';
    if (tag != 0) {
      tagFilter = ' AND u.id IN (SELECT pickerid FROM pickertags WHERE tagid = $2)';
    }
    
    // Get standings for this week with potential scores
    const standingsResult = await pool.query(`
      SELECT u.id, u.nickname, s.score, s.numright, 
             s.score + COALESCE(s.potscore, 0) as potential_score,
             s.numright + COALESCE(s.potright, 0) as potential_correct
      FROM pickers u
      JOIN scores s ON u.id = s.picker
      WHERE s.week = $1 AND u.active = 'y'${tagFilter}
      ORDER BY potential_score DESC, potential_correct DESC
    `, tag != 0 ? [weekId, tag] : [weekId]);
    
    // Get all picks for this week to calculate incorrect
    const picksResult = await pool.query(`
      SELECT p.picker, COUNT(*) as total_picks
      FROM picks p
      JOIN games g ON p.game = g.id
      WHERE g.week = $1
      GROUP BY p.picker
    `, [weekId]);
    
    const totalPicks = {};
    picksResult.rows.forEach(row => {
      totalPicks[row.picker] = row.total_picks;
    });
    
    // Add incorrect picks calculation
    const standingsWithIncorrect = standingsResult.rows.map(player => ({
      ...player,
      incorrect: (totalPicks[player.id] || 0) - player.numright
    }));
    
    res.json({ 
      success: true, 
      standings: standingsWithIncorrect,
      week: week
    });
  } catch (error) {
    console.error('Get detailed weekly standings error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get weekly standings with individual games and picks (classic view)
app.get('/api/weekly-standings-classic/:weekId', requireAuth, async (req, res) => {
  try {
    const { weekId } = req.params;
    const tag = req.query.tag || 0;
    
    // Get the week info
    const weekResult = await pool.query(`
      SELECT id, number, startdate, factor
      FROM weeks 
      WHERE id = $1
    `, [weekId]);
    
    if (weekResult.rows.length === 0) {
      return res.json({ success: false, error: 'Week not found' });
    }
    
    const week = weekResult.rows[0];
    
    // Get all games for this week with team info and scores
    const gamesResult = await pool.query(`
      SELECT g.id, g.date, g.winner, g.homescore, g.awayscore, g.time, g.info,
             h.id as home_id, h.city as home_city, h.name as home_name, h.abbr as home_abbr,
             a.id as away_id, a.city as away_city, a.name as away_name, a.abbr as away_abbr
      FROM games g
      JOIN teams h ON g.home = h.id
      JOIN teams a ON g.away = a.id
      WHERE g.week = $1
      ORDER BY g.date, a.abbr
    `, [weekId]);
    
    let tagFilter = '';
    if (tag != 0) {
      tagFilter = ' AND u.id IN (SELECT pickerid FROM pickertags WHERE tagid = $2)';
    }
    
    // Get all standings for this week
    const standingsResult = await pool.query(`
      SELECT u.id, u.nickname, s.score, s.numright
      FROM pickers u
      JOIN scores s ON u.id = s.picker
      WHERE s.week = $1 AND u.active = 'y'${tagFilter}
      ORDER BY s.score DESC, s.numright DESC
    `, tag != 0 ? [weekId, tag] : [weekId]);
    
    // Get all picks for this week
    const picksResult = await pool.query(`
      SELECT p.picker, p.game, p.guess, p.weight, g.home, g.away, g.winner
      FROM picks p
      JOIN games g ON p.game = g.id
      WHERE g.week = $1
    `, [weekId]);
    
    // Organize picks by picker and game
    const picksByPicker = {};
    picksResult.rows.forEach(pick => {
      if (!picksByPicker[pick.picker]) {
        picksByPicker[pick.picker] = {};
      }
      picksByPicker[pick.picker][pick.game] = {
        guess: pick.guess,
        weight: pick.weight,
        home: pick.home,
        away: pick.away,
        winner: pick.winner
      };
    });
    
    res.json({ 
      success: true, 
      standings: standingsResult.rows,
      games: gamesResult.rows,
      picksByPicker: picksByPicker,
      week: week
    });
  } catch (error) {
    console.error('Get classic weekly standings error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get home stats
app.get('/api/home-stats', requireAuth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get current week
    const currentWeekResult = await pool.query(`
      SELECT id, number 
      FROM weeks 
      WHERE year = $1 AND startdate < NOW() 
      ORDER BY startdate DESC 
      LIMIT 1
    `, [currentYear]);
    
    if (currentWeekResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        currentWeek: null, 
        weeklyStandings: [],
        overallStandings: []
      });
    }
    
    const currentWeek = currentWeekResult.rows[0];
    
    // Get weekly standings for current week
    const weeklyResult = await pool.query(`
      SELECT u.id, u.nickname, s.score, s.numright
      FROM pickers u
      JOIN scores s ON u.id = s.picker
      WHERE s.week = $1 AND u.active = 'y'
      ORDER BY s.score DESC, s.numright DESC
      LIMIT 5
    `, [currentWeek.id]);
    
    res.json({
      success: true,
      currentWeek,
      weeklyStandings: weeklyResult.rows
    });
  } catch (error) {
    console.error('Get home stats error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Get team stats
app.get('/api/team-stats', requireAuth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const result = await pool.query(`
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
        JOIN weeks w ON g.week = w.id
        WHERE g.winner = p.guess AND g.winner IS NOT NULL AND w.year = $1
        GROUP BY g.winner
      ) won ON t.id = won.team_id
      LEFT JOIN (
        SELECT CASE WHEN g.winner = g.home THEN g.away ELSE g.home END as team_id,
               SUM(p.weight) as totalweight, COUNT(*) as totalcount
        FROM games g
        JOIN picks p ON g.id = p.game
        JOIN weeks w ON g.week = w.id
        WHERE g.winner IS NOT NULL AND p.guess != g.winner
          AND (p.guess = g.home OR p.guess = g.away) AND w.year = $1
        GROUP BY team_id
      ) lost ON t.id = lost.team_id
      WHERE COALESCE(won.totalcount, 0) + COALESCE(lost.totalcount, 0) > 0
      ORDER BY totalPoints DESC
    `, [currentYear]);
    
    res.json({ success: true, stats: result.rows });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.json({ success: false, error: 'Database error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});