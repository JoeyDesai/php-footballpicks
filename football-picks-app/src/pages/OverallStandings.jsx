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
    // Default to quick view on mobile devices, full view on desktop
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? 'quick' : 'full';
  }); // 'quick' or 'full'
  const [selectedRows, setSelectedRows] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    { id: 0, name: 'All' }
  ]);

  // Single scroll handler for unified container
  const handleBodyScroll = (e) => {
    // No need for synchronization since header and body are in the same container
  };

  useEffect(() => {
    loadUserTags();

    // Handle window resize to adjust view mode
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const newViewMode = isMobile ? 'quick' : 'full';
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
      if (viewMode === 'quick') {
        const response = await statsAPI.getOverallStandings(selectedTag);
        if (response.data.success) {
          setStandings(response.data.standings);
          setDetailedData(null);
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
    setSelectedRows(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const renderQuickView = () => (
    <div className="div-table-container quick-table-container">
      <div className="div-scroll-container" onScroll={handleBodyScroll}>
        <div 
          className="div-header-row quick-header"
          style={{
            '--calculated-width': 'calc(100% + 6px)'
          }}
        >
          <div className="div-header-cell rank-header">#</div>
          <div className="div-header-cell player-header">Player</div>
          <div className="div-header-cell data-header">Total Score</div>
          <div className="div-header-cell data-header">Total Correct</div>
          <div className="div-header-cell data-header">Average Week</div>
        </div>
        {standings.map((player, index) => (
        <div 
          key={player.id} 
          className={`div-body-row quick-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRows.includes(player.id) ? 'selected' : ''}`}
          onClick={() => handleRowClick(player.id)}
          style={{
            '--calculated-width': 'calc(100% + 6px)'
          }}
        >
          <div className="div-body-cell rank">{index + 1}</div>
          <div className="div-body-cell player-name">
            <div className="player-info">
              <span className="name">{player.nickname}</span>
            </div>
          </div>
          <div className="div-body-cell score">{formatNumber(player.score || player.total_score)}</div>
          <div className="div-body-cell correct">{formatNumber(player.numright || player.total_correct)}</div>
          <div className="div-body-cell average">
            {(player.weeks_played || 0) > 0 
              ? formatNumber((player.score || player.total_score) / (player.weeks_played || 1))
              : '0'
            }
          </div>
        </div>
      ))}
      </div>
    </div>
  );

  const renderFullView = () => {
    if (!detailedData) return null;

    const allWeeks = detailedData.weeks || [];
    const weeklyScores = detailedData.weeklyScores || {};

    // Filter weeks to only show those that have started and sort from latest to earliest
    // The backend already filters by startdate < NOW(), so we just use all weeks returned
    const weeks = allWeeks.sort((a, b) => b.number - a.number);

    return (
      <div className="div-table-container full-table-container">
        <div className="div-scroll-container" onScroll={handleBodyScroll}>
          <div 
            className="div-header-row"
            style={{
              gridTemplateColumns: `60px minmax(150px, 1fr) 180px repeat(${weeks.length}, 100px)`,
              '--calculated-width': '100%',
              '--weeks-count': weeks.length
            }}
          >
            <div className="div-header-cell rank-header">#</div>
            <div className="div-header-cell player-header">Player</div>
            <div className="div-header-cell total-header">
              <div className="total-column-header">
                <div className="total-label">Total (# Correct)</div>
              </div>
            </div>
            {weeks.map(week => (
              <div key={week.id} className="div-header-cell week-header">
                <div className="week-column">
                  <div className="week-number">Week {week.number}</div>
                </div>
              </div>
            ))}
          </div>
          {standings.map((player, index) => (
            <div 
              key={player.id} 
              className={`div-body-row ${player.id === user?.id ? 'current-user' : ''} ${selectedRows.includes(player.id) ? 'selected' : ''}`}
              onClick={() => handleRowClick(player.id)}
              style={{
                gridTemplateColumns: `60px minmax(150px, 1fr) 180px repeat(${weeks.length}, 100px)`,
                '--calculated-width': '100%',
                '--weeks-count': weeks.length
              }}
            >
              <div className="div-body-cell rank">
                <div className="rank-display">
                  {index + 1}
                </div>
              </div>
              <div className="div-body-cell player-name">
                <div className="player-info">
                  <span className="name">{player.nickname}</span>
                </div>
              </div>
              <div className="div-body-cell total-column">
                <div className="total-score-display">
                  <div className="total-score">{formatNumber(player.total_score || player.score)}</div>
                  <div className="total-correct">({formatNumber(player.total_correct || player.numright)})</div>
                </div>
              </div>
              {weeks.map(week => {
                const weekData = weeklyScores[player.id]?.[week.number] || { score: 0, correct: 0 };
                return (
                  <div key={week.id} className="div-body-cell week-data">
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
          viewMode === 'quick' ? renderQuickView() : renderFullView()
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

        .view-toggle,
        .tag-selector {
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

        .tag-selector .custom-dropdown {
          z-index: 320 !important;
        }

        .tag-selector .custom-dropdown .dropdown-menu {
          z-index: 320 !important;
        }

        .custom-dropdown {
          width: 180px !important;
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
          margin: 0;
          font-weight: 600;
        }

        .season-info p {
          color: rgba(255, 255, 255, 0.7);
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

        .div-table-container {
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

        .div-scroll-container {
          max-height: 70vh;
          overflow-y: auto;
          overflow-x: auto;
          width: 100%;
          border-radius: 16px;
          margin-right: -6px;
          padding-right: 6px;
          box-sizing: border-box;
        }

        .div-scroll-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .div-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .div-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 200, 0.4);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .div-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 200, 0.6);
        }

        .div-scroll-container::-webkit-scrollbar-corner {
          background: transparent;
          border-radius: 0 0 16px 0;
        }

        .div-scroll-container::-webkit-scrollbar:vertical {
          margin-bottom: 6px;
        }

        .div-header-row {
          display: grid;
          min-width: 0;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .div-header-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(20, 22, 36, 0.75);
          backdrop-filter: blur(20px);
          z-index: -1;
          width: var(--calculated-width, 100%);
        }

        .div-header-row.quick-header {
          grid-template-columns: 50px 1fr 80px 80px 80px;
        }

        .div-header-row.quick-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(20, 22, 36, 0.75);
          backdrop-filter: blur(20px);
          z-index: -1;
          width: var(--calculated-width, 100%);
        }

        .div-header-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.2rem;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          min-height: 32px;
        }

        .div-header-cell:last-child {
          border-right: none;
        }

        .div-header-cell.player-header {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
        }

        .div-body-row {
          display: grid;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background-color 0.0s ease;
          cursor: default;
          min-width: 0;
          width: 100%;
          position: relative;
        }

        .div-body-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          transition: background-color 0.0s ease;
          width: var(--calculated-width, 100%);
        }

        .div-body-row:hover::before {
          background: rgba(255, 255, 255, 0.05);
        }

        .div-body-row.selected::before {
          background: rgba(100, 150, 255, 0.1);
          box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
        }

        .div-body-row.current-user::before {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.3);
        }

        .div-body-row.current-user:hover::before {
          background: rgba(255, 215, 0, 0.15);
        }

        .div-body-row.current-user.selected::before {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.5);
        }

        .div-body-row.quick-row {
          grid-template-columns: 50px 1fr 80px 80px 80px;
        }

        .div-body-row.quick-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          transition: background-color 0.0s ease;
          width: var(--calculated-width, 100%);
        }

        .div-body-row.quick-row:hover::before {
          background: rgba(255, 255, 255, 0.05);
        }

        .div-body-row.quick-row.selected::before {
          background: rgba(100, 150, 255, 0.1);
          box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
        }

        .div-body-row.quick-row.current-user::before {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.3);
        }

        .div-body-row.quick-row.current-user:hover::before {
          background: rgba(255, 215, 0, 0.15);
        }

        .div-body-row.quick-row.current-user.selected::before {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.5);
        }

        .div-body-cell:last-child {
          padding-right: 0px;
          border-right: none;
        }

        .div-body-cell {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          cursor: default;
          min-height: 32px;
        }

        .div-body-cell.player-name {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
          min-width: 0;
          overflow: hidden;
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

        .score {
          font-weight: 700;
          color: rgba(100, 150, 255, 1);
        }

        .correct {
          color: rgba(150, 255, 150, 1);
          font-weight: 600;
        }

        .average {
          color: rgba(255, 200, 100, 1);
          font-weight: 600;
        }

        .no-data {
          text-align: center;
          padding: 3rem;
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

        .div-header-row:not(.quick-header) {
          display: grid;
          gap: 0.05rem;
          min-width: 100%;
          width: 100%;
        }

        .div-body-row:not(.quick-row) {
          display: grid;
          gap: 0.05rem;
          min-width: 100%;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background-color 0.0s ease;
          cursor: default;
          position: relative;
        }

        .div-body-row:not(.quick-row)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          transition: background-color 0.0s ease;
          width: var(--calculated-width, 100%);
        }

        .div-body-row:not(.quick-row):hover::before {
          background: rgba(255, 255, 255, 0.05);
        }

        .div-body-row:not(.quick-row).selected::before {
          background: rgba(100, 150, 255, 0.1);
          box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
        }

        .div-body-row:not(.quick-row).current-user::before {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.3);
        }

        .div-body-row:not(.quick-row).current-user:hover::before {
          background: rgba(255, 215, 0, 0.15);
        }

        .div-body-row:not(.quick-row).current-user.selected::before {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.5);
        }

        .div-header-cell:not(.quick-header .div-header-cell) {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.2rem;
          font-weight: 600;
          color: rgba(150, 200, 255, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          min-height: 32px;
        }

        .div-body-cell:not(.quick-row .div-body-cell) {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem !important;
          cursor: default;
          min-height: 32px;
        }

        .div-body-cell:not(.quick-row .div-body-cell).player-name {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
          font-size: 1.1rem !important;
        }

        .div-header-cell:not(.quick-header .div-header-cell).player-header {
          text-align: left !important;
          justify-content: flex-start !important;
          padding-left: 5px;
        }

        .div-body-cell.player-name .name {
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

        .rank-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: rgba(150, 200, 255, 1);
          font-weight: 600;
        }

        .stats-summary {
          text-align: center;
          margin-top: 1.5rem;
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

        /* Default: Use 1fr for player column to fill available space with minimum width */
        .div-header-row:not(.quick-header) {
          grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
          --calculated-width: 100% !important;
        }
        
        .div-body-row:not(.quick-row) {
          grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
          --calculated-width: 100% !important;
        }

        /* Tablet/small desktop screens - ensure proper behavior */
        @media (min-width: 768px) and (max-width: 1024px) {
          .div-header-row:not(.quick-header) {
            grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: 100% !important;
          }
          
          .div-body-row:not(.quick-row) {
            grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: 100% !important;
          }
        }

        /* When viewport is smaller than content, use fixed widths */
        @media (max-width: 767px) {
          .div-header-row:not(.quick-header) {
            grid-template-columns: 60px 150px 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: calc(60px + 150px + 180px + (var(--weeks-count) * 100px) + 15px) !important;
          }
          
          .div-body-row:not(.quick-row) {
            grid-template-columns: 60px 150px 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: calc(60px + 150px + 180px + (var(--weeks-count) * 100px) + 15px) !important;
          }
        }

        @media (max-width: 889px) {
          .div-header-row.quick-header {
            grid-template-columns: 35px 1fr 60px 60px 60px;
          }

          .div-body-row.quick-row {
            grid-template-columns: 35px 1fr 60px 60px 60px;
          }

          /* Ensure full view works on tablet screens */
          .div-header-row:not(.quick-header) {
            grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: 100% !important;
          }
          
          .div-body-row:not(.quick-row) {
            grid-template-columns: 60px minmax(150px, 1fr) 180px repeat(var(--weeks-count), 100px) !important;
            --calculated-width: 100% !important;
          }

          .div-header-cell,
          .div-body-cell {
            font-size: 0.9rem;
            padding: 0.25rem 0.1rem;
          }

          .div-header-cell {
            padding: 0.3rem 0.1rem;
            font-size: 0.8rem;
          }

          .div-body-cell.player-name .name {
            max-width: 100%;
          }

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

          .div-table-container {
            overflow-x: auto;
            width: 100%;
            min-width: 100%;
          }

        }

        @media (max-width: 768px) {
          .div-header-row.quick-header {
            grid-template-columns: 30px 1fr 55px 55px 55px;
          }

          .div-body-row.quick-row {
            grid-template-columns: 30px 1fr 55px 55px 55px;
          }

          .div-header-cell,
          .div-body-cell {
            font-size: 0.85rem;
            padding: 0.2rem 0.08rem;
          }

          .div-header-cell {
            padding: 0.25rem 0.08rem;
            font-size: 0.75rem;
          }


          .title-section h1 {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 480px) {
          .div-header-row.quick-header {
            grid-template-columns: 25px 1fr 45px 45px 45px;
          }

          .div-body-row.quick-row {
            grid-template-columns: 25px 1fr 45px 45px 45px;
          }

          .div-header-cell,
          .div-body-cell {
            font-size: 0.8rem;
            padding: 0.15rem 0.05rem;
          }

          .div-header-cell {
            padding: 0.2rem 0.05rem;
            font-size: 0.7rem;
          }


          .title-section h1 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 360px) {
          .div-header-row.quick-header {
            grid-template-columns: 20px 1fr 40px 40px 40px;
          }

          .div-body-row.quick-row {
            grid-template-columns: 20px 1fr 40px 40px 40px;
          }

          .div-header-cell,
          .div-body-cell {
            font-size: 0.75rem;
            padding: 0.1rem 0.03rem;
          }

          .div-header-cell {
            padding: 0.15rem 0.03rem;
            font-size: 0.65rem;
          }

        }
      `}</style>
    </div>
  );
}

export default OverallStandings;