import api from './axios';

export const getQuestionsAPI = (params) => api.get('/questions', { params });
export const getQuestionAPI = (id) => api.get(`/questions/${id}`);
export const getDailySetAPI = () => api.get('/questions/daily');
export const submitAnswerAPI = (id, answer) => api.post(`/questions/${id}/submit`, { answer });
export const submitCodeAPI = (id, code, language) => api.post(`/questions/${id}/submit-code`, { code, language });