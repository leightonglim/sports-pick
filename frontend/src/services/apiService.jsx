// src/services/api.js
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for handling token expiration
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiService;

// League-related API calls
export const leagueService = {
  getLeagues: () => api.get('/leagues'),
  getLeague: (id) => api.get(`/leagues/${id}`),
  createLeague: (data) => api.post('/leagues', data),
  updateLeague: (id, data) => api.put(`/leagues/${id}`, data),
  deleteLeague: (id) => api.delete(`/leagues/${id}`),
  joinLeague: (code) => api.post('/leagues/join', { code }),
  leaveLeague: (id) => api.post(`/leagues/${id}/leave`),
  getLeagueMembers: (id) => api.get(`/leagues/${id}/members`),
  getLeagueStandings: (id) => api.get(`/leagues/${id}/standings`),
  addSportToLeague: (id, sportId) => api.post(`/leagues/${id}/sports`, { sportId }),
  removeSportFromLeague: (id, sportId) => api.delete(`/leagues/${id}/sports/${sportId}`),
};

// Picks-related API calls
export const picksService = {
  getUserPicks: (leagueId, sportId, week) => 
    api.get(`/picks/user`, { params: { leagueId, sportId, week } }),
  submitPicks: (leagueId, sportId, week, picks) => 
    api.post('/picks', { leagueId, sportId, week, picks }),
  getPickSummary: (leagueId, sportId, week) => 
    api.get(`/picks/summary`, { params: { leagueId, sportId, week } }),
};

// Games-related API calls
export const gamesService = {
  getGames: (sportId, week) => api.get(`/games`, { params: { sportId, week } }),
  refreshGames: (sportId, week) => api.post(`/games/refresh`, { sportId, week }),
};

// Sports-related API calls
export const sportsService = {
  getSports: () => api.get('/sports'),
  getSport: (id) => api.get(`/sports/${id}`),
  getCurrentWeek: (sportId) => api.get(`/sports/${sportId}/current-week`),
};

// Notifications-related API calls
export const notificationsService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  updateNotificationPreferences: (preferences) => 
    api.put('/notifications/preferences', preferences),
};
