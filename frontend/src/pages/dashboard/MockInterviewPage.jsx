import { useState, useEffect, useRef } from 'react';
import { startMockAPI, submitMockAnswerAPI, finishMockAPI, getMockHistoryAPI } from '../../api/mock';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Video, VideoOff, Play, Square,
  ChevronRight, Trophy, BarChart2, RefreshCw,
  Volume2, User, Bot, CheckCircle2, XCircle
} from 'lucide-react';

// ── Speech utilities ──────────────────────────────────────────
const speak = (text, onEnd) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US'
  );
  if (preferred) utterance.voice = preferred;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
};

const stopSpeaking = () => window.speechSynthesis.cancel();

// ── Score display ─────────────────────────────────────────────
const ScoreCircle = ({ score }) => {
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444';
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${score * 25.1} 251`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}<span className="text-xs text-gray-400">/10</span></span>
      </div>
    </div>
  );
};

// ── History card ──────────────────────────────────────────────
const HistoryCard = ({ mock }) => {
  const scoreColor = mock.overallScore >= 7 ? 'text-green-400' : mock.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-white font-medium text-sm capitalize">{mock.type} Interview</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {new Date(mock.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`text-lg font-bold ${scoreColor}`}>{mock.overallScore}/10</p>
          <p className="text-xs text-amber-400">+{mock.xpEarned} XP</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mock.overallScore >= 7 ? 'bg-green-500/20' : mock.overallScore >= 5 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
          <Trophy size={16} className={scoreColor} />
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const MockInterviewPage = () => {
  const { user, setUser } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const [activeTab, setActiveTab] = useState('start');
  const [selectedType, setSelectedType] = useState('mixed');
  const [phase, setPhase] = useState('setup'); // setup | permission | interview | feedback | result
  const [mock, setMock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [aiState, setAiState] = useState('idle'); // idle | thinking | speaking | listening | evaluating
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  const mockTypes = [
    { value: 'mixed', label: 'Mixed', desc: 'DSA + System Design' },
    { value: 'dsa', label: 'DSA', desc: 'Data structures & algorithms' },
    { value: 'system-design', label: 'System Design', desc: 'Architecture & design' },
  ];

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    return () => cleanup();
  }, [activeTab]);

  const cleanup = () => {
    stopSpeaking();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getMockHistoryAPI();
      setHistory(res.data.mocks);
    } catch { toast.error('Failed to load history'); }
    finally { setHistoryLoading(false); }
  };

  // ── Request camera + mic permission ──────────────────────────
  const requestPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    
    // setTimeout se ensure karo ki video element mount ho gaya ho
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log('Video play error:', e));
      }
    }, 500);
    
    return true;
  } catch (err) {
    console.error('Permission error:', err);
    setPermissionError('Camera/Microphone access denied. Please allow access and try again.');
    return false;
  }
};

  // ── Start interview ───────────────────────────────────────────
  const handleStart = async () => {
    setStarting(true);
    setPhase('permission');

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setStarting(false);
      return;
    }

    try {
      const res = await startMockAPI(selectedType);
      setMock(res.data.mock);
      setQuestions(res.data.mock.questions);
      setPhase('interview');
      setCurrentIndex(0);
      setAllFeedback([]);

      // AI greets and asks first question
      setTimeout(() => askQuestion(res.data.mock.questions[0], 0), 1000);
    } catch {
      toast.error('Failed to start interview');
      setPhase('setup');
    } finally {
      setStarting(false);
    }
  };

  // ── AI asks question via TTS ──────────────────────────────────
  const askQuestion = (question, index) => {
    setCurrentFeedback(null);
    setTranscript('');
    setAiState('speaking');
    setIsSpeaking(true);

    const intro = index === 0
      ? `Hello ${user?.name?.split(' ')[0]}! Welcome to your mock interview. Let's begin. `
      : `Great answer! Moving to question ${index + 1}. `;

    const fullText = intro + question.body;

    speak(fullText, () => {
      setIsSpeaking(false);
      setAiState('listening');
      startListening();
    });
  };

  // ── Speech to text ────────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript || interimTranscript);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // ── Submit answer ─────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) {
      toast.error('Please speak your answer first!');
      return;
    }

    stopListening();
    setAiState('evaluating');

    try {
      const res = await submitMockAnswerAPI(mock._id, {
        questionId: questions[currentIndex]._id,
        userAnswer: transcript,
      });

      const feedback = res.data.evaluation;
      setCurrentFeedback(feedback);
      setAllFeedback(prev => [...prev, {
        question: questions[currentIndex],
        feedback,
        answer: transcript,
      }]);

      setAiState('speaking');
      setIsSpeaking(true);

      // AI speaks feedback
      const feedbackText = `I'd give you a score of ${feedback.score} out of 10. ${feedback.feedback}`;
      speak(feedbackText, () => {
        setIsSpeaking(false);
        setAiState('idle');
        setPhase('feedback');
      });

    } catch {
      toast.error('Failed to evaluate answer');
      setAiState('listening');
    }
  };

  // ── Next question ─────────────────────────────────────────────
  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setPhase('interview');
      askQuestion(questions[nextIndex], nextIndex);
    }
  };

  // ── Finish interview ──────────────────────────────────────────
  const handleFinish = async () => {
    setFinishing(true);
    stopSpeaking();
    try {
      const res = await finishMockAPI(mock._id);
      setFinalResult(res.data);
      if (user) setUser({ ...user, xp: user.xp + res.data.xpEarned });

      // Cleanup camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      setPhase('result');

      // AI congratulates
      speak(`Interview complete! Your overall score is ${res.data.mock.overallScore} out of 10. Well done ${user?.name?.split(' ')[0]}!`);

    } catch {
      toast.error('Failed to finish interview');
    } finally {
      setFinishing(false);
    }
  };

  // ── Toggle camera ─────────────────────────────────────────────
  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCameraOn(prev => !prev);
    }
  };

  // ── Toggle mic ────────────────────────────────────────────────
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(prev => !prev);
    }
  };

  const handleRestart = () => {
    cleanup();
    setPhase('setup');
    setMock(null);
    setQuestions([]);
    setCurrentIndex(0);
    setTranscript('');
    setCurrentFeedback(null);
    setAllFeedback([]);
    setFinalResult(null);
    setAiState('idle');
    setCameraOn(true);
    setMicOn(true);
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const currentQ = questions[currentIndex];

  // ── SETUP PHASE ───────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Video size={22} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-white">AI Mock Interview</h1>
          </div>
          <p className="text-gray-400">Real interview experience with AI interviewer</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['start', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {tab === 'start' ? 'Start Interview' : 'Past Sessions'}
            </button>
          ))}
        </div>

        {activeTab === 'start' ? (
          <>
            {/* Interview type */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {mockTypes.map(type => (
                <button key={type.value} onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${selectedType === type.value ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                  <p className="text-white font-semibold text-sm mb-1">{type.label}</p>
                  <p className="text-gray-400 text-xs">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Requirements */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
              <h3 className="text-white font-semibold mb-3">Before you start</h3>
              <div className="flex flex-col gap-2">
                {[
                  { icon: Video, text: 'Camera access required', sub: 'Your video will be shown during interview' },
                  { icon: Mic, text: 'Microphone access required', sub: 'Speak your answers clearly' },
                  { icon: Volume2, text: 'Enable your speakers', sub: 'AI interviewer will ask questions verbally' },
                  { icon: Bot, text: 'Use Google Chrome', sub: 'Speech recognition works best on Chrome' },
                ].map(({ icon: Icon, text, sub }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{text}</p>
                      <p className="text-gray-500 text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {permissionError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">
                {permissionError}
              </div>
            )}

            <button onClick={handleStart} disabled={starting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-3 text-base">
              {starting ? <><RefreshCw size={18} className="animate-spin" /> Setting up...</> : <><Play size={18} /> Start AI Interview</>}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-gray-400 animate-pulse justify-center py-8">
                <RefreshCw size={14} className="animate-spin" /> Loading...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <BarChart2 size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No past sessions yet. Start your first interview!</p>
              </div>
            ) : history.map(m => <HistoryCard key={m._id} mock={m} />)}
          </div>
        )}
      </div>
    );
  }

  // ── INTERVIEW + FEEDBACK PHASE ────────────────────────────────
  if (phase === 'interview' || phase === 'feedback') {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${aiState === 'speaking' ? 'bg-purple-400 animate-pulse' : aiState === 'listening' ? 'bg-green-400 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-white font-medium capitalize">
              AI is {aiState === 'idle' ? 'ready' : aiState}...
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6">
          <div className="bg-purple-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left — Video */}
          <div className="flex flex-col gap-4">
            {/* User camera */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay muted playsInline
                className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`} />
              {!cameraOn && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <User size={32} className="text-gray-400" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                You
              </div>
              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Listening
                </div>
              )}
            </div>

            {/* AI interviewer */}
            <div className={`bg-gray-900 border rounded-2xl p-5 transition-all ${isSpeaking ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-800'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-purple-500/30' : 'bg-gray-700'}`}>
                  <Bot size={20} className={isSpeaking ? 'text-purple-400' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">AI Interviewer</p>
                  <p className={`text-xs ${isSpeaking ? 'text-purple-400' : 'text-gray-500'}`}>
                    {isSpeaking ? 'Speaking...' : aiState === 'listening' ? 'Waiting for your answer' : aiState === 'evaluating' ? 'Evaluating...' : 'Ready'}
                  </p>
                </div>
                {isSpeaking && (
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-1 bg-purple-400 rounded-full animate-pulse"
                        style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Current question */}
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                  {currentQ?.type?.replace('_', ' ')}
                </p>
                <p className="text-white text-sm leading-relaxed">{currentQ?.body}</p>
              </div>
            </div>

            {/* Camera/Mic controls */}
            <div className="flex gap-3">
              <button onClick={toggleCamera}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition ${cameraOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                {cameraOn ? 'Camera On' : 'Camera Off'}
              </button>
              <button onClick={toggleMic}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition ${micOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                {micOn ? 'Mic On' : 'Mic Off'}
              </button>
            </div>
          </div>

          {/* Right — Answer + Feedback */}
          <div className="flex flex-col gap-4">
            {/* Transcript */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-medium text-sm">Your Answer</p>
                {isListening && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Recording
                  </div>
                )}
              </div>
              <div className="min-h-32 bg-gray-800 rounded-xl p-4">
                {transcript ? (
                  <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    {aiState === 'speaking' ? 'Listen to the question...' :
                     aiState === 'listening' ? 'Speak your answer now...' :
                     'Your answer will appear here...'}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                {phase === 'interview' && (
                  <>
                    {isListening ? (
                      <button onClick={stopListening}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-medium transition">
                        <Square size={14} /> Stop Recording
                      </button>
                    ) : (
                      <button onClick={startListening} disabled={isSpeaking}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-40">
                        <Mic size={14} /> Start Recording
                      </button>
                    )}
                    <button onClick={handleSubmitAnswer}
                      disabled={!transcript.trim() || aiState === 'evaluating'}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-40">
                      {aiState === 'evaluating'
                        ? <><RefreshCw size={14} className="animate-spin" /> Evaluating...</>
                        : <>Submit Answer <ChevronRight size={14} /></>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI Feedback */}
            {currentFeedback && phase === 'feedback' && (
              <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white font-semibold">AI Feedback</p>
                  <ScoreCircle score={currentFeedback.score} />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{currentFeedback.feedback}</p>
                {currentFeedback.keyPoints?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-4">
                    {currentFeedback.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight size={14} className="text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-gray-300 text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Next / Finish */}
                {isLastQuestion ? (
                  <button onClick={handleFinish} disabled={finishing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {finishing
                      ? <><RefreshCw size={14} className="animate-spin" /> Finishing...</>
                      : <><Trophy size={16} /> Finish & See Results</>}
                  </button>
                ) : (
                  <button onClick={handleNext}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                    Next Question <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT PHASE ──────────────────────────────────────────────
  if (phase === 'result') {
    const overallScore = finalResult?.mock?.overallScore || 0;
    const scoreColor = overallScore >= 7 ? 'text-green-400' : overallScore >= 5 ? 'text-yellow-400' : 'text-red-400';

    return (
      <div className="max-w-2xl mx-auto">
        {/* Result header */}
        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-8 mb-6 text-center">
          <Trophy size={40} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Interview Complete!</h1>
          <p className="text-gray-400 mb-4">Here's your performance summary</p>
          <div className={`text-5xl font-bold ${scoreColor} mb-2`}>
            {overallScore}<span className="text-2xl text-gray-400">/10</span>
          </div>
          <p className="text-amber-400 font-semibold">+{finalResult?.xpEarned} XP earned!</p>
        </div>

        {/* Question breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Question Breakdown</h2>
          <div className="flex flex-col gap-4">
            {allFeedback.map((item, i) => (
              <div key={i} className="border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-white text-sm font-medium">Q{i + 1}. {item.question.title}</p>
                  <span className={`text-sm font-bold shrink-0 ${item.feedback.score >= 7 ? 'text-green-400' : item.feedback.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {item.feedback.score}/10
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">{item.feedback.feedback}</p>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                  <p className="text-gray-300 text-xs">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleRestart}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <Play size={16} /> Try Again
          </button>
          <button onClick={() => { setActiveTab('history'); handleRestart(); fetchHistory(); }}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <BarChart2 size={16} /> View History
          </button>
        </div>
      </div>
    );
  }
};

export default MockInterviewPage;