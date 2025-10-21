// API service for Football Picks app
import axios from 'axios';

// Backend URL - use network IP when accessing from mobile
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'http://192.168.0.115:3001';

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
    api.get('/api/check-session'),
  
  getUserTags: () => 
    api.get('/api/user-tags')
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
  
  getWeeklyStandingsDetailed: (weekId, tag = 0) => 
    api.get(`/api/weekly-standings-detailed/${weekId}?tag=${tag}`),
  
  getWeeklyStandingsClassic: (weekId, tag = 0) => 
    api.get(`/api/weekly-standings-classic/${weekId}?tag=${tag}`),
  
  getOverallStandings: (tag = 0) => 
    api.get(`/api/overall-standings?tag=${tag}`),
  
  getOverallStandingsDetailed: (tag = 0) => 
    api.get(`/api/overall-standings-detailed?tag=${tag}`),
  
  getTeamStats: () => 
    api.get('/api/team-stats'),
  
  getHomeStats: () => 
    api.get('/api/home-stats')
};

export const adminAPI = {
  getUsers: () => 
    api.get('/api/admin/users'),
  
  getPicksStatus: (weekId) => 
    api.get(`/api/admin/picks-status/${weekId}`),
  
  getUserPicks: (userId, weekId) => 
    api.get(`/api/admin/user-picks/${userId}/${weekId}`),
  
  submitUserPicks: (userId, weekId, picks) => 
    api.post(`/api/admin/user-picks/${userId}/${weekId}`, picks),
  
  runScript: (scriptType) => 
    api.post('/api/admin/run-script', { scriptType }),
  
  getAllTags: () => 
    api.get('/api/admin/tags'),
  
  getUserTags: (userId) => 
    api.get(`/api/admin/user-tags/${userId}`),
  
  updateUserTags: (userId, tagIds) => 
    api.post(`/api/admin/user-tags/${userId}`, { tagIds })
};

export default api;