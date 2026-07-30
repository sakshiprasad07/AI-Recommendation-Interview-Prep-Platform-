const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const questionRoutes = require('./routes/questionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const streakRoutes = require('./routes/streakRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const mockRoutes = require('./routes/mockRoutes');
const planRoutes = require('./routes/planRoutes');

const app = express();

// Connect DB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests per 15 min per IP
// General limiter — 500 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Auth limiter — thoda strict but not too strict
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 login/register attempts per 15 min
  message: { error: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);
// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV })
);

// API routes
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/questions',   questionRoutes);
app.use('/api/progress',    progressRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/streak',      streakRoutes);
app.use('/api/recommend',   recommendRoutes);
app.use('/api/mock',        mockRoutes);
app.use('/api/plan',        planRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;