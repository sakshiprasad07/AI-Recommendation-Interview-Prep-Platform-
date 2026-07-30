import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsAPI } from '../../api/users';
import { checkInAPI, getStreakAPI } from '../../api/streak';
import { getDailySetAPI } from '../../api/questions';
import toast from 'react-hot-toast';
import {
  Flame, Trophy, BookOpen, Target,
  Mic2, ClipboardList, Code2, Sparkles,
  ArrowRight, CheckCircle2, Clock
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [dailyQuestions, setDailyQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, streakRes, dailyRes] = await Promise.all([
        getDashboardStatsAPI(),
        getStreakAPI(),
        getDailySetAPI(),
      ]);
      setStats(statsRes.data.stats);
      setStreak(streakRes.data.streak);
      setDailyQuestions(dailyRes.data.questions);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await checkInAPI();
      setStreak(res.data.streak);
      toast.success(`✅ Checked in! +${res.data.xpEarned} XP`);
    } catch (err) {
      toast.error('Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Current Streak',
      value: `${streak?.currentStreak || 0} days`,
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Avg Score',
      value: `${stats?.avgScore || 0}%`,
      icon: Trophy,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Topics Done',
      value: stats?.totalCompleted || 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'XP Earned',
      value: user?.xp || 0,
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">Here's your prep summary for today</p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          <Flame size={16} />
          {checkingIn ? 'Checking in...' : 'Daily Check-in'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Continue learning + For You teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Continue learning */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Continue Learning</h2>
          {stats?.lastVisited ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{stats.lastVisited.topic?.title}</p>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {stats.lastVisited.topic?.estimatedMinutes} min
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/courses')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                Resume <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-400">You haven't started any topic yet!</p>
              <button
                onClick={() => navigate('/dashboard/courses')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                Browse Courses <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* For You teaser */}
        <div
          onClick={() => navigate('/dashboard/for-you')}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 cursor-pointer hover:border-amber-500/60 transition group"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">For You</span>
            <span className="ml-auto text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold">AI</span>
          </div>
          <p className="text-white font-medium">Get your personalised recommendations</p>
          <p className="text-gray-400 text-sm mt-1">AI-powered next steps based on your progress</p>
          <div className="flex items-center gap-1 text-amber-400 text-sm mt-4 group-hover:gap-2 transition-all">
            See recommendations <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Courses */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-white">My Courses</h2>
          </div>
          <div className="flex flex-col gap-2">
            {['DSA', 'System Design', 'JavaScript'].map((c) => (
              <div key={c} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-300">{c}</span>
                <ArrowRight size={14} className="text-gray-600" />
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/dashboard/courses')}
            className="w-full mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition text-center"
          >
            View all courses →
          </button>
        </div>

        {/* Assignments */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <ClipboardList size={18} className="text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Assignments</h2>
          </div>
          <p className="text-gray-400 text-sm">Practice assignments to test your knowledge.</p>
          <button
            onClick={() => navigate('/dashboard/assignments')}
            className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium py-2.5 rounded-xl transition"
          >
            View Assignments
          </button>
        </div>

        {/* Mock Interview */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Mic2 size={18} className="text-purple-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Mock Interview</h2>
          </div>
          <p className="text-gray-400 text-sm">AI-powered mock sessions with instant feedback.</p>
          <button
            onClick={() => navigate('/dashboard/mock')}
            className="w-full mt-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium py-2.5 rounded-xl transition"
          >
            Start Mock Interview
          </button>
        </div>
      </div>

      {/* Daily Questions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center">
              <Code2 size={18} className="text-teal-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Today's Practice Questions</h2>
          </div>
          <button
            onClick={() => navigate('/dashboard/practice')}
            className="text-sm text-teal-400 hover:text-teal-300 transition"
          >
            See all →
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {dailyQuestions.length > 0 ? (
            dailyQuestions.map((q) => (
              <div
                key={q._id}
                className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
              >
                <div>
                  <p className="text-sm text-white font-medium">{q.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{q.category}</span>
                  </div>
                </div>
                <button
                onClick={() => navigate(`/dashboard/practice?questionId=${q._id}&category=${q.category}`)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
              >
                Solve
              </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No questions available. Run the seed script!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;