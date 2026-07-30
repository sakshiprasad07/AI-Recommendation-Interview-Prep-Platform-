const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getQuestions, getQuestion, getDailySet, submitAnswer, submitCode, getStreak } = require('../controllers/allControllers');

router.get('/', protect, getQuestions);
router.get('/daily', protect, getDailySet);
router.get('/:id', protect, getQuestion);
router.post('/:id/submit', protect, submitAnswer);
router.post('/:id/submit-code', protect, submitCode);
router.get('/streak', protect, getStreak);

module.exports = router;