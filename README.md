# PrepAI — AI-Powered Interview Prep Platform

PrepAI is a full-stack interview preparation platform that generates personalized courses, practice questions, and mock interviews using AI — tailored to a user's tech domain (Software Dev, AI/ML, Data Science, Cybersecurity, DevOps, or Mobile).

Built as a portfolio project to demonstrate end-to-end AI product engineering: from a domain-aware content pipeline to real-time mock interviews.

---

## ✨ Features

- **Domain-aware onboarding** — users pick their target domain, skill level, goals, and target companies during onboarding. Courses, practice questions, assignments, and recommendations are all filtered around this.
- **AI-generated curriculum** — new courses don't need topics/questions hand-written. Given just a title + description, AI drafts a full topic list, then generates rich explanations, code examples, and common mistakes for each topic.
- **CV/JD analysis** — upload a CV and a job description; the platform semantically matches skills (e.g. "Oracle DBA" ≈ "PostgreSQL DBA") and generates a personalized prep plan.
- **Practice questions** — MCQ, coding, and short-answer questions per topic, with a Monaco-powered code editor and AI code review.
- **Tiered assignments** — Foundations → Core → Advanced → Mixed assignments auto-generated per course.
- **AI mock interviews** — real-time interview simulation using the Web Speech API, with AI-evaluated answers.
- **"For You" recommendations** — an AI coach suggests what to study next based on completed topics, weak areas, and domain, with a nudge to schedule a mock interview if it's been a while.
- **RAG-backed context** — recommendations and content generation pull live data from the GitHub API, Wikipedia REST API, DEV.to API, and an unofficial LeetCode API.
- **Gamification** — XP, streaks, and progress tracking.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS v4, React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| AI | Groq API (LLaMA 3.3 70B) |
| Auth | JWT (access + refresh tokens) |
| Code editor | Monaco Editor |
| Voice | Web Speech API (mock interviews) |
| File parsing | Multer, pdf-parse |

> **Note:** The AI provider is Groq, not Google Gemini — an earlier version used Gemini, but it was swapped out due to quota limits. The service file is still named `geminiService.js` and the API key env var is still `GEMINI_API_KEY` for historical reasons; both actually talk to Groq.

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, etc.
│   │   ├── controllers/      # Route handlers (courses, questions, recommendations, plans...)
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/           # Mongoose schemas (User, Course, Topic, Question, Assignment...)
│   │   ├── routes/           # Express routers
│   │   └── services/         # AI services, RAG pipeline, question/topic generation
│   └── scripts/              # Seeding & content-generation scripts (see below)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/          # Login, Register, Onboarding
        │   ├── courses/       # Course listing, detail, topic pages
        │   └── dashboard/     # Dashboard, Practice, Assignments, Mock Interview, For You, Profile
        ├── api/               # Axios wrappers per resource
        └── context/           # Auth context
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local instance or Atlas)
- A [Groq API key](https://console.groq.com)

### 1. Clone and install
```bash
git clone <repo-url>
cd "AI Recommendation Interview prep platform"

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/interview_prep
CLIENT_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

GEMINI_API_KEY=your_groq_api_key   # yes, really a Groq key — see note above
GITHUB_TOKEN=your_github_token      # used by the RAG pipeline
```

### 3. Seed the database
```bash
cd backend
node scripts/seed.js              # base courses (DSA, System Design, JS, SQL, OOP) + core content
```

### 4. Run it
```bash
# backend
cd backend && npm run dev

# frontend (separate terminal)
cd frontend && npm run dev
```
Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## 🌱 Content Pipeline Scripts

New domain courses don't require hand-written topics or questions — the pipeline is fully AI-driven:

```bash
# 1. Given a course (title, description, domain), AI drafts 5-8 topics
#    and generates rich content for each one
node scripts/generateTopicsForCourse.js <course-slug>
node scripts/generateTopicsForCourse.js all      # runs for every course with 0 topics

# 2. AI generates MCQ/coding questions per topic (skips topics that already have questions)
node scripts/seedQuestions.js

# 3. Builds tiered assignments (Foundations/Core/Advanced/Mixed) per course
node scripts/seedAssignments.js
```

> **Groq free-tier note:** The `llama-3.3-70b-versatile` free tier has a 100K tokens/day cap. Generating content for many new courses in one sitting can hit this — the scripts are idempotent (they skip already-generated content), so simply re-run them after the daily reset (~midnight UTC).

---

## 🗺️ Roadmap

- **Admin CMS panel** — a UI to add/manage courses without touching seed scripts directly.
- **Human-in-the-loop content review** — AI-drafted topics/questions go into a pending state for approval before publishing.

---

## 🧠 Design Notes

- **Domain vs. category:** Courses have both a `category` (content type: `dsa`, `system-design`, `language`) used for question generation, and `targetDomains` (which roles the course serves: `cybersecurity`, `ai-ml`, etc.) used for filtering what users see. Keeping these separate avoids forcing domain-specific courses into a misleading category.
- **Hybrid content generation:** priority topics are pre-generated via seed scripts for an instant demo experience; other topics generate on-demand at first visit.
- **Scoped to technical domains** (not finance/management) — a deliberate choice, since AI evaluation quality is strongest for technical content.
