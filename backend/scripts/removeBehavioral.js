require('dotenv').config();
const mongoose = require('mongoose');
const { Course, Topic } = require('../src/models/Courses');
const Question = require('../src/models/Questions');
const { Assignment } = require('../src/models/Assignment');

// Removes ONLY the Behavioral course and everything tied to it.
// Does NOT touch any other course, topic, question, or assignment.

const removeBehavioral = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const course = await Course.findOne({ slug: 'behavioral' });

  if (!course) {
    console.log('No "behavioral" course found — nothing to remove (already clean).');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found course: ${course.title} (${course._id})`);

  // 1. Find topics belonging to this course
  const topics = await Topic.find({ course: course._id });
  const topicIds = topics.map((t) => t._id);
  console.log(`Found ${topics.length} topics under this course`);

  // 2. Delete questions tied to these topics OR the behavioral category
  const questionResult = await Question.deleteMany({
    $or: [
      { topic: { $in: topicIds } },
      { category: 'behavioral' },
    ],
  });
  console.log(`Deleted ${questionResult.deletedCount} questions`);

  // 3. Delete assignments tied to this course
  const assignmentResult = await Assignment.deleteMany({ course: course._id });
  console.log(`Deleted ${assignmentResult.deletedCount} assignments`);

  // 4. Delete the topics
  const topicResult = await Topic.deleteMany({ course: course._id });
  console.log(`Deleted ${topicResult.deletedCount} topics`);

  // 5. Delete the course itself
  await Course.deleteOne({ _id: course._id });
  console.log('Deleted the "Behavioral Interviews" course');

  console.log('\n✅ Behavioral course fully removed. Everything else untouched.');
  await mongoose.disconnect();
  process.exit(0);
};

removeBehavioral().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});