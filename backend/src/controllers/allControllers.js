const Progress = require('../models/Progress');
const User = require('../models/Users');
const Question = require('../models/Questions');
const { Course, Topic } = require('../models/Courses');
const { Assignment, Submission, Streak, MockInterview } = require('../models/Assignment');
const { evaluateMockAnswer } = require('../services/geminiService');
const { reviewCode } = require('../services/codeReviewService');

// ── PROGRESS ─────────────────────────────────────────────────
const logProgress = async (req, res, next) => {
  try {
    const { topicId, courseId, status, score, totalQuestions, correct, timeTakenSeconds } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ user: userId, topic: topicId });
    if (!progress) {
      progress = await Progress.create({ user: userId, topic: topicId, course: courseId, status });
    }

    if (score !== undefined) {
      progress.attempts += 1;
      progress.scores.push({ attemptNumber: progress.attempts, score, totalQuestions, correct, timeTakenSeconds });
      if (score > progress.bestScore) progress.bestScore = score;
    }

    if (status === 'completed' && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();
      const xpEarned = 50;
      progress.xpEarned += xpEarned;
      await User.findByIdAndUpdate(userId, { $inc: { xp: xpEarned } });
    }

    if (timeTakenSeconds) progress.timeSpentMinutes += Math.round(timeTakenSeconds / 60);
    progress.lastVisitedAt = new Date();
    await progress.save();

    res.json({ success: true, progress });
  } catch (e) { next(e); }
};

const getUserProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find({ user: req.user._id })
      .populate('topic', 'title slug difficulty tags')
      .populate('course', 'title slug category')
      .sort({ lastVisitedAt: -1 });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find({ user: req.user._id, course: req.params.courseId });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
};

// ── QUESTIONS ─────────────────────────────────────────────────
const getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, category, type, domain, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (type) filter.type = type;

    if (domain && !topic) {
      const courses = await Course.find({ targetDomains: { $in: [domain, 'all'] } }).select('_id');
      const topics = await Topic.find({ course: { $in: courses.map((c) => c._id) } }).select('_id');
      filter.topic = { $in: topics.map((t) => t._id) };
    }

    const questions = await Question.find(filter)
      .select('-solution -correctOption')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(filter);
    res.json({ success: true, questions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
};

const getQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id).populate('topic', 'title slug');
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (e) { next(e); }
};

const getDailySet = async (req, res, next) => {
  try {
    const questions = await Question.aggregate([
      { $match: { isPublished: true } },
      { $sample: { size: 5 } },
      { $project: { solution: 0, correctOption: 0 } },
    ]);
    res.json({ success: true, questions });
  } catch (e) { next(e); }
};

const submitAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    let isCorrect = false;
    if (question.type === 'mcq') {
      isCorrect = Number(answer) === question.correctOption;
    }

    question.totalAttempts += 1;
    if (isCorrect) question.totalCorrect += 1;
    question.successRate = Math.round((question.totalCorrect / question.totalAttempts) * 100);
    await question.save();

    if (isCorrect) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { xp: question.xpReward } });
    }

    res.json({
      success: true,
      isCorrect,
      ...(question.type === 'mcq' && { correctOption: question.correctOption }),
      explanation: question.explanation,
      xpEarned: isCorrect ? question.xpReward : 0,
    });
  } catch (e) { next(e); }
};

// ── NEW: Submit code for coding questions ──────────────────────
const submitCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const review = await reviewCode({
      problemTitle: question.title,
      problemBody: question.body,
      userCode: code,
      language: language || 'javascript',
    });

    question.totalAttempts += 1;
    if (review.isCorrect) question.totalCorrect += 1;
    question.successRate = Math.round((question.totalCorrect / question.totalAttempts) * 100);
    await question.save();

    const xpEarned = review.isCorrect ? question.xpReward : Math.round(question.xpReward * 0.3);
    if (review.score > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } });
    }

    res.json({ success: true, review, xpEarned });
  } catch (e) { next(e); }
};
// ── STREAK ────────────────────────────────────────────────────
const getStreak = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ user: req.user._id });
    res.json({ success: true, streak });
  } catch (e) { next(e); }
};

const checkIn = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ user: req.user._id });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheckIn = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
    const lastDay = lastCheckIn
      ? new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
      : null;
    const diffDays = lastDay ? Math.floor((today - lastDay) / (1000 * 60 * 60 * 24)) : null;

    if (diffDays === 0) return res.json({ success: true, message: 'Already checked in today', streak });

    streak.currentStreak = diffDays === 1 ? streak.currentStreak + 1 : 1;
    if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
    streak.lastCheckIn = now;
    streak.checkInHistory.push(now);
    streak.totalDaysActive += 1;
    await streak.save();

    const xpBonus = streak.currentStreak % 7 === 0 ? 200 : 20;
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpBonus } });

    res.json({ success: true, streak, xpEarned: xpBonus });
  } catch (e) { next(e); }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const top = await Streak.find()
      .populate('user', 'name avatar level')
      .sort({ currentStreak: -1 })
      .limit(10);
    res.json({ success: true, leaderboard: top });
  } catch (e) { next(e); }
};

