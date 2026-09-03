const Groq = require('groq-sdk');
const { 
  fetchResourcesForSkill, 
  fetchCompanyRoleQuestions  // ← import karo
} = require('./ragService');
//const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

const chat = async (prompt, json = false) => {
  const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });
  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    ...(json && { response_format: { type: 'json_object' } }),
    reasoning_format: 'hidden',
  });
  return res.choices[0]?.message?.content || '';
};

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
};

// ── Step 1: Extract skills from CV and JD ────────────────────
const extractSkills = async (cvText, jdText) => {
  const prompt = `You are a senior technical recruiter with 15+ years experience doing FAIR skill assessment.

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jdText}

IMPORTANT — Do SEMANTIC skill matching, not just keyword matching:

EQUIVALENCE RULES:
- Oracle DBA = PostgreSQL DBA conceptually (same role, different flavor)
- MySQL Admin = MariaDB Admin (near identical)
- AWS experience = understands cloud concepts (Azure/GCP learnable faster)
- React developer = understands component architecture (Vue/Angular learnable)
- Java 10yr = OOP mastery, design patterns, threading (language-agnostic skills)
- DBA anywhere = indexing, query optimization, transactions, backups EVERYWHERE
- "10 years Oracle" IMPLIES: indexing, DBA skills, query optimization, transactions

SCORING RULES:
- readinessScore should reflect ACTUAL readiness, not keyword match %
- A 10yr Oracle DBA applying for PostgreSQL role = 75-85% ready (not 20%)
- Consider years of experience — senior people have transferable depth

Return ONLY this JSON:
{
  "jobTitle": "exact job title from JD",
  "targetCompany": "company name or Unknown",
  "cvSkills": ["skill1", "skill2"],
  "jdSkills": ["skill1", "skill2"],
  "missingSkills": ["only GENUINELY missing skills — not conceptual equivalents"],
  "transferableSkills": [
    {
      "have": "Oracle PL/SQL",
      "maps_to": "PostgreSQL PL/pgSQL",
      "gap": "Syntax differences only — 1-2 days to learn"
    }
  ],
  "readinessScore": 78,
  "summary": "Honest 2-3 sentence assessment reflecting true readiness"
}

missingSkills should ONLY contain skills that require NEW LEARNING FROM SCRATCH.
Do NOT list skills where candidate has conceptual equivalent.`;

  const text = await chat(prompt, true);
  return parseJSON(text);
};

// ── Step 2: Generate week plan for one skill using RAG data ──
const generateWeekPlan = async (skill, weekNumber, userLevel, ragData) => {
  const resourceContext = `
Wikipedia: ${ragData.wikipedia?.content || 'Not available'}

DEV.to articles: ${ragData.devtoArticles.map(a => `- ${a.title}: ${a.content}`).join('\n') || 'None'}

GitHub resources: ${ragData.githubRepos.map(r => `- ${r.title}: ${r.content}`).join('\n') || 'None'}

Available LeetCode problems: ${ragData.leetcodeProblems.map(p => `- ${p.title} (${p.difficulty})`).join('\n') || 'None'}
`;

  const prompt = `You are an expert interview coach creating a personalized study plan.

SKILL TO TEACH: ${skill}
WEEK NUMBER: ${weekNumber}
USER LEVEL: ${userLevel}

REAL RESOURCE CONTEXT (use this to ground your content):
${resourceContext}

Create a detailed week plan. Return ONLY this JSON:
{
  "week": ${weekNumber},
  "title": "Week ${weekNumber}: ${skill} Mastery",
  "focus": "${skill}",
  "topics": [
    {
      "title": "Topic name",
      "explanation": "Clear 3-4 sentence explanation grounded in the resources above",
      "estimatedHours": 2
    }
  ],
  "quiz": [
    {
      "question": "Specific question about ${skill}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Another question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 1,
      "explanation": "Why this is correct"
    },
    {
      "question": "Third question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 2,
      "explanation": "Why this is correct"
    }
  ],
  "assignment": {
    "title": "Hands-on assignment title",
    "description": "Detailed assignment description specific to ${skill}",
    "hints": ["Hint 1", "Hint 2", "Hint 3"]
  }
}

Make content SPECIFIC to ${skill} — not generic. Use the resource context to add real depth.`;

  const text = await chat(prompt, true);
  const plan = parseJSON(text);
  if (plan) {
    plan.leetcodeProblems = ragData.leetcodeProblems;
  }
  return plan;
};

// ── Main: Generate full custom plan ──────────────────────────
const generateCustomPlan = async (cvText, jdText, userLevel = 'beginner') => {
  console.log('Step 1: Extracting skills...');
  const skillData = await extractSkills(cvText, jdText);

  if (!skillData || !skillData.missingSkills?.length) {
    throw new Error('Could not extract skills from CV/JD');
  }

  console.log('Missing skills found:', skillData.missingSkills);

  // Limit to top 4 missing skills to avoid rate limits
  const topSkills = skillData.missingSkills.slice(0, 4);

  console.log('Step 2: Fetching RAG resources for each skill...');
  const ragResults = await Promise.all(
    topSkills.map((skill) => fetchResourcesForSkill(skill))
  );

  console.log('Step 2b: Fetching company + role specific questions...');
const companyRoleData = await fetchCompanyRoleQuestions(
  skillData.targetCompany,
  skillData.jobTitle
);
console.log('Company/role resources found:', 
  companyRoleData.github.length + companyRoleData.articles.length);

  console.log('Step 3: Generating week-by-week plan...');
  const weeklyPlan = [];

  for (let i = 0; i < topSkills.length; i++) {
    const skill = topSkills[i];
    const ragData = ragResults[i];
    console.log(`Generating week ${i + 1} for: ${skill}`);

    try {
      const weekPlan = await generateWeekPlan(skill, i + 1, userLevel, ragData);
      if (weekPlan) {
        // Add RAG resources to topics
        if (weekPlan.topics) {
          weekPlan.topics = weekPlan.topics.map((topic) => {
            // Destructure out resources so it never bleeds through
            const { resources, ...topicWithoutResources } = topic;

            return {
              ...topicWithoutResources,
              resources: [
                ...(ragData.wikipedia
                  ? [{
                      type: 'wikipedia',
                      title: ragData.wikipedia.title,
                      url: ragData.wikipedia.url,
                      content: ragData.wikipedia.content?.slice(0, 200),
                    }]
                  : []),
                ...ragData.devtoArticles.map((a) => ({
                  type: 'article',
                  title: a.title,
                  url: a.url,
                  content: a.content,
                })),
                ...ragData.githubRepos.map((r) => ({
                  type: 'github',
                  title: r.title,
                  url: r.url,
                  content: r.content,
                })),
              ],
            };
          });
        }

        weeklyPlan.push(weekPlan);
      }
    } catch (err) {
      console.error(`Error generating week ${i + 1}:`, err.message);
    }

    // Small delay to avoid rate limiting
    if (i < topSkills.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return {
  ...skillData,
  weeklyPlan,
  totalWeeks: weeklyPlan.length,
  companyRoleResources: companyRoleData, // ← add karo
};
};
module.exports = { generateCustomPlan, extractSkills };