require('dotenv').config();
const mongoose = require('mongoose');
const { Course, Topic } = require('../src/models/Courses');
const { generateTopicsForCourse } = require('../src/services/topicGenerationService');
const { generateTopicContent } = require('../src/services/topicContentService');

// Usage:
//   node scripts/generateTopicsForCourse.js <course-slug>
//   node scripts/generateTopicsForCourse.js all      → runs for every course with 0 topics

const processCourse = async (course) => {
  const existing = await Topic.countDocuments({ course: course._id });
  if (existing > 0) {
    console.log(`⏭️  Skipping "${course.title}" — already has ${existing} topics`);
    return;
  }

  console.log(`\n🧠 Generating topic list for: ${course.title}...`);
  const topicDrafts = await generateTopicsForCourse(course);
  console.log(`   → ${topicDrafts.length} topics drafted`);

  const topics = await Topic.insertMany(
    topicDrafts.map((t) => ({ ...t, course: course._id }))
  );

  await Course.findByIdAndUpdate(course._id, { totalTopics: topics.length });
  console.log(`✅ Saved ${topics.length} topics for "${course.title}"`);

  // Generate rich content for each new topic, one by one (rate-limit friendly)
  for (const topic of topics) {
    try {
      console.log(`   Generating rich content: ${topic.title}...`);
      const richContent = await generateTopicContent(topic);
      await Topic.findByIdAndUpdate(topic._id, {
        richContent,
        contentGenerated: true,
        contentGeneratedAt: new Date(),
      });
      console.log(`   ✅ Content done: ${topic.title}`);
    } catch (err) {
      console.error(`   ❌ Content failed: ${topic.title} —`, err.message);
    }
    await new Promise((r) => setTimeout(r, 2000)); // avoid rate limits
  }
};

const run = async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/generateTopicsForCourse.js <course-slug|all>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const courses = arg === 'all'
    ? await Course.find({})
    : await Course.find({ slug: arg });

  if (!courses.length) {
    console.error(`No course found for "${arg}"`);
    process.exit(1);
  }

  for (const course of courses) {
    await processCourse(course);
  }

  console.log('\n🎉 Done!');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});