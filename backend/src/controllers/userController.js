const User = require('../models/Users');
const Progress = require('../models/Progress');
const { Streak } = require('../models/Assignment');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar', 'preferredLanguage', 'targetCompanies', 'targetRoles', 'goals'];
    const updates = {};
    allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const { techDomain, skillLevel, targetCompanies, targetRoles, goals, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { techDomain, skillLevel, targetCompanies, targetRoles, goals, preferredLanguage, onboardingDone: true },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const allProgress = await Progress.find({ user: userId })
      .populate('topic', 'title slug estimatedMinutes')
      .populate('course', 'title slug category')
      .sort({ lastVisitedAt: -1 });

    const completed = allProgress.filter((p) => p.status === 'completed');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, p) => sum + (p.bestScore || 0), 0) / completed.length)
      : 0;

    const lastVisited = allProgress[0] || null;
    const streak = await Streak.findOne({ user: userId });

    const courseMap = {};
    allProgress.forEach((p) => {
      if (!p.course) return;
      const cId = p.course._id.toString();
      if (!courseMap[cId]) courseMap[cId] = { course: p.course, total: 0, completed: 0 };
      courseMap[cId].total++;
      if (p.status === 'completed') courseMap[cId].completed++;
    });

    res.json({
      success: true,
      stats: {
        totalCompleted: completed.length,
        totalStarted: allProgress.length,
        avgScore,
        xp: req.user.xp,
        level: req.user.level,
        streakDays: streak?.currentStreak || 0,
        lastVisited,
        courseBreakdown: Object.values(courseMap),
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, completeOnboarding, getDashboardStats };