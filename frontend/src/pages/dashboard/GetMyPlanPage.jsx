import { useState, useEffect, useRef } from 'react';
import { generatePlanAPI, getPlanStatusAPI, getMyPlansAPI, getPlanAPI, deletePlanAPI } from '../../api/plan';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Briefcase, Sparkles, RefreshCw,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  BookOpen, Code2, ClipboardList, ExternalLink, Trash2,
  ArrowRight, Brain, Trophy, AlertTriangle, Zap
} from 'lucide-react';

// ── Readiness Score Ring ──────────────────────────────────────
const ReadinessRing = ({ score }) => {
  const color = score >= 60 ? '#22c55e' : score >= 30 ? '#eab308' : '#ef4444';
  const label = score >= 60 ? 'Ready' : score >= 30 ? 'Partially Ready' : 'Needs Work';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${score * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}%</span>
        </div>
      </div>
      <p className="text-sm mt-2" style={{ color }}>{label}</p>
    </div>
  );
};

// ── Week Card ─────────────────────────────────────────────────
const WeekCard = ({ week }) => {
  const [expanded, setExpanded] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);

  const handleQuizAnswer = (qIndex, optIndex) => {
    if (quizResults[qIndex] !== undefined) return;
    const isCorrect = optIndex === week.quiz[qIndex].correctOption;
    setQuizAnswers({ ...quizAnswers, [qIndex]: optIndex });
    setQuizResults({ ...quizResults, [qIndex]: isCorrect });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Week header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/40 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-indigo-400 font-bold">W{week.week}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{week.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {week.topics?.length} topics · {week.quiz?.length} quiz questions · {week.leetcodeProblems?.length} LeetCode problems
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-5 flex flex-col gap-6">

          {/* Topics */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <BookOpen size={15} className="text-indigo-400" /> Topics to Study
            </h4>
            <div className="flex flex-col gap-3">
              {week.topics?.map((topic, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4">
                  <p className="text-white font-medium text-sm mb-2">{topic.title}</p>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">{topic.explanation}</p>
                  <p className="text-xs text-amber-400 mb-2">~{topic.estimatedHours}h estimated</p>

                  {/* Resources */}
                  {topic.resources?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-widest">Resources</p>
                      <div className="flex flex-col gap-1.5">
                        {topic.resources.map((r, ri) => (
                          <a
                            key={ri}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition"
                          >
                            <ExternalLink size={11} />
                            {r.title}
                            <span className="text-gray-600 capitalize">({r.type})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LeetCode Problems */}
          {week.leetcodeProblems?.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Code2 size={15} className="text-teal-400" /> LeetCode Problems
              </h4>
              <div className="flex flex-col gap-2">
                {week.leetcodeProblems.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.difficulty}
                      </span>
                      <p className="text-white text-sm">{p.title}</p>
                    </div>
                    <ExternalLink size={13} className="text-gray-500 group-hover:text-indigo-400 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assignment */}
          {week.assignment && (
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <ClipboardList size={15} className="text-rose-400" /> Assignment
              </h4>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <p className="text-white font-medium text-sm mb-2">{week.assignment.title}</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{week.assignment.description}</p>
                {week.assignment.hints?.length > 0 && (
                  <div>
                    <p className="text-xs text-rose-400 font-semibold mb-1.5">💡 Hints</p>
                    {week.assignment.hints.map((hint, i) => (
                      <p key={i} className="text-gray-400 text-xs mb-1">• {hint}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz */}
          {week.quiz?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Brain size={15} className="text-amber-400" /> Week Quiz
                </h4>
                <button
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  {showQuiz ? 'Hide quiz' : 'Take quiz'}
                </button>
              </div>

              {showQuiz && (
                <div className="flex flex-col gap-4">
                  {week.quiz.map((q, qi) => (
                    <div key={qi} className="bg-gray-800 rounded-xl p-4">
                      <p className="text-white text-sm font-medium mb-3">Q{qi + 1}. {q.question}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => handleQuizAnswer(qi, oi)}
                            className={`text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${
                              quizResults[qi] !== undefined
                                ? oi === q.correctOption
                                  ? 'border-green-500 bg-green-500/10 text-green-300'
                                  : oi === quizAnswers[qi] && !quizResults[qi]
                                  ? 'border-red-500 bg-red-500/10 text-red-300'
                                  : 'border-gray-700 text-gray-500'
                                : quizAnswers[qi] === oi
                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                : 'border-gray-700 text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                      {quizResults[qi] !== undefined && (
                        <div className={`mt-3 p-3 rounded-xl text-xs ${
                          quizResults[qi] ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
                        }`}>
                          {quizResults[qi] ? '✅ Correct! ' : '❌ Incorrect. '}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Plan Detail View ──────────────────────────────────────────
const PlanDetail = ({ plan, onBack }) => {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm"
      >
        ← Back to plans
      </button>

      {/* Plan header */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {plan.jobTitle !== 'Unknown' ? plan.jobTitle : 'Your Custom Plan'}
            </h2>
            {plan.targetCompany !== 'Unknown' && (
              <p className="text-indigo-400 text-sm mb-3">@ {plan.targetCompany}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                {plan.totalWeeks} weeks
              </span>
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                {plan.missingSkills?.length} skills to learn
              </span>
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                {plan.weeklyPlan?.reduce((s, w) => s + (w.topics?.length || 0), 0)} topics
              </span>
            </div>
          </div>
          <ReadinessRing score={plan.readinessScore} />
        </div>
      </div>
         
    {(plan.companyRoleResources?.github?.length > 0 || 
        plan.companyRoleResources?.articles?.length > 0) && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-amber-400" />
            <h3 className="text-white font-semibold">
              {plan.targetCompany} — {plan.jobTitle} Interview Resources
            </h3>
            <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
              Company Specific
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Resources based on past interview experiences at {plan.targetCompany} 
            for {plan.jobTitle} role
          </p>

          {/* GitHub repos */}
          {plan.companyRoleResources.github?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                GitHub Resources
              </p>
              <div className="flex flex-col gap-2">
                {plan.companyRoleResources.github.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink size={13} className="text-gray-500" />
                      <p className="text-white text-sm">{r.title}</p>
                    </div>
                    {r.stars && (
                      <span className="text-xs text-amber-400">⭐ {r.stars.toLocaleString()}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* DEV.to articles */}
          {plan.companyRoleResources.articles?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                Interview Experiences
              </p>
              <div className="flex flex-col gap-2">
                {plan.companyRoleResources.articles.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition"
                  >
                    <ExternalLink size={13} className="text-gray-500" />
                    <p className="text-white text-sm">{a.title}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skills comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-400" /> Skills You Have
          </h3>
          <div className="flex flex-wrap gap-2">
            {plan.cvSkills?.map((s) => (
              <span key={s} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-400" /> Skills to Learn
          </h3>
          <div className="flex flex-wrap gap-2">
            {plan.missingSkills?.map((s) => (
              <span key={s} className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Transferable Skills */}
{plan.transferableSkills?.length > 0 && (
  <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-5 mb-6">
    <h3 className="text-white font-medium mb-1 flex items-center gap-2">
      <Zap size={15} className="text-amber-400" />
      Your Transferable Skills
    </h3>
    <p className="text-gray-400 text-xs mb-4">
      These existing skills map directly to job requirements
    </p>
    <div className="flex flex-col gap-3">
      {plan.transferableSkills.map((s, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg font-medium shrink-0">
            ✓ {s.have}
          </span>
          <span className="text-gray-500 text-xs">→</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg font-medium shrink-0">
            {s.maps_to}
          </span>
          <span className="text-gray-400 text-xs ml-auto">{s.gap}</span>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Weekly plan */}
      <h3 className="text-white font-semibold mb-4">Your Week-by-Week Plan</h3>
      <div className="flex flex-col gap-4">
        {plan.weeklyPlan?.map((week) => (
          <WeekCard key={week.week} week={week} />
        ))}
      </div>


    </div>
  );
};

// ── Upload Form ───────────────────────────────────────────────
const UploadForm = ({ onPlanStarted }) => {
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const cvInputRef = useRef();
  const jdInputRef = useRef();

  const handleSubmit = async () => {
  if ((!cvText && !cvFile) || (!jdText && !jdFile)) {
    toast.error('Please provide both CV and Job Description');
    return;
  }

  setGenerating(true);
  try {
    const formData = new FormData();
    if (cvFile) {
      formData.append('cv', cvFile);
    } else {
      formData.append('cvText', cvText);
    }
    if (jdFile) {
      formData.append('jd', jdFile);  // ← JD file bhi append karo
    } else {
      formData.append('jdText', jdText);
    }

    const res = await generatePlanAPI(formData);
    toast.success('Plan generation started! This takes 1-2 minutes...');
    onPlanStarted(res.data.planId);
  } catch (err) {
    toast.error('Failed to start plan generation');
    setGenerating(false);
  }
};

  return (
    <div className="flex flex-col gap-6">
      {/* How it works */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-400" />
          <h3 className="text-white font-semibold">How it works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Upload, label: 'Upload CV + JD', desc: 'Paste your CV and job description' },
            { icon: Brain, label: 'AI Analysis', desc: 'AI identifies your skill gaps' },
            { icon: Trophy, label: 'Get Your Plan', desc: 'Receive a personalized week-by-week roadmap' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={14} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CV Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText size={16} className="text-teal-400" /> Your CV / Resume
          </h3>
          <button
            onClick={() => cvInputRef.current?.click()}
            className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
          >
            <Upload size={12} /> Upload PDF
          </button>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              setCvFile(e.target.files[0]);
              setCvText('');
              toast.success(`File selected: ${e.target.files[0].name}`);
            }}
          />
        </div>

        {cvFile ? (
          <div className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3">
            <FileText size={16} className="text-teal-400" />
            <p className="text-teal-300 text-sm">{cvFile.name}</p>
            <button
              onClick={() => {
                setCvFile(null);
                if (cvInputRef.current) cvInputRef.current.value = '';
              }}
              className="ml-auto text-gray-500 hover:text-red-400 transition"
            >
              <XCircle size={14} />
            </button>
          </div>
        ) : (
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Paste your CV / resume text here...&#10;&#10;Include: skills, experience, education, technologies used"
            rows={8}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-teal-500 transition resize-none"
          />
        )}
      </div>

      {/* JD Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-purple-400" /> Job Description
          </h3>
          <button
            onClick={() => jdInputRef.current?.click()}
            className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
          >
            <Upload size={12} /> Upload PDF
          </button>
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              setJdFile(e.target.files[0]);
              setJdText('');
              toast.success(`File selected: ${e.target.files[0].name}`);
            }}
          />
        </div>

        {jdFile ? (
          <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
            <FileText size={16} className="text-purple-400" />
            <p className="text-purple-300 text-sm">{jdFile.name}</p>
            <button
              onClick={() => {
                setJdFile(null);
                if (jdInputRef.current) jdInputRef.current.value = '';
              }}
              className="ml-auto text-gray-500 hover:text-red-400 transition"
            >
              <XCircle size={14} />
            </button>
          </div>
        ) : (
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description here...&#10;&#10;Include: required skills, responsibilities, qualifications"
            rows={8}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition resize-none"
          />
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleSubmit}
        disabled={generating}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-3 text-base"
      >
        {generating ? (
          <><RefreshCw size={18} className="animate-spin" /> Starting analysis...</>
        ) : (
          <><Sparkles size={18} /> Generate My Personalized Plan</>
        )}
      </button>
    </div>
  );
};

// ── Polling component ─────────────────────────────────────────
const PlanPolling = ({ planId, onReady }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
  const dotsInterval = setInterval(() => {
    setDots((d) => d.length >= 3 ? '' : d + '.');
  }, 500);

  let attempts = 0;
  const maxAttempts = 30; // 30 × 4sec = 2 minutes

  const pollInterval = setInterval(async () => {
    attempts++;
    try {
      const res = await getPlanStatusAPI(planId);
      if (res.data.status === 'ready') {
        clearInterval(pollInterval);
        clearInterval(dotsInterval);
        onReady(res.data.plan);
      } else if (res.data.status === 'failed') {
        clearInterval(pollInterval);
        clearInterval(dotsInterval);
        toast.error('Plan generation failed. Please try again.');
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        clearInterval(dotsInterval);
        toast.error('Taking too long. Please check "My Plans" in a few minutes.');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 4000);

  return () => {
    clearInterval(pollInterval);
    clearInterval(dotsInterval);
  };
}, [planId]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
        <Brain size={32} className="text-indigo-400 animate-pulse" />
      </div>
      <div className="text-center">
        <h3 className="text-white font-semibold text-lg mb-2">AI is analysing your profile{dots}</h3>
        <p className="text-gray-400 text-sm max-w-sm">
          Extracting skills, fetching resources from GitHub and DEV.to, generating your week-by-week plan
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {[
          'Extracting skills from CV & JD',
          'Fetching resources from GitHub & DEV.to',
          'Generating personalized weekly plan',
          'Creating quizzes & assignments',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
            <RefreshCw size={12} className="text-indigo-400 animate-spin shrink-0" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const GetMyPlanPage = () => {
  const [view, setView] = useState('list');  // list | upload | polling | detail
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingPlanId, setPollingPlanId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await getMyPlansAPI();
      setPlans(res.data.plans);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanStarted = (planId) => {
    setPollingPlanId(planId);
    setView('polling');
  };

  const handlePlanReady = (plan) => {
    toast.success('Your plan is ready! 🎉');
    setSelectedPlan(plan);
    setView('detail');
    fetchPlans();
  };

  const handleDeletePlan = async (planId, e) => {
    e.stopPropagation();
    try {
      await deletePlanAPI(planId);
      setPlans(plans.filter((p) => p._id !== planId));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  const handleViewPlan = async (planId) => {
    try {
      const res = await getPlanAPI(planId);
      setSelectedPlan(res.data.plan);
      setView('detail');
    } catch {
      toast.error('Failed to load plan');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      {view !== 'detail' && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-amber-400" />
                <h1 className="text-2xl font-bold text-white">Get My Plan</h1>
                <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">RAG AI</span>
              </div>
              <p className="text-gray-400">Upload your CV + Job Description — AI will build your personalized roadmap</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs — only on list view */}
      {view !== 'polling' && view !== 'detail' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('upload')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              view === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            + New Plan
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Plans ({plans.length})
          </button>
        </div>
      )}

      {/* Views */}
      {view === 'upload' && <UploadForm onPlanStarted={handlePlanStarted} />}

      {view === 'polling' && <PlanPolling planId={pollingPlanId} onReady={handlePlanReady} />}

      {view === 'detail' && selectedPlan && (
        <PlanDetail plan={selectedPlan} onBack={() => setView('list')} />
      )}

      {view === 'list' && (
        loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <Brain size={40} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No plans yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Upload your CV and a job description to get your personalized learning roadmap
            </p>
            <button
              onClick={() => setView('upload')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition mx-auto"
            >
              <Sparkles size={14} /> Create My First Plan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div
                key={plan._id}
                onClick={() => handleViewPlan(plan._id)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">
                      {plan.jobTitle !== 'Unknown' ? plan.jobTitle : 'Custom Plan'}
                    </h3>
                    {plan.targetCompany !== 'Unknown' && (
                      <p className="text-indigo-400 text-xs mt-0.5">@ {plan.targetCompany}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{plan.totalWeeks} weeks</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        plan.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                        plan.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {plan.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(plan.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{plan.readinessScore}%</span>
                    <button
                      onClick={(e) => handleDeletePlan(plan._id, e)}
                      className="text-gray-600 hover:text-red-400 transition p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ArrowRight size={16} className="text-gray-600 group-hover:text-indigo-400 transition" />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setView('upload')}
              className="w-full border border-dashed border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-indigo-400 py-4 rounded-2xl text-sm transition"
            >
              + Generate new plan
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default GetMyPlanPage;