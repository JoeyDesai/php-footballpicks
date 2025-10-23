// Centralized configuration for Football Picks App
// All settings are hardcoded for simplicity - modify these values directly

const config = {
  // Server Configuration
  server: {
    port: 3001,
    host: 'localhost',
    environment: 'development'
  },

  // Database Configuration (PostgreSQL)
  database: {
    user: 'footballusr',
    host: 'localhost',
    database: 'football',
    password: 'password',
    port: 5432,
    ssl: false // Set to { rejectUnauthorized: false } for production
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
    secret: 'football-picks-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
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
    user: 'footballusr',
    password: 'password',
    database: 'football',
    host: 'localhost',
    port: 5432
  },

  // Application Settings
  app: {
    currentYear: 2025,
    debug: false
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
