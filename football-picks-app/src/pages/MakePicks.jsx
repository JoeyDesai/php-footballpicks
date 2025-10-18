import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { gameAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CustomDropdown from '../components/CustomDropdown';

function MakePicks() {
  const { user } = useAuth();
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [viewMode, setViewMode] = useState('tiles'); // 'tiles', 'classic', 'dragdrop'
  const [autoPickHighest, setAutoPickHighest] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);

  // Helper function to map team names to image file names
  const getTeamImageName = (teamName) => {
    const teamMap = {
      '49ers': '49ers',
      'Bears': 'bears',
      'Bengals': 'bengals',
      'Bills': 'bills',
      'Broncos': 'broncos',
      'Browns': 'browns',
      'Buccaneers': 'buccaneers',
      'Cardinals': 'cardinals',
      'Chargers': 'chargers',
      'Chiefs': 'chiefs',
      'Colts': 'colts',
      'Commanders': 'commanders',
      'Cowboys': 'cowboys',
      'Dolphins': 'dolphins',
      'Eagles': 'eagles',
      'Falcons': 'falcons',
      'Giants': 'giants',
      'Jaguars': 'jaguars',
      'Jets': 'jets',
      'Lions': 'lions',
      'Packers': 'packers',
      'Panthers': 'panthers',
      'Patriots': 'patriots',
      'Raiders': 'raiders',
      'Rams': 'rams',
      'Ravens': 'ravens',
      'Saints': 'saints',
      'Seahawks': 'seahawks',
      'Steelers': 'steelers',
      'Texans': 'texans',
      'Titans': 'titans',
      'Vikings': 'vikings'
    };
    return teamMap[teamName] || teamName.toLowerCase();
  };

  // Helper function to format date/time to Eastern time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'TBD';
    }
  };

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadGamesAndPicks();
    }
  }, [selectedWeek]);

  const loadWeeks = async () => {
    try {
      const response = await gameAPI.getWeeks();
      if (response.data.success) {
        setWeeks(response.data.weeks);
        // Auto-select next week to make picks for (same strategy as weekly standings but +1)
        const completedWeeks = response.data.weeks.filter(w => w.completed);
        const currentWeek = completedWeeks[completedWeeks.length - 1] || response.data.weeks[0];
        
        // Find the next week after the current week
        const currentIndex = response.data.weeks.findIndex(w => w.id === currentWeek.id);
        const nextWeek = response.data.weeks[currentIndex + 1];
        
        // Select the next week if it exists, otherwise fall back to current week
        setSelectedWeek(nextWeek || currentWeek);
      }
    } catch (error) {
      setError('Failed to load weeks');
    } finally {
      setLoading(false);
    }
  };

  const loadGamesAndPicks = async () => {
    try {
      setLoading(true);
      const [gamesResponse, picksResponse] = await Promise.all([
        gameAPI.getGames(selectedWeek.id),
        gameAPI.getPicks(selectedWeek.id)
      ]);

      if (gamesResponse.data.success) {
        setGames(gamesResponse.data.games);
        setReadOnly(gamesResponse.data.readOnly || false);
      }

      if (picksResponse.data.success) {
        const existingPicks = {};
        picksResponse.data.picks.forEach(pick => {
          existingPicks[`GAME${pick.game}`] = pick.guess;
          existingPicks[`VAL${pick.game}`] = pick.weight;
        });
        setPicks(existingPicks);
      }
    } catch (error) {
      setError('Failed to load games and picks');
    } finally {
      setLoading(false);
    }
  };

  const handlePickChange = (gameId, team) => {
    const newPicks = {
      ...picks,
      [`GAME${gameId}`]: team
    };

    // Auto-assign highest available point value if auto-pick is enabled
    if (autoPickHighest) {
      const usedValues = new Set();
      games.forEach(game => {
        const value = newPicks[`VAL${game.id}`];
        if (value && value !== 0) {
          usedValues.add(value);
        }
      });

      // Find the highest unused value
      let highestUnused = 0;
      for (let i = games.length; i >= 1; i--) {
        if (!usedValues.has(i)) {
          highestUnused = i;
          break;
        }
      }

      if (highestUnused > 0) {
        newPicks[`VAL${gameId}`] = highestUnused;
      }
    }

    setPicks(newPicks);
    setError('');
    setSuccess('');
    
    // Only clear validation errors if picks are now valid
    const errors = validatePicks();
    if (errors.length === 0) {
      setValidationErrors([]);
    }
  };

  const handleAutoPickToggle = () => {
    setAutoPickHighest(!autoPickHighest);
    // Clear validation errors when toggling auto pick to prevent red glow
    setValidationErrors([]);
    setError('');
    setSuccess('');
  };

  const handleValueChange = (gameId, value) => {
    const newPicks = {
      ...picks,
      [`VAL${gameId}`]: parseInt(value)
    };
    
    setPicks(newPicks);
    setError('');
    setSuccess('');
    
    // Only clear validation errors if picks are now valid
    const errors = validatePicks();
    if (errors.length === 0) {
      setValidationErrors([]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetPointValue) => {
    e.preventDefault();
    const gameId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (!gameId) return;

    // Remove the game from its current point value
    const currentPicks = { ...picks };
    Object.keys(currentPicks).forEach(key => {
      if (key.startsWith('VAL') && currentPicks[key] === targetPointValue) {
        currentPicks[key] = 0;
      }
    });

    // Set the new point value
    currentPicks[`VAL${gameId}`] = targetPointValue;
    setPicks(currentPicks);
    setError('');
    setSuccess('');
    
    // Only clear validation errors if picks are now valid
    const errors = validatePicks();
    if (errors.length === 0) {
      setValidationErrors([]);
    }
  };

  const validatePicks = () => {
    const usedValues = new Set();
    const errors = [];

    games.forEach(game => {
      const pick = picks[`GAME${game.id}`];
      const value = picks[`VAL${game.id}`];

      if (!pick) {
        errors.push(`Please select a winner for ${game.away_city} ${game.away_name} @ ${game.home_city} ${game.home_name}`);
      }

      if (!value || value === 0) {
        errors.push(`Please assign a point value for ${game.away_city} ${game.away_name} @ ${game.home_city} ${game.home_name}`);
      } else if (usedValues.has(value)) {
        errors.push(`Point value ${value} is used more than once`);
      } else {
        usedValues.add(value);
      }
    });

    return errors;
  };

  // Check if a game tile needs attention (blue glow)
  const isGameIncomplete = (gameId) => {
    const pick = picks[`GAME${gameId}`];
    const value = picks[`VAL${gameId}`];
    
    // Must have both team selection and point value
    if (!pick || !value || value === 0) return true;
    
    // Check for duplicate point values
    const usedValues = new Set();
    games.forEach(game => {
      if (game.id !== gameId) {
        const gameValue = picks[`VAL${game.id}`];
        if (gameValue && gameValue !== 0) {
          usedValues.add(gameValue);
        }
      }
    });
    
    // Stay blue if point value is duplicated
    return usedValues.has(value);
  };

  // Check if a game has validation errors (red glow) - only when submit is attempted
  const hasGameValidationError = (gameId) => {
    // Only show red glow if validation has been attempted (submit clicked)
    if (validationErrors.length === 0) return false;
    
    const pick = picks[`GAME${gameId}`];
    const value = picks[`VAL${gameId}`];
    
    if (!pick || !value || value === 0) return true;
    
    // Check for duplicate point values
    const usedValues = new Set();
    games.forEach(game => {
      if (game.id !== gameId) {
        const gameValue = picks[`VAL${game.id}`];
        if (gameValue && gameValue !== 0) {
          usedValues.add(gameValue);
        }
      }
    });
    
    return usedValues.has(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validatePicks();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError(errors.join('. '));
      return;
    }

    // Clear validation errors and error messages when submitting successfully
    setValidationErrors([]);
    setError('');
    setSaving(true);

    try {
      const response = await gameAPI.submitPicks(selectedWeek.id, picks);
      if (response.data.success) {
        setSuccess('Picks saved successfully!');
        // Clear success message after animation
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || 'Failed to save picks');
      }
    } catch (error) {
      setError('Network error while saving picks');
    } finally {
      setSaving(false);
    }
  };

  const getUnusedValues = () => {
    const usedValues = new Set();
    games.forEach(game => {
      const value = picks[`VAL${game.id}`];
      if (value && value !== 0) {
        usedValues.add(value);
      }
    });

    const unused = [];
    for (let i = 1; i <= games.length; i++) {
      if (!usedValues.has(i)) {
        unused.push(i);
      }
    }
    return unused;
  };

  if (loading) {
    return (
      <div className="picks-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const renderTilesView = () => (
    <div className="games-container glass-container">
      <div className="main-panel-header">
        <div className="header-row">
          <h2>Week {selectedWeek?.number}</h2>
          {!readOnly && (
            <button
              type="button"
              className={`auto-pick-button ${autoPickHighest ? 'active' : ''}`}
              onClick={handleAutoPickToggle}
            >
              <Zap size={16} />
              Auto Pick Highest Points
            </button>
          )}
        </div>
        {!readOnly && (
          <div className="unused-values-inline">
            <h3>Unused Point Values:</h3>
            <div className="values-list">
              {getUnusedValues().map(value => (
                <span key={value} className="unused-value">{value}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="games-grid">
        {games.map((game, index) => (
          <div 
            key={game.id} 
            className={`game-card ${
              validationErrors.length > 0 && hasGameValidationError(game.id) ? 'validation-error' :
              isGameIncomplete(game.id) ? 'incomplete' : ''
            }`}
          >
            <div className="game-header">
              <span className="game-date">{formatDateTime(game.date)}</span>
            </div>
            
            <div className="teams-container">
              {/* Away Team */}
              <div className="team-option">
                <div className="team-info">
                  <img 
                    src={`/images/${getTeamImageName(game.away_name)}.svg`}
                    alt={game.away_name}
                    className="team-logo"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                      <div className="team-details">
                        <div className="team-name">{game.away_city} {game.away_name}</div>
                        <div className="team-record">
                          ({game.away_wins}-{game.away_losses}
                          {game.away_ties > 0 && `-${game.away_ties}`}) Away
                        </div>
                      </div>
                </div>
                {!readOnly && (
                  <label className="custom-radio">
                    <input
                      type="radio"
                      name={`GAME${game.id}`}
                      value={game.away_id}
                      checked={picks[`GAME${game.id}`] == game.away_id}
                      onChange={() => handlePickChange(game.id, game.away_id)}
                    />
                    <span className="radio-mark"></span>
                  </label>
                )}
                {readOnly && picks[`GAME${game.id}`] == game.away_id && (
                  <div className="pick-indicator">✓</div>
                )}
              </div>

              <div className="vs-divider">@</div>

              {/* Home Team */}
              <div className="team-option">
                <div className="team-info">
                  <img 
                    src={`/images/${getTeamImageName(game.home_name)}.svg`}
                    alt={game.home_name}
                    className="team-logo"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                      <div className="team-details">
                        <div className="team-name">{game.home_city} {game.home_name}</div>
                        <div className="team-record">
                          ({game.home_wins}-{game.home_losses}
                          {game.home_ties > 0 && `-${game.home_ties}`}) Home
                        </div>
                      </div>
                </div>
                {!readOnly && (
                  <label className="custom-radio">
                    <input
                      type="radio"
                      name={`GAME${game.id}`}
                      value={game.home_id}
                      checked={picks[`GAME${game.id}`] == game.home_id}
                      onChange={() => handlePickChange(game.id, game.home_id)}
                    />
                    <span className="radio-mark"></span>
                  </label>
                )}
                {readOnly && picks[`GAME${game.id}`] == game.home_id && (
                  <div className="pick-indicator">✓</div>
                )}
              </div>
            </div>

            <div className="point-value">
              <label>Point Value:</label>
              {!readOnly ? (
                <CustomDropdown
                  options={[
                    { value: 0, label: 'Select Points' },
                    ...Array.from({ length: games.length }, (_, i) => ({
                      value: i + 1,
                      label: (i + 1).toString()
                    }))
                  ]}
                  value={picks[`VAL${game.id}`] || 0}
                  onChange={(value) => handleValueChange(game.id, value)}
                  placeholder="Select Points"
                />
              ) : (
                <div className={`point-display ${
                  game.winner && picks[`GAME${game.id}`] == game.winner ? 'correct' :
                  game.winner && picks[`GAME${game.id}`] != game.winner ? 'incorrect' : 'pending'
                }`}>
                  {picks[`VAL${game.id}`] || 0}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="submit-section">
          <button
            type="submit"
            className="glass-button primary"
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Picks'}
          </button>
          {validationErrors.length > 0 && (
            <div className="validation-message">
              <AlertCircle size={16} />
              <span>Please complete all highlighted games</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderClassicView = () => (
    <div className="games-container glass-container">
      <div className="main-panel-header">
        <div className="header-row">
          <h2>Week {selectedWeek?.number}</h2>
          {!readOnly && (
            <button
              type="button"
              className={`auto-pick-button ${autoPickHighest ? 'active' : ''}`}
              onClick={handleAutoPickToggle}
            >
              <Zap size={16} />
              Auto Pick Highest Points
            </button>
          )}
        </div>
        {!readOnly && (
          <div className="unused-values-inline">
            <h3>Unused Point Values:</h3>
            <div className="values-list">
              {getUnusedValues().map(value => (
                <span key={value} className="unused-value">{value}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="classic-games-list">
        {games.map((game, index) => (
          <div 
            key={game.id} 
            className={`classic-game-row ${
              validationErrors.length > 0 && hasGameValidationError(game.id) ? 'validation-error' :
              isGameIncomplete(game.id) ? 'incomplete' : ''
            }`}
          >
            <div className="game-row-main">
              {/* Away Team Info */}
              <div className="team-info-section away-team">
                <div className="team-logo-section mobile-logo">
                  <img 
                    src={`/images/${getTeamImageName(game.away_name)}.svg`}
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
                  src={`/images/${getTeamImageName(game.away_name)}.svg`}
                  alt={game.away_name}
                  className="team-logo-large"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>

              {/* Away Team Radio Button */}
              <div className="radio-section">
                {!readOnly && (
                  <label className="custom-radio">
                    <input
                      type="radio"
                      name={`GAME${game.id}`}
                      value={game.away_id}
                      checked={picks[`GAME${game.id}`] == game.away_id}
                      onChange={() => handlePickChange(game.id, game.away_id)}
                    />
                    <span className="radio-mark"></span>
                  </label>
                )}
                {readOnly && picks[`GAME${game.id}`] == game.away_id && (
                  <div className="pick-indicator">✓</div>
                )}
              </div>

              {/* VS Divider */}
              <div className="vs-divider">@</div>

              {/* Home Team Radio Button */}
              <div className="radio-section">
                {!readOnly && (
                  <label className="custom-radio">
                    <input
                      type="radio"
                      name={`GAME${game.id}`}
                      value={game.home_id}
                      checked={picks[`GAME${game.id}`] == game.home_id}
                      onChange={() => handlePickChange(game.id, game.home_id)}
                    />
                    <span className="radio-mark"></span>
                  </label>
                )}
                {readOnly && picks[`GAME${game.id}`] == game.home_id && (
                  <div className="pick-indicator">✓</div>
                )}
              </div>

              {/* Home Team Logo */}
              <div className="team-logo-section">
                <img 
                  src={`/images/${getTeamImageName(game.home_name)}.svg`}
                  alt={game.home_name}
                  className="team-logo-large"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>

              {/* Home Team Info */}
              <div className="team-info-section home-team">
                <div className="team-logo-section mobile-logo">
                  <img 
                    src={`/images/${getTeamImageName(game.home_name)}.svg`}
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
              {!readOnly ? (
                <CustomDropdown
                  options={[
                    { value: 0, label: 'Select Points' },
                    ...Array.from({ length: games.length }, (_, i) => ({
                      value: i + 1,
                      label: (i + 1).toString()
                    }))
                  ]}
                  value={picks[`VAL${game.id}`] || 0}
                  onChange={(value) => handleValueChange(game.id, value)}
                  placeholder="Points"
                />
              ) : (
                <div className={`point-display ${
                  game.winner && picks[`GAME${game.id}`] == game.winner ? 'correct' :
                  game.winner && picks[`GAME${game.id}`] != game.winner ? 'incorrect' : 'pending'
                }`}>
                  {picks[`VAL${game.id}`] || 0}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="submit-section">
          <button
            type="submit"
            className="glass-button primary"
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Picks'}
          </button>
          {validationErrors.length > 0 && (
            <div className="validation-message">
              <AlertCircle size={16} />
              <span>Please complete all highlighted games</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDragDropView = () => (
    <div className="games-container glass-container">
      <div className="main-panel-header">
        <h2>Week {selectedWeek?.number}</h2>
        <p className="drag-instructions">Drag games to assign point values</p>
      </div>
      
      <div className="drag-drop-container">
        <div className="point-sections">
          {Array.from({ length: games.length }, (_, i) => {
            const pointValue = i + 1;
            const gameInSection = games.find(game => picks[`VAL${game.id}`] == pointValue);
            
            return (
              <div key={pointValue} className="point-section">
                <div className="point-section-header">
                  <span className="point-value-label">{pointValue}</span>
                </div>
                <div 
                  className="point-section-content"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, pointValue)}
                >
                  {gameInSection ? (
                    <div 
                      className="dragged-game"
                      draggable={!readOnly}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', gameInSection.id.toString());
                      }}
                    >
                      <img 
                        src={`/images/${getTeamImageName(gameInSection.away_name)}.svg`}
                        alt={gameInSection.away_name}
                        className="team-logo-tiny"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <span className="game-text">
                        {gameInSection.away_city} @ {gameInSection.home_city}
                      </span>
                    </div>
                  ) : (
                    <div className="empty-slot">Drop here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="available-games">
          <h3>Available Games</h3>
          <div className="games-list">
            {games.filter(game => !picks[`VAL${game.id}`] || picks[`VAL${game.id}`] == 0).map(game => (
              <div 
                key={game.id} 
                className="available-game"
                draggable={!readOnly}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', game.id.toString());
                }}
              >
                <img 
                  src={`/images/${getTeamImageName(game.away_name)}.svg`}
                  alt={game.away_name}
                  className="team-logo-tiny"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <span className="game-text">
                  {game.away_city} @ {game.home_city}
                </span>
                <span className="game-time-small">{formatDateTime(game.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="picks-container">
      {/* Controls Section */}
      <div className="picks-header glass-container">
        <div className="header-content">
          <div className="title-section">
            <h1>Make Your Picks {user?.nickname || user?.name || ''}</h1>
          </div>
          
          <div className="controls">
            <div className="view-toggle">
              <label htmlFor="view-toggle">View</label>
              <div className="slider-container">
                <div className="slider-track">
                  <div className={`slider-thumb ${viewMode === 'tiles' ? 'slider-thumb-left' : viewMode === 'classic' ? 'slider-thumb-center' : 'slider-thumb-right'}`}>
                  </div>
                  <div className="slider-track-labels">
                    <span 
                      className={`track-label ${viewMode === 'tiles' ? 'track-label-active' : 'track-label-inactive'}`}
                      onClick={() => setViewMode('tiles')}
                    >
                      <span className="desktop-text">Tiles</span>
                      <span className="mobile-text">Tiles</span>
                    </span>
                    <span 
                      className={`track-label ${viewMode === 'classic' ? 'track-label-active' : 'track-label-inactive'}`}
                      onClick={() => setViewMode('classic')}
                    >
                      <span className="desktop-text">Classic</span>
                      <span className="mobile-text">Classic</span>
                    </span>
                    <span 
                      className={`track-label ${viewMode === 'dragdrop' ? 'track-label-active' : 'track-label-inactive'}`}
                      onClick={() => setViewMode('dragdrop')}
                    >
                      <span className="desktop-text">Drag n Drop</span>
                      <span className="mobile-text">Drag</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="week-selector">
              <label htmlFor="week-select">Week</label>
              <CustomDropdown
                options={weeks.map(week => ({
                  value: week.id,
                  label: `Week ${week.number}`
                }))}
                value={selectedWeek?.id || ''}
                onChange={(value) => {
                  const week = weeks.find(w => w.id === parseInt(value));
                  setSelectedWeek(week);
                  // Clear validation errors when switching weeks
                  setValidationErrors([]);
                  setError('');
                }}
                placeholder="Select Week"
              />
            </div>
          </div>
        </div>

        {selectedWeek && (
          <div className="week-info">
            {selectedWeek.factor !== 1 && (
              <p className="multiplier-notice">
                <AlertCircle size={16} />
                All scores will be multiplied by {selectedWeek.factor} this week!
              </p>
            )}
            {readOnly && (
              <p className="readonly-notice">
                <Clock size={16} />
                This week has already started. Picks cannot be changed.
              </p>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="floating-success-notification">
          <div className="success-content">
            <CheckCircle size={20} />
            <span>Picks submitted successfully!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="picks-form">
        {viewMode === 'tiles' && renderTilesView()}
        {viewMode === 'classic' && renderClassicView()}
        {viewMode === 'dragdrop' && renderDragDropView()}
      </form>

      <style jsx="true">{`
        .picks-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem 4rem 1rem;
        }

        /* Header Controls */
        .picks-header {
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 999 !important;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        }

        .title-section {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0;
          text-align: center;
        }

        .controls {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }

        @media (min-width: 890px) {
          .controls {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            width: 100%;
          }
        }

        @media (min-width: 1024px) {
          .controls {
            grid-template-columns: repeat(2, auto);
            gap: 1.5rem;
            width: auto;
          }
        }

        .week-selector,
        .view-toggle {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .week-selector label,
        .view-toggle label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Z-index stacking for dropdowns */
        .week-selector .custom-dropdown {
          z-index: 1001 !important;
        }

        .week-selector .custom-dropdown .dropdown-menu {
          z-index: 1001 !important;
        }

        .view-toggle .custom-dropdown {
          z-index: 950 !important;
        }

        .view-toggle .custom-dropdown .dropdown-menu {
          z-index: 950 !important;
        }

        /* Point value dropdowns in game cards - normal z-index for buttons, high for menus */
        .point-value .custom-dropdown {
          position: relative;
        }

        .point-value .custom-dropdown .dropdown-trigger {
          position: relative;
        }

        .point-value .custom-dropdown .dropdown-menu {
          z-index: 10000 !important;
          position: fixed !important;
          overflow: auto !important;
          max-height: 200px !important;
          background: rgba(20, 20, 30, 0.6) !important;
        }

        .point-value .custom-dropdown .dropdown-option {
          z-index: 10000 !important;
        }

        /* Classic view point dropdowns - normal z-index for buttons, high for menus */
        .point-selector .custom-dropdown {
          position: relative !important;
        }

        .point-selector .custom-dropdown .dropdown-trigger {
          position: relative;
        }

        .point-selector .custom-dropdown .dropdown-menu {
          z-index: 999999 !important;
          position: fixed !important;
          overflow: auto !important;
          max-height: 200px !important;
          background: rgba(20, 20, 30, 0.6) !important;
        }

        .point-selector .custom-dropdown .dropdown-option {
          z-index: 10000 !important;
        }

        /* Override inline styles for classic view dropdown buttons (lower z-index) */
        .point-selector .custom-dropdown[style*="z-index"] {
          z-index: auto !important;
        }

        .point-selector .custom-dropdown .dropdown-trigger[style*="z-index"] {
          z-index: auto !important;
        }

        /* Override inline styles for classic view dropdown menus (higher z-index) */
        .point-selector .custom-dropdown .dropdown-menu[style*="z-index"] {
          z-index: 10000 !important;
        }

        .point-selector .custom-dropdown .dropdown-option[style*="z-index"] {
          z-index: 10000 !important;
        }

        /* Force classic view dropdown buttons to stay low, menus to appear above everything */
        .classic-games-list .point-selector .custom-dropdown {
          position: relative;
        }

        .classic-games-list .point-selector .custom-dropdown .dropdown-trigger {
          position: relative;
        }

        .classic-games-list .point-selector .custom-dropdown .dropdown-menu {
          z-index: 999999 !important;
          position: absolute !important;
        }

        .classic-games-list .point-selector .custom-dropdown .dropdown-option {
          z-index: 999999 !important;
        }

        /* Make dropdown options shorter - more specific selectors */
        .point-value .custom-dropdown .dropdown-menu .dropdown-option,
        .point-selector .custom-dropdown .dropdown-menu .dropdown-option {
          padding: 0.4rem 0.75rem !important;
          font-size: 0.9rem !important;
          min-height: auto !important;
          line-height: 1.2 !important;
        }

        /* Override inline z-index styles for tiles view */
        .point-value .custom-dropdown[style*="z-index"] {
          z-index: auto !important;
        }

        .point-value .custom-dropdown .dropdown-trigger[style*="z-index"] {
          z-index: auto !important;
        }

        .point-value .custom-dropdown .dropdown-menu[style*="z-index"] {
          z-index: 10000 !important;
        }

        .point-value .custom-dropdown .dropdown-option[style*="z-index"] {
          z-index: 10000 !important;
        }

        .custom-dropdown {
          width: 180px !important;
        }

        /* Prevent scroll interference with dropdowns */
        .custom-dropdown .dropdown-menu {
          overscroll-behavior: contain !important;
          touch-action: pan-y !important;
        }

        .custom-dropdown .dropdown-option {
          overscroll-behavior: contain !important;
        }

        /* Global dropdown styling overrides */
        .games-container .custom-dropdown {
          position: relative !important;
        }

        .games-container .custom-dropdown .dropdown-menu {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          right: 0 !important;
          background: rgba(20, 20, 30, 0.6) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          padding-right: 2px !important;
          z-index: 999999 !important;
        }

        /* Custom scrollbar for dropdown menus */
        .games-container .custom-dropdown .dropdown-menu::-webkit-scrollbar {
          width: 4px !important;
        }

        .games-container .custom-dropdown .dropdown-menu::-webkit-scrollbar-track {
          background: transparent !important;
          border-radius: 0 8px 8px 0 !important;
        }

        .games-container .custom-dropdown .dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 200, 0.4) !important;
          border-radius: 0 4px 4px 0 !important;
          transition: all 0.3s ease !important;
        }

        .games-container .custom-dropdown .dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 200, 0.6) !important;
        }

        .games-container .custom-dropdown .dropdown-menu::-webkit-scrollbar-corner {
          background: transparent !important;
        }

        .games-container .custom-dropdown .dropdown-option {
          padding: 0.4rem 0.75rem !important;
          font-size: 0.9rem !important;
          color: rgba(255, 255, 255, 0.9) !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .games-container .custom-dropdown .dropdown-option:last-child {
          border-bottom: none !important;
        }

        .games-container .custom-dropdown .dropdown-option:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .games-container .custom-dropdown .dropdown-option.selected {
          background: rgba(100, 150, 255, 0.2) !important;
          color: rgba(150, 200, 255, 1) !important;
        }

        /* View Toggle Slider */
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 450px;
        }

        .slider-track {
          position: relative;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          height: 40px;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .slider-track:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .slider-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: calc(33.333% - 2px);
          height: calc(100% - 4px);
          background: rgba(100, 150, 255, 0.15);
          border: 1px solid rgba(100, 150, 255, 0.4);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 0 3px rgba(100, 150, 255, 0.1),
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          z-index: 2;
        }

        .slider-thumb-center {
          left: calc(33.333% - 2px);
        }

        .slider-thumb-right {
          left: calc(66.666% - 2px);
        }

        .slider-track-labels {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-around;
          pointer-events: none;
          z-index: 1;
        }

        .track-label {
          font-size: 0.8rem;
          font-weight: 500;
          text-align: center;
          flex: 1;
          cursor: pointer;
          pointer-events: auto;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .track-label:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .track-label-active {
          color: rgba(150, 200, 255, 1);
        }

        .track-label-inactive {
          color: rgba(255, 255, 255, 0.4);
        }

        .desktop-text {
          display: inline;
        }

        .mobile-text {
          display: none;
        }

        @media (max-width: 889px) {
          .desktop-text {
            display: none;
          }

          .mobile-text {
            display: inline;
          }
        }

        /* Week Info */
        .week-info {
          margin-top: 1rem;
          text-align: center;
        }

        .multiplier-notice,
        .readonly-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: rgba(255, 200, 100, 1);
          font-weight: 500;
          margin: 0.5rem 0;
        }

        /* Error/Success Messages */
        .error-message,
        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .error-message {
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid rgba(255, 100, 100, 0.3);
          color: rgba(255, 150, 150, 1);
        }

        .success-message {
          background: rgba(100, 255, 100, 0.2);
          border: 1px solid rgba(100, 255, 100, 0.3);
          color: rgba(150, 255, 150, 1);
        }

        /* Main Panel Header */
        .main-panel-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .main-panel-header h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .auto-pick-button {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .auto-pick-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .auto-pick-button.active {
          background: rgba(100, 150, 255, 0.15);
          border-color: rgba(100, 150, 255, 0.4);
          color: rgba(150, 200, 255, 1);
          box-shadow: 
            0 0 0 3px rgba(100, 150, 255, 0.1),
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .unused-values-inline {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .unused-values-inline h3 {
          color: white;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .values-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .unused-value {
          background: rgba(100, 150, 255, 0.3);
          border: 1px solid rgba(100, 150, 255, 0.5);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Tiles View */
        .games-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          contain: layout style;
        }

        @media (min-width: 768px) {
          .games-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .games-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .game-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .game-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .game-card.incomplete {
          box-shadow: 0 0 20px rgba(100, 150, 255, 0.3);
          border-color: rgba(100, 150, 255, 0.4);
        }

        .game-card.validation-error {
          box-shadow: 0 0 20px rgba(255, 100, 100, 0.4);
          border-color: rgba(255, 100, 100, 0.6);
        }

        .game-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .game-date {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .teams-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .team-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .team-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .team-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .team-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .team-details {
          flex: 1;
        }

        .team-name {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .team-record {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }

        .vs-divider {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          padding: 0.5rem 0;
        }

        /* Custom Radio Buttons */
        .custom-radio {
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .custom-radio input[type="radio"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .radio-mark {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          position: relative;
        }

        .custom-radio input[type="radio"]:checked + .radio-mark {
          border-color: rgba(100, 150, 255, 0.8);
          background: rgba(100, 150, 255, 0.2);
        }

        .custom-radio input[type="radio"]:checked + .radio-mark::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(100, 150, 255, 1);
        }

        .radio-label {
          margin-left: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .pick-indicator {
          color: rgba(100, 150, 255, 1);
          font-size: 1.2rem;
          font-weight: bold;
        }

        .point-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .point-value label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .point-display {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          min-width: 60px;
          text-align: center;
        }

        .point-display.correct {
          background: rgba(100, 255, 100, 0.2);
          color: rgba(150, 255, 150, 1);
        }

        .point-display.incorrect {
          background: rgba(255, 100, 100, 0.2);
          color: rgba(255, 150, 150, 1);
        }

        .point-display.pending {
          background: rgba(255, 200, 100, 0.2);
          color: rgba(255, 220, 150, 1);
        }

        /* Classic View */
        .classic-games-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          z-index: auto;
        }

        .classic-game-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          min-height: 80px;
          position: relative;
        }

        @media (max-width: 768px) {
          .classic-game-row {
            padding: 0.75rem 0.5rem;
          }
        }

        .classic-game-row:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .classic-game-row.incomplete {
          box-shadow: 0 0 20px rgba(100, 150, 255, 0.3);
          border-color: rgba(100, 150, 255, 0.4);
        }

        .classic-game-row.validation-error {
          box-shadow: 0 0 20px rgba(255, 100, 100, 0.4);
          border-color: rgba(255, 100, 100, 0.6);
        }

        .team-info-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 2;
          max-width: 180px;
        }

        .team-info-section.away-team {
          text-align: right;
          align-items: flex-end;
        }

        .team-info-section.home-team {
          text-align: left;
          align-items: flex-start;
        }

        .team-logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          width: 50px;
        }

        .team-logo-large {
          width: 35px;
          height: 35px;
          object-fit: contain;
        }

        .radio-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          width: 40px;
        }

        .team-name-small {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          line-height: 1.2;
        }

        .team-record-small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          line-height: 1.2;
        }

        .vs-divider {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          font-size: 1.2rem;
          padding: 0 0.1rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .game-row-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
        }

        .point-selector {
          min-width: 120px;
          flex-shrink: 0;
          position: relative;
        }

        .readonly-picks {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        /* Desktop: Keep logos separate from team info */
        @media (min-width: 769px) {
          .team-info-section {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.25rem !important;
            flex: 2 !important;
            max-width: 180px !important;
            position: static !important;
          }

          .team-info-section.away-team {
            text-align: right !important;
            align-items: flex-end !important;
          }

          .team-info-section.home-team {
            text-align: left !important;
            align-items: flex-start !important;
          }

          .team-logo-section {
            width: 50px !important;
            padding: 0 !important;
            flex-shrink: 0 !important;
            margin-bottom: 0 !important;
            display: flex !important;
          }

          .team-logo-large {
            width: 40px !important;
            height: 40px !important;
          }

          /* Hide mobile logos on desktop */
          .mobile-logo {
            display: none !important;
          }
        }

        /* Mobile: Show mobile logos, hide desktop logos */
        @media (max-width: 768px) {
          .mobile-logo {
            display: flex !important;
            justify-content: center;
            margin-bottom: 0.25rem;
          }

          .team-logo-section:not(.mobile-logo) {
            display: none !important;
          }

          .team-logo-large {
            width: 20px !important;
            height: 20px !important;
          }
        }

        /* Drag and Drop View */
        .drag-instructions {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          margin: 0;
        }

        .drag-drop-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .drag-drop-container {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .point-sections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .point-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .point-section-header {
          background: rgba(100, 150, 255, 0.2);
          padding: 0.75rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .point-value-label {
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .point-section-content {
          padding: 1rem;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dragged-game {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(100, 150, 255, 0.2);
          border: 1px solid rgba(100, 150, 255, 0.4);
          border-radius: 8px;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .dragged-game:hover {
          background: rgba(100, 150, 255, 0.3);
        }

        .dragged-game:active {
          cursor: grabbing;
        }

        .empty-slot {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          text-align: center;
          padding: 1rem;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
        }

        .available-games {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
        }

        .available-games h3 {
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .games-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .available-game {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .available-game:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .available-game:active {
          cursor: grabbing;
        }

        .team-logo-tiny {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .game-text {
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .game-time-small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          margin-left: auto;
        }

        /* Submit Section */
        .submit-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .submit-section .glass-button {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 200px;
          justify-content: center;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .submit-section .glass-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .submit-section .glass-button:disabled {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .validation-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 150, 150, 1);
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Floating Success Notification */
        .floating-success-notification {
          position: fixed;
          top: 100px;
          right: 0;
          z-index: 1000;
          animation: slideInOut 3s ease-in-out forwards;
        }

        .success-content {
          background: rgba(100, 255, 100, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(100, 255, 100, 0.6);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
          font-size: 1rem;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(100, 255, 100, 0.2);
        }

        @keyframes slideInOut {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          15% {
            transform: translateX(0);
            opacity: 1;
          }
          85% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Responsive Design */
        @media (max-width: 889px) {
          .title-section h1 {
            font-size: 2rem;
          }
          
          .controls {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .slider-container {
            width: 100%;
            max-width: 450px;
          }

          .custom-dropdown {
            width: 100% !important;
            max-width: 180px;
          }
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 1.75rem;
          }
          
          /* Center header elements on mobile */
          .title-section {
            text-align: center;
          }
          
          .controls {
            align-items: center;
          }
          
          .view-toggle,
          .week-selector {
            align-items: center;
          }
          
          .slider-container {
            align-items: center;
          }
          
          .header-row {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
          }

          .auto-pick-button {
            width: 100%;
            justify-content: center;
          }
          
          /* Center main panel elements on mobile */
          .main-panel-header {
            align-items: center;
            text-align: center;
          }
          
          .unused-values-inline {
            align-items: center;
            text-align: center;
          }
          
          .values-list {
            justify-content: center;
          }
          
          .classic-game-row {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
            min-height: auto;
          }

          .game-row-main {
            flex-direction: row;
            gap: 0.25rem;
            align-items: center;
          }

          .team-info-section {
            max-width: 100px;
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            position: relative;
          }

          .team-info-section.away-team,
          .team-info-section.home-team {
            text-align: center;
            align-items: center;
          }

          .team-logo-section {
            display: none;
          }

          .team-logo-large {
            width: 20px;
            height: 20px;
          }

          .radio-section {
            width: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .vs-divider {
            padding: 0 0.1rem;
            font-size: 1rem;
          }

          .point-selector {
            align-self: center;
            margin-top: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .title-section h1 {
            font-size: 1.5rem;
          }
          
          .games-grid {
            grid-template-columns: 1fr;
          }
        }

        /* FORCE dropdown background override with maximum specificity */
        .picks-container .classic-games-list .point-selector .custom-dropdown .dropdown-menu,
        .picks-container .games-container .custom-dropdown .dropdown-menu,
        .picks-container .custom-dropdown .dropdown-menu,
        .point-value .custom-dropdown .dropdown-menu,
        .point-selector .custom-dropdown .dropdown-menu {
          background: rgba(20, 20, 30, 0.6) !important;
        }

        /* Ensure week dropdown appears above main glass panel but below header */
        .picks-header .week-selector .custom-dropdown {
          z-index: 999 !important;
        }

        .picks-header .week-selector .custom-dropdown .dropdown-menu {
          z-index: 999 !important;
        }

        /* Ensure games-container has lower z-index than picks-header */
        .picks-container .games-container.glass-container {
          position: relative;
          z-index: 1 !important;
        }
      `}</style>
    </div>
  );
}

export default MakePicks;