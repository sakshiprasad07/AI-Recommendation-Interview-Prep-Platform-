const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/Users');
const { Streak } = require('../models/Assignment');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skillLevel: user.skillLevel,
      onboardingDone: user.onboardingDone,
      xp: user.xp,
      level: user.level,
    },
  });
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    await Streak.create({ user: user._id });
    await sendTokenResponse(user, 201, res);
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    await sendTokenResponse(user, 200, res);
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch (error) { next(error); }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, logout, refreshToken, getMe };