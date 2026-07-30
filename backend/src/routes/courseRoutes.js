const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCourses, getCourse, getTopic, enrollCourse, getUserCourses, getTopicContentStatus } = require('../controllers/courseController');

router.get('/', getCourses);
router.get('/mine', protect, getUserCourses);
router.get('/:slug', getCourse);
router.get('/:courseSlug/topics/:topicSlug', protect, getTopic);
router.get('/:courseSlug/topics/:topicSlug/content-status', protect, getTopicContentStatus); // ← naya
router.post('/:id/enroll', protect, enrollCourse);

module.exports = router;