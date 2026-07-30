const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { startMock, submitMockAnswer, finishMock, getMockHistory } = require('../controllers/allControllers');

router.post('/start', protect, startMock);
router.post('/:id/answer', protect, submitMockAnswer);
router.post('/:id/finish', protect, finishMock);
router.get('/history', protect, getMockHistory);

module.exports = router;