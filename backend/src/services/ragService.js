const axios = require('axios');

const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
};

// ── 1. Fetch LeetCode problems by topic tag ───────────────────
const fetchLeetcodeProblems = async (topic) => {
  try {
    // Map skill to relevant LeetCode tags
    const tagMap = {
      'python': 'python',
      'dynamic programming': 'dynamic-programming',
      'dp': 'dynamic-programming',
      'graph': 'graph',
      'tree': 'tree',
      'array': 'array',
      'string': 'string',
      'binary search': 'binary-search',
      'linked list': 'linked-list',
      'stack': 'stack',
      'queue': 'queue',
      'hash': 'hash-table',
      'recursion': 'recursion',
      'sorting': 'sorting',
      'greedy': 'greedy',
      'backtracking': 'backtracking',
      'sql': 'database',
      'database': 'database',
      'design': 'design',
      'system design': 'design',
    };

    // Find best matching tag
    const topicLower = topic.toLowerCase();
    let tag = null;
    for (const [key, value] of Object.entries(tagMap)) {
      if (topicLower.includes(key)) {
        tag = value;
        break;
      }
    }

    // Agar koi relevant tag nahi mila toh LeetCode problems skip karo
    if (!tag) {
      console.log(`No LeetCode tag found for: ${topic} — skipping`);
      return [];
    }

    const res = await axios.get(
      `https://alfa-leetcode-api.onrender.com/problems?tags=${tag}&limit=5`,
      { timeout: 8000 }
    );

    const problems = res.data?.problemsetQuestionList || [];
    return problems.slice(0, 5).map((p) => ({
      title: p.title,
      difficulty: p.difficulty,
      url: `https://leetcode.com/problems/${p.titleSlug}`,
      topicTags: p.topicTags?.map((t) => t.name) || [],
    }));
  } catch (error) {
    console.error(`LeetCode fetch error for ${topic}:`, error.message);
    return [];
  }
};

// ── 2. Fetch Wikipedia summary ────────────────────────────────
const fetchWikipediaSummary = async (topic) => {
  try {
    const searchTerm = encodeURIComponent(topic);
    const res = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${searchTerm}`,
      { timeout: 5000 }
    );
    return {
      title: res.data.title,
      content: res.data.extract?.slice(0, 800) || '',
      url: res.data.content_urls?.desktop?.page || '',
    };
  } catch {
    return null;
  }
};

// ── 3. Fetch DEV.to articles ──────────────────────────────────
const fetchDevToArticles = async (topic) => {
  try {
    const tag = topic.toLowerCase().replace(/\s+/g, '');
    const res = await axios.get(
      `https://dev.to/api/articles?tag=${tag}&per_page=3&top=1`,
      { timeout: 5000 }
    );
    return res.data.slice(0, 3).map((a) => ({
      title: a.title,
      url: a.url,
      content: a.description?.slice(0, 300) || '',
      type: 'article',
    }));
  } catch {
    return [];
  }
};

// ── 4. Fetch GitHub repos for a skill ────────────────────────
const fetchGithubResources = async (topic) => {
  try {
    const awesomeQuery = encodeURIComponent(`awesome ${topic}`);
    const awesomeRes = await axios.get(
      `https://api.github.com/search/repositories?q=${awesomeQuery}&sort=stars&per_page=2`,
      { timeout: 5000, headers: GITHUB_HEADERS }
    );

    const interviewQuery = encodeURIComponent(`${topic} interview questions`);
    const interviewRes = await axios.get(
      `https://api.github.com/search/repositories?q=${interviewQuery}&sort=stars&per_page=2`,
      { timeout: 5000, headers: GITHUB_HEADERS }
    );

    const allRepos = [
      ...(awesomeRes.data.items || []),
      ...(interviewRes.data.items || []),
    ];

    const seen = new Set();
    const filtered = allRepos
      .filter((r) => {
        if (r.stargazers_count < 50) return false;
        if (seen.has(r.full_name)) return false;
        seen.add(r.full_name);
        return true;
      })
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    return filtered.map((r) => ({
      title: r.full_name,
      url: r.html_url,
      content: r.description?.slice(0, 300) || '',
      type: 'github',
      stars: r.stargazers_count,
    }));
  } catch {
    return [];
  }
};

