const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    techDomain: { 
    type: String, 
    enum: ['software-dev', 'data-science', 'ai-ml', 'cybersecurity', 'devops', 'mobile'],
    default: 'software-dev'
    },
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    targetCompanies: [{ type: String }],
    targetRoles: [{ type: String }],
    goals: [{ type: String }],
    preferredLanguage: { type: String, default: 'JavaScript' },
    onboardingDone: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.recalculateLevel = function () {
  this.level = Math.floor(this.xp / 500) + 1;
};

module.exports = mongoose.model('User', userSchema);