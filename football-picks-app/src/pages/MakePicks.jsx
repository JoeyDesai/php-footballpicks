import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { gameAPI } from '../services/api';

function MakePicks() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readOnly, setReadOnly] = useState(false);

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
        // Auto-select current week
        const currentWeek = response.data.weeks.find(w => w.current) || response.data.weeks[0];
        setSelectedWeek(currentWeek);
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
    setPicks(prev => ({
      ...prev,
      [`GAME${gameId}`]: team
    }));
    setError('');
    setSuccess('');
  };

  const handleValueChange = (gameId, value) => {
    setPicks(prev => ({
      ...prev,
      [`VAL${gameId}`]: parseInt(value)
    }));
    setError('');
    setSuccess('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validatePicks();
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await gameAPI.submitPicks(selectedWeek.id, picks);
      if (response.data.success) {
        setSuccess('Picks saved successfully!');
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

  return (
    <div className="picks-container">
      <div className="picks-header glass-container">
        <h1>Make Your Picks</h1>
        
        <div className="week-selector">
          <label htmlFor="week-select">Select Week:</label>
          <select
            id="week-select"
            className="glass-select"
            value={selectedWeek?.id || ''}
            onChange={(e) => {
              const week = weeks.find(w => w.id === parseInt(e.target.value));
              setSelectedWeek(week);
            }}
          >
            {weeks.map(week => (
              <option key={week.id} value={week.id}>
                Week {week.number}
              </option>
            ))}
          </select>
        </div>

        {selectedWeek && (
          <div className="week-info">
            <h2>Week {selectedWeek.number}</h2>
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

      {error && (
        <div className="error-message glass-container">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message glass-container">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {!readOnly && (
        <div className="unused-values glass-container">
          <h3>Unused Point Values:</h3>
          <div className="values-list">
            {getUnusedValues().map(value => (
              <span key={value} className="unused-value">{value}</span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="picks-form">
        <div className="games-container glass-container">
          <div className="games-grid">
            {games.map((game, index) => (
              <div key={game.id} className="game-card">
                <div className="game-header">
                  <span className="game-date">{game.date}</span>
                </div>
                
                <div className="teams-container">
                  {/* Away Team */}
                  <div className="team-option">
                    <div className="team-info">
                      <img 
                        src={`/footballpicks/images/${game.away_name.toLowerCase()}.svg`}
                        alt={game.away_name}
                        className="team-logo"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="team-details">
                        <div className="team-name">{game.away_city} {game.away_name}</div>
                        <div className="team-record">
                          ({game.away_wins}-{game.away_losses}
                          {game.away_ties > 0 && `-${game.away_ties}`})
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <input
                        type="radio"
                        name={`GAME${game.id}`}
                        value={game.away_id}
                        checked={picks[`GAME${game.id}`] == game.away_id}
                        onChange={() => handlePickChange(game.id, game.away_id)}
                        className="team-radio"
                      />
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
                        src={`/footballpicks/images/${game.home_name.toLowerCase()}.svg`}
                        alt={game.home_name}
                        className="team-logo"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="team-details">
                        <div className="team-name">{game.home_city} {game.home_name}</div>
                        <div className="team-record">
                          ({game.home_wins}-{game.home_losses}
                          {game.home_ties > 0 && `-${game.home_ties}`})
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <input
                        type="radio"
                        name={`GAME${game.id}`}
                        value={game.home_id}
                        checked={picks[`GAME${game.id}`] == game.home_id}
                        onChange={() => handlePickChange(game.id, game.home_id)}
                        className="team-radio"
                      />
                    )}
                    {readOnly && picks[`GAME${game.id}`] == game.home_id && (
                      <div className="pick-indicator">✓</div>
                    )}
                  </div>
                </div>

                <div className="point-value">
                  <label>Point Value:</label>
                  {!readOnly ? (
                    <select
                      className="glass-select"
                      value={picks[`VAL${game.id}`] || 0}
                      onChange={(e) => handleValueChange(game.id, e.target.value)}
                    >
                      <option value={0}>Select Points</option>
                      {Array.from({ length: games.length }, (_, i) => i + 1).map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
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
        </div>

        {!readOnly && (
          <div className="submit-container">
            <button
              type="submit"
              className="glass-button primary"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Picks'}
            </button>
          </div>
        )}
      </form>

      <style jsx>{`
        .picks-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .picks-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .picks-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
        }

        .week-selector {
          margin-bottom: 1rem;
        }

        .week-selector label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .week-info h2 {
          color: white;
          margin-bottom: 0.5rem;
        }

        .multiplier-notice,
        .readonly-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 200, 100, 1);
          font-weight: 500;
        }

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

        .unused-values {
          margin-bottom: 2rem;
        }

        .unused-values h3 {
          color: white;
          margin-bottom: 1rem;
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
        }

        .games-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
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

        .team-radio {
          width: 20px;
          height: 20px;
          accent-color: rgba(100, 150, 255, 1);
        }

        .pick-indicator {
          color: rgba(100, 255, 100, 1);
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

        .point-value .glass-select {
          min-width: 120px;
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

        .submit-container {
          text-align: center;
          margin-top: 2rem;
        }

        .submit-container .glass-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 200px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default MakePicks;