const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

// ── Safely parse JSON ─────────────────────────────────────────
const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
};

const chat = async (prompt) => {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content || '';
};

// ── 1. Next topic recommendations ────────────────────────────
const getNextTopicRecommendations = async ({ user, completedTopics, allTopics, weakTopics }) => {
  const prompt = `
You are an expert interview prep coach.

USER PROFILE:
- Name: ${user.name}
- Skill level: ${user.skillLevel}
- Goals: ${user.goals?.join(', ') || 'crack technical interviews'}
- Target companies: ${user.targetCompanies?.join(', ') || 'top tech companies'}
- Preferred language: ${user.preferredLanguage}

COMPLETED TOPICS (${completedTopics.length}):
${completedTopics.map((t) => `- ${t.title} (score: ${t.bestScore}%)`).join('\n') || 'None yet'}

WEAK TOPICS (score < 60%):
${weakTopics.map((t) => `- ${t.title} (score: ${t.bestScore}%)`).join('\n') || 'None'}

AVAILABLE TOPICS:
${allTopics.slice(0, 20).map((t) => `- ${t._id}: ${t.title} [${t.tags?.join(', ')}] difficulty:${t.difficulty}/5`).join('\n')}

Recommend TOP 3 topics to study next. Respond ONLY with valid JSON array, no markdown:
[{"topicId":"id here","title":"topic title","reason":"1-2 sentence reason","priority":"high|medium|low","estimatedMinutes":30}]`;

  try {
    const text = await chat(prompt);
    return parseJSON(text) || [];
  } catch (error) {
    console.error('Groq recommendation error:', error.message);
    return [];
  }
};

// ── 2. Weekly insight ─────────────────────────────────────────
const generateWeeklyInsight = async ({ user, weekProgress, mockScores }) => {
  const prompt = `
You are an AI interview coach generating a weekly performance insight.

USER: ${user.name} (${user.skillLevel})
GOALS: ${user.goals?.join(', ')}

THIS WEEK:
- Topics completed: ${weekProgress.completed}
- Topics attempted: ${weekProgress.attempted}
- Average score: ${weekProgress.avgScore}%
- Time spent: ${weekProgress.timeSpentMinutes} minutes
- Weak areas: ${weekProgress.weakTopics?.join(', ') || 'none'}
- Mock scores: ${mockScores?.join(', ') || 'no mocks'}

Respond ONLY with this exact JSON, no markdown, no extra text:
{"headline":"short punchy headline max 8 words","body":"3-4 sentence insight","strength":"one skill doing well","improvement":"one area to work on","action":"one concrete next step"}`;

  try {
    const text = await chat(prompt);
    const parsed = parseJSON(text);
    return parsed || fallbackInsight();
  } catch (error) {
    console.error('Groq insight error:', error.message);
    return fallbackInsight();
  }
};

const fallbackInsight = () => ({
  headline: 'Keep going, you are making progress!',
  body: 'You are on the right track. Keep studying consistently and you will see results soon.',
  strength: 'Consistency in showing up',
  improvement: 'Try to complete more topics this week',
  action: 'Pick one topic and finish it today',
});

// ── 3. Explain topic ──────────────────────────────────────────
const explainTopic = async ({ topicTitle, userLevel, preferredLanguage }) => {
  const prompt = `Explain "${topicTitle}" to a ${userLevel} developer preparing for technical interviews.
Use ${preferredLanguage} for code examples.
Keep it concise: concept → why it matters in interviews → 1 quick example.
Plain text only, no markdown headers.`;

  try {
    return await chat(prompt);
  } catch (error) {
    console.error('Groq explain error:', error.message);
    return 'Could not load explanation. Please try again.';
  }
};

// ── 4. Mock interview evaluation ──────────────────────────────
const evaluateMockAnswer = async ({ question, userAnswer, questionType }) => {
  const prompt = `You are a strict but fair technical interviewer.

QUESTION TYPE: ${questionType}
QUESTION: ${question}
CANDIDATE ANSWER: ${userAnswer}

Evaluate the answer and respond with ONLY a valid JSON object. No markdown, no backticks, no extra text before or after.
Use double quotes for all strings. Do not use apostrophes inside strings.

{"score":7,"feedback":"Your feedback here without any apostrophes or special characters","keyPoints":["point one","point two","point three"]}`;

  try {
    const text = await chat(prompt, true);
    const parsed = parseJSON(text);
    return parsed || { score: 0, feedback: 'Could not evaluate. Please try again.', keyPoints: [] };
  } catch (error) {
    console.error('Groq mock eval error:', error.message);
    return { score: 0, feedback: 'Evaluation failed. Please try again.', keyPoints: [] };
  }
};

module.exports = {
  getNextTopicRecommendations,
  generateWeeklyInsight,
  explainTopic,
  evaluateMockAnswer,
};