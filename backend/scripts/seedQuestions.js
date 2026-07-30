require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../src/models/Questions');
const { Topic } = require('../src/models/Courses');
const {
  generateMCQQuestions,
  generateCodingQuestions,
} = require('../src/services/questionGeneratorService');

// Slugify helper
const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const seedQuestions = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Get topics to generate questions for
  const topics = await Topic.find({}).populate('course', 'category');
  console.log(`Found ${topics.length} topics`);

  let totalGenerated = 0;

  for (const topic of topics) {
    const category = topic.course?.category || 'dsa';

    const existingCount = await Question.countDocuments({ topic: topic._id });
    if (existingCount > 0) {
      console.log(`⏭️  Skipping ${topic.title} — already has ${existingCount} questions`);
      continue;
    }

    console.log(`\nGenerating questions for: ${topic.title} (${category})`);

    try {
      let newQuestions = [];

      {
        // MCQs
        const mcqs = await generateMCQQuestions(topic.title, category, topic.tags, 4);
        const mcqQuestions = mcqs.map((q) => ({
          title: q.title,
          slug: slugify(q.title),
          body: q.body,
          type: 'mcq',
          category,
          topic: topic._id,
          tags: topic.tags,
          difficulty: q.difficulty || 'medium',
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          xpReward: q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 15 : 10,
        }));

        // Coding questions — only for DSA/language topics
        let codingQuestions = [];
        if (category === 'dsa' || category === 'language') {
          const coding = await generateCodingQuestions(topic.title, topic.tags, 2);
          codingQuestions = coding.map((q) => ({
            title: q.title,
            slug: slugify(q.title),
            body: q.body,
            type: 'coding',
            category,
            topic: topic._id,
            tags: topic.tags,
            difficulty: q.difficulty || 'medium',
            hints: q.hints,
            explanation: q.explanation,
            xpReward: q.difficulty === 'hard' ? 30 : q.difficulty === 'medium' ? 20 : 15,
          }));
        }

        newQuestions = [...mcqQuestions, ...codingQuestions];
      }

      if (newQuestions.length > 0) {
        await Question.insertMany(newQuestions);
        totalGenerated += newQuestions.length;
        console.log(`✅ Added ${newQuestions.length} questions for ${topic.title}`);
      }
    } catch (err) {
      console.error(`❌ Failed for ${topic.title}:`, err.message);
    }
    // Delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n✅ Total questions generated: ${totalGenerated}`);
  await mongoose.disconnect();
  process.exit(0);
};

seedQuestions().catch((err) => {
  console.error('Seed questions failed:', err);
  process.exit(1);
});