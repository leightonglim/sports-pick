// src/services/apiService.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for handling token expiration
api.interceptors.response.use(
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

// User-related API calls
export const userService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updateNotificationSettings: (settings) => api.put('/users/notification-settings', settings),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

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
  getUserPicks: (leagueId, sportId, weekId) => 
    api.get(`/picks`, { params: { leagueId, sportId, weekId } }),
  submitPicks: (leagueId, sportId, weekId, picks) => 
    api.post('/picks', { leagueId, sportId, weekId, picks }),
  getPickSummary: (leagueId, sportId, weekId) => 
    api.get(`/picks/summary`, { params: { leagueId, sportId, weekId } }),
};

// Games-related API calls
export const gamesService = {
  getGames: (sportId, weekId) => api.get(`/games`, { params: { sportId, weekId } }),
  refreshGames: (sportId, weekId) => api.post(`/games/refresh`, { sportId, weekId }),
};

// Sports-related API calls
export const sportsService = {
  getSports: () => api.get('/sports'),
  getSport: (id) => api.get(`/sports/${id}`),
  getCurrentWeek: (sportId) => api.get(`/sports/${sportId}/current-week`),
  getWeeks: (sportId) => api.get(`/sports/${sportId}/weeks`),
};

// Notifications-related API calls
export const notificationsService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  updateNotificationPreferences: (preferences) => 
    api.put('/notifications/preferences', preferences),
};

// Export the base API instance as default
export default api;