const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'coding', 'short_answer'], required: true },
    category: { type: String, enum: ['dsa', 'system-design', 'language', 'mock'], required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    tags: [{ type: String }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    company: [{ type: String }],
    options: [{ type: String }],
    correctOption: { type: Number },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
    hints: [{ type: String }],
    explanation: { type: String, default: '' },
    totalAttempts: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    xpReward: { type: Number, default: 10 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ topic: 1 });

module.exports = mongoose.model('Question', questionSchema);