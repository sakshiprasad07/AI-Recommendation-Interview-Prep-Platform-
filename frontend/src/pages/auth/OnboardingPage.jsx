import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { completeOnboardingAPI } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const steps = [
    {
    id: 0,
    title: 'What is your tech specialization?',
    field: 'techDomain',
    type: 'single',
    options: [
      { label: '💻 Software Development', value: 'software-dev', desc: 'Frontend, Backend, Fullstack' },
      { label: '📊 Data Science', value: 'data-science', desc: 'Analytics, visualization, SQL' },
      { label: '🤖 AI / ML Engineering', value: 'ai-ml', desc: 'Machine learning, deep learning, NLP' },
      { label: '🔐 Cybersecurity', value: 'cybersecurity', desc: 'Network security, ethical hacking' },
      { label: '⚙️ DevOps & Cloud', value: 'devops', desc: 'Docker, Kubernetes, CI/CD, AWS' },
      { label: '📱 Mobile Development', value: 'mobile', desc: 'React Native, Flutter, iOS/Android' },
    ],
  },
  {
    id: 1,
    title: 'What is your current skill level?',
    field: 'skillLevel',
    type: 'single',
    options: [
      { label: '🌱 Beginner', value: 'beginner', desc: 'Just starting out with DSA & interviews' },
      { label: '⚡ Intermediate', value: 'intermediate', desc: 'Know the basics, want to go deeper' },
      { label: '🚀 Advanced', value: 'advanced', desc: 'Preparing for top-tier companies' },
    ],
  },
  {
    id: 2,
    title: 'What are your goals?',
    field: 'goals',
    type: 'multi',
    options: [
      { label: '💻 Crack DSA rounds', value: 'crack DSA' },
      { label: '🏗️ Master System Design', value: 'system design' },
      { label: '🌐 Get a frontend role', value: 'frontend' },
      { label: '⚙️ Get a backend role', value: 'backend' },
      { label: '🧠 Land an ML/AI role', value: 'ml/ai' },
    ],
  },
  {
    id: 3,
    title: 'Which companies are you targeting?',
    field: 'targetCompanies',
    type: 'multi',
    options: [
      { label: 'Google', value: 'Google' },
      { label: 'Amazon', value: 'Amazon' },
      { label: 'Microsoft', value: 'Microsoft' },
      { label: 'Meta', value: 'Meta' },
      { label: 'Apple', value: 'Apple' },
      { label: 'Netflix', value: 'Netflix' },
      { label: 'Flipkart', value: 'Flipkart' },
      { label: 'Uber', value: 'Uber' },
    ],
  },
  {
    id: 4,
    title: 'What is your preferred coding language?',
    field: 'preferredLanguage',
    type: 'single',
    options: [
      { label: 'JavaScript', value: 'JavaScript' },
      { label: 'Python', value: 'Python' },
      { label: 'Java', value: 'Java' },
      { label: 'C++', value: 'C++' },
    ],
  },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    techDomain: '',
    skillLevel: '',
    goals: [],
    targetCompanies: [],
    preferredLanguage: '',
  });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const step = steps[currentStep];

  const handleSingle = (value) => {
    setAnswers({ ...answers, [step.field]: value });
  };

  const handleMulti = (value) => {
    const current = answers[step.field];
    if (current.includes(value)) {
      setAnswers({ ...answers, [step.field]: current.filter((v) => v !== value) });
    } else {
      setAnswers({ ...answers, [step.field]: [...current, value] });
    }
  };

  const isSelected = (value) => {
    const val = answers[step.field];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const canProceed = () => {
    const val = answers[step.field];
    return Array.isArray(val) ? val.length > 0 : val !== '';
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await completeOnboardingAPI(answers);
      setUser(res.data.user);
      toast.success('Profile set up! Welcome to PrepAI 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">PrepAI</h1>
          <p className="text-gray-400 mt-2">Let's personalise your experience</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= currentStep ? 'bg-indigo-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h2 className="text-xl font-semibold text-white mb-6">{step.title}</h2>

          <div className="flex flex-col gap-3">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  step.type === 'single' ? handleSingle(opt.value) : handleMulti(opt.value)
                }
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  isSelected(opt.value)
                    ? 'border-indigo-500 bg-indigo-600/20 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.desc && (
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                )}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
            >
              ← Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition"
              >
                {loading ? 'Setting up...' : "Let's Go! 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;