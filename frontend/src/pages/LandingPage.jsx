import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, BookOpen, Code2, Mic2, Trophy,
  ArrowRight, CheckCircle2, Flame, Brain,
  ClipboardList, Star, Users, Zap, Target
} from 'lucide-react';
import { useEffect } from 'react';


// ── Feature card ──────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color, bg }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all hover:scale-[1.02] group">
    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={20} className={color} />
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-gray-400 text-sm">{label}</p>
  </div>
);

// ── Step card ─────────────────────────────────────────────────
const StepCard = ({ number, title, desc }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
      {number}
    </div>
    <div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useAuth();  // ← component ke andar hona chahiye
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const features = [
    {
      icon: BookOpen,
      title: 'Structured Courses',
      desc: 'DSA, System Design, and language-specific courses — all in one place.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
    {
      icon: Sparkles,
      title: 'AI Recommendations',
      desc: 'Gemini AI analyses your progress and tells you exactly what to study next.',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      icon: Mic2,
      title: 'Mock Interviews',
      desc: 'AI-powered mock sessions with instant feedback on every answer you give.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      icon: Code2,
      title: 'Practice Questions',
      desc: 'Topic-wise questions with difficulty filters — from easy to hard.',
      color: 'text-teal-400',
      bg: 'bg-teal-400/10',
    },
    {
      icon: ClipboardList,
      title: 'Assignments',
      desc: 'Timed assignments to test your knowledge and earn XP rewards.',
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
    {
      icon: Flame,
      title: 'Daily Streaks',
      desc: 'Build consistency with daily check-ins, streaks, and a leaderboard.',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Create your account',
      desc: 'Sign up and complete a quick onboarding to set your goals and skill level.',
    },
    {
      number: 2,
      title: 'Get your AI roadmap',
      desc: 'Our AI analyses your profile and builds a personalised learning path for you.',
    },
    {
      number: 3,
      title: 'Learn, practice, repeat',
      desc: 'Complete topics, solve questions, do mock interviews and earn XP every day.',
    },
    {
      number: 4,
      title: 'Crack your dream interview',
      desc: 'Walk into interviews confident, prepared, and ready to perform at your best.',
    },
  ];

  const companies = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Flipkart', 'Uber'];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Navbar ── */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-white">PrepAI</h1>
          <p className="text-xs text-gray-500">Interview Prep Platform</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              Go to Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm mb-8">
          <Sparkles size={14} />
          AI-Powered Interview Preparation
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Crack your dream
          <span className="text-indigo-400"> tech interview</span>
          <br />with the power of AI
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          PrepAI tracks your progress, identifies your weak spots, and uses AI to recommend
          exactly what you should study next — so you never waste time again.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition"
          >
            Start Preparing Free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-2xl text-base font-semibold transition"
          >
            Login to Dashboard
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mt-8 text-gray-500 text-sm">
          <CheckCircle2 size={14} className="text-green-400" />
          Free to use · No credit card required
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="20+" label="DSA Topics" />
          <StatCard value="100+" label="Practice Questions" />
          <StatCard value="5" label="Course Tracks" />
          <StatCard value="AI" label="Powered Feedback" />
        </div>
      </section>

      {/* ── Target companies ── */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest">
          Prepare for top companies
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {companies.map((c) => (
            <span
              key={c}
              className="bg-gray-900 border border-gray-700 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Everything you need to prepare
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A complete platform built for serious candidates who want to land their dream job.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
          <p className="text-gray-400">Get started in minutes and see results in days.</p>
        </div>
        <div className="flex flex-col gap-8">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </section>

      {/* ── AI highlight ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm mb-6">
            <Brain size={14} />
            Powered by Groq AI
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Your personal AI interview coach
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Our AI studies your learning patterns, identifies knowledge gaps, and gives you
            a personalised roadmap — just like having a senior engineer mentor you every day.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Zap, label: 'Instant Feedback', desc: 'Get evaluated on every mock answer in seconds' },
              { icon: Target, label: 'Gap Analysis', desc: 'Know exactly which topics need more attention' },
              { icon: Star, label: 'Smart Roadmap', desc: 'AI-ordered topic sequence based on your goals' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-gray-900/50 rounded-2xl p-4">
                <Icon size={18} className="text-indigo-400 mb-2" />
                <p className="text-white font-medium text-sm mb-1">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to start prepping?
        </h2>
        <p className="text-gray-400 mb-8">
          Join PrepAI today and start your journey to cracking your dream interview.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-semibold transition mx-auto"
        >
          Get Started Free <ArrowRight size={18} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">PrepAI</p>
            <p className="text-gray-500 text-xs mt-0.5">AI-powered interview prep platform</p>
          </div>
          <p className="text-gray-500 text-sm">Built with ❤️ for developers</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;