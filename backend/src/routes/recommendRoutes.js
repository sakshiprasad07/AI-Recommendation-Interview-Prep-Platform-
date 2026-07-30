const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getRecommendations, getInsight, explainTopic } = require('../controllers/recommendController');

router.get('/', protect, getRecommendations);
router.post('/insight', protect, getInsight);
router.post('/explain', protect, explainTopic);

module.exports = router;