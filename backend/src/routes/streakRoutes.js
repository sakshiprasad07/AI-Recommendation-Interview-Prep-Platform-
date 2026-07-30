const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStreak, checkIn, getLeaderboard } = require('../controllers/allControllers');

router.get('/', protect, getStreak);
router.post('/checkin', protect, checkIn);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;