const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },

    // Content
    content: { type: String, default: '' },         // Quick summary (existing)
    richContent: {                                    // ← NEW: detailed AI-generated content
      explanation: { type: String, default: '' },
      keyConcepts: [{ type: String }],
      codeExample: { type: String, default: '' },
      commonMistakes: [{ type: String }],
      complexity: { type: String, default: '' },
      practiceProblems: [
        {
          title: String,
          url: String,
          difficulty: String,
        }
      ],
      resources: [
        {
          type: { type: String },
          title: String,
          url: String,
        }
      ],
    },
    contentGenerated: { type: Boolean, default: false }, // ← NEW
    contentGeneratedAt: { type: Date },                   // ← NEW

    videoUrl: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 15 },
    tags: [{ type: String }],
    difficulty: { type: Number, min: 1, max: 5, default: 1 },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    xpReward: { type: Number, default: 50 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['dsa', 'system-design', 'language', 'mock'],
      required: true,
    },
    targetDomains: [{ 
    type: String,
    enum: ['software-dev', 'data-science', 'ai-ml', 'cybersecurity', 'devops', 'mobile', 'all'],
    default: 'all'
}],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    thumbnail: { type: String, default: '' },
    tags: [{ type: String }],
    totalTopics: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
const Topic = mongoose.model('Topic', topicSchema);

module.exports = { Course, Topic };