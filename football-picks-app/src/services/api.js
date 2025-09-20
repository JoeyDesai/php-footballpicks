// API service for Football Picks app
import axios from 'axios';

// Use the existing server
const BASE_URL = 'https://jasetheace.com/footballpicks';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookie-based auth
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
  // Login through the normal login page to establish session cookie
  login: async (email, password) => {
    try {
      // Login through the main page to establish session
      const response = await api.post('/', transformRequest({ 
        Email: email, 
        Pass: password 
      }));
      
      // Check if login was successful by testing API access
      const apiTest = await api.get('/api/info');
      if (apiTest.status === 200) {
        // Login successful, get user info from session
        return { data: { success: true } };
      } else {
        return { data: { success: false, error: 'Invalid credentials' } };
      }
    } catch (error) {
      if (error.response && error.response.status === 200) {
        // Sometimes PHP redirects are seen as errors, check if we can access API
        try {
          await api.get('/api/info');
          return { data: { success: true } };
        } catch (apiError) {
          return { data: { success: false, error: 'Invalid credentials' } };
        }
      }
      return { data: { success: false, error: 'Network error - unable to connect to server' } };
    }
  },
  
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
  
  // Check if we have a valid session by testing API access
  checkSession: async () => {
    try {
      const response = await api.get('/api/info');
      if (response.status === 200) {
        return { data: { authenticated: true, user: { id: 1 } } }; // Basic user object
      }
      return { data: { authenticated: false } };
    } catch (error) {
      return { data: { authenticated: false } };
    }
  }
};

export const gameAPI = {
  // Get current year and week info
  getInfo: () => 
    api.get('/api/info'),
  
  // Get weeks - we'll need to create this or use existing pages
  getWeeks: async () => {
    try {
      const info = await api.get('/api/info');
      // For now, return basic week structure - you may need to enhance this
      return { 
        data: { 
          success: true, 
          weeks: [{ id: info.data.week, number: info.data.week, current: true }] 
        } 
      };
    } catch (error) {
      return { data: { success: false, error: 'Failed to load weeks' } };
    }
  },
  
  getCurrentWeek: () => 
    api.get('/api/info'),
  
  // Get games for a week - may need to use existing pages
  getGames: (weekId) => {
    // This might need to use existing picks page or create new endpoint
    return api.get(`/picks.php?week=${weekId}`);
  },
  
  // Get picks for a week using API
  getPicks: (weekNum) => 
    api.get(`/api/picks/${weekNum}`),
  
  // Submit picks using API  
  submitPicks: (weekNum, picks) => 
    api.post(`/api/picks/${weekNum}`, transformRequest(picks))
};

export const statsAPI = {
  // These will need to use existing pages since API doesn't mention them
  getWeeklyStandings: (weekId, tag = 0) => 
    api.get(`/group.php?week=${weekId}`),
  
  getOverallStandings: (tag = 0) => 
    api.get('/group.php'),
  
  getTeamStats: () => 
    api.get('/teamstats.php'),
  
  getHomeStats: async () => {
    try {
      const info = await api.get('/api/info');
      return { 
        data: { 
          success: true, 
          currentWeek: { number: info.data.week },
          weeklyStandings: [],
          overallStandings: []
        } 
      };
    } catch (error) {
      return { data: { success: false } };
    }
  }
};

export default api;