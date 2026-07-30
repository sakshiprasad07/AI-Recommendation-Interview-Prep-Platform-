const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { logProgress, getUserProgress, getCourseProgress } = require('../controllers/allControllers');

router.post('/', protect, logProgress);
router.get('/', protect, getUserProgress);
router.get('/course/:courseId', protect, getCourseProgress);

module.exports = router;