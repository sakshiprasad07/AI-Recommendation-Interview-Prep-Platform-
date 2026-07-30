require('dotenv').config();
const mongoose = require('mongoose');
const { Topic } = require('../src/models/Courses');
const { generateTopicContent } = require('../src/services/topicContentService');

// Priority topics — pre-generate for instant demo experience
const PRIORITY_SLUGS = [
  'arrays-hashing',
  'two-pointers',
  'sliding-window',
  'binary-search',
  'trees-bst',
  'dynamic-programming',
  'scalability-basics',
  'caching',
  'star-method',
  'closures-scope',
  'sql-basics', 'sql-joins',           // ← add karo
  'oop-fundamentals', 'solid-principles', // ← add karo
];

const seedContent = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const topics = await Topic.find({ slug: { $in: PRIORITY_SLUGS } });
  console.log(`Found ${topics.length} priority topics to generate content for`);

  for (const topic of topics) {
    if (topic.contentGenerated) {
      console.log(`Skipping ${topic.title} — already generated`);
      continue;
    }

    try {
      console.log(`\nGenerating content for: ${topic.title}...`);
      const richContent = await generateTopicContent(topic);

      await Topic.findByIdAndUpdate(topic._id, {
        richContent,
        contentGenerated: true,
        contentGeneratedAt: new Date(),
      });

      console.log(`✅ Done: ${topic.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${topic.title} —`, err.message);
    }

    // Delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n✅ Priority content generation complete!');
  await mongoose.disconnect();
  process.exit(0);
};

seedContent().catch((err) => {
  console.error('Seed content failed:', err);
  process.exit(1);
});