const Progress = require('../models/Progress');
const { Course, Topic } = require('../models/Courses');
const { MockInterview } = require('../models/Assignment');
const { getNextTopicRecommendations, generateWeeklyInsight, explainTopic: geminiExplain } = require('../services/geminiService');

const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const allProgress = await Progress.find({ user: userId }).populate('topic', 'title tags difficulty');

    const completedTopics = allProgress
      .filter((p) => p.status === 'completed')
      .map((p) => ({ title: p.topic?.title, bestScore: p.bestScore, tags: p.topic?.tags }));

    const weakTopics = allProgress
      .filter((p) => p.bestScore < 60 && p.attempts > 0)
      .map((p) => ({ title: p.topic?.title, bestScore: p.bestScore }));

    const studiedTopicIds = allProgress.map((p) => p.topic?._id?.toString());

    // Scope candidate topics to the user's domain (plus universal 'all' courses) —
    // otherwise every user gets the same generic, lowest-difficulty DSA topics first.
    const domainCourses = await Course.find({
      targetDomains: { $in: [req.user.techDomain, 'all'] },
    }).select('_id');

    const allTopics = await Topic.find({
      _id: { $nin: studiedTopicIds },
      course: { $in: domainCourses.map((c) => c._id) },
      isPublished: true,
    })
      .sort({ difficulty: 1 })
      .limit(30);

    // Shuffle within each difficulty tier so "Refresh" doesn't return the exact
    // same order every time — otherwise the AI sees an identical candidate list.
    const shuffled = allTopics
      .map((t) => ({ t, r: Math.random() }))
      .sort((a, b) => a.t.difficulty - b.t.difficulty || a.r - b.r)
      .map(({ t }) => t);

    const recommendations = await getNextTopicRecommendations({
      user: req.user,
      completedTopics,
      allTopics: shuffled,
      weakTopics,
    });

    const recentMocks = await MockInterview.find({ user: userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('overallScore completedAt');

    const daysSinceLastMock = recentMocks[0]
      ? Math.floor((Date.now() - new Date(recentMocks[0].completedAt)) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      success: true,
      data: {
        recommendations,
        weakTopics,
        mockNudge: daysSinceLastMock === null || daysSinceLastMock > 5
          ? { show: true, daysSince: daysSinceLastMock, message: "You haven't done a mock interview recently!" }
          : { show: false },
        recentMockScores: recentMocks.map((m) => m.overallScore),
      },
    });
  } catch (error) { next(error); }
};

const getInsight = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekProgress = await Progress.find({ user: userId, updatedAt: { $gte: oneWeekAgo } }).populate('topic', 'title');

    const completed = weekProgress.filter((p) => p.status === 'completed');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((s, p) => s + p.bestScore, 0) / completed.length)
      : 0;

    const weakTopics = weekProgress.filter((p) => p.bestScore < 60).map((p) => p.topic?.title);
    const recentMocks = await MockInterview.find({ user: userId, status: 'completed', completedAt: { $gte: oneWeekAgo } }).select('overallScore');

    const insight = await generateWeeklyInsight({
      user: req.user,
      weekProgress: {
        completed: completed.length,
        attempted: weekProgress.length,
        avgScore,
        timeSpentMinutes: weekProgress.reduce((s, p) => s + p.timeSpentMinutes, 0),
        weakTopics,
      },
      mockScores: recentMocks.map((m) => m.overallScore),
    });

    res.json({ success: true, insight });
  } catch (error) { next(error); }
};

const explainTopic = async (req, res, next) => {
  try {
    const { topicTitle } = req.body;
    if (!topicTitle) return res.status(400).json({ success: false, message: 'topicTitle is required' });

    const explanation = await geminiExplain({
      topicTitle,
      userLevel: req.user.skillLevel,
      preferredLanguage: req.user.preferredLanguage,
    });

    res.json({ success: true, explanation });
  } catch (error) { next(error); }
};

module.exports = { getRecommendations, getInsight, explainTopic };