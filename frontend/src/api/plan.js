import api from './axios';

export const generatePlanAPI = (formData) =>
  api.post('/plan/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getPlanStatusAPI = (planId) => api.get(`/plan/status/${planId}`);
export const getMyPlansAPI = () => api.get('/plan/my');
export const getPlanAPI = (planId) => api.get(`/plan/${planId}`);
export const deletePlanAPI = (planId) => api.delete(`/plan/${planId}`);