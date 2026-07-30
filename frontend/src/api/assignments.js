import api from './axios';

export const getAssignmentsAPI = (domain) => api.get('/assignments', { params: { domain } });
export const getAssignmentAPI = (id) => api.get(`/assignments/${id}`);
export const submitAssignmentAPI = (id, answers) => api.post(`/assignments/${id}/submit`, { answers });
export const getMySubmissionsAPI = () => api.get('/assignments/submissions');