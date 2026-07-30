require('dotenv').config();
const mongoose = require('mongoose');
const { Course, Topic } = require('../src/models/Courses');
const Question = require('../src/models/Questions');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Course.deleteMany({});
  await Topic.deleteMany({});
  await Question.deleteMany({});
  console.log('Cleared existing data');

  // ── COURSES ──────────────────────────────────────────────────
  const courses = await Course.insertMany([
  { 
    title: 'Data Structures & Algorithms', 
    slug: 'dsa', 
    category: 'dsa', 
    difficulty: 'beginner', 
    description: 'Master DSA from scratch — arrays to graphs.', 
    estimatedHours: 40, 
    order: 1,
    targetDomains: ['software-dev', 'ai-ml', 'data-science'],
  },
  { 
    title: 'System Design', 
    slug: 'system-design', 
    category: 'system-design', 
    difficulty: 'intermediate', 
    description: 'Design scalable systems like a senior engineer.', 
    estimatedHours: 20, 
    order: 2,
    targetDomains: ['software-dev', 'devops'],
  },
  { 
    title: 'JavaScript Deep Dive', 
    slug: 'javascript', 
    category: 'language', 
    difficulty: 'intermediate', 
    description: 'Closures, async, prototypes, event loop.', 
    estimatedHours: 15, 
    order: 4,
    targetDomains: ['software-dev'],
  },
  { 
    title: 'SQL & Databases', 
    slug: 'sql', 
    category: 'language', 
    difficulty: 'intermediate', 
    description: 'Master SQL queries, joins, and database design for interviews.', 
    estimatedHours: 15, 
    order: 5,
    targetDomains: ['software-dev', 'data-science', 'ai-ml', 'devops'],
  },
  { 
    title: 'OOP & Low Level Design', 
    slug: 'oop-lld', 
    category: 'system-design', 
    difficulty: 'intermediate', 
    description: 'Object-oriented design principles and low-level system design.', 
    estimatedHours: 12, 
    order: 6,
    targetDomains: ['software-dev', 'ai-ml'],
  },
  // ── NEW DOMAIN-SPECIFIC COURSES ──────────────────────────────
  {
    title: 'Machine Learning Fundamentals',
    slug: 'ml-fundamentals',
    category: 'dsa',
    difficulty: 'intermediate',
    description: 'Core ML concepts, algorithms, and interview preparation for AI/ML roles.',
    estimatedHours: 20,
    order: 7,
    targetDomains: ['ai-ml', 'data-science'],
  },
  {
    title: 'Python for Data Science',
    slug: 'python-ds',
    category: 'language',
    difficulty: 'beginner',
    description: 'NumPy, Pandas, Matplotlib — essential Python libraries for data roles.',
    estimatedHours: 15,
    order: 8,
    targetDomains: ['data-science', 'ai-ml'],
  },
  {
    title: 'Statistics & Probability',
    slug: 'statistics',
    category: 'dsa',
    difficulty: 'intermediate',
    description: 'Core statistics concepts tested in data science and AI/ML interviews.',
    estimatedHours: 12,
    order: 9,
    targetDomains: ['data-science', 'ai-ml'],
  },
  {
    title: 'Docker & Kubernetes',
    slug: 'docker-k8s',
    category: 'system-design',
    difficulty: 'intermediate',
    description: 'Containerization, orchestration, and deployment — essential for DevOps.',
    estimatedHours: 18,
    order: 10,
    targetDomains: ['devops'],
  },
  {
    title: 'CI/CD & DevOps Practices',
    slug: 'cicd-devops',
    category: 'system-design',
    difficulty: 'intermediate',
    description: 'Jenkins, GitHub Actions, deployment pipelines, and DevOps culture.',
    estimatedHours: 15,
    order: 11,
    targetDomains: ['devops'],
  },
  {
    title: 'Network Security Fundamentals',
    slug: 'network-security',
    category: 'system-design',
    difficulty: 'beginner',
    description: 'Network protocols, security concepts, and threat analysis for cybersecurity roles.',
    estimatedHours: 20,
    order: 12,
    targetDomains: ['cybersecurity'],
  },
  {
    title: 'Ethical Hacking & Penetration Testing',
    slug: 'ethical-hacking',
    category: 'system-design',
    difficulty: 'advanced',
    description: 'Penetration testing concepts, tools, and methodologies for security interviews.',
    estimatedHours: 25,
    order: 13,
    targetDomains: ['cybersecurity'],
  },
  {
    title: 'React Native & Mobile Development',
    slug: 'react-native',
    category: 'language',
    difficulty: 'intermediate',
    description: 'Cross-platform mobile development concepts for mobile developer interviews.',
    estimatedHours: 18,
    order: 14,
    targetDomains: ['mobile'],
  },
  {
    title: 'Cloud Platforms (AWS/Azure/GCP)',
    slug: 'cloud-platforms',
    category: 'system-design',
    difficulty: 'intermediate',
    description: 'Core cloud concepts, services, and architecture for cloud and DevOps roles.',
    estimatedHours: 20,
    order: 15,
    targetDomains: ['devops', 'software-dev', 'ai-ml'],
  },
]);

  const [dsa, sd, js, sql, oop] = courses;
  console.log(`✅ ${courses.length} courses seeded`);

  // ── DSA TOPICS ────────────────────────────────────────────────
  const dsaTopics = await Topic.insertMany([
    {
      title: 'Arrays & Hashing',
      slug: 'arrays-hashing',
      course: dsa._id,
      order: 1,
      difficulty: 1,
      tags: ['arrays', 'hashmap'],
      estimatedMinutes: 30,
      xpReward: 50,
      content: 'Arrays are the most fundamental data structure. Hashing allows O(1) lookups.',
    },
    {
      title: 'Two Pointers',
      slug: 'two-pointers',
      course: dsa._id,
      order: 2,
      difficulty: 1,
      tags: ['arrays', 'two-pointer'],
      estimatedMinutes: 25,
      xpReward: 50,
      content: 'Two pointers technique uses two indices to traverse an array efficiently.',
    },
    {
      title: 'Sliding Window',
      slug: 'sliding-window',
      course: dsa._id,
      order: 3,
      difficulty: 2,
      tags: ['arrays', 'sliding-window'],
      estimatedMinutes: 30,
      xpReward: 75,
      content: 'Sliding window maintains a subset of elements as a window that slides over data.',
    },
    {
      title: 'Stack',
      slug: 'stack',
      course: dsa._id,
      order: 4,
      difficulty: 2,
      tags: ['stack'],
      estimatedMinutes: 20,
      xpReward: 75,
      content: 'Stack is a LIFO data structure. Used for parsing, backtracking, and more.',
    },
    {
      title: 'Binary Search',
      slug: 'binary-search',
      course: dsa._id,
      order: 5,
      difficulty: 2,
      tags: ['binary-search', 'arrays'],
      estimatedMinutes: 25,
      xpReward: 75,
      content: 'Binary search finds elements in O(log n) time in a sorted array.',
    },
    {
      title: 'Linked Lists',
      slug: 'linked-lists',
      course: dsa._id,
      order: 6,
      difficulty: 2,
      tags: ['linked-list'],
      estimatedMinutes: 35,
      xpReward: 100,
      content: 'Linked lists are nodes connected by pointers. No random access but efficient inserts.',
    },
    {
      title: 'Trees & BST',
      slug: 'trees-bst',
      course: dsa._id,
      order: 7,
      difficulty: 3,
      tags: ['tree', 'bst', 'recursion'],
      estimatedMinutes: 45,
      xpReward: 100,
      content: 'Trees are hierarchical structures. BST maintains sorted order for O(log n) ops.',
    },
    {
      title: 'Graphs & BFS/DFS',
      slug: 'graphs',
      course: dsa._id,
      order: 8,
      difficulty: 3,
      tags: ['graph', 'bfs', 'dfs'],
      estimatedMinutes: 50,
      xpReward: 125,
      content: 'Graphs model relationships. BFS uses a queue, DFS uses a stack or recursion.',
    },
    {
      title: 'Dynamic Programming',
      slug: 'dynamic-programming',
      course: dsa._id,
      order: 9,
      difficulty: 5,
      tags: ['dp', 'recursion', 'memoization'],
      estimatedMinutes: 60,
      xpReward: 150,
      content: 'DP breaks problems into subproblems and stores results to avoid recomputation.',
    },
    {
      title: 'Heaps & Priority Queue',
      slug: 'heaps',
      course: dsa._id,
      order: 10,
      difficulty: 3,
      tags: ['heap', 'priority-queue'],
      estimatedMinutes: 30,
      xpReward: 100,
      content: 'Heaps are complete binary trees. Min-heap gives smallest element in O(1).',
    },
  ]);

  // ── SYSTEM DESIGN TOPICS ──────────────────────────────────────
  await Topic.insertMany([
    {
      title: 'Scalability Basics',
      slug: 'scalability-basics',
      course: sd._id,
      order: 1,
      difficulty: 2,
      tags: ['scalability', 'load-balancing'],
      estimatedMinutes: 30,
      xpReward: 75,
      content: 'Scalability is the ability to handle growing load. Vertical vs horizontal scaling.',
    },
    {
      title: 'Databases: SQL vs NoSQL',
      slug: 'sql-vs-nosql',
      course: sd._id,
      order: 2,
      difficulty: 2,
      tags: ['database', 'sql', 'nosql'],
      estimatedMinutes: 35,
      xpReward: 75,
      content: 'SQL is relational and ACID-compliant. NoSQL is flexible and horizontally scalable.',
    },
    {
      title: 'Caching Strategies',
      slug: 'caching',
      course: sd._id,
      order: 3,
      difficulty: 3,
      tags: ['cache', 'redis', 'cdn'],
      estimatedMinutes: 30,
      xpReward: 100,
      content: 'Caching stores frequently accessed data in fast storage like Redis or CDN.',
    },
    {
      title: 'Message Queues',
      slug: 'message-queues',
      course: sd._id,
      order: 4,
      difficulty: 3,
      tags: ['kafka', 'rabbitmq', 'async'],
      estimatedMinutes: 25,
      xpReward: 100,
      content: 'Message queues decouple services and enable async communication.',
    },
    {
      title: 'Design: URL Shortener',
      slug: 'design-url-shortener',
      course: sd._id,
      order: 5,
      difficulty: 4,
      tags: ['system-design', 'case-study'],
      estimatedMinutes: 45,
      xpReward: 150,
      content: 'Classic system design problem covering hashing, databases, and scaling.',
    },
  ]);

  // ── JAVASCRIPT TOPICS ─────────────────────────────────────────
  await Topic.insertMany([
    {
      title: 'Closures & Scope',
      slug: 'closures-scope',
      course: js._id,
      order: 1,
      difficulty: 2,
      tags: ['javascript', 'closures', 'scope'],
      estimatedMinutes: 25,
      xpReward: 75,
      content: 'A closure gives access to outer scope from inner function even after outer returns.',
    },
    {
      title: 'Event Loop & Async',
      slug: 'event-loop-async',
      course: js._id,
      order: 2,
      difficulty: 3,
      tags: ['javascript', 'async', 'event-loop', 'promises'],
      estimatedMinutes: 35,
      xpReward: 100,
      content: 'JS is single-threaded. The event loop handles async via call stack + task queue.',
    },
    {
      title: 'Prototypes & Classes',
      slug: 'prototypes-classes',
      course: js._id,
      order: 3,
      difficulty: 3,
      tags: ['javascript', 'prototypes', 'oop'],
      estimatedMinutes: 30,
      xpReward: 100,
      content: 'JS uses prototypal inheritance. Classes are syntactic sugar over prototypes.',
    },
  ]);

  console.log('✅ Topics seeded');

  // ── QUESTIONS ─────────────────────────────────────────────────
  await Question.insertMany([
    {
      title: 'Two Sum',
      slug: 'two-sum',
      body: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target.',
      type: 'coding',
      category: 'dsa',
      topic: dsaTopics[0]._id,
      tags: ['arrays', 'hashmap'],
      difficulty: 'easy',
      company: ['Google', 'Amazon', 'Meta'],
      hints: [
        'Try using a hashmap to store seen values',
        'For each number, check if (target - number) exists in the map',
      ],
      explanation: 'Use a hashmap to store each number and its index. For each element, check if the complement exists.',
      xpReward: 15,
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      body: 'Given a string containing just (, ), {, }, [ and ], determine if the input string is valid.',
      type: 'coding',
      category: 'dsa',
      topic: dsaTopics[3]._id,
      tags: ['stack'],
      difficulty: 'easy',
      company: ['Amazon', 'Microsoft'],
      hints: ['Use a stack to track opening brackets'],
      explanation: 'Push opening brackets onto a stack. When you hit a closing bracket, pop and check if it matches.',
      xpReward: 15,
    },
    {
      title: 'Binary Search',
      slug: 'binary-search-q',
      body: 'Given a sorted array of integers and a target value, return the index if found, else -1.',
      type: 'coding',
      category: 'dsa',
      topic: dsaTopics[4]._id,
      tags: ['binary-search'],
      difficulty: 'easy',
      company: ['Google', 'Apple'],
      hints: [
        'Keep track of left and right pointers',
        'Check the midpoint and halve the search space',
      ],
      explanation: 'Maintain left/right pointers. Mid = (left + right) / 2. If arr[mid] === target return mid, else halve.',
      xpReward: 15,
    },
    {
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      body: 'Given an integer array, find the contiguous subarray with the largest sum and return its sum.',
      type: 'coding',
      category: 'dsa',
      topic: dsaTopics[0]._id,
      tags: ['arrays', 'dp'],
      difficulty: 'medium',
      company: ['Google', 'Amazon', 'Microsoft'],
      hints: [
        "Use Kadane's algorithm",
        'Track current sum and reset to 0 if it goes negative',
      ],
      explanation: "Kadane's algorithm: keep a running sum, reset when negative, track the max seen so far.",
      xpReward: 20,
    },
    {
      title: 'What is a load balancer?',
      slug: 'load-balancer-mcq',
      body: 'Which of the following best describes the primary purpose of a load balancer?',
      type: 'mcq',
      category: 'system-design',
      tags: ['scalability', 'load-balancing'],
      difficulty: 'easy',
      options: [
        'To store data across multiple databases',
        'To distribute incoming traffic across multiple servers',
        'To encrypt data in transit',
        'To compress static assets',
      ],
      correctOption: 1,
      explanation: 'A load balancer distributes incoming requests across multiple servers so no single server is overwhelmed.',
      xpReward: 10,
    },
    {
      title: 'SQL vs NoSQL',
      slug: 'sql-vs-nosql-mcq',
      body: 'Which database type is best suited for highly flexible, unstructured data at massive scale?',
      type: 'mcq',
      category: 'system-design',
      tags: ['database', 'sql', 'nosql'],
      difficulty: 'easy',
      options: [
        'Relational SQL database',
        'NoSQL database',
        'In-memory cache',
        'File storage',
      ],
      correctOption: 1,
      explanation: 'NoSQL databases like MongoDB are schema-flexible and horizontally scalable for unstructured data.',
      xpReward: 10,
    },
    {
      title: 'What is a closure in JavaScript?',
      slug: 'js-closure',
      body: 'Explain what a closure is in JavaScript and provide a practical example of its use.',
      type: 'short_answer',
      category: 'language',
      tags: ['javascript', 'closures'],
      difficulty: 'medium',
      company: ['Google', 'Meta', 'Airbnb'],
      explanation: 'A closure is a function that retains access to its outer scope even after the outer function returns.',
      xpReward: 20,
    },
    {
      title: 'Event Loop explanation',
      slug: 'js-event-loop',
      body: 'What is the JavaScript event loop and how does it handle asynchronous operations?',
      type: 'short_answer',
      category: 'language',
      tags: ['javascript', 'async', 'event-loop'],
      difficulty: 'medium',
      company: ['Netflix', 'Uber'],
      explanation: 'The event loop processes the call stack first, then picks tasks from the callback/task queue.',
      xpReward: 20,
    },
  ]);

  // ── SQL Topics ───────────────────────────────────────────────
