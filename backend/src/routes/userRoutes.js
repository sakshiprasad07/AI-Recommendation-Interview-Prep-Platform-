const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, completeOnboarding, getDashboardStats } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.post('/onboarding', protect, completeOnboarding);
router.get('/dashboard', protect, getDashboardStats);

module.exports = router;