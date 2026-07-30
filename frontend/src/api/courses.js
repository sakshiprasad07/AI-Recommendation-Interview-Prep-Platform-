import api from './axios';

export const getCoursesAPI = (category, domain) =>
  api.get('/courses', { params: { category, domain } });

export const getCourseAPI = (slug) => api.get(`/courses/${slug}`);

export const getTopicAPI = (courseSlug, topicSlug) =>
  api.get(`/courses/${courseSlug}/topics/${topicSlug}`);

export const enrollCourseAPI = (id) => api.post(`/courses/${id}/enroll`);
export const getMyCourses = () => api.get('/courses/mine');