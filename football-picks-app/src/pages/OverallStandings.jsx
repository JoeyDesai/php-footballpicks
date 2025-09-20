import React, { useState, useEffect } from 'react';
import { Trophy, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI } from '../services/api';

function OverallStandings() {
  const { user } = useAuth();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(0);
  const [availableTags] = useState([
    { id: 0, name: 'All' },
    { id: 1, name: 'Family' },
    { id: 2, name: 'Extended Family' }
  ]);

  useEffect(() => {
    loadStandings();
  }, [selectedTag]);

  const loadStandings = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getOverallStandings(selectedTag);
      if (response.data.success) {
        setStandings(response.data.standings);
      }
    } catch (error) {
      console.error('Error loading overall standings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="standings-container">
      <div className="standings-header glass-container">
        <div className="header-content">
          <div className="title-section">
            <Trophy className="header-icon" />
            <h1>Overall Standings</h1>
          </div>
          
          <div className="controls">
            <div className="tag-selector">
              <label htmlFor="tag-select">
                <Filter size={16} />
                Filter:
              </label>
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

        <div className="season-info">
          <h2>2025 Season Totals</h2>
          <p>Combined scores from all completed weeks</p>
        </div>
      </div>

      <div className="standings-table-container glass-container">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : standings.length > 0 ? (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th className="rank-header">#</th>
                  <th className="player-header">Player</th>
                  <th className="score-header">Total Score</th>
                  <th className="correct-header">Total Correct</th>
                  <th className="average-header">Avg/Week</th>
                  <th className="weeks-header">Weeks Played</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className={player.id === user?.id ? 'current-user' : ''}
                  >
                    <td className="rank">
                      <div className="rank-display">
                        {index + 1}
                        {index === 0 && <Trophy className="trophy-icon" />}
                      </div>
                    </td>
                    <td className="player-name">
                      <div className="player-info">
                        <span className="name">{player.nickname}</span>
                        {player.id === user?.id && (
                          <span className="you-indicator">You</span>
                        )}
                      </div>
                    </td>
                    <td className="total-score">{player.score}</td>
                    <td className="total-correct">{player.numright}</td>
                    <td className="average">
                      {player.weeks_played > 0 
                        ? (player.score / player.weeks_played).toFixed(1)
                        : '0.0'
                      }
                    </td>
                    <td className="weeks-played">{player.weeks_played || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <Trophy className="no-data-icon" />
            <p>No standings data available yet.</p>
            <p>Check back after the first week of games!</p>
          </div>
        )}
      </div>

      {standings.length > 0 && (
        <div className="stats-summary glass-container">
          <h3>Season Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{standings.length}</div>
              <div className="stat-label">Total Players</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {Math.max(...standings.map(p => p.score))}
              </div>
              <div className="stat-label">Highest Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {Math.round(standings.reduce((sum, p) => sum + p.score, 0) / standings.length)}
              </div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {Math.max(...standings.map(p => p.weeks_played || 0))}
              </div>
              <div className="stat-label">Weeks Completed</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .standings-container {
          max-width: 1200px;
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
          color: rgba(255, 215, 0, 1);
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
        }

        .tag-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tag-selector label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .season-info {
          margin-top: 1.5rem;
          text-align: center;
        }

        .season-info h2 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .season-info p {
          color: rgba(255, 255, 255, 0.7);
        }

        .standings-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .table-wrapper {
          min-width: 700px;
        }

        .glass-table th {
          text-align: center;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          padding: 1rem 0.5rem;
        }

        .player-header {
          text-align: left !important;
        }

        .glass-table td {
          text-align: center;
          padding: 1rem 0.5rem;
          vertical-align: middle;
        }

        .rank {
          font-weight: 600;
        }

        .rank-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: rgba(150, 200, 255, 1);
        }

        .trophy-icon {
          color: rgba(255, 215, 0, 1);
          width: 20px;
          height: 20px;
        }

        .player-name {
          text-align: left !important;
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .name {
          font-weight: 600;
          color: white;
        }

        .you-indicator {
          background: rgba(100, 150, 255, 0.3);
          color: rgba(150, 200, 255, 1);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .total-score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          font-size: 1.2rem;
        }

        .total-correct {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .average {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
        }

        .weeks-played {
          color: rgba(255, 255, 255, 0.7);
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .no-data-icon {
          color: rgba(255, 215, 0, 0.5);
          width: 64px;
          height: 64px;
          margin-bottom: 1rem;
        }

        .no-data p {
          margin-bottom: 0.5rem;
        }

        .stats-summary {
          text-align: center;
        }

        .stats-summary h3 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 2rem;
          }
          
          .controls {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default OverallStandings;