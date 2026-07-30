import { useState, useEffect } from 'react';
import { getQuestionsAPI, submitAnswerAPI, submitCodeAPI } from '../../api/questions';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Code2, Filter, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lightbulb, RefreshCw
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';


// ── Filters config ────────────────────────────────────────────
// Domain tabs — mirrors CoursesPage. Category alone can't distinguish
// domain-specific courses (e.g. Network Security is tagged 'system-design'
// internally), so we filter by domain here instead.
const domainOptions = [
  { label: 'All', value: '' },
  { label: 'Software Dev', value: 'software-dev' },
  { label: 'AI/ML', value: 'ai-ml' },
  { label: 'Data Science', value: 'data-science' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Mobile', value: 'mobile' },
];

const difficulties = [
  { label: 'All', value: '' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const QuestionCard = ({ question, onAnswered, autoExpand}) => {
  const [expanded, setExpanded] = useState(autoExpand || false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [code, setCode] = useState(question.starterCode || '// Write your solution here\n\n');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState(null);
  const [codeReview, setCodeReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const diffColor = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
  };

  const typeColor = {
    mcq: 'bg-indigo-500/20 text-indigo-400',
    coding: 'bg-teal-500/20 text-teal-400',
    short_answer: 'bg-purple-500/20 text-purple-400',
  };

  const handleSubmit = async () => {
    const answer = question.type === 'mcq' ? selectedOption : textAnswer;
    if (answer === null || answer === '') {
      toast.error('Please provide an answer');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitAnswerAPI(question._id, answer);
      setResult(res.data);
      onAnswered(res.data.xpEarned);
      if (res.data.isCorrect) {
        toast.success(`✅ Correct! +${res.data.xpEarned} XP`);
      } else {
        toast.error('❌ Incorrect. Check the explanation!');
      }
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || code.trim() === '// Write your solution here') {
      toast.error('Please write your solution');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitCodeAPI(question._id, code, language);
      setCodeReview(res.data.review);
      onAnswered(res.data.xpEarned);
      if (res.data.review.isCorrect) {
        toast.success(`✅ Great solution! +${res.data.xpEarned} XP`);
      } else {
        toast.error('Review the feedback to improve');
      }
    } catch (err) {
      toast.error('Code review failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
    id={`question-${question._id}`}
    className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
      result || codeReview ? ((result?.isCorrect || codeReview?.isCorrect) ? 'border-green-500/40' : 'border-red-500/40') : 'border-gray-800'
    }`}>
      {/* Question header */}
      <div
        id={`question-${question._id}`}
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/40 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(result || codeReview) && (
            (result?.isCorrect || codeReview?.isCorrect)
              ? <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              : <XCircle size={18} className="text-red-400 shrink-0" />
          )}
          <p className="text-white font-medium text-sm truncate">{question.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[question.difficulty]}`}>
            {question.difficulty}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[question.type]}`}>
            {question.type}
          </span>
          <span className="text-xs text-amber-400">+{question.xpReward} XP</span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-800 pt-4">
          {/* Company tags */}
          {question.company?.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {question.company.map((c) => (
                <span key={c} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Question body */}
          <p className="text-gray-300 text-sm mb-5 leading-relaxed">{question.body}</p>

          {/* MCQ options */}
          {question.type === 'mcq' && question.options && (
            <div className="flex flex-col gap-2 mb-4">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!result}
                  onClick={() => setSelectedOption(i)}
                  className={`text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                    result
                      ? i === result.correctOption
                        ? 'border-green-500 bg-green-500/10 text-green-300'
                        : i === selectedOption && !result.isCorrect
                        ? 'border-red-500 bg-red-500/10 text-red-300'
                        : 'border-gray-700 text-gray-500'
                      : selectedOption === i
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* CODING — Monaco Editor */}
          {question.type === 'coding' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Your Solution</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={!!codeReview}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-xs text-white"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="border border-gray-700 rounded-xl overflow-hidden">
                <Editor
                  height="300px"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value)}
                  options={{
                    readOnly: !!codeReview,
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                  }}
                />
              </div>
            </div>
          )}

          {/* Text answer */}
          {question.type === 'short_answer' && (
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={!!result}
              placeholder="Write your answer here..."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition resize-none mb-4"
            />
          )}

          {/* Hints */}
          {question.hints?.length > 0 && !result && !codeReview && (
            <div className="mb-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition"
              >
                <Lightbulb size={13} />
                {showHint ? 'Hide hint' : 'Show hint'}
              </button>
              {showHint && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-amber-200 text-xs">{question.hints[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Submit button */}
          {!result && !codeReview && (
            <button
              onClick={question.type === 'coding' ? handleSubmitCode : handleSubmit}
              disabled={submitting || (question.type === 'mcq' && selectedOption === null)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting
                ? <><RefreshCw size={13} className="animate-spin" /> {question.type === 'coding' ? 'AI is reviewing...' : 'Submitting...'}</>
                : (question.type === 'coding' ? 'Submit Code' : 'Submit Answer')}
            </button>
          )}

          {/* MCQ/Text Result */}
          {result && (
            <div className={`rounded-xl p-4 border ${
              result.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <p className={`font-semibold text-sm mb-1 ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              {question.explanation && (
                <p className="text-gray-300 text-sm">{question.explanation}</p>
              )}
            </div>
          )}

          {/* CODE REVIEW Result */}
{codeReview && (
  <div className={`rounded-xl p-4 border ${codeReview.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`font-semibold text-sm ${codeReview.isCorrect ? 'text-green-400' : 'text-amber-400'}`}>
        {codeReview.isCorrect ? '✅ Solution looks correct!' : '⚠️ Needs improvement'}
      </p>
      <span className="text-sm font-bold text-white">{codeReview.score}/10</span>
    </div>
    <p className="text-gray-300 text-sm mb-3">{codeReview.feedback}</p>

    <div className="grid grid-cols-2 gap-3 mb-3">
      <div className="bg-gray-800 rounded-lg p-2">
        <p className="text-xs text-gray-500">Time Complexity</p>
        <p className="text-xs text-teal-400">{codeReview.timeComplexity}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-2">
        <p className="text-xs text-gray-500">Space Complexity</p>
        <p className="text-xs text-teal-400">{codeReview.spaceComplexity}</p>
      </div>
    </div>

    {codeReview.issues?.length > 0 && (
      <div className="mb-2">
        <p className="text-xs text-rose-400 font-semibold mb-1">Issues found</p>
        {codeReview.issues.map((issue, i) => (
          <p key={i} className="text-xs text-gray-400">• {issue}</p>
        ))}
      </div>
    )}

    {codeReview.suggestions?.length > 0 && (
      <div className="mb-3">
        <p className="text-xs text-indigo-400 font-semibold mb-1">Suggestions</p>
        {codeReview.suggestions.map((sugg, i) => (
          <p key={i} className="text-xs text-gray-400">• {sugg}</p>
        ))}
      </div>
    )}

    {/* Try Again button — sirf tab dikhao jab correct nahi hai */}
    {!codeReview.isCorrect && (
      <button
        onClick={() => setCodeReview(null)}  // ← review clear karo, editor editable ho jayega
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition mt-2"
      >
        <RefreshCw size={12} /> Improve & Resubmit
      </button>
    )}
  </div>
)}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────


const PracticePage = () => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const targetQuestionId = new URLSearchParams(location.search).get('questionId');
  const targetCategory = new URLSearchParams(location.search).get('category');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: targetCategory || '',
    domain: targetQuestionId ? '' : (user?.techDomain || ''),
    difficulty: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQuestions();
  }, [filters, page]);

  // ← Phir ye useEffect
  useEffect(() => {
    if (targetQuestionId && questions.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`question-${targetQuestionId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [targetQuestionId, questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getQuestionsAPI({ ...filters, page, limit: 10 });
      setQuestions(res.data.questions);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };
  const handleAnswered = (xpEarned) => {
    if (xpEarned > 0 && user) {
      setUser({ ...user, xp: user.xp + xpEarned });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Code2 size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Practice Questions</h1>
        </div>
        <p className="text-gray-400">Solve questions topic-wise and earn XP</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <span className="text-sm text-gray-400 font-medium">Filters</span>
        </div>
        <div className="flex gap-4 flex-wrap">
          {/* Domain filter */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Domain</p>
            <div className="flex gap-2 flex-wrap">
              {domainOptions.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleFilterChange('domain', d.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    filters.domain === d.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty filter */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Difficulty</p>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleFilterChange('difficulty', d.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    filters.difficulty === d.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <Code2 size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No questions found for these filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
  <QuestionCard 
    key={q._id} 
    question={q} 
    onAnswered={handleAnswered}
    autoExpand={q._id === targetQuestionId}
  />
))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-400 rounded-xl text-sm disabled:opacity-40 hover:text-white transition"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-gray-400 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-gray-400 rounded-xl text-sm disabled:opacity-40 hover:text-white transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticePage;