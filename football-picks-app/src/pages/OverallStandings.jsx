import React, { useState, useEffect } from 'react';
import { Trophy, Filter, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, authAPI } from '../services/api';
import CustomDropdown from '../components/CustomDropdown';

// Utility function to format numbers - remove .0 but keep other decimals
const formatNumber = (num) => {
  if (num == null || num === '') return num;
  const numValue = Number(num);
  if (isNaN(numValue)) return num;
  return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
};

function OverallStandings() {
  const { user } = useAuth();
  const [standings, setStandings] = useState([]);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    // Default to condensed view on mobile devices, classic view on desktop
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? 'condensed' : 'classic';
  }); // 'condensed' or 'classic'
  const [selectedRow, setSelectedRow] = useState(null);
  const [availableTags, setAvailableTags] = useState([
    { id: 0, name: 'All' }
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
    loadUserTags();

    // Handle window resize to adjust view mode
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const newViewMode = isMobile ? 'condensed' : 'classic';
      setViewMode(newViewMode);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStandings();
  }, [selectedTag, viewMode]);

  const loadUserTags = async () => {
    try {
      const response = await authAPI.getUserTags();
      if (response.data.success) {
        setAvailableTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error loading user tags:', error);
    }
  };

  const loadStandings = async () => {
    try {
      setLoading(true);
      if (viewMode === 'condensed') {
        const response = await statsAPI.getOverallStandings(selectedTag);
        if (response.data.success) {
          setStandings(response.data.standings);
        }
      } else {
        const response = await statsAPI.getOverallStandingsDetailed(selectedTag);
        if (response.data.success) {
          setStandings(response.data.standings);
          setDetailedData(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading overall standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (playerId) => {
    setSelectedRow(selectedRow === playerId ? null : playerId);
  };

  const renderCondensedView = () => (
    <div className="table-container quick-table-container">
      <div className="quick-header-container" onScroll={handleHeaderScroll}>
        <div className="quick-header">
          <div className="header-cell rank-header">#</div>
          <div className="header-cell player-header">Player</div>
          <div className="header-cell data-header">Total Score</div>
          <div className="header-cell data-header">Total Correct</div>
          <div className="header-cell data-header">Average Week</div>
        </div>
      </div>
      <div className="quick-body-wrapper">
        <div className="quick-body" onScroll={handleBodyScroll}>
          {standings.map((player, index) => (
          <div 
            key={player.id} 
            className={`quick-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRow === player.id ? 'selected' : ''}`}
            onClick={() => handleRowClick(player.id)}
          >
            <div className="table-cell rank">{index + 1}</div>
            <div className="table-cell player-name">
              <div className="player-info">
                <span className="name">{player.nickname}</span>
              </div>
            </div>
            <div className="table-cell score">{formatNumber(player.score || player.total_score)}</div>
            <div className="table-cell correct">{formatNumber(player.numright || player.total_correct)}</div>
            <div className="table-cell average">
              {(player.weeks_played || 0) > 0 
                ? formatNumber((player.score || player.total_score) / (player.weeks_played || 1))
                : '0'
              }
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );

  const renderClassicView = () => {
    if (!detailedData) return null;

    const allWeeks = detailedData.weeks || [];
    const weeklyScores = detailedData.weeklyScores || {};

    // Filter weeks to only show those that have started and sort from latest to earliest
    // The backend already filters by startdate < NOW(), so we just use all weeks returned
    const weeks = allWeeks.sort((a, b) => b.number - a.number);

    return (
      <div className="table-container full-table-container">
        <div className="full-header-container" onScroll={handleHeaderScroll}>
          <div 
            className="full-header"
            style={{
              gridTemplateColumns: `60px 250px 180px repeat(${weeks.length}, minmax(100px, 1fr)) 6px`,
              '--week-count': weeks.length
            }}
          >
            <div className="header-cell rank-header">#</div>
            <div className="header-cell player-header">Player</div>
            <div className="header-cell total-header">
              <div className="total-column-header">
                <div className="total-label">Total (# Correct)</div>
              </div>
            </div>
            {weeks.map(week => (
              <div key={week.id} className="header-cell week-header">
                <div className="week-column">
                  <div className="week-number">Week {week.number}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="full-body" onScroll={handleBodyScroll}>
          {standings.map((player, index) => (
            <div 
              key={player.id} 
              className={`full-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRow === player.id ? 'selected' : ''}`}
              onClick={() => handleRowClick(player.id)}
              style={{
                gridTemplateColumns: `60px 250px 180px repeat(${weeks.length}, minmax(100px, 1fr))`,
                '--week-count': weeks.length
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
              <div className="table-cell total-column">
                <div className="total-score-display">
                  <div className="total-score">{formatNumber(player.total_score || player.score)}</div>
                  <div className="total-correct">({formatNumber(player.total_correct || player.numright)})</div>
                </div>
              </div>
              {weeks.map(week => {
                const weekData = weeklyScores[player.id]?.[week.number] || { score: 0, correct: 0 };
                return (
                  <div key={week.id} className="table-cell week-data">
                    <div className="week-score-display">
                      <div className="week-score">{formatNumber(weekData.score)}</div>
                      <div className="week-correct">({formatNumber(weekData.correct)})</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="standings-container">
      <div className="standings-header glass-container">
        <div className="header-content">
          <div className="title-section">
            <h1>Overall Standings</h1>
          </div>
          
          <div className="controls">
            <div className="view-toggle">
              <label htmlFor="view-toggle">View</label>
              <div className="slider-container">
                <div className="slider-track" onClick={() => setViewMode(viewMode === 'condensed' ? 'classic' : 'condensed')}>
                  <div className={`slider-thumb ${viewMode === 'classic' ? 'slider-thumb-right' : 'slider-thumb-left'}`}>
                  </div>
                  <div className="slider-track-labels">
                    <span className={`track-label ${viewMode === 'condensed' ? 'track-label-active' : 'track-label-inactive'}`}>
                      <span className="desktop-text">Quick View</span>
                      <span className="mobile-text">Quick</span>
                    </span>
                    <span className={`track-label ${viewMode === 'classic' ? 'track-label-active' : 'track-label-inactive'}`}>
                      <span className="desktop-text">Full View</span>
                      <span className="mobile-text">Full</span>
                    </span>
                  </div>
                </div>
              </div>
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
        <div className="season-info">
          <h2>2025 Season Totals</h2>
          <p>Combined scores from all completed weeks</p>
        </div>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : standings.length > 0 ? (
          viewMode === 'condensed' ? renderCondensedView() : renderClassicView()
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
                {formatNumber(Math.max(...standings.map(p => Number(p.score || p.total_score || 0))))}
              </div>
              <div className="stat-label">Highest Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {formatNumber(Math.min(...standings.map(p => Number(p.score || p.total_score || 0))))}
              </div>
              <div className="stat-label">Lowest Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {formatNumber(standings.reduce((sum, p) => sum + Number(p.score || p.total_score || 0), 0) / standings.length)}
              </div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .standings-container {
          max-width: 2000px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Override main-content max-width for this page */
        :global(.main-content) {
          max-width: 2000px !important;
        }

        .standings-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        }

        @media (min-width: 890px) {
          .header-content {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 2rem;
          }
        }

        .title-section {
          display: flex;
          align-items: center;
        }

        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0;
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
            gap: 1rem;
            width: auto;
          }
        }

        @media (min-width: 1024px) {
          .controls {
            grid-template-columns: repeat(2, auto);
            gap: 1.5rem;
          }
        }

        .view-toggle,
        .tag-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .view-toggle label,
        .tag-selector label {
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

        .season-info {
          margin-bottom: 1rem;
          text-align: center;
          padding: 0.5rem 0;
        }

        .season-info h2 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .season-info p {
          color: rgba(255, 255, 255, 0.7);
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

        .rank {
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          font-size: 1.1rem;
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

        .score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          font-size: 1.1rem;
        }

        .correct {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
          font-size: 1.1rem;
        }

        .average {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
          font-size: 1.1rem;
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
            font-size: 0.8rem;
          }

          .quick-row .table-cell.player-name .name {
            max-width: 100%;
            font-size: 0.9rem;
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
            font-size: 0.75rem;
          }

          .quick-row .table-cell.player-name .name {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .quick-header {
            grid-template-columns: 25px 1fr 45px 45px 45px;
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
            font-size: 0.7rem;
          }

          .quick-row .table-cell.player-name .name {
            font-size: 0.8rem;
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
            font-size: 0.65rem;
          }

          .quick-row .table-cell.player-name .name {
            font-size: 0.75rem;
          }
        }

        .standings-table-container {
          overflow: visible !important;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }

        .standings-table-container .table-container {
          overflow: visible !important;
        }

        /* Ensure dropdowns in header appear above table container */
        .standings-header {
          position: relative;
          z-index: 100 !important;
        }

        .standings-header .custom-dropdown {
          position: relative;
          z-index: 200 !important;
        }

        .standings-header .custom-dropdown .dropdown-menu {
          position: absolute;
          z-index: 200 !important;
        }

        /* Force header above table container */
        .standings-header.glass-container {
          position: relative;
          z-index: 100 !important;
        }

        .scrollable-table {
          width: 100%;
          max-height: 70vh;
          overflow-y: auto;
          display: block;
        }

        .scrollable-table thead {
          display: block;
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 16px 16px 0 0;
        }

        .scrollable-table tbody {
          display: block;
          overflow-y: auto;
        }

        .scrollable-table tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .glass-table th {
          text-align: center;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          padding: 0.5rem 0.5rem;
        }

        .player-header {
          text-align: left !important;
        }

        .glass-table td {
          text-align: center;
          padding: 0.5rem 0.5rem;
          vertical-align: middle;
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
        }

        .rank-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: rgba(150, 200, 255, 1);
          font-weight: 600;
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
          font-size: 1.1rem;
        }

        .you-indicator {
          background: rgba(100, 150, 255, 0.3);
          color: rgba(150, 200, 255, 1);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }


        .average {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
        }


        .week-header {
          min-width: 80px;
        }

        .week-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .week-number {
          font-weight: 700;
          color: rgba(150, 200, 255, 1);
          margin-bottom: 0.25rem;
        }

        .week-subheaders {
          display: flex;
          gap: 0.5rem;
        }

        .subheader {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .week-data {
          min-width: 80px;
        }

        .week-score {
          font-weight: 600;
          color: rgba(100, 150, 255, 1);
          margin-bottom: 0.25rem;
        }

        .week-correct {
          font-size: 0.9rem;
          color: rgba(150, 255, 150, 1);
          font-weight: 500;
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

        @media (max-width: 889px) {
          .header-content {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .title-section {
            text-align: center;
            width: 100%;
          }

          .title-section h1 {
            font-size: 2rem;
          }

          .controls {
            grid-template-columns: 1fr;
            gap: 1rem;
            width: 100%;
            max-width: 100%;
          }

          .slider-container {
            width: 100%;
            max-width: 100%;
          }

          .custom-dropdown {
            width: 100% !important;
            max-width: 100%;
          }

          .desktop-text {
            display: none;
          }

          .mobile-text {
            display: inline;
          }
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 1.75rem;
          }
          
          .controls {
            justify-content: center;
          }

          .classic-table-wrapper {
            min-width: 1000px;
          }
        }

        @media (max-width: 480px) {
          .title-section h1 {
            font-size: 1.5rem;
          }
        }

        .scrollable-table::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scrollable-table::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .scrollable-table::-webkit-scrollbar-thumb {
          background: rgba(100, 150, 255, 0.5);
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .scrollable-table::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 150, 255, 0.7);
        }

        .scrollable-table::-webkit-scrollbar-corner {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Full table container styles */
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
          white-space: nowrap;
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
          min-width: 100%;
          width: max-content;
          white-space: nowrap;
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
          font-size: 1.1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          min-width: 100%;
          width: max-content;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background-color 0.0s ease;
          cursor: default;
          white-space: nowrap;
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
          font-size: 1.1rem;
          cursor: default;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

        /* Total column header styling */
        .total-column-header {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .total-label {
          font-weight: 700;
          color: rgba(150, 200, 255, 1);
        }

        /* Total column data styling */
        .total-score-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .total-score {
          font-weight: 700;
          color: rgba(150, 255, 150, 1);
          font-size: 1.1rem;
          line-height: 1;
        }

        .total-correct {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          line-height: 1;
        }

        /* Week column styling */
        .week-header {
          min-width: 80px;
          text-align: center;
        }

        .week-column {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .week-number {
          font-weight: 700;
          color: rgba(150, 200, 255, 1);
        }

        .week-data {
          min-width: 80px;
          text-align: center;
        }

        .week-score-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .week-score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
          font-size: 1.1rem;
          line-height: 1;
        }

        .week-correct {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          line-height: 1;
        }


        @media (max-width: 889px) {
          .full-header .header-cell,
          .full-row .table-cell {
            font-size: 0.9rem;
            padding: 0.25rem 0.1rem;
          }

          .full-header .header-cell {
            padding: 0.3rem 0.1rem;
            font-size: 0.8rem;
          }

          .full-row .table-cell.player-name .name {
            max-width: 100%;
            font-size: 0.9rem;
          }

          .rank, .score, .correct, .average, .week-score, .week-correct, .total-score, .total-correct, .rank-display {
            font-size: 0.9rem;
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

          /* Override grid columns for mobile */
          .full-header {
            grid-template-columns: 40px 180px 140px repeat(var(--week-count, 1), minmax(70px, 1fr)) 6px !important;
          }

          .full-row {
            grid-template-columns: 40px 180px 140px repeat(var(--week-count, 1), minmax(70px, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .full-header .header-cell,
          .full-row .table-cell {
            font-size: 0.85rem;
            padding: 0.2rem 0.08rem;
          }

          .full-header .header-cell {
            padding: 0.25rem 0.08rem;
            font-size: 0.75rem;
          }

          .full-row .table-cell.player-name .name {
            font-size: 0.85rem;
          }

          .rank, .score, .correct, .average, .week-score, .week-correct, .total-score, .total-correct, .rank-display {
            font-size: 0.85rem;
          }

          /* Override grid columns for mobile */
          .full-header {
            grid-template-columns: 35px 150px 120px repeat(var(--week-count, 1), minmax(60px, 1fr)) 6px !important;
          }

          .full-row {
            grid-template-columns: 35px 150px 120px repeat(var(--week-count, 1), minmax(60px, 1fr)) !important;
          }
        }

        @media (max-width: 480px) {
          .full-header .header-cell,
          .full-row .table-cell {
            font-size: 0.8rem;
            padding: 0.15rem 0.05rem;
          }

          .full-header .header-cell {
            padding: 0.2rem 0.05rem;
            font-size: 0.7rem;
          }

          .full-row .table-cell.player-name .name {
            font-size: 0.8rem;
          }

          .rank, .score, .correct, .average, .week-score, .week-correct, .total-score, .total-correct, .rank-display {
            font-size: 0.8rem;
          }

          /* Override grid columns for mobile */
          .full-header {
            grid-template-columns: 30px 120px 100px repeat(var(--week-count, 1), minmax(50px, 1fr)) 6px !important;
          }

          .full-row {
            grid-template-columns: 30px 120px 100px repeat(var(--week-count, 1), minmax(50px, 1fr)) !important;
          }
        }

        @media (max-width: 360px) {
          .full-header .header-cell,
          .full-row .table-cell {
            font-size: 0.75rem;
            padding: 0.1rem 0.03rem;
          }

          .full-header .header-cell {
            padding: 0.15rem 0.03rem;
            font-size: 0.65rem;
          }

          .full-row .table-cell.player-name .name {
            font-size: 0.75rem;
          }

          .rank, .score, .correct, .average, .week-score, .week-correct, .total-score, .total-correct, .rank-display {
            font-size: 0.75rem;
          }

          /* Override grid columns for mobile */
          .full-header {
            grid-template-columns: 25px 100px 90px repeat(var(--week-count, 1), minmax(40px, 1fr)) 6px !important;
          }

          .full-row {
            grid-template-columns: 25px 100px 90px repeat(var(--week-count, 1), minmax(40px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default OverallStandings;