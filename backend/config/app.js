// Centralized configuration for Football Picks App
// Modify these values to change all settings across the application

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // Database Configuration (PostgreSQL)
  database: {
    user: process.env.DB_USER || 'footballusr',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'football',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // CORS Configuration
  cors: {
    origins: [
      'http://localhost:5173',
      'http://192.168.1.171:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'football-picks-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Static Files Configuration
  static: {
    imagesPath: '../images', // Path to team images relative to backend directory
    servePath: '/images' // URL path to serve images
  },

  // DB Updates Configuration
  dbUpdates: {
    baseDir: 'DB Updates', // Directory containing update scripts
    scripts: {
      individualRecords: 'update_individualrecords.inc',
      losers: 'update_losers.inc',
      teamRecords: 'update_teamrecords.inc',
      nflScores: 'update-nfl-scores.php'
    }
  },

  // PHP Database Configuration (for DB update scripts)
  phpDatabase: {
    user: process.env.DB_USER || 'footballusr',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'football',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432
  },

  // Application Settings
  app: {
    currentYear: 2025,
    debug: process.env.DEBUG === 'true' || false
  }
};

// Helper functions
config.getScriptPath = function(scriptType) {
  if (!this.dbUpdates.scripts[scriptType]) {
    throw new Error(`Invalid script type: ${scriptType}`);
  }
  return `${this.dbUpdates.baseDir}/${this.dbUpdates.scripts[scriptType]}`;
};

config.getAvailableScripts = function() {
  return Object.keys(this.dbUpdates.scripts);
};

// Export configuration
module.exports = config;