const sqlTopics = await Topic.insertMany([
  { title: 'SQL Basics & Queries', slug: 'sql-basics', course: sql._id, order: 1, difficulty: 1, tags: ['sql', 'select', 'where'], estimatedMinutes: 30, xpReward: 50 },
  { title: 'Joins (Inner, Outer, Self)', slug: 'sql-joins', course: sql._id, order: 2, difficulty: 2, tags: ['sql', 'joins'], estimatedMinutes: 35, xpReward: 75 },
  { title: 'Aggregate Functions & GROUP BY', slug: 'sql-aggregates', course: sql._id, order: 3, difficulty: 2, tags: ['sql', 'group-by', 'aggregate'], estimatedMinutes: 30, xpReward: 75 },
  { title: 'Subqueries & CTEs', slug: 'sql-subqueries', course: sql._id, order: 4, difficulty: 3, tags: ['sql', 'subquery', 'cte'], estimatedMinutes: 35, xpReward: 100 },
  { title: 'Indexing & Query Optimization', slug: 'sql-indexing', course: sql._id, order: 5, difficulty: 4, tags: ['sql', 'indexing', 'performance'], estimatedMinutes: 40, xpReward: 125 },
  { title: 'Normalization & Database Design', slug: 'sql-normalization', course: sql._id, order: 6, difficulty: 3, tags: ['sql', 'normalization', 'database-design'], estimatedMinutes: 35, xpReward: 100 },
]);

