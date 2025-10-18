import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, gameAPI } from '../services/api';
import CustomDropdown from '../components/CustomDropdown';

// Utility function to format numbers - remove .0 but keep other decimals
const formatNumber = (num) => {
  if (num == null || num === '') return num;
  const numValue = Number(num);
  if (isNaN(numValue)) return num;
  return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
};

function WeeklyStandings() {
  const { user } = useAuth();
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [standings, setStandings] = useState([]);
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(0);
  const [viewMode, setViewMode] = useState('quick'); // 'quick' or 'full'
  const [selectedRows, setSelectedRows] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [availableTags] = useState([
    { id: 0, name: 'All' },
    { id: 1, name: 'Family' },
    { id: 2, name: 'Extended Family' }
  ]);

  // Sync horizontal scrolling between header and body
  const handleHeaderScroll = (e) => {
    const bodyContainer = document.querySelector('.full-body');
    if (bodyContainer) {
      bodyContainer.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleBodyScroll = (e) => {
    const headerContainer = document.querySelector('.full-header-container');
    if (headerContainer) {
      headerContainer.scrollLeft = e.target.scrollLeft;
    }
  };


  useEffect(() => {
    loadWeeks();
    
    // Check for auto refresh on page load
    if (window.location.hash === '#autoreload') {
      setAutoRefresh(true);
    }
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadStandings();
    }
  }, [selectedWeek, selectedTag, viewMode]);

  // Auto refresh effect
  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        window.location.reload();
      }, 60000); // 60 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

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
      if (viewMode === 'quick') {
        const response = await statsAPI.getWeeklyStandings(selectedWeek.id, selectedTag);
        if (response.data.success) {
          // For quick view, we need to get the full data to calculate potential correctly
          const fullResponse = await statsAPI.getWeeklyStandingsClassic(selectedWeek.id);
          if (fullResponse.data.success) {
            // Calculate potential score as: points from ALL games (assuming they pick correctly on remaining)
            const standingsWithPotential = response.data.standings.map(player => {
              let potentialScore = 0;
              let potentialCorrect = 0;
              
              // Calculate potential as sum of ALL game weights (assuming they pick correctly on remaining)
              if (fullResponse.data.games && fullResponse.data.picksByPicker[player.id]) {
                const weekFactor = fullResponse.data.week?.factor || 1;
                fullResponse.data.games.forEach(game => {
                  const playerPick = fullResponse.data.picksByPicker[player.id][game.id];
                  if (playerPick) {
                    if (game.winner && playerPick.guess === game.winner) {
                      // Game completed and they got it right - add the points
                      potentialScore += (playerPick.weight * weekFactor);
                      potentialCorrect += 1;
                    } else if (game.winner === 0) {
                      // Game ended in a tie - add half points
                      potentialScore += (playerPick.weight * weekFactor * 0.5);
                      potentialCorrect += 0.5;
                    } else if (!game.winner) {
                      // Game not completed - assume they pick correctly
                      potentialScore += (playerPick.weight * weekFactor);
                      potentialCorrect += 1;
                    }
                    // If game completed and they got it wrong, they get 0 points
                  }
                });
              }
              
              return {
                ...player,
                potential_score: potentialScore,
                potential_correct: potentialCorrect
              };
            });
            
            // Sort by potential score
            const sortedStandings = standingsWithPotential.sort((a, b) => {
              const aPotential = a.potential_score || a.score;
              const bPotential = b.potential_score || b.score;
              if (bPotential !== aPotential) {
                return bPotential - aPotential;
              }
              return b.score - a.score;
            });
            
            setStandings(sortedStandings);
            setFullData(null);
          } else {
            setStandings(response.data.standings);
            setFullData(null);
          }
        }
      } else {
        const response = await statsAPI.getWeeklyStandingsClassic(selectedWeek.id);
        if (response.data.success) {
          // Calculate potential score as: points from ALL games (assuming they pick correctly on remaining)
          const standingsWithPotential = response.data.standings.map(player => {
            let potentialScore = 0;
            let potentialCorrect = 0;
            
            // Calculate potential as sum of ALL game weights (assuming they pick correctly on remaining)
            if (response.data.games && response.data.picksByPicker[player.id]) {
              const weekFactor = response.data.week?.factor || 1;
              response.data.games.forEach(game => {
                const playerPick = response.data.picksByPicker[player.id][game.id];
                if (playerPick) {
                  if (game.winner && playerPick.guess === game.winner) {
                    // Game completed and they got it right - add the points
                    potentialScore += (playerPick.weight * weekFactor);
                    potentialCorrect += 1;
                  } else if (game.winner === 0) {
                    // Game ended in a tie - add half points
                    potentialScore += (playerPick.weight * weekFactor * 0.5);
                    potentialCorrect += 0.5;
                  } else if (!game.winner) {
                    // Game not completed - assume they pick correctly
                    potentialScore += (playerPick.weight * weekFactor);
                    potentialCorrect += 1;
                  }
                  // If game completed and they got it wrong, they get 0 points
                }
              });
            }
            
            return {
              ...player,
              potential_score: potentialScore,
              potential_correct: potentialCorrect
            };
          });
          
          // Sort by potential score instead of current score
          const sortedStandings = standingsWithPotential.sort((a, b) => {
            const aPotential = a.potential_score || a.score;
            const bPotential = b.potential_score || b.score;
            if (bPotential !== aPotential) {
              return bPotential - aPotential;
            }
            // If potential scores are equal, sort by current score
            return b.score - a.score;
          });
          setStandings(sortedStandings);
          setFullData(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (playerId) => {
    setSelectedRows(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const toggleAutoRefresh = () => {
    const newAutoRefresh = !autoRefresh;
    setAutoRefresh(newAutoRefresh);
    
    if (newAutoRefresh) {
      window.location.replace('#autoreload');
    } else {
      window.location.replace('#');
    }
  };

  const renderQuickView = () => (
    <div className="table-container quick-table-container">
      <div className="quick-header-container" onScroll={handleHeaderScroll}>
        <div className="quick-header">
          <div className="header-cell rank-header">#</div>
          <div className="header-cell player-header">Player</div>
          <div className="header-cell data-header">Correct</div>
          <div className="header-cell data-header">Score</div>
          <div className="header-cell data-header">Potential</div>
        </div>
      </div>
      <div className="quick-body-wrapper">
        <div className="quick-body" onScroll={handleBodyScroll}>
          {standings.map((player, index) => (
          <div 
            key={player.id} 
            className={`quick-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRows.includes(player.id) ? 'selected' : ''}`}
            onClick={() => handleRowClick(player.id)}
          >
            <div className="table-cell rank">{index + 1}</div>
            <div className="table-cell player-name">
              <div className="player-info">
                <span className="name">{player.nickname}</span>
              </div>
            </div>
            <div className="table-cell correct">{formatNumber(player.numright)}</div>
            <div className="table-cell score">{formatNumber(player.score)}</div>
            <div className="table-cell potential">{formatNumber(player.potential_score || player.score)}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );

  const renderFullView = () => {
    if (!fullData) return null;

    const { games, picksByPicker } = fullData;

    return (
      <div className="table-container full-table-container">
        <div className="full-header-container" onScroll={handleHeaderScroll}>
          <div 
            className="full-header"
            style={{
              gridTemplateColumns: `60px 200px repeat(${games.length}, 1fr) 60px 66px`
            }}
          >
            <div className="header-cell rank-header">#</div>
            <div className="header-cell player-header">Player</div>
            {games.map(game => (
              <div key={game.id} className="header-cell game-header">
                <div className="game-info">
                  <div className="game-teams">
                    <div className="away-team">{game.away_abbr}-</div>
                    <div className="away-score">{game.awayscore || '-'}</div>
                  </div>
                  <div className="game-teams">
                    <div className="home-team">{game.home_abbr}-</div>
                    <div className="home-score">{game.homescore || '-'}</div>
                  </div>
                  <div className="game-status">
                    {game.winner ? 'Final' : (game.time || 'TBD')}
                  </div>
                </div>
              </div>
            ))}
            <div className="header-cell total-header">Total</div>
            <div className="header-cell potential-header">Potential</div>
          </div>
        </div>
        <div className="full-body" onScroll={handleBodyScroll}>
          {standings.map((player, index) => (
            <div 
              key={player.id} 
              className={`full-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRows.includes(player.id) ? 'selected' : ''}`}
              onClick={() => handleRowClick(player.id)}
              style={{
                gridTemplateColumns: `60px 200px repeat(${games.length}, 1fr) 60px 60px`
              }}
            >
              <div className="table-cell rank">
                <div className="rank-display">
                  {index + 1}
                </div>
              </div>
              <div className="table-cell player-name">
                <div className="player-info">
                  <span className="name">{player.nickname}</span>
                </div>
              </div>
              {games.map(game => {
                const playerPicks = picksByPicker[player.id];
                const gamePick = playerPicks ? playerPicks[game.id] : null;
                
                if (!gamePick) {
                  return (
                    <div key={game.id} className="table-cell game-data">
                      <div className="pick-display">-</div>
                    </div>
                  );
                }

                const isAwayPick = gamePick.guess === gamePick.away;
                const isHomePick = gamePick.guess === gamePick.home;
                const isCorrect = gamePick.winner && gamePick.guess === gamePick.winner;
                const isWrong = gamePick.winner && gamePick.guess !== gamePick.winner;
                const isPending = !gamePick.winner;
                
                const pickedTeam = isAwayPick ? game.away_abbr : game.home_abbr;
                const pickWeight = gamePick.weight;
                
                return (
                  <div key={game.id} className="table-cell game-data">
                    <div className={`pick-display ${isCorrect ? 'correct' : isWrong ? 'wrong' : isPending ? 'pending' : ''}`}>
                      {pickedTeam} {pickWeight}
                    </div>
                  </div>
                );
              })}
              <div className="table-cell total-column">
                <div className="total-score">{formatNumber(player.score)}</div>
              </div>
              <div className="table-cell potential-column">
                <div className="potential-score">{formatNumber(player.potential_score || player.score)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
            <h1>Weekly Standings</h1>
          </div>
          
          <div className="controls">
            <div className="auto-refresh-control">
              <label htmlFor="auto-refresh">Auto Refresh:</label>
              <button
                id="auto-refresh"
                className={`auto-refresh-button ${autoRefresh ? 'active' : ''}`}
                onClick={toggleAutoRefresh}
              >
                {autoRefresh ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="view-toggle">
              <label htmlFor="view-toggle">View</label>
              <div className="slider-container">
                <div className="slider-track" onClick={() => setViewMode(viewMode === 'quick' ? 'full' : 'quick')}>
                  <div className={`slider-thumb ${viewMode === 'full' ? 'slider-thumb-right' : 'slider-thumb-left'}`}>
                  </div>
                  <div className="slider-track-labels">
                    <span className={`track-label ${viewMode === 'quick' ? 'track-label-active' : 'track-label-inactive'}`}>
                      <span className="desktop-text">Quick View</span>
                      <span className="mobile-text">Quick</span>
                    </span>
                    <span className={`track-label ${viewMode === 'full' ? 'track-label-active' : 'track-label-inactive'}`}>
                      <span className="desktop-text">Full View</span>
                      <span className="mobile-text">Full</span>
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
                }}
                placeholder="Select Week"
              />
            </div>

            <div className="tag-selector">
              <label htmlFor="tag-select">Filter</label>
              <CustomDropdown
                options={availableTags.map(tag => ({
                  value: tag.id,
                  label: tag.name
                }))}
                value={selectedTag}
                onChange={(value) => setSelectedTag(parseInt(value))}
                placeholder="All Tags"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="standings-table-container glass-container">
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
        {loading ? (
          <div className="loading-spinner"></div>
        ) : standings.length > 0 ? (
          viewMode === 'quick' ? renderQuickView() : renderFullView()
        ) : (
          <div className="no-data">
            <p>No standings data available for this week.</p>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .standings-container {
          max-width: 2000px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
        }

        /* Override main-content max-width for this page */
        :global(.main-content) {
          max-width: 2000px !important;
        }

        .standings-header {
          margin-bottom: 1.5rem;
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
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            width: 100%;
          }
        }

        @media (min-width: 1024px) {
          .controls {
            grid-template-columns: repeat(4, auto);
            gap: 1.5rem;
            width: auto;
          }
        }

        .view-toggle,
        .week-selector,
        .tag-selector,
        .auto-refresh-control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Z-index stacking for dropdowns */
        .view-toggle .custom-dropdown {
          z-index: 300 !important;
        }

        .view-toggle .custom-dropdown .dropdown-menu {
          z-index: 300 !important;
        }

        .week-selector .custom-dropdown {
          z-index: 330 !important;
        }

        .week-selector .custom-dropdown .dropdown-menu {
          z-index: 330 !important;
        }

        .tag-selector .custom-dropdown {
          z-index: 320 !important;
        }

        .tag-selector .custom-dropdown .dropdown-menu {
          z-index: 320 !important;
        }

        .auto-refresh-control {
          z-index: 310 !important;
        }

        .custom-dropdown {
          width: 180px !important;
        }

        .view-toggle label,
        .week-selector label,
        .tag-selector label,
        .auto-refresh-control label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 180px;
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
          width: calc(50% - 2px);
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

        .slider-thumb-right {
          left: calc(50% - 2px);
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



        .week-info {
          margin-bottom: 1rem;
          text-align: center;
          padding: 0.5rem 0;
        }


        .week-info h2 {
          color: white;
          font-size: 1.5rem;
          margin: 0;
          font-weight: 600;
        }

        .auto-refresh-button {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
          padding: 0.6rem 0.875rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          font-weight: 500;
          width: 180px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .auto-refresh-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .auto-refresh-button.active {
          background: rgba(100, 150, 255, 0.15);
          border-color: rgba(100, 150, 255, 0.4);
          color: rgba(150, 200, 255, 1);
          box-shadow: 
            0 0 0 3px rgba(100, 150, 255, 0.1),
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .multiplier-notice {
          color: rgba(255, 200, 100, 1);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .standings-table-container {
          overflow: visible !important;
          width: 100%;
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }

        .standings-table-container .table-container {
          overflow: visible !important;
        }

        .table-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          width: 100%;
        }

        .quick-table-container {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          position: relative;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quick-header-container {
          overflow-x: auto;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-right: 6px;
          border-radius: 16px 16px 0 0;
          margin-right: -6px;
          box-sizing: border-box;
        }

        .quick-header-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .quick-header-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .quick-header-container::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 200, 0.4);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .quick-header-container::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 200, 0.6);
        }

        .quick-body-wrapper {
          max-height: 70vh;
          overflow: hidden;
          border-radius: 0 0 16px 16px;
        }

        .quick-body {
          max-height: 70vh;
          overflow-y: auto;
          overflow-x: auto;
          width: 100%;
          border-radius: 0 0 16px 16px;
          margin-right: -6px;
          padding-right: 6px;
          box-sizing: border-box;
        }

        .quick-body::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .quick-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .quick-body::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 200, 0.4);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .quick-body::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 200, 0.6);
        }

        .quick-body::-webkit-scrollbar-corner {
          background: transparent;
          border-radius: 0 0 16px 0;
        }

        .quick-body::-webkit-scrollbar:vertical {
          margin-bottom: 6px;
        }

        .quick-header {
          display: grid;
          grid-template-columns: 50px 1fr 80px 80px 86px;
          min-width: 0;
        }

        .quick-header .header-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4rem 0.2rem;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .quick-header .header-cell:last-child {
          border-right: none;
        }

        .quick-header .player-header {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
        }



        .quick-row {
          display: grid;
          grid-template-columns: 50px 1fr 80px 80px 80px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background-color 0.0s ease;
          cursor: default;
          min-width: 0;
        }


        .quick-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .quick-row.selected {
          background: rgba(100, 150, 255, 0.1);
          box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
          transition: background-color 0.1s ease;
        }

        .quick-row.current-user {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.3);
          transition: background-color 0.1s ease;
        }

        .quick-row.current-user:hover {
          background: rgba(255, 215, 0, 0.15);
        }

        .quick-row.current-user.selected {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.5);
        }

        .quick-row .table-cell:last-child {
          padding-right: 0px;
          border-right: none;
        }

        .quick-row .table-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.3rem 0.1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          cursor: default;
        }

        .quick-row .table-cell.player-name {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
          min-width: 0;
          overflow: hidden;
        }

        .quick-row .table-cell.player-name .name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          display: block;
          width: 100%;
        }

        @media (max-width: 889px) {
          .quick-header {
            grid-template-columns: 35px 1fr 60px 60px 66px;
          }

          .quick-row {
            grid-template-columns: 35px 1fr 60px 60px 60px;
          }

          .quick-header .header-cell,
          .quick-row .table-cell {
            font-size: 0.9rem;
            padding: 0.25rem 0.1rem;
          }

          .quick-header .header-cell {
            padding: 0.3rem 0.1rem;
          }

          .quick-row .table-cell.player-name .name {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .quick-header {
            grid-template-columns: 30px 1fr 55px 55px 61px;
          }

          .quick-row {
            grid-template-columns: 30px 1fr 55px 55px 55px;
          }

          .quick-header .header-cell,
          .quick-row .table-cell {
            font-size: 0.85rem;
            padding: 0.2rem 0.08rem;
          }

          .quick-header .header-cell {
            padding: 0.25rem 0.08rem;
          }
        }

        @media (max-width: 480px) {
          .quick-header {
            grid-template-columns: 25px 1fr 45px 45px 51px;
          }

          .quick-row {
            grid-template-columns: 25px 1fr 45px 45px 45px;
          }

          .quick-header .header-cell,
          .quick-row .table-cell {
            font-size: 0.8rem;
            padding: 0.15rem 0.05rem;
          }

          .quick-header .header-cell {
            padding: 0.2rem 0.05rem;
          }
        }

        @media (max-width: 360px) {
          .quick-header {
            grid-template-columns: 20px 1fr 40px 40px 46px;
          }

          .quick-row {
            grid-template-columns: 20px 1fr 40px 40px 40px;
          }

          .quick-header .header-cell,
          .quick-row .table-cell {
            font-size: 0.75rem;
            padding: 0.1rem 0.03rem;
          }

          .quick-header .header-cell {
            padding: 0.15rem 0.03rem;
          }
        }




        .glass-table tbody tr {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .glass-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .glass-table tbody tr.selected {
          background: rgba(100, 150, 255, 0.1);
          border: 1px solid rgba(100, 150, 255, 0.3);
        }

        .glass-table tbody tr.current-user {
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .glass-table tbody tr.current-user:hover {
          background: rgba(255, 215, 0, 0.15);
        }

        .glass-table tbody tr.current-user.selected {
          background: rgba(255, 215, 0, 0.2);
          border: 1px solid rgba(255, 215, 0, 0.5);
        }

        .rank {
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
        }

        .player-name {
          font-weight: 600;
          text-align: left !important;
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .name {
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

        .score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          font-size: 1.1rem;
        }

        .correct {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .potential {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.6);
        }


        .full-table-container {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          position: relative;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .full-body {
          max-height: 70vh;
          overflow-y: auto;
          overflow-x: auto;
          width: 100%;
          border-radius: 0 0 16px 16px;
          margin-right: -6px;
          padding-right: 6px;
          box-sizing: border-box;
        }

        .full-body::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }


        .full-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          margin: 0 0 0 0;
        }

        .full-body::-webkit-scrollbar-track:horizontal {
          margin: 0 6px 0 6px;
        }

        .full-body::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 200, 0.4);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .full-body::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 200, 0.6);
        }

        .full-body::-webkit-scrollbar-corner {
          background: transparent;
          border-radius: 0 0 16px 0;
          margin: 0 6px 0 0;
        }

        .full-grid {
          display: grid;
          gap: 0.05rem;
          min-width: 600px;
        }

        .full-header-container {
          overflow-x: auto;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-right: 6px;
          border-radius: 16px 16px 0 0;
          margin-right: -6px;
          box-sizing: border-box;
        }

        .full-header-container::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }

        .full-header-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .full-header-container::-webkit-scrollbar-thumb {
          background: transparent;
        }

        .full-header-container::-webkit-scrollbar-thumb:hover {
          background: transparent;
        }

        .full-header {
          display: grid;
          gap: 0.05rem;
          min-width: 100%;
          width: max-content;
        }


        .full-header .header-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4rem 0.2rem;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .full-header .header-cell:last-child {
          border-right: none;
        }

        .full-header .player-header {
          text-align: left !important;
          justify-content: flex-start !important;
        }

        .full-row {
          display: grid;
          gap: 0.05rem;
          min-width: 100%;
          width: max-content;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background-color 0.0s ease;
          cursor: default;
        }

        .full-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }


        .full-row.selected {
          background: rgba(100, 150, 255, 0.1);
          box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
          transition: background-color 0.1s ease;
        }


        .full-row.current-user {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.3);
          transition: background-color 0.1s ease;
        }


        .full-row.current-user:hover {
          background: rgba(255, 215, 0, 0.15);
        }


        .full-row.current-user.selected {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.5);
        }


        .full-row .table-cell:last-child {
          padding-right: 0px;
          border-right: none;
        }

        .full-row .table-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.3rem 0.1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          cursor: default;
        }

        .full-row .table-cell.player-name {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
        }

        .full-header .player-header {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
        }

        .player-name .name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }


        .full-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .game-header {
          min-width: 60px;
          text-align: center;
        }

        .full-header .game-header,
        .full-row .game-data {
          min-width: 60px;
        }

        .game-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .game-teams {
          display: flex;
          align-items: center;
          gap: 0.05rem;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          font-size: 0.7rem;
        }

        .away-team {
          color: rgba(255, 150, 150, 1);
        }

        .home-team {
          color: rgba(150, 255, 150, 1);
        }

        .vs {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }

        .game-scores {
          display: flex;
          gap: 0.5rem;
          font-weight: 700;
        }

        .away-score {
          color: rgba(255, 150, 150, 1);
          font-weight: 700;
        }

        .home-score {
          color: rgba(150, 255, 150, 1);
          font-weight: 700;
        }

        .game-status {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .game-data {
          min-width: 60px;
          text-align: center;
        }

        .pick-display {
          padding: 0.05rem 0.1rem;
          border-radius: 2px;
          font-weight: 600;
          min-height: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          width: 80%;
          min-width: 30px;
          margin: 0 auto;
        }

        .pick-display.correct {
          background: rgba(150, 255, 150, 0.3);
          color: rgba(150, 255, 150, 1);
          border: 1px solid rgba(150, 255, 150, 0.5);
        }

        .pick-display.wrong {
          background: rgba(255, 150, 150, 0.3);
          color: rgba(255, 150, 150, 1);
          border: 1px solid rgba(255, 150, 150, 0.5);
        }

        .pick-display.pending {
          background: rgba(255, 200, 100, 0.3);
          color: rgba(255, 200, 100, 1);
          border: 1px solid rgba(255, 200, 100, 0.5);
        }

        .total-score {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
        }

        .potential-score {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 200, 100, 1);
        }

        @media (max-width: 889px) {
          .title-section h1 {
            font-size: 2rem;
          }
          
          .controls {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .slider-container {
            width: 100%;
            max-width: 180px;
          }

          .custom-dropdown {
            width: 100% !important;
            max-width: 180px;
          }

          .auto-refresh-button {
            width: 100%;
            max-width: 180px;
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
            min-height: 36px;
          }

          .desktop-text {
            display: none;
          }

          .mobile-text {
            display: inline;
          }

          .full-table-container {
            min-width: 600px;
            overflow-x: auto;
            width: 100%;
            max-width: 100%;
          }

          .standings-table-container {
            overflow-x: auto;
            width: 100%;
            max-width: 100%;
          }

          .table-container {
            overflow-x: auto;
            width: 100%;
            min-width: 100%;
          }
        }

        @media (max-width: 889px) {
          .standings-header {
            padding: 1.25rem;
          }
          
          .title-section h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
          }
          
          .controls {
            gap: 0.75rem;
          }
          
          .view-toggle,
          .week-selector,
          .tag-selector {
            gap: 0.4rem;
          }
          
          .view-toggle label,
          .week-selector label,
          .tag-selector label {
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
          }
          
          .toggle-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
            min-height: 36px;
          }
          
          .custom-dropdown {
            min-width: 120px;
          }
          
          .dropdown-trigger {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
            min-height: 36px;
          }
        }

        @media (max-width: 480px) {
          .standings-header {
            padding: 1rem;
          }
          
          .title-section h1 {
            font-size: 1.5rem;
          }
          
          .toggle-button {
            padding: 0.45rem 0.6rem;
            font-size: 0.8rem;
            width: 80px;
            min-height: 32px;
          }
          
          .dropdown-trigger {
            padding: 0.45rem 0.6rem;
            font-size: 0.8rem;
            min-height: 32px;
          }

          .auto-refresh-button {
            padding: 0.45rem 0.6rem;
            font-size: 0.8rem;
            min-height: 32px;
          }

          .slider-track {
            height: 32px;
          }

          .slider-label {
            font-size: 0.8rem;
          }


          .full-table-container {
            max-width: 100%;
          }

          .standings-table-container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default WeeklyStandings;