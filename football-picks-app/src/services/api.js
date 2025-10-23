// API service for Football Picks app
import axios from 'axios';
import { getBackendUrl, config } from '../config';

// Backend URL - use network IP when accessing from mobile
const BASE_URL = getBackendUrl();

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json'
  },
});

export const authAPI = {
  login: (email, password) => 
    api.post(config.api.auth.login, { email, password }),
  
  logout: () => 
    api.post(config.api.auth.logout),
  
  createAccount: (userData) => 
    api.post(config.api.auth.createAccount, {
      email: userData.email,
      realName: userData.realName,
      nickName: userData.nickName,
      password: userData.password,
      sitePassword: userData.sitePassword
    }),
  
  checkSession: () => 
    api.get(config.api.auth.checkSession),
  
  getUserTags: () => 
    api.get(config.api.auth.getUserTags)
};

export const gameAPI = {
  getWeeks: () => 
    api.get(config.api.game.getWeeks),
  
  getGames: (weekId) => 
    api.get(config.api.game.getGames(weekId)),
  
  getPicks: (weekId) => 
    api.get(config.api.game.getPicks(weekId)),
  
  submitPicks: (weekId, picks) => 
    api.post(config.api.game.submitPicks(weekId), picks)
};

export const statsAPI = {
  getWeeklyStandings: (weekId, tag = 0) => 
    api.get(config.api.stats.getWeeklyStandings(weekId, tag)),
  
  getWeeklyStandingsDetailed: (weekId, tag = 0) => 
    api.get(config.api.stats.getWeeklyStandingsDetailed(weekId, tag)),
  
  getWeeklyStandingsClassic: (weekId, tag = 0) => 
    api.get(config.api.stats.getWeeklyStandingsClassic(weekId, tag)),
  
  getOverallStandings: (tag = 0) => 
    api.get(config.api.stats.getOverallStandings(tag)),
  
  getOverallStandingsDetailed: (tag = 0) => 
    api.get(config.api.stats.getOverallStandingsDetailed(tag)),
  
  getTeamStats: () => 
    api.get(config.api.stats.getTeamStats),
  
  getHomeStats: () => 
    api.get(config.api.stats.getHomeStats),
  
  getWeeks: () => 
    api.get(config.api.stats.getWeeks)
};

export const adminAPI = {
  getUsers: () => 
    api.get(config.api.admin.getUsers),
  
  getPicksStatus: (weekId) => 
    api.get(config.api.admin.getPicksStatus(weekId)),
  
  getUserPicks: (userId, weekId) => 
    api.get(config.api.admin.getUserPicks(userId, weekId)),
  
  submitUserPicks: (userId, weekId, picks) => 
    api.post(config.api.admin.submitUserPicks(userId, weekId), picks),
  
  runScript: (scriptType) => 
    api.post(config.api.admin.runScript, { scriptType }),
  
  getAllTags: () => 
    api.get(config.api.admin.getAllTags),
  
  getUserTags: (userId) => 
    api.get(config.api.admin.getUserTags(userId)),
  
  updateUserTags: (userId, tagIds) => 
    api.post(config.api.admin.updateUserTags(userId), { tagIds })
};

export default api;