// ── OOP & LLD Topics ──────────────────────────────────────────
const oopTopics = await Topic.insertMany([
  { title: 'OOP Fundamentals (Encapsulation, Inheritance)', slug: 'oop-fundamentals', course: oop._id, order: 1, difficulty: 1, tags: ['oop', 'inheritance', 'encapsulation'], estimatedMinutes: 30, xpReward: 50 },
  { title: 'Polymorphism & Abstraction', slug: 'oop-polymorphism', course: oop._id, order: 2, difficulty: 2, tags: ['oop', 'polymorphism', 'abstraction'], estimatedMinutes: 30, xpReward: 75 },
  { title: 'SOLID Principles', slug: 'solid-principles', course: oop._id, order: 3, difficulty: 3, tags: ['oop', 'solid', 'design-principles'], estimatedMinutes: 40, xpReward: 100 },
  { title: 'Design Patterns (Singleton, Factory, Observer)', slug: 'design-patterns', course: oop._id, order: 4, difficulty: 4, tags: ['oop', 'design-patterns'], estimatedMinutes: 45, xpReward: 125 },
  { title: 'LLD: Design a Parking Lot', slug: 'lld-parking-lot', course: oop._id, order: 5, difficulty: 4, tags: ['lld', 'system-design', 'case-study'], estimatedMinutes: 50, xpReward: 150 },
]);

  console.log('✅ Questions seeded');

  // Update course topic counts
  await Course.findByIdAndUpdate(dsa._id, { totalTopics: 10 });
  await Course.findByIdAndUpdate(sd._id, { totalTopics: 5 });
  await Course.findByIdAndUpdate(js._id, { totalTopics: 3 });
  await Course.findByIdAndUpdate(sql._id, { totalTopics: 6 });
  await Course.findByIdAndUpdate(oop._id, { totalTopics: 5 });

  console.log('✅ Seed complete!');
  console.log('   Courses: 5');
  console.log('   Topics: 23');
  console.log('   Questions: 8');

  // ── ASSIGNMENTS ───────────────────────────────────────────────
