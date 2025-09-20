import axios from 'axios';

// Since we're running on different ports, we need to use the full URL to the PHP backend
// Assuming the PHP app runs on the same host but different port or path
const BASE_URL = 'http://localhost'; // Adjust this to match your PHP server

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for session-based auth
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
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
    api.post('/footballpicks/', transformRequest({ Email: email, Pass: password })),
  
  logout: () => 
    api.get('/footballpicks/logout.php'),
  
  createAccount: (userData) => 
    api.post('/footballpicks/createaccount.php', transformRequest({
      email: userData.email,
      name: userData.realName,
      nick: userData.nickName,
      pass1: userData.password,
      pass2: userData.confirmPassword,
      sitepass: userData.sitePassword,
      SUBMIT: 'Sign Up'
    })),
  
  checkSession: () => 
    api.get('/footballpicks/api/session-check.php')
};

export const gameAPI = {
  getWeeks: () => 
    api.get('/footballpicks/api/weeks.php'),
  
  getCurrentWeek: () => 
    api.get('/footballpicks/api/current-week.php'),
  
  getGames: (weekId) => 
    api.get(`/footballpicks/api/games.php?week=${weekId}`),
  
  getPicks: (weekId) => 
    api.get(`/footballpicks/api/picks.php?week=${weekId}`),
  
  submitPicks: (weekId, picks) => 
    api.post('/footballpicks/picks.php', transformRequest({
      week: weekId,
      Submit: 'Submit',
      ...picks
    }))
};

export const statsAPI = {
  getWeeklyStandings: (weekId, tag = 0) => 
    api.get(`/footballpicks/api/weekly-standings.php?week=${weekId}&tag=${tag}`),
  
  getOverallStandings: (tag = 0) => 
    api.get(`/footballpicks/api/overall-standings.php?tag=${tag}`),
  
  getTeamStats: () => 
    api.get('/footballpicks/api/team-stats.php'),
  
  getHomeStats: () => 
    api.get('/footballpicks/api/home-stats.php')
};

export default api;