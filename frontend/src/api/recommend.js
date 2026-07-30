import api from './axios';

export const getRecommendationsAPI = () => api.get('/recommend');
export const getInsightAPI = () => api.post('/recommend/insight');
export const explainTopicAPI = (topicTitle) => api.post('/recommend/explain', { topicTitle });