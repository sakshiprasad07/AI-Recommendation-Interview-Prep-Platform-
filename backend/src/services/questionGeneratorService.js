const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

const chat = async (prompt) => {
  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8, // thoda zyada randomness for variety
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

// ── Generate MCQ questions for a topic ─────────────────────────
const generateMCQQuestions = async (topicTitle, category, tags, count = 5) => {
  const prompt = `You are an expert interview question setter.

Generate ${count} unique multiple-choice questions about "${topicTitle}" for technical interview preparation.

Category: ${category}
Tags: ${tags?.join(', ')}

Respond ONLY with this exact JSON structure:
{
  "questions": [
    {
      "title": "Short question title (max 8 words)",
      "body": "Full question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctOption": 0,
      "explanation": "Why this answer is correct, 2-3 sentences",
      "difficulty": "easy"
    }
  ]
}

Rules:
- difficulty must be exactly: "easy", "medium", or "hard"
- Mix difficulties across the ${count} questions
- Make questions genuinely test understanding, not just memorization
- Each question must have exactly 4 options
- correctOption is the 0-indexed position of correct answer
- No duplicate questions`;

  const text = await chat(prompt);
  const parsed = parseJSON(text);
  return parsed?.questions || [];
};

// ── Generate coding questions for a topic ──────────────────────
const generateCodingQuestions = async (topicTitle, tags, count = 3) => {
  const prompt = `You are an expert technical interviewer creating coding problems.

Generate ${count} unique coding interview questions about "${topicTitle}".

Tags: ${tags?.join(', ')}

Respond ONLY with this exact JSON structure:
{
  "questions": [
    {
      "title": "Problem title (like LeetCode style)",
      "body": "Full problem statement with examples and constraints",
      "hints": ["hint 1", "hint 2"],
      "explanation": "Brief solution approach explanation",
      "difficulty": "medium"
    }
  ]
}

Rules:
- difficulty must be exactly: "easy", "medium", or "hard"
- Include 1-2 examples with input/output in the body
- Mix difficulties across the ${count} questions
- Make these realistic interview questions, similar in style to LeetCode/HackerRank`;

  const text = await chat(prompt);
  const parsed = parseJSON(text);
  return parsed?.questions || [];
};



module.exports = { generateMCQQuestions, generateCodingQuestions};