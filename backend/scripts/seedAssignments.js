require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../src/models/Questions');
const { Assignment } = require('../src/models/Assignment');
const { Course, Topic } = require('../src/models/Courses');

const seedAssignments = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing assignments
  await Assignment.deleteMany({});
  console.log('Cleared existing assignments');

  const courses = await Course.find({});
  let totalAssignments = 0;

  for (const course of courses) {
    console.log(`\nBuilding assignments for: ${course.title}`);

    // Get all questions for this category
    const allQuestions = await Question.find({ category: course.category, isPublished: true });

    if (allQuestions.length < 5) {
      console.log(`Skipping ${course.title} — not enough questions (${allQuestions.length})`);
      continue;
    }

    // Group questions by difficulty
    const easy = allQuestions.filter((q) => q.difficulty === 'easy');
    const medium = allQuestions.filter((q) => q.difficulty === 'medium');
    const hard = allQuestions.filter((q) => q.difficulty === 'hard');

    const assignmentsToCreate = [];

    // Assignment 1 — Foundations (easy questions)
    if (easy.length >= 4) {
      assignmentsToCreate.push({
        title: `${course.title}: Foundations`,
        description: `Build your fundamentals in ${course.title} with these beginner-friendly questions.`,
        course: course._id,
        questions: easy.slice(0, Math.min(8, easy.length)).map((q) => q._id),
        difficulty: 'easy',
        xpReward: 100,
      });
    }

    // Assignment 2 — Core Concepts (medium questions)
    if (medium.length >= 4) {
      assignmentsToCreate.push({
        title: `${course.title}: Core Concepts`,
        description: `Test your understanding of core ${course.title} concepts with these intermediate questions.`,
        course: course._id,
        questions: medium.slice(0, Math.min(10, medium.length)).map((q) => q._id),
        difficulty: 'medium',
        xpReward: 175,
      });
    }

    // Assignment 3 — Advanced Challenge (hard + remaining medium)
    const advancedPool = [...hard, ...medium.slice(10)];
    if (advancedPool.length >= 3) {
      assignmentsToCreate.push({
        title: `${course.title}: Advanced Challenge`,
        description: `Push yourself with challenging ${course.title} questions used in top company interviews.`,
        course: course._id,
        questions: advancedPool.slice(0, Math.min(8, advancedPool.length)).map((q) => q._id),
        difficulty: 'hard',
        xpReward: 250,
      });
    }

    // Assignment 4 — Mixed Practice Set (random mix of all)
    if (allQuestions.length >= 10) {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      assignmentsToCreate.push({
        title: `${course.title}: Mixed Practice Set`,
        description: `A comprehensive mixed-difficulty set covering all aspects of ${course.title}.`,
        course: course._id,
        questions: shuffled.slice(0, Math.min(12, shuffled.length)).map((q) => q._id),
        difficulty: 'medium',
        xpReward: 200,
      });
    }

    if (assignmentsToCreate.length > 0) {
      await Assignment.insertMany(assignmentsToCreate);
      totalAssignments += assignmentsToCreate.length;
      console.log(`✅ Created ${assignmentsToCreate.length} assignments for ${course.title}`);
    }
  }

  console.log(`\n✅ Total assignments created: ${totalAssignments}`);
  await mongoose.disconnect();
  process.exit(0);
};

seedAssignments().catch((err) => {
  console.error('Seed assignments failed:', err);
  process.exit(1);
});