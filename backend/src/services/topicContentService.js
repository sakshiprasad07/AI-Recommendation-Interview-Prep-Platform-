const Groq = require('groq-sdk');
const {
  fetchWikipediaSummary,
  fetchDevToArticles,
  fetchGithubResources,
  fetchLeetcodeProblems,
} = require('./ragService');

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

// ── Generate rich content for a single topic ──────────────────
const generateTopicContent = async (topic) => {
  console.log(`Generating rich content for: ${topic.title}`);

  // Step 1: Gather RAG resources
  const [wikipedia, devtoArticles, githubRepos, leetcodeProblems] = await Promise.all([
    fetchWikipediaSummary(topic.title),
    fetchDevToArticles(topic.tags?.[0] || topic.title),
    fetchGithubResources(topic.title),
    fetchLeetcodeProblems(topic.title),
  ]);

  // Step 2: Build context for AI
  const context = `
Wikipedia: ${wikipedia?.content || 'Not available'}

DEV.to articles: ${devtoArticles.map(a => `- ${a.title}: ${a.content}`).join('\n') || 'None'}

GitHub resources: ${githubRepos.map(r => `- ${r.title}: ${r.content}`).join('\n') || 'None'}
`;

  // Step 3: Generate structured content with Groq
  const prompt = `You are an expert technical interview coach writing study material for "${topic.title}".

Topic difficulty: ${topic.difficulty}/5
Topic tags: ${topic.tags?.join(', ')}

REAL RESOURCE CONTEXT:
${context}

Write comprehensive interview prep content for this topic. Respond ONLY with valid JSON:
{
  "explanation": "A detailed 4-6 sentence explanation of the concept, written for someone preparing for technical interviews. Be specific and educational.",
  "keyConcepts": ["concept 1", "concept 2", "concept 3", "concept 4"],
  "codeExample": "A clear, well-commented code example in JavaScript demonstrating this concept. Use \\n for newlines.",
  "commonMistakes": ["mistake 1 candidates make", "mistake 2", "mistake 3"],
  "complexity": "Time and space complexity explanation for this topic, 1-2 sentences"
}

Make it genuinely useful for interview preparation — not generic.`;

  const text = await chat(prompt);
  const generated = parseJSON(text);

  if (!generated) {
    throw new Error('Failed to generate content');
  }

  return {
    explanation: generated.explanation || '',
    keyConcepts: generated.keyConcepts || [],
    codeExample: generated.codeExample || '',
    commonMistakes: generated.commonMistakes || [],
    complexity: generated.complexity || '',
    practiceProblems: leetcodeProblems.map(p => ({
      title: p.title,
      url: p.url,
      difficulty: p.difficulty,
    })),
    resources: [
      ...(wikipedia ? [{ type: 'wikipedia', title: wikipedia.title, url: wikipedia.url }] : []),
      ...devtoArticles.map(a => ({ type: 'article', title: a.title, url: a.url })),
      ...githubRepos.map(r => ({ type: 'github', title: r.title, url: r.url })),
    ],
  };
};

module.exports = { generateTopicContent };