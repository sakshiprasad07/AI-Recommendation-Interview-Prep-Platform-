const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

const chat = async (prompt) => {
  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3, // low temperature for consistent code review
    response_format: { type: 'json_object' },
    reasoning_format: 'hidden',
  });
  return res.choices[0]?.message?.content || '';
};

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

// ── Review submitted code against a problem ────────────────────
const reviewCode = async ({ problemTitle, problemBody, userCode, language }) => {
  const prompt = `You are an expert technical interviewer reviewing a candidate's code submission.

PROBLEM: ${problemTitle}
${problemBody}

LANGUAGE: ${language}

CANDIDATE'S CODE:
\`\`\`${language}
${userCode}
\`\`\`

Analyze this code carefully. Check for:
1. Correctness — does it solve the problem?
2. Edge cases — does it handle them?
3. Time/space complexity
4. Code quality and readability

Respond ONLY with this exact JSON, no markdown, no apostrophes in strings:
{
  "isCorrect": true,
  "score": 8,
  "feedback": "2-3 sentence overall assessment without apostrophes",
  "timeComplexity": "O(n) explanation",
  "spaceComplexity": "O(1) explanation",
  "issues": ["issue 1 if any", "issue 2 if any"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "edgeCasesHandled": true
}`;

  try {
    const text = await chat(prompt);
    const parsed = parseJSON(text);
    return parsed || fallbackReview();
  } catch (error) {
    console.error('Code review error:', error.message);
    return fallbackReview();
  }
};

const fallbackReview = () => ({
  isCorrect: false,
  score: 0,
  feedback: 'Could not analyze your code. Please try again.',
  timeComplexity: 'N/A',
  spaceComplexity: 'N/A',
  issues: [],
  suggestions: [],
  edgeCasesHandled: false,
});

module.exports = { reviewCode };