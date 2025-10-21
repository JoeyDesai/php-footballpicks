import React, { useState, useEffect } from 'react';
import { Settings, Users, Database, CheckCircle, XCircle, Search, Play, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { gameAPI, statsAPI, adminAPI } from '../services/api';
import CustomDropdown from '../components/CustomDropdown';

function Admin() {
  const { isAdmin } = useAuth();
  const [activePanel, setActivePanel] = useState('picks-status');
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [picksStatus, setPicksStatus] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [games, setGames] = useState([]);
  const [userPicks, setUserPicks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update script paths - easily configurable for deployment
  const updateScriptPaths = {
    individualRecords: '/DB Updates/update_individualrecords.inc',
    losers: '/DB Updates/update_losers.inc',
    teamRecords: '/DB Updates/update_teamrecords.inc'
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadWeeks();
    loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedWeek && activePanel === 'picks-status') {
      loadPicksStatus();
    }
  }, [selectedWeek, activePanel]);

  useEffect(() => {
    if (selectedUser && selectedWeek && activePanel === 'enter-picks') {
      loadUserGames();
    }
  }, [selectedUser, selectedWeek, activePanel]);

  const loadWeeks = async () => {
    try {
      const response = await gameAPI.getWeeks();
      setWeeks(response.data.weeks || []);
      if (response.data.weeks && response.data.weeks.length > 0) {
        // Find the current week (not future, not completed)
        const currentWeek = response.data.weeks.find(week => !week.future && !week.completed);
        if (currentWeek) {
          setSelectedWeek(currentWeek.id);
        } else {
          // Fallback to first week if no current week found
          setSelectedWeek(response.data.weeks[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading weeks:', error);
      setError('Failed to load weeks');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      const sortedUsers = response.data.users.sort((a, b) => {
        // Sort by nickname first, then realname, then email
        const aName = (a.nickname || a.realname || a.email || '').toLowerCase();
        const bName = (b.nickname || b.realname || b.email || '').toLowerCase();
        return aName.localeCompare(bName);
      });
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  const loadPicksStatus = async () => {
    if (!selectedWeek) return;
    
    setLoading(true);
    try {
      const response = await adminAPI.getPicksStatus(selectedWeek);
      setPicksStatus(response.data.picksStatus || []);
    } catch (error) {
      console.error('Error loading picks status:', error);
      setError('Failed to load picks status');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGames = async () => {
    if (!selectedUser || !selectedWeek) return;
    
    setLoading(true);
    try {
      const response = await gameAPI.getGames(selectedWeek);
      setGames(response.data.games || []);
      
      // Load user's existing picks
      const picksResponse = await adminAPI.getUserPicks(selectedUser.id, selectedWeek);
      const picksData = {};
      if (picksResponse.data.picks) {
        picksResponse.data.picks.forEach(pick => {
          picksData[`GAME${pick.game}`] = pick.guess;
          picksData[`VAL${pick.game}`] = pick.weight;
        });
      }
      setUserPicks(picksData);
    } catch (error) {
      console.error('Error loading user games:', error);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = (searchTerm) => {
    setUserSearch(searchTerm);
    setShowUserDropdown(true);
    
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.realname && user.realname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredUsers(filtered);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearch(user.nickname || user.realname || user.email || '');
    setShowUserDropdown(false);
  };

  const handleUserSearchFocus = () => {
    setShowUserDropdown(true);
  };

  const handleUserSearchBlur = () => {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => setShowUserDropdown(false), 200);
  };

  const handlePickChange = (gameId, team) => {
    setUserPicks(prev => ({
      ...prev,
      [`GAME${gameId}`]: team
    }));
  };

  const handleValueChange = (gameId, value) => {
    setUserPicks(prev => ({
      ...prev,
      [`VAL${gameId}`]: parseInt(value)
    }));
  };

  const saveUserPicks = async () => {
    if (!selectedUser || !selectedWeek) return;
    
    setLoading(true);
    try {
      await adminAPI.submitUserPicks(selectedUser.id, selectedWeek, userPicks);
      setSuccess('Picks saved successfully');
    } catch (error) {
      console.error('Error saving picks:', error);
      setError('Failed to save picks');
    } finally {
      setLoading(false);
    }
  };

  const runUpdateScript = async (scriptType) => {
    setLoading(true);
    try {
      const response = await adminAPI.runScript(scriptType);
      setSuccess(response.data.message);
    } catch (error) {
      console.error(`Error running ${scriptType} script:`, error);
      setError(`Failed to run ${scriptType} script`);
    } finally {
      setLoading(false);
    }
  };

  const renderPicksStatus = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Picks Status</h2>
        <CustomDropdown
          options={weeks.map ? weeks.map(week => ({ value: week.id, label: `Week ${week.number}` })) : []}
          value={selectedWeek}
          onChange={setSelectedWeek}
          placeholder="Select Week"
        />
      </div>
      
      <div className="picks-status-content">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="picks-status-list">
            {picksStatus && picksStatus.length > 0 ? (
              picksStatus.map((user, index) => (
                <div key={index} className="picks-status-item">
                  <span className="user-name">{user.name}</span>
                  <div className="status-indicator">
                    {user.hasPicks ? (
                      <CheckCircle className="status-icon success" size={16} />
                    ) : (
                      <XCircle className="status-icon error" size={16} />
                    )}
                    <span className="status-text">
                      {user.hasPicks ? 'Picks Entered' : 'No Picks'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No picks status data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderEnterPicks = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Enter Picks for User</h2>
        <div className="user-search-container">
          <div className="user-dropdown-wrapper">
            <div className="search-input">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                onFocus={handleUserSearchFocus}
                onBlur={handleUserSearchBlur}
              />
            </div>
            {showUserDropdown && (
              <div className="user-dropdown">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="user-dropdown-item"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="user-info">
                        <div className="user-name">
                          {user.nickname || user.realname || 'No Name'}
                        </div>
                        {user.realname && user.nickname && (
                          <div className="user-realname">{user.realname}</div>
                        )}
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="user-dropdown-item no-users">
                    <div className="user-info">
                      <div className="user-name">No users found</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedUser ? (
        <div className="user-picks-interface">
          <div className="selected-user-info">
            <h3>Making picks for: {selectedUser.nickname || selectedUser.realname || selectedUser.email}</h3>
            <CustomDropdown
              options={weeks.map ? weeks.map(week => ({ value: week.id, label: `Week ${week.number}` })) : []}
              value={selectedWeek}
              onChange={setSelectedWeek}
              placeholder="Select Week"
            />
          </div>
          
          <div className="games-container glass-container">
            <div className="main-panel-header">
              <div className="header-row">
                <h2>Week {selectedWeek ? weeks.find(w => w.id === selectedWeek)?.number : ''}</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div className="classic-games-list">
                {games && games.length > 0 ? games.map((game) => (
                  <div key={game.id} className="classic-game-row">
                    <div className="game-row-main">
                      {/* Away Team Info */}
                      <div className="team-info-section away-team">
                        <div className="team-logo-section mobile-logo">
                          <img 
                            src={`/images/${game.away_name.toLowerCase()}.svg`}
                            alt={game.away_name}
                            className="team-logo-large"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                        <div className="team-name-small">{game.away_city} {game.away_name}</div>
                        <div className="team-record-small">
                          ({game.away_wins}-{game.away_losses}
                          {game.away_ties > 0 && `-${game.away_ties}`}) Away
                        </div>
                      </div>

                      {/* Away Team Logo */}
                      <div className="team-logo-section">
                        <img 
                          src={`/images/${game.away_name.toLowerCase()}.svg`}
                          alt={game.away_name}
                          className="team-logo-large"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>

                      {/* Away Team Radio Button */}
                      <div className="radio-section">
                        <label className="custom-radio">
                          <input
                            type="radio"
                            name={`GAME${game.id}`}
                            value={game.away_id}
                            checked={userPicks[`GAME${game.id}`] == game.away_id}
                            onChange={() => handlePickChange(game.id, game.away_id)}
                          />
                          <span className="radio-mark"></span>
                        </label>
                      </div>

                      {/* VS Divider */}
                      <div className="vs-divider">@</div>

                      {/* Home Team Radio Button */}
                      <div className="radio-section">
                        <label className="custom-radio">
                          <input
                            type="radio"
                            name={`GAME${game.id}`}
                            value={game.home_id}
                            checked={userPicks[`GAME${game.id}`] == game.home_id}
                            onChange={() => handlePickChange(game.id, game.home_id)}
                          />
                          <span className="radio-mark"></span>
                        </label>
                      </div>

                      {/* Home Team Logo */}
                      <div className="team-logo-section">
                        <img 
                          src={`/images/${game.home_name.toLowerCase()}.svg`}
                          alt={game.home_name}
                          className="team-logo-large"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>

                      {/* Home Team Info */}
                      <div className="team-info-section home-team">
                        <div className="team-logo-section mobile-logo">
                          <img 
                            src={`/images/${game.home_name.toLowerCase()}.svg`}
                            alt={game.home_name}
                            className="team-logo-large"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                        <div className="team-name-small">{game.home_city} {game.home_name}</div>
                        <div className="team-record-small">
                          ({game.home_wins}-{game.home_losses}
                          {game.home_ties > 0 && `-${game.home_ties}`}) Home
                        </div>
                      </div>
                    </div>

                    {/* Point Value Selector */}
                    <div className="point-selector">
                      <CustomDropdown
                        options={[
                          { value: 0, label: 'Select Points' },
                          ...Array.from({ length: games.length }, (_, i) => ({
                            value: i + 1,
                            label: (i + 1).toString()
                          }))
                        ]}
                        value={userPicks[`VAL${game.id}`] || 0}
                        onChange={(value) => handleValueChange(game.id, value)}
                        placeholder="Points"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="no-data">
                    <p>No games available for this week</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="submit-section">
              <button 
                className="glass-button primary"
                onClick={saveUserPicks}
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Picks'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-user-selected">
          <p>Search and select a user to make picks for them</p>
        </div>
      )}
    </div>
  );

  const renderUpdateScripts = () => (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Update Scripts</h2>
        <p>Run database update scripts</p>
      </div>
      
      <div className="update-scripts-content">
        <div className="script-buttons">
          <button 
            className="script-button"
            onClick={() => runUpdateScript('individualRecords')}
            disabled={loading}
          >
            <Database className="script-icon" size={20} />
            Update Individual Records
          </button>
          
          <button 
            className="script-button"
            onClick={() => runUpdateScript('losers')}
            disabled={loading}
          >
            <Database className="script-icon" size={20} />
            Update Losers
          </button>
          
          <button 
            className="script-button"
            onClick={() => runUpdateScript('teamRecords')}
            disabled={loading}
          >
            <Database className="script-icon" size={20} />
            Update Team Records
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h1>Access Denied</h1>
          <p>You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-navigation glass-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage picks and run system updates</p>
        </div>
        
        <div className="admin-nav-buttons">
          <button 
            className={`admin-nav-button ${activePanel === 'picks-status' ? 'active' : ''}`}
            onClick={() => {
              setActivePanel('picks-status');
              setSuccess('');
              setError('');
            }}
          >
            <CheckCircle size={20} />
            Picks Status
          </button>
          
          <button 
            className={`admin-nav-button ${activePanel === 'enter-picks' ? 'active' : ''}`}
            onClick={() => {
              setActivePanel('enter-picks');
              setSuccess('');
              setError('');
            }}
          >
            <Users size={20} />
            Enter Picks
          </button>
          
          <button 
            className={`admin-nav-button ${activePanel === 'update-scripts' ? 'active' : ''}`}
            onClick={() => {
              setActivePanel('update-scripts');
              setSuccess('');
              setError('');
            }}
          >
            <Database size={20} />
            Update Scripts
          </button>
        </div>
      </div>

      <div className="admin-content glass-container">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {activePanel === 'picks-status' && renderPicksStatus()}
        {activePanel === 'enter-picks' && renderEnterPicks()}
        {activePanel === 'update-scripts' && renderUpdateScripts()}
      </div>
    </div>
  );
}

export default Admin;
