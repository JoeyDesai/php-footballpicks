import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI } from '../services/api';

function Home() {
  const { user } = useAuth();
  const [weeklyStandings, setWeeklyStandings] = useState([]);
  const [overallStandings, setOverallStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load both weekly and overall standings for home page preview
      const [weeklyResponse, overallResponse] = await Promise.all([
        statsAPI.getHomeStats(), // This will get current week standings
        statsAPI.getOverallStandings()
      ]);

      if (weeklyResponse.data.success) {
        setWeeklyStandings(weeklyResponse.data.weeklyStandings.slice(0, 5)); // Top 5
        setCurrentWeek(weeklyResponse.data.currentWeek);
      }

      if (overallResponse.data.success) {
        setOverallStandings(overallResponse.data.standings.slice(0, 5)); // Top 5
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="welcome-section glass-container">
        <h1>Welcome back, {user?.nickname || user?.realName}!</h1>
        <p>Ready to make your picks for this week?</p>
        <Link to="/make-picks" className="glass-button primary">
          Enter Your Picks
        </Link>
      </div>

      <div className="stats-grid">
        {/* Weekly Standings Preview */}
        <div className="stats-card glass-container">
          <div className="stats-header">
            <Calendar className="stats-icon" />
            <h2>
              <Link to="/weekly-standings" className="stats-title-link">
                Week {currentWeek?.number || 'Current'} Standings
              </Link>
            </h2>
          </div>
          
          {weeklyStandings.length > 0 ? (
            <div className="stats-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyStandings.map((player, index) => (
                    <tr 
                      key={player.id} 
                      className={player.id === user?.id ? 'current-user' : ''}
                    >
                      <td>{index + 1}</td>
                      <td>{player.nickname}</td>
                      <td>{player.score} ({player.numright})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="view-all-link">
                <Link to="/weekly-standings" className="glass-button secondary">
                  View Full Standings
                </Link>
              </div>
            </div>
          ) : (
            <p className="no-data">No weekly data available yet.</p>
          )}
        </div>

        {/* Overall Standings Preview */}
        <div className="stats-card glass-container">
          <div className="stats-header">
            <Trophy className="stats-icon" />
            <h2>
              <Link to="/overall-standings" className="stats-title-link">
                Overall Standings
              </Link>
            </h2>
          </div>
          
          {overallStandings.length > 0 ? (
            <div className="stats-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {overallStandings.map((player, index) => (
                    <tr 
                      key={player.id} 
                      className={player.id === user?.id ? 'current-user' : ''}
                    >
                      <td>{index + 1}</td>
                      <td>{player.nickname}</td>
                      <td>{player.score} ({player.numright})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="view-all-link">
                <Link to="/overall-standings" className="glass-button secondary">
                  View Full Standings
                </Link>
              </div>
            </div>
          ) : (
            <p className="no-data">No overall data available yet.</p>
          )}
        </div>
      </div>

      <div className="quick-actions glass-container">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/make-picks" className="glass-button primary">
            <TrendingUp size={20} />
            Make Picks
          </Link>
          <Link to="/team-stats" className="glass-button secondary">
            <Trophy size={20} />
            Team Stats
          </Link>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff, #a0c4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-section p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .stats-card {
          height: fit-content;
        }

        .stats-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stats-icon {
          color: rgba(100, 150, 255, 1);
          width: 24px;
          height: 24px;
        }

        .stats-title-link {
          color: white;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .stats-title-link:hover {
          color: rgba(150, 200, 255, 1);
        }

        .stats-table-container {
          overflow-x: auto;
        }

        .glass-table {
          font-size: 0.9rem;
        }

        .glass-table th {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .view-all-link {
          margin-top: 1rem;
          text-align: center;
        }

        .no-data {
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        .quick-actions {
          text-align: center;
        }

        .quick-actions h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-buttons .glass-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 150px;
        }

        @media (max-width: 768px) {
          .welcome-section h1 {
            font-size: 2rem;
          }
          
          .stats-grid {
            gap: 1rem;
          }
          
          .action-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;