// ── 5. Fetch all resources for a skill ───────────────────────
const fetchResourcesForSkill = async (skill) => {
  console.log(`Fetching resources for: ${skill}`);

  const [leetcode, wikipedia, devto, github] = await Promise.allSettled([
    fetchLeetcodeProblems(skill),
    fetchWikipediaSummary(skill),
    fetchDevToArticles(skill),
    fetchGithubResources(skill),
  ]);

  return {
    skill,
    leetcodeProblems: leetcode.status === 'fulfilled' ? leetcode.value : [],
    wikipedia: wikipedia.status === 'fulfilled' ? wikipedia.value : null,
    devtoArticles: devto.status === 'fulfilled' ? devto.value : [],
    githubRepos: github.status === 'fulfilled' ? github.value : [],
  };
};

// ── 6. Fetch company + role specific questions ────────────────
const fetchCompanyRoleQuestions = async (company, role) => {
  try {
    console.log(`Fetching company/role resources for: ${company} - ${role}`);

    const roleWords = role.toLowerCase().split(' ');
    const coreRole = roleWords.slice(-2).join(' ');      // "cloud developer"
    const roleType = roleWords[roleWords.length - 1];    // "developer"
    const companyShort = company.split(' ')[0];          // "Hewlett"

      const searches = [
    `${role} interview questions`,           // "Senior Cloud Developer interview questions"
    `${coreRole} interview preparation`,     // "Cloud Developer interview preparation"  
    `${roleType} interview experience`,      // "Developer interview experience"
    `${companyShort} ${roleType} interview`, // "Hewlett Developer interview"
  ];

    const results = await Promise.all(
      searches.map(async (query) => {
        const q = encodeURIComponent(query);
        const res = await axios.get(
          `https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=2`,
          { timeout: 5000, headers: GITHUB_HEADERS }
        );
        return res.data.items || [];
      })
    );

    // DEV.to interview experience articles
    const devtoRes = await axios.get(
      `https://dev.to/api/articles?tag=interview&per_page=20`,
      { timeout: 5000 }
    ).catch(() => ({ data: [] }));

    const devtoArticles = devtoRes.data
      .filter((a) => {
        const title = a.title.toLowerCase();
        return (
          title.includes(roleType) ||
          title.includes(coreRole) ||
          title.includes(companyShort.toLowerCase()) ||
          title.includes('interview experience') ||
          title.includes('got hired')
        );
      })
      .slice(0, 3)
      .map((a) => ({
        title: a.title,
        url: a.url,
        content: a.description?.slice(0, 300) || '',
        type: 'article',
      }));

    const seen = new Set();
    const githubResults = results
      .flat()
      .filter((r) => {
        if (r.stargazers_count < 10) return false; // 100 se 30 karo
        if (seen.has(r.full_name)) return false;
        if ((r.description || '').length > 1000) return false;
        const desc = (r.description || '').toLowerCase();
        const name = r.full_name.toLowerCase();
        const relevant = ['interview', 'question', 'preparation', 'coding', 'developer', 'engineer', 'cloud', 'devops'];
        const isRelevant = relevant.some(word => 
          desc.includes(word) || name.includes(word)
        );
        if (!isRelevant) return false;
        seen.add(r.full_name);
        return true;
      })
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4)
      .map((r) => ({
        title: r.full_name,
        url: r.html_url,
        content: r.description?.slice(0, 300) || '',
        type: 'github',
        stars: r.stargazers_count,
      }));

    console.log(`Company/role resources found: ${githubResults.length + devtoArticles.length}`);

    return {
      github: githubResults,
      articles: devtoArticles,
    };
  } catch (error) {
    console.error('Company/role questions fetch error:', error.message);
    return { github: [], articles: [] };
  }
};

module.exports = {
  fetchLeetcodeProblems,
  fetchWikipediaSummary,
  fetchDevToArticles,
  fetchGithubResources,
  fetchResourcesForSkill,
  fetchCompanyRoleQuestions,
};