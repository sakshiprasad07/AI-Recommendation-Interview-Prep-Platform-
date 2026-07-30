import api from './axios';

export const getProfileAPI = () => api.get('/users/profile');
export const updateProfileAPI = (data) => api.patch('/users/profile', data);
export const getDashboardStatsAPI = () => api.get('/users/dashboard');