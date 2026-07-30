const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  upload,
  generatePlan,
  getPlanStatus,
  getMyPlans,
  getPlan,
  deletePlan,
} = require('../controllers/planController');

// Generate new plan — accepts CV file + JD file or text
router.post(
  '/generate',
  protect,
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'jd', maxCount: 1 },
  ]),
  generatePlan
);

router.get('/my', protect, getMyPlans);
router.get('/status/:planId', protect, getPlanStatus);
router.get('/:planId', protect, getPlan);
router.delete('/:planId', protect, deletePlan);

module.exports = router;