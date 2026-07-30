import api from './axios';

export const logProgressAPI = (data) => api.post('/progress', data);
export const getUserProgressAPI = () => api.get('/progress');
export const getCourseProgressAPI = (courseId) => api.get(`/progress/course/${courseId}`);