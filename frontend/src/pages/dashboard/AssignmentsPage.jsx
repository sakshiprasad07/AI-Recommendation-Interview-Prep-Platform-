import { useState, useEffect } from 'react';
import { getAssignmentsAPI, getAssignmentAPI, submitAssignmentAPI, getMySubmissionsAPI } from '../../api/assignments';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ClipboardList, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Trophy, RefreshCw, BookOpen
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// Domain tabs — mirrors CoursesPage/PracticePage
const domainOptions = [
  { label: 'All', value: '' },
  { label: 'Software Dev', value: 'software-dev' },
  { label: 'AI/ML', value: 'ai-ml' },
  { label: 'Data Science', value: 'data-science' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Mobile', value: 'mobile' },
];

// ── Assignment Card ───────────────────────────────────────────
const AssignmentCard = ({ assignment, onSubmitted }) => {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const diffColor = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
  };

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!expanded && questions.length === 0) {
      setLoadingQuestions(true);
      try {
        const res = await getAssignmentAPI(assignment._id);
        setQuestions(res.data.assignment.questions);
      } catch (err) {
        toast.error('Failed to load questions');
      } finally {
        setLoadingQuestions(false);
      }
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      toast.error('Please answer at least one question');
      return;
    }
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const res = await submitAssignmentAPI(assignment._id, formattedAnswers);
      setResult(res.data);
      onSubmitted(res.data.xpEarned);
      toast.success(`Assignment submitted! Score: ${res.data.score}% +${res.data.xpEarned} XP`);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
      result ? 'border-green-500/40' : 'border-gray-800'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/40 transition"
        onClick={handleExpand}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {result
            ? <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            : <ClipboardList size={18} className="text-rose-400 shrink-0" />
          }
          <div>
            <p className="text-white font-medium text-sm">{assignment.title}</p>
            {assignment.description && (
              <p className="text-gray-500 text-xs mt-0.5 truncate">{assignment.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[assignment.difficulty]}`}>
            {assignment.difficulty}
          </span>
          <span className="text-xs text-amber-400">+{assignment.xpReward} XP</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <BookOpen size={11} />
            {assignment.questions?.length || 0} Qs
          </span>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-800 pt-4">
          {loadingQuestions ? (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse py-4">
              <RefreshCw size={14} className="animate-spin" />
              Loading questions...
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {questions.map((q, index) => (
  <div key={q._id} className="border border-gray-700 rounded-xl p-4">
    <p className="text-white text-sm font-medium mb-1">
      Q{index + 1}. {q.title}
    </p>
    <p className="text-gray-400 text-sm mb-3">{q.body}</p>

    {/* MCQ */}
    {q.type === 'mcq' && q.options && (
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={!!result}
            onClick={() => handleAnswer(q._id, i)}
            className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
              result
                ? i === result.answers?.find(a => a.question === q._id)?.answer && result.answers?.find(a => a.question === q._id)?.isCorrect
                  ? 'border-green-500 bg-green-500/10 text-green-300'
                  : 'border-gray-700 text-gray-500'
                : answers[q._id] === i
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
    {q.type === 'coding' && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Your Solution</label>
          <select
            disabled={!!result}
            value={answers[`${q._id}_lang`] || 'javascript'}
            onChange={(e) => handleAnswer(`${q._id}_lang`, e.target.value)}
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
            height="250px"
            language={answers[`${q._id}_lang`] || 'javascript'}
            theme="vs-dark"
            value={answers[q._id] || q.starterCode || '// Write your solution here\n\n'}
            onChange={(value) => handleAnswer(q._id, value)}
            options={{
              readOnly: !!result,
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              padding: { top: 10 },
            }}
          />
        </div>
      </div>
    )}

    {/* Text answer */}
    {q.type === 'short_answer' && (
      <textarea
        disabled={!!result}
        value={answers[q._id] || ''}
        onChange={(e) => handleAnswer(q._id, e.target.value)}
        placeholder="Write your answer here..."
        rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
      />
    )}
  </div>
))}

              {/* Submit */}
              {!result ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-2 w-fit"
                >
                  {submitting
                    ? <><RefreshCw size={13} className="animate-spin" /> Submitting...</>
                    : <><CheckCircle2 size={14} /> Submit Assignment</>
                  }
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={16} className="text-amber-400" />
                    <p className="text-green-400 font-semibold">Submitted!</p>
                  </div>
                  <p className="text-white text-sm">
                    Score: <span className="text-green-400 font-bold">{result.score}%</span>
                    {' '}· Correct: <span className="text-green-400">{result.submission?.correct}</span>/{questions.length}
                    {' '}· XP Earned: <span className="text-amber-400">+{result.xpEarned}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Submissions History ───────────────────────────────────────
const SubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySubmissionsAPI()
      .then((res) => setSubmissions(res.data.submissions))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 animate-pulse py-8 justify-center">
      <RefreshCw size={14} className="animate-spin" /> Loading...
    </div>
  );

  if (submissions.length === 0) return (
    <div className="text-center py-12">
      <ClipboardList size={32} className="text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400">No submissions yet. Complete an assignment!</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{s.assignment?.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {new Date(s.submittedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${
                s.score >= 60 ? 'text-green-400' : 'text-red-400'
              }`}>
                {s.score}%
              </span>
              <span className="text-xs text-amber-400">+{s.xpEarned} XP</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                s.score >= 60
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {s.score >= 60 ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const AssignmentsPage = () => {
  const { user, setUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');
  const [domain, setDomain] = useState(user?.techDomain || '');

  useEffect(() => {
    setLoading(true);
    getAssignmentsAPI(domain)
      .then((res) => setAssignments(res.data.assignments))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [domain]);

  const handleSubmitted = (xpEarned) => {
    if (xpEarned > 0 && user) {
      setUser({ ...user, xp: user.xp + xpEarned });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList size={22} className="text-rose-400" />
          <h1 className="text-2xl font-bold text-white">Assignments</h1>
        </div>
        <p className="text-gray-400">Complete assignments to earn XP and test your knowledge</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'assignments'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All Assignments
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'submissions'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          My Submissions
        </button>
      </div>

      {/* Domain filter — only relevant for the Assignments tab */}
      {activeTab === 'assignments' && (
        <div className="flex gap-2 flex-wrap mb-6">
          {domainOptions.map((d) => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${
                domain === d.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeTab === 'assignments' ? (
        loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No assignments yet.</p>
            <p className="text-gray-500 text-sm mt-1">Run the seed script to add assignments!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {assignments.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onSubmitted={handleSubmitted} />
            ))}
          </div>
        )
      ) : (
        <SubmissionsTab />
      )}
    </div>
  );
};

export default AssignmentsPage;