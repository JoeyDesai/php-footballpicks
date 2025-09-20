import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-title" onClick={closeMenu}>
          <Target className="header-icon" />
          Football Picks
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/weekly-standings" className="nav-link">Weekly Standings</Link>
          <Link to="/overall-standings" className="nav-link">Overall Standings</Link>
          <Link to="/team-stats" className="nav-link">Team Stats</Link>
          <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Call to Action Button */}
        <Link to="/make-picks" className="cta-button">
          Enter Your Picks
        </Link>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="mobile-nav">
          <Link to="/weekly-standings" className="mobile-nav-link" onClick={closeMenu}>
            Weekly Standings
          </Link>
          <Link to="/overall-standings" className="mobile-nav-link" onClick={closeMenu}>
            Overall Standings
          </Link>
          <Link to="/team-stats" className="mobile-nav-link" onClick={closeMenu}>
            Team Stats
          </Link>
          <Link to="/make-picks" className="mobile-nav-link" onClick={closeMenu}>
            Enter Your Picks
          </Link>
          <button onClick={handleLogout} className="mobile-nav-link logout-btn">
            Logout
          </button>
        </nav>
      )}

      <style jsx>{`
        .header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .header-title:hover {
          color: rgba(150, 200, 255, 1);
        }

        .header-icon {
          color: rgba(100, 150, 255, 1);
        }

        .desktop-nav {
          display: none;
          align-items: center;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .nav-link:hover {
          color: rgba(150, 200, 255, 1);
        }

        .logout-btn {
          color: rgba(255, 150, 150, 0.8);
        }

        .logout-btn:hover {
          color: rgba(255, 150, 150, 1);
        }

        .mobile-menu-btn {
          display: block;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .mobile-menu-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none;
          }
        }

        .cta-button {
          display: none;
          background: linear-gradient(135deg, rgba(100, 150, 255, 0.5), rgba(150, 200, 255, 0.4));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          color: white;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(100, 150, 255, 0.3);
        }

        @media (min-width: 1024px) {
          .cta-button {
            display: block;
          }
        }

        .mobile-nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .mobile-nav {
            display: none;
          }
        }

        .mobile-nav-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          text-align: left;
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(150, 200, 255, 1);
        }
      `}</style>
    </header>
  );
}

export default Header;