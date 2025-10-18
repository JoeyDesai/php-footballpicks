// API service for Football Picks app
import axios from 'axios';

// Local backend
const BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json'
  },
});

export const authAPI = {
  login: (email, password) => 
    api.post('/api/login', { email, password }),
  
  logout: () => 
    api.post('/api/logout'),
  
  createAccount: (userData) => 
    api.post('/api/create-account', {
      email: userData.email,
      realName: userData.realName,
      nickName: userData.nickName,
      password: userData.password,
      sitePassword: userData.sitePassword
    }),
  
  checkSession: () => 
    api.get('/api/check-session')
};

export const gameAPI = {
  getWeeks: () => 
    api.get('/api/weeks'),
  
  getGames: (weekId) => 
    api.get(`/api/games/${weekId}`),
  
  getPicks: (weekId) => 
    api.get(`/api/picks/${weekId}`),
  
  submitPicks: (weekId, picks) => 
    api.post(`/api/picks/${weekId}`, picks)
};

export const statsAPI = {
  getWeeklyStandings: (weekId, tag = 0) => 
    api.get(`/api/weekly-standings/${weekId}?tag=${tag}`),
  
  getWeeklyStandingsDetailed: (weekId) => 
    api.get(`/api/weekly-standings-detailed/${weekId}`),
  
  getWeeklyStandingsClassic: (weekId) => 
    api.get(`/api/weekly-standings-classic/${weekId}`),
  
  getOverallStandings: (tag = 0) => 
    api.get(`/api/overall-standings?tag=${tag}`),
  
  getOverallStandingsDetailed: () => 
    api.get('/api/overall-standings-detailed'),
  
  getTeamStats: () => 
    api.get('/api/team-stats'),
  
  getHomeStats: () => 
    api.get('/api/home-stats')
};

export default api;