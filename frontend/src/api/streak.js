import api from './axios';

export const getStreakAPI = () => api.get('/streak');
export const checkInAPI = () => api.post('/streak/checkin');
export const getLeaderboardAPI = () => api.get('/streak/leaderboard');