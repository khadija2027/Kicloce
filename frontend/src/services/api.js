import axios from 'axios';

// Utiliser le proxy de Vite en développement, URL relative en production (même domaine)
const API_BASE_URL = import.meta.env.DEV ? '/api' : '/api';

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp }),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users')
};

// Tontine Service
export const tontineService = {
  createTontine: (data) => api.post('/tontines/create', data),
  getTontines: () => api.get('/tontines'),
  joinTontine: (tontineId, userId) => api.post(`/tontines/${tontineId}/join`, { userId }),
  getTontineStatus: (tontineId) => api.get(`/tontines/${tontineId}/status`),
  getParticipants: (tontineId) => api.get(`/tontines/${tontineId}/participants`),
  executeCycle: (tontineId) => api.post(`/tontines/${tontineId}/execute-cycle`),
  advanceTurn: (tontineId) => api.post(`/tontines/${tontineId}/advance-turn`),
  getTurnSimulation: (tontineId) => api.get(`/tontines/${tontineId}/turn-simulation`)
};

// Scoring Service
export const scoringService = {
  getUserScore: (userId) => api.get(`/scoring/${userId}`),
  getAllScores: () => api.get('/scoring'),
  calculateScore: () => api.post('/scoring/calculate'),
  recalculateScores: (tontineId) => api.post(`/scoring/recalculate/${tontineId}`)
};

// Transaction Service
export const transactionService = {
  simulateTransfer: (data) => api.post('/transactions/simulate', data),
  requestOtp: (phoneNumber) => api.post('/transactions/request-otp', { phoneNumber }),
  confirmTransfer: (transactionId, otp, phoneNumber) => 
    api.post(`/transactions/confirm/${transactionId}`, { otp, phoneNumber }),
  getHistory: (tontineId) => api.get(`/transactions/history/${tontineId}`),
  executeFullCycle: (tontineId) => api.post('/transactions/execute-full-cycle', { tontineId })
};

// Goals Service
export const goalsService = {
  getGoals: () => api.get('/goals'),
  createGoal: (data) => api.post('/goals', data),
  updateGoal: (goalId, data) => api.put(`/goals/${goalId}`, data)
};

// Messages Service
export const messagesService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId) => api.get(`/messages/conversations/${conversationId}`),
  sendMessage: (data) => api.post('/messages/send', data)
};

// Admin Service
export const adminService = {
  getAllUsers: () => api.get('/auth/users'),
  getAllTontines: () => api.get('/tontines'),
  getUserStatistics: () => api.get('/admin/statistics'),
  getTontineStatistics: () => api.get('/admin/tontines-stats'),
  getTransactionStatistics: () => api.get('/admin/transactions-stats'),
  getUserWithTontines: (userId) => api.get(`/admin/users/${userId}/tontines`),
  getSystemMetrics: () => api.get('/admin/metrics'),
  getUserScore: (userId) => api.get(`/scoring/${userId}`)
};

export default api;
