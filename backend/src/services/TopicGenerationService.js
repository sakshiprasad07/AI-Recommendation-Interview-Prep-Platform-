const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

const chat = async (prompt) => {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    response_format: { type: 'json_object' },
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

// Turns a title into a safe, unique-ish slug
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// ── Generate a topic list for a course using AI ────────────────
// course: { title, description, category, difficulty, targetDomains }
const generateTopicsForCourse = async (course) => {
  const prompt = `You are an expert curriculum designer for a technical interview prep platform.

COURSE: "${course.title}"
DESCRIPTION: ${course.description || 'N/A'}
CATEGORY: ${course.category}
DIFFICULTY: ${course.difficulty}
TARGET DOMAINS: ${course.targetDomains?.join(', ') || 'all'}

Design 5-8 topics that comprehensively cover this course for someone preparing for technical interviews
in this domain. Order them from foundational to advanced. Respond ONLY with valid JSON:

{
  "topics": [
    {
      "title": "Topic Title",
      "tags": ["tag1", "tag2"],
      "difficulty": 1,
      "estimatedMinutes": 30,
      "xpReward": 50
    }
  ]
}

Rules:
- "difficulty" is an integer 1-5 (1=beginner, 5=expert), increasing roughly with topic order.
- "estimatedMinutes" between 20-60.
- "xpReward" between 50-150, roughly matching difficulty.
- Topics must be specific and interview-relevant, not generic filler.`;

  const text = await chat(prompt);
  const parsed = parseJSON(text);

  if (!parsed?.topics?.length) {
    throw new Error(`Failed to generate topics for course: ${course.title}`);
  }

  return parsed.topics.map((t, i) => ({
    title: t.title,
    slug: slugify(t.title),
    tags: t.tags || [],
    difficulty: t.difficulty || Math.min(5, Math.ceil((i + 1) / 2)),
    estimatedMinutes: t.estimatedMinutes || 30,
    xpReward: t.xpReward || 50,
    order: i + 1,
  }));
};

module.exports = { generateTopicsForCourse, slugify };