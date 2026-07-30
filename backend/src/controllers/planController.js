const multer = require('multer');
const pdfParse = require('pdf-parse');
const CustomPlan = require('../models/CustomPlan');
const { generateCustomPlan } = require('../services/skillGapService');

// Multer setup — memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files allowed'));
    }
  },
});

// Extract text from uploaded file

const extractText = async (file) => {
  if (!file) return '';
  if (file.mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(file.buffer);
      console.log('PDF text extracted, length:', data.text.length);
      return data.text;
    } catch (err) {
      console.error('PDF parse error:', err.message);
      return '';
    }
  }
  return file.buffer.toString('utf-8');
};

// @POST /api/plan/generate
// Accepts: cv file + jd (text or file)
const generatePlan = async (req, res, next) => {
  try {
    console.log('generatePlan called');
    console.log('files:', req.files);
    console.log('body:', req.body);
    const userId = req.user._id;

    // Extract CV text
    let cvText = '';
    if (req.files?.cv?.[0]) {
      cvText = await extractText(req.files.cv[0]);
      console.log('CV text length:', cvText.length);
    } else if (req.body.cvText) {
      cvText = req.body.cvText;
    }

    // Extract JD text
    let jdText = '';
    if (req.files?.jd?.[0]) {
      jdText = await extractText(req.files.jd[0]);
    } else if (req.body.jdText) {
      jdText = req.body.jdText;
    }

    if (!cvText || !jdText) {
      return res.status(400).json({
        success: false,
        message: 'Both CV and Job Description are required',
      });
    }

    // Create a pending plan record
    // Clean text before storing
const cleanText = (str) => str
  .replace(/[^\x00-\x7F]/g, '') // remove non-ASCII characters
  .trim();

const plan = await CustomPlan.create({
  user: userId,
  cvText: cleanText(cvText),
  jdText: cleanText(jdText),
  status: 'generating',
});

    // Send immediate response — generation happens async
    res.json({
      success: true,
      message: 'Plan generation started',
      planId: plan._id,
    });

    // Generate plan in background
    try {
    const result = await generateCustomPlan(cvText, jdText, req.user?.skillLevel || 'beginner');

    const updatedPlan = await CustomPlan.findById(plan._id);
updatedPlan.jobTitle = result.jobTitle;
updatedPlan.targetCompany = result.targetCompany;
updatedPlan.cvSkills = result.cvSkills;
updatedPlan.jdSkills = result.jdSkills;
updatedPlan.missingSkills = result.missingSkills;
updatedPlan.transferableSkills = result.transferableSkills || [];
updatedPlan.weeklyPlan = result.weeklyPlan;
updatedPlan.totalWeeks = result.totalWeeks;
updatedPlan.readinessScore = result.readinessScore;
updatedPlan.companyRoleResources = result.companyRoleResources; // ← ye add karo
updatedPlan.status = 'ready';
await updatedPlan.save();

  console.log(`Plan ${plan._id} generated successfully!`);
} catch (err) {
      await CustomPlan.findByIdAndUpdate(plan._id, { status: 'failed' });
      console.error('Plan generation failed:', err.message);
    }
  } catch (error) {
    next(error);
  }
};

// @GET /api/plan/status/:planId
const getPlanStatus = async (req, res, next) => {
  try {
    const plan = await CustomPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, status: plan.status, plan: plan.status === 'ready' ? plan : null });
  } catch (error) { next(error); }
};

// @GET /api/plan/my
const getMyPlans = async (req, res, next) => {
  try {
    const plans = await CustomPlan.find({ user: req.user._id })
      .select('-cvText -jdText -weeklyPlan')
      .sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (error) { next(error); }
};

// @GET /api/plan/:planId
const getPlan = async (req, res, next) => {
  try {
    const plan = await CustomPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, plan });
  } catch (error) { next(error); }
};

// @DELETE /api/plan/:planId
const deletePlan = async (req, res, next) => {
  try {
    await CustomPlan.findByIdAndDelete(req.params.planId);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) { next(error); }
};

module.exports = { upload, generatePlan, getPlanStatus, getMyPlans, getPlan, deletePlan };