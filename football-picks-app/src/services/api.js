import axios from 'axios';

// Base URL for the PHP backend - adjust this to match your server
const BASE_URL = 'https://jasetheace.com/footballpicks';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for session-based auth
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Transform data to form-encoded format for PHP compatibility
const transformRequest = (data) => {
  if (data && typeof data === 'object') {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => {
      params.append(key, data[key]);
    });
    return params;
  }
  return data;
};

export const authAPI = {
  login: (email, password) => 
    api.post('/login.php', transformRequest({ Email: email, Pass: password })),
  
  logout: () => 
    api.get('/logout.php'),
  
  createAccount: (userData) => 
    api.post('/createaccount.php', transformRequest({
      email: userData.email,
      name: userData.realName,
      nick: userData.nickName,
      pass1: userData.password,
      pass2: userData.confirmPassword,
      sitepass: userData.sitePassword,
      SUBMIT: 'Sign Up'
    })),
  
  checkSession: () => 
    api.get('/api/check-session.php')
};

export const gameAPI = {
  getWeeks: () => 
    api.get('/api/weeks.php'),
  
  getCurrentWeek: () => 
    api.get('/api/current-week.php'),
  
  getGames: (weekId) => 
    api.get(`/api/games.php?week=${weekId}`),
  
  getPicks: (weekId) => 
    api.get(`/api/picks.php?week=${weekId}`),
  
  submitPicks: (weekId, picks) => 
    api.post('/picks.php', transformRequest({
      week: weekId,
      Submit: 'Submit',
      ...picks
    }))
};

export const statsAPI = {
  getWeeklyStandings: (weekId, tag = 0) => 
    api.get(`/api/weekly-standings.php?week=${weekId}&tag=${tag}`),
  
  getOverallStandings: (tag = 0) => 
    api.get(`/api/overall-standings.php?tag=${tag}`),
  
  getTeamStats: () => 
    api.get('/api/team-stats.php'),
  
  getHomeStats: () => 
    api.get('/api/home-stats.php')
};

export default api;