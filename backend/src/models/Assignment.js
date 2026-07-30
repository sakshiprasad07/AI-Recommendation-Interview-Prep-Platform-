const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    dueDate: { type: Date },
    xpReward: { type: Number, default: 100 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        timeTakenSeconds: Number,
      },
    ],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number },
    correct: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'submitted' },
    xpEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const streakSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    checkInHistory: [{ type: Date }],
    totalDaysActive: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['dsa', 'system-design', 'behavioral', 'mixed'], default: 'mixed' },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        userAnswer: { type: String },
        aiFeedback: { type: String },
        score: { type: Number, min: 0, max: 10 },
      },
    ],
    overallScore: { type: Number, default: 0 },
    overallFeedback: { type: String, default: '' },
    durationMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const Streak = mongoose.model('Streak', streakSchema);
const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);

module.exports = { Assignment, Submission, Streak, MockInterview };