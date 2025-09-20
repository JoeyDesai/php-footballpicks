import React, { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, gameAPI } from '../services/api';

function WeeklyStandings() {
  const { user } = useAuth();
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(0);
  const [availableTags] = useState([
    { id: 0, name: 'All' },
    { id: 1, name: 'Family' },
    { id: 2, name: 'Extended Family' }
  ]);

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadStandings();
    }
  }, [selectedWeek, selectedTag]);

  const loadWeeks = async () => {
    try {
      const response = await gameAPI.getWeeks();
      if (response.data.success) {
        setWeeks(response.data.weeks);
        // Auto-select most recent completed week
        const completedWeeks = response.data.weeks.filter(w => w.completed);
        const currentWeek = completedWeeks[completedWeeks.length - 1] || response.data.weeks[0];
        setSelectedWeek(currentWeek);
      }
    } catch (error) {
      console.error('Error loading weeks:', error);
    }
  };

  const loadStandings = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getWeeklyStandings(selectedWeek.id, selectedTag);
      if (response.data.success) {
        setStandings(response.data.standings);
      }
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedWeek) {
    return (
      <div className="standings-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="standings-container">
      <div className="standings-header glass-container">
        <div className="header-content">
          <div className="title-section">
            <Calendar className="header-icon" />
            <h1>Weekly Standings</h1>
          </div>
          
          <div className="controls">
            <div className="week-selector">
              <label htmlFor="week-select">Week:</label>
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

            <div className="tag-selector">
              <label htmlFor="tag-select">Filter:</label>
              <select
                id="tag-select"
                className="glass-select"
                value={selectedTag}
                onChange={(e) => setSelectedTag(parseInt(e.target.value))}
              >
                {availableTags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedWeek && (
          <div className="week-info">
            <h2>Week {selectedWeek.number} Results</h2>
            {selectedWeek.factor !== 1 && (
              <p className="multiplier-notice">
                Scores multiplied by {selectedWeek.factor}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="standings-table-container glass-container">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : standings.length > 0 ? (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th className="games-header">Games</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className={player.id === user?.id ? 'current-user' : ''}
                  >
                    <td className="rank">{index + 1}</td>
                    <td className="player-name">{player.nickname}</td>
                    <td className="score">{player.score}</td>
                    <td className="correct">{player.numright}</td>
                    <td className="games">
                      <div className="game-picks">
                        {player.games && player.games.map((game, gameIndex) => (
                          <div key={gameIndex} className="game-pick">
                            <div className="teams">
                              <span className="away-team">{game.away_abbr}</span>
                              <span className="at">@</span>
                              <span className="home-team">{game.home_abbr}</span>
                            </div>
                            <div className={`pick-value ${
                              game.winner && game.pick === game.winner ? 'correct' :
                              game.winner && game.pick !== game.winner ? 'incorrect' : 'pending'
                            }`}>
                              {game.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No standings data available for this week.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .standings-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .standings-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .header-content {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          color: rgba(100, 150, 255, 1);
          width: 32px;
          height: 32px;
        }

        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .controls {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .week-selector,
        .tag-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .week-selector label,
        .tag-selector label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .week-info {
          margin-top: 1.5rem;
          text-align: center;
        }

        .week-info h2 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .multiplier-notice {
          color: rgba(255, 200, 100, 1);
          font-weight: 500;
        }

        .standings-table-container {
          overflow-x: auto;
        }

        .table-wrapper {
          min-width: 800px;
        }

        .glass-table {
          width: 100%;
        }

        .glass-table th {
          text-align: center;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          padding: 1rem 0.5rem;
        }

        .glass-table td {
          text-align: center;
          padding: 1rem 0.5rem;
        }

        .rank {
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
        }

        .player-name {
          font-weight: 600;
          text-align: left !important;
        }

        .score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          font-size: 1.1rem;
        }

        .correct {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .games-header {
          min-width: 400px;
        }

        .games {
          text-align: left !important;
        }

        .game-picks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .game-pick {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 0.5rem;
          min-width: 80px;
        }

        .teams {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .away-team,
        .home-team {
          font-weight: 600;
        }

        .at {
          color: rgba(255, 255, 255, 0.5);
        }

        .pick-value {
          font-weight: 700;
          font-size: 0.9rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          min-width: 24px;
          text-align: center;
        }

        .pick-value.correct {
          background: rgba(100, 255, 100, 0.3);
          color: rgba(150, 255, 150, 1);
        }

        .pick-value.incorrect {
          background: rgba(255, 100, 100, 0.3);
          color: rgba(255, 150, 150, 1);
        }

        .pick-value.pending {
          background: rgba(255, 200, 100, 0.3);
          color: rgba(255, 220, 150, 1);
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 2rem;
          }
          
          .controls {
            justify-content: center;
          }
          
          .game-picks {
            justify-content: center;
          }
          
          .game-pick {
            min-width: 60px;
          }
        }
      `}</style>
    </div>
  );
}

export default WeeklyStandings;