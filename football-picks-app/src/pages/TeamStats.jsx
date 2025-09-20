import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { statsAPI } from '../services/api';

function TeamStats() {
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadTeamStats();
  }, []);

  const loadTeamStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getTeamStats();
      if (response.data.success) {
        setTeamStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedStats = [...teamStats].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  if (loading) {
    return (
      <div className="team-stats-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="team-stats-container">
      <div className="team-stats-header glass-container">
        <div className="title-section">
          <BarChart3 className="header-icon" />
          <h1>Team Statistics</h1>
        </div>
        <p>See how teams perform based on player picks and actual results</p>
      </div>

      <div className="stats-table-container glass-container">
        {teamStats.length > 0 ? (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                  >
                    Team {getSortIcon('name')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('pointsWon')}
                  >
                    Points Won {getSortIcon('pointsWon')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('correctPicks')}
                  >
                    Correctly Picked {getSortIcon('correctPicks')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('pointsLost')}
                  >
                    Points Lost {getSortIcon('pointsLost')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('wrongPicks')}
                  >
                    Wrongly Picked {getSortIcon('wrongPicks')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('totalPoints')}
                  >
                    Total Points {getSortIcon('totalPoints')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('totalPicks')}
                  >
                    Total Picks {getSortIcon('totalPicks')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('winRate')}
                  >
                    Win Rate {getSortIcon('winRate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((team, index) => (
                  <tr key={team.name}>
                    <td className="team-name">
                      <div className="team-info">
                        <img 
                          src={`/footballpicks/images/${team.name.toLowerCase()}.svg`}
                          alt={team.name}
                          className="team-logo"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <span>{team.name}</span>
                      </div>
                    </td>
                    <td className="points-won">{team.pointsWon || 0}</td>
                    <td className="correct-picks">{team.correctPicks || 0}</td>
                    <td className="points-lost">{team.pointsLost || 0}</td>
                    <td className="wrong-picks">{team.wrongPicks || 0}</td>
                    <td className="total-points">{team.totalPoints || 0}</td>
                    <td className="total-picks">{team.totalPicks || 0}</td>
                    <td className="win-rate">
                      {team.totalPicks > 0 
                        ? `${((team.correctPicks / team.totalPicks) * 100).toFixed(1)}%`
                        : '0.0%'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <BarChart3 className="no-data-icon" />
            <p>No team statistics available yet.</p>
            <p>Stats will appear after games are completed and scored.</p>
          </div>
        )}
      </div>

      {teamStats.length > 0 && (
        <div className="insights-container">
          <div className="insight-card glass-container">
            <h3>Most Popular Team</h3>
            <div className="insight-content">
              {(() => {
                const mostPicked = teamStats.reduce((max, team) => 
                  (team.totalPicks || 0) > (max.totalPicks || 0) ? team : max
                );
                return (
                  <div className="team-highlight">
                    <img 
                      src={`/footballpicks/images/${mostPicked.name.toLowerCase()}.svg`}
                      alt={mostPicked.name}
                      className="highlight-logo"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <div className="highlight-name">{mostPicked.name}</div>
                      <div className="highlight-stat">{mostPicked.totalPicks} picks</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="insight-card glass-container">
            <h3>Most Valuable Team</h3>
            <div className="insight-content">
              {(() => {
                const mostValuable = teamStats.reduce((max, team) => 
                  (team.totalPoints || 0) > (max.totalPoints || 0) ? team : max
                );
                return (
                  <div className="team-highlight">
                    <img 
                      src={`/footballpicks/images/${mostValuable.name.toLowerCase()}.svg`}
                      alt={mostValuable.name}
                      className="highlight-logo"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <div className="highlight-name">{mostValuable.name}</div>
                      <div className="highlight-stat">{mostValuable.totalPoints} points</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="insight-card glass-container">
            <h3>Best Win Rate</h3>
            <div className="insight-content">
              {(() => {
                const bestWinRate = teamStats
                  .filter(team => (team.totalPicks || 0) >= 3) // Minimum 3 picks
                  .reduce((max, team) => {
                    const maxRate = max.totalPicks > 0 ? max.correctPicks / max.totalPicks : 0;
                    const teamRate = team.totalPicks > 0 ? team.correctPicks / team.totalPicks : 0;
                    return teamRate > maxRate ? team : max;
                  });
                
                if (!bestWinRate.name) {
                  return <div className="no-data-small">Not enough data</div>;
                }
                
                return (
                  <div className="team-highlight">
                    <img 
                      src={`/footballpicks/images/${bestWinRate.name.toLowerCase()}.svg`}
                      alt={bestWinRate.name}
                      className="highlight-logo"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <div className="highlight-name">{bestWinRate.name}</div>
                      <div className="highlight-stat">
                        {((bestWinRate.correctPicks / bestWinRate.totalPicks) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .team-stats-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .team-stats-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .title-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
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

        .team-stats-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }

        .stats-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .table-wrapper {
          min-width: 1000px;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .sortable-header:hover {
          background: rgba(255, 255, 255, 0.1);
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
          vertical-align: middle;
        }

        .team-name {
          text-align: left !important;
        }

        .team-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .team-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .team-info span {
          font-weight: 600;
          color: white;
        }

        .points-won {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .correct-picks {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .points-lost {
          color: rgba(255, 150, 150, 1);
          font-weight: 600;
        }

        .wrong-picks {
          color: rgba(255, 150, 150, 1);
          font-weight: 600;
        }

        .total-points {
          color: rgba(100, 150, 255, 1);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .total-picks {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .win-rate {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .no-data-icon {
          color: rgba(100, 150, 255, 0.5);
          width: 64px;
          height: 64px;
          margin-bottom: 1rem;
        }

        .no-data p {
          margin-bottom: 0.5rem;
        }

        .insights-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .insights-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .insight-card {
          text-align: center;
        }

        .insight-card h3 {
          color: white;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .team-highlight {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .highlight-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .highlight-name {
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .highlight-stat {
          color: rgba(100, 150, 255, 1);
          font-weight: 700;
          font-size: 1.2rem;
        }

        .no-data-small {
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 2rem;
          }
          
          .team-highlight {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default TeamStats;