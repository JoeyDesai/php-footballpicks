// Script configuration for admin update scripts
// Easy to modify for different deployment environments

const path = require('path');

const scriptConfig = {
  // Base directory for scripts (relative to backend folder)
  baseDir: '../DB Updates',
  
  // Script file names
  scripts: {
    individualRecords: 'update_individualrecords.inc',
    losers: 'update_losers.inc',
    teamRecords: 'update_teamrecords.inc'
  },
  
  // Get full path for a script
  getScriptPath: function(scriptType) {
    if (!this.scripts[scriptType]) {
      throw new Error(`Invalid script type: ${scriptType}`);
    }
    // __dirname is backend/config, so we need to go up two levels to get to root
    return path.join(__dirname, '..', '..', 'DB Updates', this.scripts[scriptType]);
  },
  
  // Get all available script types
  getAvailableScripts: function() {
    return Object.keys(this.scripts);
  }
};

module.exports = scriptConfig;
