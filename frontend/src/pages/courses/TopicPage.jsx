import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopicAPI } from '../../api/courses';
import { logProgressAPI } from '../../api/progress';
import { explainTopicAPI } from '../../api/recommend';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Clock, Star,
  CheckCircle2, Sparkles, BookOpen, RefreshCw,
  Code2, AlertTriangle, Zap, ExternalLink, Lightbulb
} from 'lucide-react';

const TopicPage = () => {
  const { slug, topicSlug } = useParams();
  const navigate = useNavigate();
  const { setUser, user } = useAuth();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Rich content state
  const [richContent, setRichContent] = useState(null);
  const [contentStatus, setContentStatus] = useState('loading'); // loading | generating | ready

  useEffect(() => {
    fetchTopic();
  }, [topicSlug]);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const res = await getTopicAPI(slug, topicSlug);
      setTopic(res.data.topic);

      if (res.data.contentStatus === 'ready' && res.data.topic.richContent) {
        setRichContent(res.data.topic.richContent);
        setContentStatus('ready');
      } else {
        setContentStatus('generating');
        pollForContent();
      }
    } catch (err) {
      toast.error('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  // Poll for content status every 3 seconds until ready
  const pollForContent = () => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/courses/${slug}/topics/${topicSlug}/content-status`);
        if (res.data.ready) {
          setRichContent(res.data.richContent);
          setContentStatus('ready');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    // Stop polling after 60 seconds regardless
    setTimeout(() => clearInterval(interval), 60000);
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await logProgressAPI({
        topicId: topic._id,
        courseId: topic.course,
        status: 'completed',
        score: 100,
        totalQuestions: 1,
        correct: 1,
      });
      setCompleted(true);
      toast.success(`🎉 Topic completed! +${topic.xpReward} XP earned!`);
      if (user) setUser({ ...user, xp: user.xp + topic.xpReward });
    } catch (err) {
      toast.error('Failed to mark as complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleAIExplain = async () => {
    setShowAI(true);
    if (aiExplanation) return;
    setAiLoading(true);
    try {
      const res = await explainTopicAPI(topic.title);
      setAiExplanation(res.data.explanation);
    } catch (err) {
      toast.error('AI explanation failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-800 rounded w-2/3 mb-8" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  if (!topic) return <div className="text-white">Topic not found</div>;

  const diffColor = {
    Easy: 'bg-green-500/20 text-green-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(`/dashboard/courses/${slug}`)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to {slug === 'dsa' ? 'DSA' : slug === 'oop-lld' ? 'OOP & LLD' : slug === 'sql' ? 'SQL & Databases' : slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </button>

      {/* Topic header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{topic.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < topic.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                ))}
              </div>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock size={13} /> {topic.estimatedMinutes} min
              </span>
              <span className="text-sm text-amber-400 font-medium">+{topic.xpReward} XP</span>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {topic.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          {completed ? (
            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-xl shrink-0">
              <CheckCircle2 size={16} /><span className="text-sm font-medium">Completed!</span>
            </div>
          ) : (
            <button onClick={handleComplete} disabled={completing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 shrink-0">
              {completing ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> Mark Complete</>}
            </button>
          )}
        </div>
      </div>

      {/* Content generating state */}
      {contentStatus === 'generating' && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-8 mb-6 text-center">
          <RefreshCw size={28} className="text-indigo-400 animate-spin mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">AI is preparing detailed study material...</h3>
          <p className="text-gray-400 text-sm">
            Fetching resources and generating in-depth content for this topic. This takes about 15-20 seconds.
          </p>
        </div>
      )}

      {/* Rich Content — once ready */}
      {contentStatus === 'ready' && richContent && (
        <>
          {/* Detailed explanation */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-indigo-400" />
              <h2 className="text-white font-semibold">Explanation</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">{richContent.explanation}</p>
          </div>

          {/* Key concepts */}
          {richContent.keyConcepts?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-400" />
                <h2 className="text-white font-semibold">Key Concepts</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {richContent.keyConcepts.map((concept, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-800 rounded-xl p-3">
                    <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{concept}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code example */}
          {richContent.codeExample && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={16} className="text-teal-400" />
                <h2 className="text-white font-semibold">Code Example</h2>
              </div>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-teal-300 font-mono whitespace-pre">{richContent.codeExample}</code>
              </pre>
            </div>
          )}

          {/* Complexity */}
          {richContent.complexity && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6">
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Time & Space Complexity</p>
              <p className="text-gray-300 text-sm">{richContent.complexity}</p>
            </div>
          )}

          {/* Common mistakes */}
          {richContent.commonMistakes?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-rose-400" />
                <h2 className="text-white font-semibold">Common Mistakes to Avoid</h2>
              </div>
              <div className="flex flex-col gap-2">
                {richContent.commonMistakes.map((mistake, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">⚠</span>
                    <p className="text-gray-300 text-sm">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice problems */}
          {richContent.practiceProblems?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={16} className="text-purple-400" />
                <h2 className="text-white font-semibold">Practice Problems</h2>
              </div>
              <div className="flex flex-col gap-2">
                {richContent.practiceProblems.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition group">
                    <p className="text-white text-sm">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[p.difficulty] || 'bg-gray-700 text-gray-400'}`}>
                        {p.difficulty}
                      </span>
                      <ExternalLink size={13} className="text-gray-500 group-hover:text-indigo-400 transition" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {richContent.resources?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-yellow-400" />
                <h2 className="text-white font-semibold">Additional Resources</h2>
              </div>
              <div className="flex flex-col gap-2">
                {richContent.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
                    <ExternalLink size={12} />
                    {r.title}
                    <span className="text-gray-600 capitalize">({r.type})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Prerequisites */}
      {topic.prerequisites?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-3">Prerequisites</h2>
          <div className="flex gap-2 flex-wrap">
            {topic.prerequisites.map((pre) => (
              <button key={pre._id} onClick={() => navigate(`/dashboard/courses/${slug}/topics/${pre.slug}`)}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-indigo-400 px-3 py-1.5 rounded-xl transition">
                {pre.title} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Explanation — quick chat-style explain */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h2 className="text-white font-semibold">Ask AI for a Simpler Explanation</h2>
            <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold">AI</span>
          </div>
          {!showAI && (
            <button onClick={handleAIExplain}
              className="text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl transition">
              Explain with AI
            </button>
          )}
        </div>
        {showAI && (
          aiLoading ? (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse">
              <RefreshCw size={14} className="animate-spin" /> AI is explaining...
            </div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{aiExplanation}</p>
          )
        )}
        {!showAI && (
          <p className="text-gray-500 text-sm">Click for a personalized, beginner-friendly explanation.</p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button onClick={() => navigate(`/dashboard/courses/${slug}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2.5 rounded-xl text-sm transition">
          <ArrowLeft size={14} /> Back to Course
        </button>
        <button onClick={() => { if (!completed) handleComplete(); navigate(`/dashboard/courses/${slug}`); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          Next Topic <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default TopicPage;