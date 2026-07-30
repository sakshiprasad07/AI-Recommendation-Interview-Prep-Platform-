const mongoose = require('mongoose');

const customPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Job details
    jobTitle: { type: String, default: '' },
    targetCompany: { type: String, default: '' },

    // Raw text extracted
    cvText: { type: String, default: '' },
    jdText: { type: String, default: '' },

    // AI extracted skills
    cvSkills: [{ type: String }],        // skills user already has
    jdSkills: [{ type: String }],        // skills job requires
    missingSkills: [{ type: String }],   // gap = jdSkills - cvSkills
    transferableSkills: [{
  have: { type: String },
  maps_to: { type: String },
  gap: { type: String }
}],

    // Generated learning plan
    weeklyPlan: [
      {
        week: Number,
        title: String,
        focus: String,                   // main skill this week
        topics: [
          {
            title: String,
            explanation: String,         // from RAG sources
            resources: [
              {
                type : {type: String},           // 'leetcode' | 'article' | 'github' | 'wikipedia'
                title: String,
                url: String,
                content: String,        // fetched content snippet
              }
            ],
            estimatedHours: Number,
          }
        ],
        quiz: [
          {
            question: String,
            options: [String],
            correctOption: Number,
            explanation: String,
          }
        ],
        assignment: {
          title: String,
          description: String,
          hints: [String],
        },
        leetcodeProblems: [
          {
            title: String,
            difficulty: String,
            url: String,
            topicTags: [String],
          }
        ],
      }
    ],

    companyRoleResources: {
  github: [
    {
      title: String,
      url: String,
      content: String,
      stars: Number,
    }
  ],
  articles: [
    {
      title: String,
      url: String,
      content: String,
    }
  ],
},

    // Overall stats
    totalWeeks: { type: Number, default: 0 },
    readinessScore: { type: Number, default: 0 },  // 0-100, how ready user is
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
    },

    // Progress tracking
    completedWeeks: [{ type: Number }],
    completedTopics: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomPlan', customPlanSchema);