const { Assignment } = require('../src/models/Assignment');

await Assignment.deleteMany({});

await Assignment.insertMany([
  {
    title: 'DSA Basics Assignment',
    description: 'Test your knowledge of arrays, hashing and two pointers',
    difficulty: 'easy',
    xpReward: 100,
    questions: [
      dsaTopics[0]._id && await Question.findOne({ slug: 'two-sum' }).then(q => q?._id),
      await Question.findOne({ slug: 'binary-search-q' }).then(q => q?._id),
    ].filter(Boolean),
  },
  {
    title: 'System Design Fundamentals',
    description: 'Test your understanding of system design concepts',
    difficulty: 'medium',
    xpReward: 150,
    questions: [
      await Question.findOne({ slug: 'load-balancer-mcq' }).then(q => q?._id),
      await Question.findOne({ slug: 'sql-vs-nosql-mcq' }).then(q => q?._id),
    ].filter(Boolean),
  },
  {
    title: 'JavaScript Concepts',
    description: 'Test your JS knowledge — closures, event loop',
    difficulty: 'medium',
    xpReward: 130,
    questions: [
      await Question.findOne({ slug: 'js-closure' }).then(q => q?._id),
      await Question.findOne({ slug: 'js-event-loop' }).then(q => q?._id),
    ].filter(Boolean),
  },
]);

console.log('✅ Assignments seeded');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});