// ── ASSIGNMENTS ───────────────────────────────────────────────
const getAssignments = async (req, res, next) => {
  try {
    const { domain } = req.query;
    const filter = { isPublished: true };

    if (domain) {
      const courses = await Course.find({ targetDomains: { $in: [domain, 'all'] } }).select('_id');
      filter.course = { $in: courses.map((c) => c._id) };
    }

    const assignments = await Assignment.find(filter)
      .populate('questions', 'title type difficulty');
    res.json({ success: true, assignments });
  } catch (e) { next(e); }
};

const getAssignment = async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.id).populate('questions');
    if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, assignment: a });
  } catch (e) { next(e); }
};

const submitAssignment = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const assignment = await Assignment.findById(req.params.id).populate('questions');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    let correct = 0;
    const evaluated = answers.map((a) => {
      const q = assignment.questions.find((q) => q._id.toString() === a.questionId);
      const isCorrect = q?.type === 'mcq' ? Number(a.answer) === q.correctOption : false;
      if (isCorrect) correct++;
      return { question: a.questionId, answer: a.answer, isCorrect };
    });

    const score = Math.round((correct / assignment.questions.length) * 100);
    const xpEarned = score >= 60 ? assignment.xpReward : Math.round(assignment.xpReward * 0.25);

    const submission = await Submission.create({
      user: req.user._id,
      assignment: assignment._id,
      answers: evaluated,
      score,
      totalQuestions: assignment.questions.length,
      correct,
      status: 'submitted',
      xpEarned,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } });
    res.json({ success: true, submission, score, xpEarned });
  } catch (e) { next(e); }
};

const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate('assignment', 'title')
      .sort({ submittedAt: -1 });
    res.json({ success: true, submissions });
  } catch (e) { next(e); }
};

// ── MOCK INTERVIEW ────────────────────────────────────────────
const startMock = async (req, res, next) => {
  try {
    const { type = 'mixed' } = req.body;
    const filter = { isPublished: true };
    if (type !== 'mixed') filter.category = type;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: 5 } },
      { $project: { solution: 0, correctOption: 0 } },
    ]);

    const mock = await MockInterview.create({
      user: req.user._id,
      type,
      questions: questions.map((q) => q._id),
    });

    res.json({ success: true, mock: { ...mock.toObject(), questions } });
  } catch (e) { next(e); }
};

const submitMockAnswer = async (req, res, next) => {
  try {
    const { questionId, userAnswer } = req.body;
    const mock = await MockInterview.findById(req.params.id);
    if (!mock) return res.status(404).json({ success: false, message: 'Mock not found' });
    if (mock.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const question = await Question.findById(questionId);
    const evaluation = await evaluateMockAnswer({
      question: question.body,
      userAnswer,
      questionType: question.type,
    });

    mock.answers.push({ question: questionId, userAnswer, aiFeedback: evaluation.feedback, score: evaluation.score });
    await mock.save();

    res.json({ success: true, evaluation });
  } catch (e) { next(e); }
};

const finishMock = async (req, res, next) => {
  try {
    const mock = await MockInterview.findById(req.params.id);
    if (!mock) return res.status(404).json({ success: false, message: 'Mock not found' });

    const avgScore = mock.answers.length > 0
      ? mock.answers.reduce((s, a) => s + (a.score || 0), 0) / mock.answers.length
      : 0;

    mock.overallScore = Math.round(avgScore * 10) / 10;
    mock.status = 'completed';
    mock.completedAt = new Date();
    const xpEarned = Math.round(mock.overallScore * 20);
    mock.xpEarned = xpEarned;
    await mock.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } });
    res.json({ success: true, mock, xpEarned });
  } catch (e) { next(e); }
};

const getMockHistory = async (req, res, next) => {
  try {
    const mocks = await MockInterview.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('-answers');
    res.json({ success: true, mocks });
  } catch (e) { next(e); }
};

module.exports = {
  // progress
  logProgress, getUserProgress, getCourseProgress,
  // questions
  getQuestions, getQuestion, getDailySet, submitAnswer, submitCode,
  // streak
  getStreak, checkIn, getLeaderboard,
  // assignments
  getAssignments, getAssignment, submitAssignment, getMySubmissions,
  // mock
  startMock, submitMockAnswer, finishMock, getMockHistory,
};