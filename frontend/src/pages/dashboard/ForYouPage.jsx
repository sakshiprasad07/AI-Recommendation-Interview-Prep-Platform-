import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendationsAPI, getInsightAPI, explainTopicAPI } from '../../api/recommend';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Sparkles, ArrowRight, Mic2, AlertTriangle,
  BookOpen, TrendingUp, Lightbulb, RefreshCw, X
} from 'lucide-react';

// ── Small reusable card ───────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

// ── Priority badge ────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[priority] || map.low}`}>
      {priority}
    </span>
  );
};

// ── Explain modal ─────────────────────────────────────────────
const ExplainModal = ({ topic, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    explainTopicAPI(topic)
      .then((res) => setExplanation(res.data.explanation))
      .catch(() => setExplanation('Could not load explanation. Please try again.'))
      .finally(() => setLoading(false));
  }, [topic]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-white font-semibold">AI Explanation</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <p className="text-amber-400 font-medium mb-3">{topic}</p>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            Gemini is thinking...
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{explanation}</p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-2.5 rounded-xl transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
const ForYouPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [explainTopic, setExplainTopic] = useState(null);

  useEffect(() => {
  fetchRecommendations();
  
  // Check cached insight — 24 hours tak valid rakho
  const cached = localStorage.getItem('weeklyInsight');
  if (cached) {
    const { insight, savedAt } = JSON.parse(cached);
    const hours = (Date.now() - savedAt) / (1000 * 60 * 60);
    if (hours < 24) setInsight(insight);
  }
}, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await getRecommendationsAPI();
      setData(res.data.data);
    } catch (err) {
      toast.error('Could not load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsight = async () => {
  setInsightLoading(true);
  try {
    const res = await getInsightAPI();
    setInsight(res.data.insight);
    // Cache karo
    localStorage.setItem('weeklyInsight', JSON.stringify({
      insight: res.data.insight,
      savedAt: Date.now(),
    }));
  } catch (err) {
    toast.error('Could not generate insight');
  } finally {
    setInsightLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <RefreshCw size={24} className="text-amber-400 animate-spin" />
        <p className="text-gray-400 animate-pulse">AI is analysing your progress...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-white">For You</h1>
            <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">AI</span>
          </div>
          <p className="text-gray-400">
            Personalised recommendations based on your progress, {user?.name?.split(' ')[0]}
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-xl transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Mock Interview Nudge */}
      {data?.mockNudge?.show && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic2 size={20} className="text-purple-400" />
            <div>
              <p className="text-white font-medium">Time for a Mock Interview!</p>
              <p className="text-sm text-gray-400">
                {data.mockNudge.daysSince === null
                  ? "You haven't done a mock interview yet."
                  : `It's been ${data.mockNudge.daysSince} days since your last mock.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/mock')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition shrink-0"
          >
            Start Mock <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* AI Next Topic Recommendations */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">What to Study Next</h2>
        </div>

        {data?.recommendations?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-indigo-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{rec.title}</p>
                      <PriorityBadge priority={rec.priority} />
                    </div>
                    <p className="text-sm text-gray-400">{rec.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">~{rec.estimatedMinutes} mins</p>
                  </div>
                </div>
                <button
                  onClick={() => setExplainTopic(rec.title)}
                  className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg transition shrink-0"
                >
                  Explain
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Complete some topics first to get AI recommendations!</p>
            <button
              onClick={() => navigate('/dashboard/courses')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl transition"
            >
              Browse Courses
            </button>
          </div>
        )}
      </Card>

      {/* Weak Spots */}
      {data?.weakTopics?.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={18} className="text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Weak Spots to Revisit</h2>
          </div>
          <div className="flex flex-col gap-3">
            {data.weakTopics.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700"
              >
                <div>
                  <p className="text-white font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-rose-400 mt-0.5">Score: {t.bestScore}%</p>
                </div>
                <button
                  onClick={() => setExplainTopic(t.title)}
                  className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg transition"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly AI Insight */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Weekly Insight</h2>
          </div>
          {!insight && (
            <button
              onClick={fetchInsight}
              disabled={insightLoading}
              className="flex items-center gap-2 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              {insightLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Generate Insight
                </>
              )}
            </button>
          )}
        </div>

        {insight ? (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
            <h3 className="text-amber-400 font-bold text-lg mb-3">{insight.headline}</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{insight.body}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs text-green-400 font-semibold mb-1">💪 Strength</p>
                <p className="text-sm text-gray-300">{insight.strength}</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <p className="text-xs text-rose-400 font-semibold mb-1">⚠️ Improve</p>
                <p className="text-sm text-gray-300">{insight.improvement}</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs text-indigo-400 font-semibold mb-1">🎯 Action</p>
                <p className="text-sm text-gray-300">{insight.action}</p>
              </div>
            </div>
            <button
              onClick={() => { setInsight(null); fetchInsight(); }}
              className="mt-4 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Click "Generate Insight" to get your personalised weekly summary from AI.
            </p>
          </div>
        )}
      </Card>

      {/* Explain Modal */}
      {explainTopic && (
        <ExplainModal topic={explainTopic} onClose={() => setExplainTopic(null)} />
      )}
    </div>
  );
};

export default ForYouPage;