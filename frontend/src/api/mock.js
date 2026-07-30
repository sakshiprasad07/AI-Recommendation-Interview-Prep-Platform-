import api from './axios';

export const startMockAPI = (type) => api.post('/mock/start', { type });
export const submitMockAnswerAPI = (id, data) => api.post(`/mock/${id}/answer`, data);
export const finishMockAPI = (id) => api.post(`/mock/${id}/finish`);
export const getMockHistoryAPI = () => api.get('/mock/history');