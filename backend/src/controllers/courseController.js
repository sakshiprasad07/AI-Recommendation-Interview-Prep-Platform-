const { Course, Topic } = require('../models/Courses');
const Progress = require('../models/Progress');
const { generateTopicContent } = require('../services/topicContentService');


const getCourses = async (req, res, next) => {
  try {
    const { category, domain } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (domain) {
      filter.targetDomains = { $in: [domain, 'all'] };
    }
    const courses = await Course.find(filter).sort({ order: 1 });
    res.json({ success: true, courses });
  } catch (e) { next(e); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const topics = await Topic.find({ course: course._id }).sort({ order: 1 });
    res.json({ success: true, course, topics });
  } catch (e) {
    next(e);
  }
};
// ── getTopic — now auto-generates rich content if missing ─────
const getTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.topicSlug })
      .populate('prerequisites', 'title slug');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    // Log visit in progress
    await Progress.findOneAndUpdate(
      { user: req.user._id, topic: topic._id },
      { $set: { course: topic.course, lastVisitedAt: new Date() }, $setOnInsert: { status: 'in_progress' } },
      { upsert: true, new: true }
    );

    // Return immediately if content already generated
    if (topic.contentGenerated) {
      return res.json({ success: true, topic, contentStatus: 'ready' });
    }

    // Otherwise — return topic now, generate content in background
    res.json({ success: true, topic, contentStatus: 'generating' });

    // Generate content async (don't block response)
    try {
      const richContent = await generateTopicContent(topic);
      await Topic.findByIdAndUpdate(topic._id, {
        richContent,
        contentGenerated: true,
        contentGeneratedAt: new Date(),
      });
      console.log(`Content generated for topic: ${topic.title}`);
    } catch (err) {
      console.error(`Content generation failed for ${topic.title}:`, err.message);
    }
  } catch (e) { next(e); }
};

const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: `Enrolled in ${course.title}` });
  } catch (e) { next(e); }
};

const getUserCourses = async (req, res, next) => {
  try {
    const courseIds = await Progress.find({ user: req.user._id }).distinct('course');
    const courses = await Course.find({ _id: { $in: courseIds } });
    res.json({ success: true, courses });
  } catch (e) { next(e); }
};

// ── New endpoint — check if content is ready ───────────────────
const getTopicContentStatus = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.topicSlug })
      .select('contentGenerated richContent');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.json({
      success: true,
      ready: topic.contentGenerated,
      richContent: topic.contentGenerated ? topic.richContent : null,
    });
  } catch (e) { next(e); }
};

module.exports = { getCourses, getCourse, getTopic, enrollCourse, getUserCourses, getTopicContentStatus };