const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'in_progress',
    },
    scores: [
      {
        attemptNumber: Number,
        score: Number,
        totalQuestions: Number,
        correct: Number,
        timeTakenSeconds: Number,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    bestScore: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    timeSpentMinutes: { type: Number, default: 0 },
    completedAt: { type: Date },
    lastVisitedAt: { type: Date, default: Date.now },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, topic: 1 }, { unique: true });
progressSchema.index({ user: 1, course: 1 });

module.exports = mongoose.model('Progress', progressSchema);