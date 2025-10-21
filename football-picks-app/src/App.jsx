import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Home from './pages/Home';
import WeeklyStandings from './pages/WeeklyStandings';
import OverallStandings from './pages/OverallStandings';
import TeamStats from './pages/TeamStats';
import MakePicks from './pages/MakePicks';
import CreateAccount from './pages/CreateAccount';
import Admin from './pages/Admin';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  // Fix mobile scroll position on mount and handle iPhone PWA spacing
  useEffect(() => {
    // Ensure page starts at top on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768 || 
                     ('ontouchstart' in window);
    
    // Check if running as PWA on iPhone
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    const isiPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Force scroll to top immediately
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Add minimal spacing for iPhone PWA dynamic island
      if (isPWA && isiPhone) {
        document.body.classList.add('iphone-pwa');
      }
      
      // Also set on window load to handle any delayed rendering
      const handleLoad = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      
      window.addEventListener('load', handleLoad);
      
      // Cleanup
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/weekly-standings" element={<WeeklyStandings />} />
          <Route path="/overall-standings" element={<OverallStandings />} />
          <Route path="/team-stats" element={<TeamStats />} />
          <Route path="/make-picks" element={<MakePicks />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;