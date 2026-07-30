const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAssignments, getAssignment, submitAssignment, getMySubmissions } = require('../controllers/allControllers');

router.get('/', protect, getAssignments);
router.get('/submissions', protect, getMySubmissions);
router.get('/:id', protect, getAssignment);
router.post('/:id/submit', protect, submitAssignment);

module.exports = router;