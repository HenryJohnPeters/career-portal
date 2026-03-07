import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed dev users (no passwords — auth handled by Supabase)
  const premiumUser = await prisma.user.upsert({
    where: { email: "premium@careerportal.dev" },
    update: { isPremium: true },
    create: {
      email: "premium@careerportal.dev",
      name: "Premium User",
      isPremium: true,
    },
  });
  console.log("Seeded premium user:", premiumUser.email);

  const freeUser = await prisma.user.upsert({
    where: { email: "free@careerportal.dev" },
    update: { isPremium: false },
    create: {
      email: "free@careerportal.dev",
      name: "Free User",
      isPremium: false,
    },
  });
  console.log("Seeded free user:", freeUser.email);

  const user = await prisma.user.upsert({
    where: { email: "admin@careerportal.dev" },
    update: { isPremium: true },
    create: {
      email: "admin@careerportal.dev",
      name: "Dev Admin",
      isPremium: true,
    },
  });
  console.log("Seeded admin user:", user.email);

  // Seed questions
  const questions = [
    {
      text: "Tell me about yourself.",
      type: QuestionType.TEXT,
      category: "Behavioral",
    },
    {
      text: "What is your greatest strength?",
      type: QuestionType.TEXT,
      category: "Behavioral",
    },
    {
      text: "Describe a challenging project you worked on.",
      type: QuestionType.TEXT,
      category: "Behavioral",
    },
    {
      text: "Where do you see yourself in 5 years?",
      type: QuestionType.TEXT,
      category: "Career Goals",
    },
    {
      text: "Why do you want to work at this company?",
      type: QuestionType.TEXT,
      category: "Career Goals",
    },
    {
      text: "Which of the following is NOT a JavaScript data type?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: "Technical",
      options: ["String", "Boolean", "Float", "Undefined"],
      correctIndex: 2,
    },
    {
      text: "What does REST stand for?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: "Technical",
      options: [
        "Representational State Transfer",
        "Remote Execution Service Technology",
        "Reliable Exchange Standard Type",
        "Resource Encoding Syntax Tool",
      ],
      correctIndex: 0,
    },
    {
      text: "Which HTTP method is idempotent?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: "Technical",
      options: ["POST", "PUT", "PATCH", "All of the above"],
      correctIndex: 1,
    },
    {
      text: "What is the time complexity of binary search?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: "Technical",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctIndex: 1,
    },
    {
      text: "How do you handle disagreements with teammates?",
      type: QuestionType.TEXT,
      category: "Behavioral",
    },
  ];

  for (const q of questions) {
    const existing = await prisma.question.findFirst({
      where: { text: q.text },
    });
    if (existing) continue;

    const { options, correctIndex, ...questionData } = q as any;
    const created = await prisma.question.create({ data: questionData });

    if (q.type === QuestionType.MULTIPLE_CHOICE && options) {
      for (const optText of options) {
        await prisma.questionOption.create({
          data: { questionId: created.id, text: optText },
        });
      }
    }
  }

  console.log("Seeded questions");

  // === Seed Interview Prep Question Bank ===
  const interviewQuestions = [
    // --- Frontend / React / Junior ---
    {
      id: "iq-fe-react-jr-1",
      track: "frontend",
      tags: ["react", "javascript", "components"],
      difficulty: 1,
      type: "theory",
      level: "junior",
      prompt: "What is a React component?",
      options: [
        "A reusable piece of UI that accepts props and returns JSX",
        "A CSS class that styles HTML elements",
        "A server-side function that handles HTTP requests",
        "A database model that stores application state",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "reusable UI building block",
        "functional components use functions",
        "class components use ES6 classes",
        "hooks in functional components",
        "render method in class components",
      ],
      redFlags: ["react is a language", "components are pages"],
      rubric: {
        criteria: [
          {
            name: "Core concept",
            weight: 3,
            keywords: [
              "reusable",
              "ui",
              "building block",
              "returns jsx",
              "render",
            ],
          },
          {
            name: "Functional vs class",
            weight: 4,
            keywords: [
              "function",
              "class",
              "hooks",
              "useState",
              "lifecycle",
              "render method",
            ],
          },
          {
            name: "Modern usage",
            weight: 3,
            keywords: [
              "hooks",
              "functional preferred",
              "simpler",
              "less boilerplate",
            ],
          },
        ],
      },
      modelAnswer:
        "A React component is a reusable building block of UI that accepts props and returns JSX describing what should appear on screen. Functional components are plain JavaScript functions that return JSX and use hooks like useState and useEffect for state and lifecycle. Class components extend React.Component, use a render() method, and manage state via this.state. Modern React strongly favors functional components with hooks due to simpler syntax and better composability.",
      followUpIds: ["iq-fe-react-jr-2"],
    },
    {
      id: "iq-fe-react-jr-2",
      track: "frontend",
      tags: ["react", "hooks", "state"],
      difficulty: 2,
      type: "theory",
      level: "junior",
      prompt: "When should you use useReducer instead of useState?",
      options: [
        "When you have complex state logic with multiple sub-values or when next state depends on previous state",
        "When you want to replace Redux entirely in your application",
        "When you need to manage global state across the entire app",
        "When you need to store data in localStorage",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "manages local state",
        "returns state and setter",
        "useReducer for complex state logic",
        "immutable updates",
      ],
      redFlags: ["useState is global state", "useState replaces redux"],
      rubric: {
        criteria: [
          {
            name: "useState basics",
            weight: 4,
            keywords: [
              "local state",
              "returns array",
              "setter function",
              "initial value",
              "re-render",
            ],
          },
          {
            name: "useReducer comparison",
            weight: 3,
            keywords: [
              "complex state",
              "reducer",
              "dispatch",
              "action",
              "multiple sub-values",
            ],
          },
          {
            name: "Immutability",
            weight: 3,
            keywords: ["immutable", "new object", "spread", "don't mutate"],
          },
        ],
      },
      modelAnswer:
        "useState is a hook that lets functional components hold local state. It returns a pair: the current value and a setter function. You pass an initial value. For complex state with multiple sub-values or when the next state depends on the previous, useReducer is more appropriate — it uses a reducer function with actions, similar to Redux. Always update state immutably by creating new objects rather than mutating.",
      followUpIds: [],
    },
    // --- Frontend / TypeScript / Mid ---
    {
      id: "iq-fe-ts-mid-1",
      track: "frontend",
      tags: ["typescript", "types", "generics"],
      difficulty: 3,
      type: "theory",
      level: "mid",
      prompt:
        "Explain TypeScript generics. Give an example of when you'd use a generic function or type.",
      options: [
        "To write reusable, type-safe code by parameterizing types with placeholders like <T>",
        "To remove all type checking and make code behave like plain JavaScript",
        "To automatically generate documentation for your codebase",
        "To convert TypeScript code into Java bytecode",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "type parameters",
        "reusable type-safe code",
        "generic functions",
        "generic interfaces",
        "constraints with extends",
      ],
      redFlags: ["generics are like any type", "generics remove type safety"],
      rubric: {
        criteria: [
          {
            name: "Core concept",
            weight: 4,
            keywords: [
              "type parameter",
              "placeholder",
              "reusable",
              "type-safe",
              "angle brackets",
            ],
          },
          {
            name: "Practical example",
            weight: 3,
            keywords: ["function", "array", "promise", "container", "wrapper"],
          },
          {
            name: "Constraints",
            weight: 3,
            keywords: ["extends", "constraint", "narrow", "keyof", "bounded"],
          },
        ],
      },
      modelAnswer:
        "Generics allow you to write reusable, type-safe code by parameterizing types. Instead of using 'any', you declare a type parameter like <T> that gets filled in when the function or type is used. For example, function identity<T>(arg: T): T returns the same type that was passed in. You can constrain generics with 'extends' to ensure certain properties exist. Generic interfaces and classes work similarly, enabling containers like Array<T> or Promise<T>.",
      followUpIds: ["iq-fe-ts-mid-2"],
    },
    {
      id: "iq-fe-ts-mid-2",
      track: "frontend",
      tags: ["typescript", "types"],
      difficulty: 3,
      type: "debugging",
      level: "mid",
      prompt:
        "You have a TypeScript function that accepts an object and a key, returning the value at that key. The current signature is `function getProperty(obj: any, key: string): any`. How would you make this type-safe using generics?",
      options: [
        "Use <T, K extends keyof T>(obj: T, key: K): T[K] with two type parameters and keyof constraint",
        "Replace 'any' with 'unknown' and cast the return value",
        "Use a type assertion like (obj as Record<string, any>)[key]",
        "Just add @ts-ignore above the function to suppress errors",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "keyof operator",
        "generic constraint",
        "return type inferred",
        "two type parameters",
      ],
      redFlags: ["just use any", "type assertion is fine"],
      rubric: {
        criteria: [
          {
            name: "keyof usage",
            weight: 4,
            keywords: ["keyof", "key of", "property names", "union of keys"],
          },
          {
            name: "Generic signature",
            weight: 4,
            keywords: [
              "<T, K extends keyof T>",
              "two type parameters",
              "constraint",
              "extends keyof",
            ],
          },
          {
            name: "Return type",
            weight: 2,
            keywords: ["T[K]", "indexed access", "return type", "inferred"],
          },
        ],
      },
      modelAnswer:
        "Use two type parameters: function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]. T represents the object type, K is constrained to keyof T (the union of T's property names), and the return type T[K] is the indexed access type — the type of the property at key K. This ensures both the key and return value are type-safe without any 'any'.",
      followUpIds: [],
    },
    // --- Backend / Node / Junior ---
    {
      id: "iq-be-node-jr-1",
      track: "backend",
      tags: ["node", "javascript", "event-loop"],
      difficulty: 1,
      type: "theory",
      level: "junior",
      prompt:
        "Explain the Node.js event loop. Why is Node considered non-blocking?",
      options: [
        "It uses a single-threaded event loop that offloads I/O operations and processes callbacks asynchronously",
        "It creates a new thread for every incoming request like Java servlets",
        "It uses WebAssembly to run all code in parallel across multiple cores",
        "It compiles JavaScript to native machine code which runs faster than blocking languages",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "single-threaded",
        "event-driven",
        "non-blocking I/O",
        "callback queue",
        "asynchronous operations",
      ],
      redFlags: ["node is multi-threaded", "node creates a thread per request"],
      rubric: {
        criteria: [
          {
            name: "Event loop concept",
            weight: 4,
            keywords: [
              "event loop",
              "single thread",
              "continuously checks",
              "phases",
              "tick",
            ],
          },
          {
            name: "Non-blocking I/O",
            weight: 3,
            keywords: [
              "non-blocking",
              "asynchronous",
              "callback",
              "doesn't wait",
              "offloads",
            ],
          },
          {
            name: "Practical implication",
            weight: 3,
            keywords: [
              "scalable",
              "concurrent connections",
              "I/O bound",
              "not CPU bound",
            ],
          },
        ],
      },
      modelAnswer:
        "Node.js runs on a single thread with an event loop that continuously checks for pending events and executes callbacks. Instead of blocking on I/O operations (like reading a file or making a network request), Node offloads them to the OS or thread pool and registers a callback. When the operation completes, the callback is placed in the queue and processed by the event loop. This non-blocking model allows Node to handle many concurrent connections efficiently, making it ideal for I/O-bound applications.",
      followUpIds: ["iq-be-node-jr-2"],
    },
    {
      id: "iq-be-node-jr-2",
      track: "backend",
      tags: ["node", "javascript", "async"],
      difficulty: 2,
      type: "coding",
      level: "junior",
      prompt:
        "What is the difference between callbacks, Promises, and async/await in Node.js? When would you use each?",
      options: [
        "Syntactic sugar over Promises that lets you write asynchronous code in a synchronous-looking style using try/catch",
        "A way to run code synchronously by blocking the event loop until the operation completes",
        "A replacement for callbacks that only works with the fs module",
        "A Node.js-specific feature not available in browser JavaScript",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "callbacks are oldest pattern",
        "promise chains",
        "async/await is syntactic sugar",
        "error handling differences",
        "readability",
      ],
      redFlags: ["they are all the same thing", "async/await is synchronous"],
      rubric: {
        criteria: [
          {
            name: "Callback pattern",
            weight: 3,
            keywords: [
              "callback",
              "error-first",
              "callback hell",
              "nested",
              "oldest",
            ],
          },
          {
            name: "Promises",
            weight: 3,
            keywords: [
              "promise",
              "then",
              "catch",
              "chaining",
              "resolve",
              "reject",
            ],
          },
          {
            name: "Async/await",
            weight: 4,
            keywords: [
              "async",
              "await",
              "syntactic sugar",
              "try catch",
              "readable",
              "sequential",
            ],
          },
        ],
      },
      modelAnswer:
        "Callbacks are the original async pattern — you pass a function to be called when the operation completes, using error-first convention. They can lead to 'callback hell' with deep nesting. Promises improved this with .then()/.catch() chains, making error handling cleaner. Async/await is syntactic sugar over Promises — it lets you write asynchronous code that reads like synchronous code using try/catch for errors. Use async/await for most modern code, Promises when you need parallel execution with Promise.all, and callbacks mainly for legacy APIs.",
      followUpIds: [],
    },
    // --- Backend / SQL / Mid ---
    {
      id: "iq-be-sql-mid-1",
      track: "backend",
      tags: ["postgres", "sql", "database"],
      difficulty: 3,
      type: "theory",
      level: "mid",
      prompt:
        "Explain database indexing. When should you add an index and when might an index hurt performance?",
      options: [
        "On tables with heavy write traffic, because every INSERT/UPDATE/DELETE must also update the index",
        "On tables that are read frequently using WHERE clauses",
        "On columns with high cardinality that are used in JOIN operations",
        "On the primary key column of a frequently queried table",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "B-tree structure",
        "speeds up reads",
        "slows down writes",
        "query planner",
        "covering index",
        "cardinality matters",
      ],
      redFlags: ["always add indexes on every column", "indexes have no cost"],
      rubric: {
        criteria: [
          {
            name: "How indexes work",
            weight: 4,
            keywords: [
              "b-tree",
              "data structure",
              "lookup",
              "sorted",
              "pointer",
              "leaf nodes",
            ],
          },
          {
            name: "When to use",
            weight: 3,
            keywords: [
              "frequent queries",
              "WHERE clause",
              "JOIN",
              "ORDER BY",
              "high cardinality",
            ],
          },
          {
            name: "Trade-offs",
            weight: 3,
            keywords: [
              "write overhead",
              "storage",
              "insert slower",
              "update cost",
              "maintenance",
            ],
          },
        ],
      },
      modelAnswer:
        "A database index is a data structure (commonly B-tree) that allows the database to find rows without scanning the entire table. Indexes speed up SELECT queries, especially on columns used in WHERE, JOIN, and ORDER BY clauses. However, they come at a cost: every INSERT, UPDATE, and DELETE must also update the index, consuming extra I/O and storage. Add indexes on high-cardinality columns queried frequently. Avoid over-indexing low-cardinality columns or tables with heavy write traffic. The query planner decides whether to use an index based on table statistics.",
      followUpIds: [],
    },
    // --- Fullstack / Mid ---
    {
      id: "iq-fs-api-mid-1",
      track: "fullstack",
      tags: ["api", "rest", "http"],
      difficulty: 2,
      type: "theory",
      level: "mid",
      prompt:
        "Design a RESTful API for a blog platform. What endpoints would you create and what HTTP methods would you use?",
      options: [
        "POST /posts with the post data in the request body",
        "GET /posts/create?title=Hello&body=World",
        "PUT /createPost with the post data in the request body",
        "POST /api/action?type=create&resource=post",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "resource-based URLs",
        "proper HTTP methods",
        "status codes",
        "pagination",
        "authentication",
      ],
      redFlags: ["use GET for everything", "put all logic in one endpoint"],
      rubric: {
        criteria: [
          {
            name: "REST principles",
            weight: 4,
            keywords: [
              "resource",
              "noun",
              "stateless",
              "uniform interface",
              "HATEOAS",
            ],
          },
          {
            name: "Endpoint design",
            weight: 3,
            keywords: [
              "GET /posts",
              "POST /posts",
              "PUT",
              "DELETE",
              "nested resources",
              "/posts/:id/comments",
            ],
          },
          {
            name: "HTTP conventions",
            weight: 3,
            keywords: [
              "status code",
              "201 created",
              "204",
              "404",
              "pagination",
              "query params",
            ],
          },
        ],
      },
      modelAnswer:
        "A RESTful blog API would use resource-based URLs: GET /posts (list with pagination), POST /posts (create), GET /posts/:id (read one), PUT /posts/:id (full update), PATCH /posts/:id (partial update), DELETE /posts/:id. Nested resources for comments: GET /posts/:id/comments, POST /posts/:id/comments. Use proper status codes: 200 OK, 201 Created, 204 No Content, 404 Not Found, 422 for validation errors. Add pagination via query params (?page=1&limit=20). Protect write endpoints with authentication tokens.",
      followUpIds: [],
    },
    // --- Fullstack / Senior / System Design ---
    {
      id: "iq-fs-sd-sr-1",
      track: "fullstack",
      tags: ["system-design", "architecture", "scalability"],
      difficulty: 4,
      type: "system-design",
      level: "senior",
      prompt:
        "Design a URL shortener service like bit.ly. Walk through the high-level architecture, data model, and key design decisions.",
      options: [
        "Counter-based approach with base62 encoding to convert an auto-incrementing ID into a short string, avoiding collisions",
        "Use the full URL as the short code but remove the protocol prefix",
        "Generate a random 3-character string and hope for no collisions",
        "Store the URL in memory only and use the memory address as the code",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "hashing or encoding",
        "base62 encoding",
        "database schema",
        "read-heavy workload",
        "caching",
        "analytics",
        "redirect with 301/302",
      ],
      redFlags: [
        "just use a random string",
        "no mention of collision handling",
        "store in memory only",
      ],
      rubric: {
        criteria: [
          {
            name: "Architecture",
            weight: 3,
            keywords: [
              "API server",
              "database",
              "cache",
              "load balancer",
              "CDN",
              "horizontal scaling",
            ],
          },
          {
            name: "Short URL generation",
            weight: 4,
            keywords: [
              "base62",
              "hash",
              "counter",
              "unique ID",
              "collision",
              "encoding",
            ],
          },
          {
            name: "Data model & storage",
            weight: 3,
            keywords: [
              "original URL",
              "short code",
              "created at",
              "expiry",
              "user",
              "click count",
              "NoSQL or SQL",
            ],
          },
        ],
      },
      modelAnswer:
        "A URL shortener has three core components: an API to create/resolve short URLs, a database to store mappings, and a cache for hot URLs. For short code generation, use a counter-based approach with base62 encoding (0-9, a-z, A-Z) to convert an auto-incrementing ID into a short string, avoiding collisions. The data model stores: shortCode (PK), originalUrl, userId, createdAt, expiresAt, clickCount. Use Redis to cache frequent lookups since reads vastly outnumber writes. Redirect with 302 (to track analytics) or 301 (if caching is more important). Scale horizontally behind a load balancer, and partition the database by short code range.",
      followUpIds: [],
    },
    // --- DevOps / Junior ---
    {
      id: "iq-do-docker-jr-1",
      track: "devops",
      tags: ["docker", "containers", "devops"],
      difficulty: 1,
      type: "theory",
      level: "junior",
      prompt:
        "What is Docker and why would you use it? Explain the difference between an image and a container.",
      options: [
        "An image is a read-only template/blueprint; a container is a running instance of that image with a writable layer",
        "An image runs in production; a container runs in development only",
        "An image is the same as a virtual machine; a container is a lightweight VM",
        "There is no difference — they are interchangeable terms",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "containerization platform",
        "consistent environments",
        "image is a blueprint",
        "container is a running instance",
        "isolation",
      ],
      redFlags: ["docker is a virtual machine", "containers include a full OS"],
      rubric: {
        criteria: [
          {
            name: "What Docker is",
            weight: 3,
            keywords: [
              "containerization",
              "platform",
              "package",
              "ship",
              "run",
              "consistent",
            ],
          },
          {
            name: "Image vs container",
            weight: 4,
            keywords: [
              "image",
              "blueprint",
              "template",
              "read-only",
              "container",
              "running instance",
              "writable layer",
            ],
          },
          {
            name: "Benefits",
            weight: 3,
            keywords: [
              "isolation",
              "reproducible",
              "lightweight",
              "portable",
              "dependencies",
            ],
          },
        ],
      },
      modelAnswer:
        "Docker is a containerization platform that packages applications with all their dependencies into standardised units called containers. An image is a read-only template/blueprint containing the application code, runtime, libraries, and configuration. A container is a running instance of an image — it adds a writable layer on top. Unlike VMs, containers share the host OS kernel, making them lightweight and fast to start. Docker ensures consistent environments across development, testing, and production, solving the 'works on my machine' problem.",
      followUpIds: [],
    },
    // --- DevOps / Mid / Ops ---
    {
      id: "iq-do-k8s-mid-1",
      track: "devops",
      tags: ["kubernetes", "orchestration", "devops"],
      difficulty: 3,
      type: "ops",
      level: "mid",
      prompt:
        "Explain Kubernetes pods, deployments, and services. How do they relate to each other?",
      options: [
        "A stable network endpoint with load balancing to access a set of Pods selected by labels",
        "A way to build Docker images directly inside the cluster",
        "An auto-scaling mechanism that adjusts CPU allocation per container",
        "A CI/CD pipeline that automatically deploys new code to production",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "pod is smallest unit",
        "deployment manages replicas",
        "service provides stable networking",
        "rolling updates",
        "labels and selectors",
      ],
      redFlags: [
        "pod is the same as a container",
        "you deploy directly to pods",
      ],
      rubric: {
        criteria: [
          {
            name: "Pods",
            weight: 3,
            keywords: [
              "smallest unit",
              "one or more containers",
              "shared network",
              "ephemeral",
              "IP address",
            ],
          },
          {
            name: "Deployments",
            weight: 4,
            keywords: [
              "manages replicas",
              "desired state",
              "rolling update",
              "rollback",
              "replica set",
            ],
          },
          {
            name: "Services",
            weight: 3,
            keywords: [
              "stable endpoint",
              "load balancing",
              "ClusterIP",
              "NodePort",
              "selector",
              "DNS",
            ],
          },
        ],
      },
      modelAnswer:
        "A Pod is the smallest deployable unit in Kubernetes, containing one or more containers that share networking and storage. Pods are ephemeral. A Deployment manages a set of identical Pods (replicas), ensuring the desired number are always running. It handles rolling updates and rollbacks by managing ReplicaSets. A Service provides a stable network endpoint (IP and DNS name) to access a set of Pods, selected by labels. Services load-balance traffic across Pods. Types include ClusterIP (internal), NodePort (external port), and LoadBalancer (cloud LB).",
      followUpIds: [],
    },
    // --- Behavioral / All tracks ---
    {
      id: "iq-beh-all-1",
      track: "frontend",
      tags: ["behavioral", "communication", "teamwork"],
      difficulty: 1,
      type: "behavioral",
      level: "junior",
      prompt:
        "Tell me about a time you had to learn a new technology quickly. How did you approach it?",
      options: [
        "Read the official documentation, build a small prototype, break the problem into small steps, and ask teammates for help",
        "Copy and paste code from Stack Overflow until something works",
        "Wait for someone else on the team to learn it and then ask them to do it",
        "Avoid using new technology and stick with what you already know",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "structured learning approach",
        "practical application",
        "time management",
        "asking for help",
        "documentation",
      ],
      redFlags: [
        "never had to learn anything new",
        "just copied code from Stack Overflow",
      ],
      rubric: {
        criteria: [
          {
            name: "Learning approach",
            weight: 4,
            keywords: [
              "documentation",
              "tutorial",
              "course",
              "hands-on",
              "project",
              "practice",
            ],
          },
          {
            name: "Problem-solving",
            weight: 3,
            keywords: [
              "broke it down",
              "incremental",
              "prototype",
              "experiment",
              "small steps",
            ],
          },
          {
            name: "Outcome",
            weight: 3,
            keywords: [
              "delivered",
              "completed",
              "learned",
              "applied",
              "contributed",
              "result",
            ],
          },
        ],
      },
      modelAnswer:
        "A strong answer describes a specific situation, the structured approach taken (reading docs, building a small prototype, breaking the problem into parts), any challenges faced and how they were overcome (asking teammates, finding resources), and the successful outcome (delivered the feature, improved the system). The key is showing a deliberate learning process, not just winging it.",
      followUpIds: [],
    },
    {
      id: "iq-beh-all-2",
      track: "backend",
      tags: ["behavioral", "conflict", "teamwork"],
      difficulty: 2,
      type: "behavioral",
      level: "mid",
      prompt:
        "Describe a situation where you disagreed with a technical decision. How did you handle it?",
      options: [
        "Present evidence-based arguments, listen to their perspective, and work toward a team decision with data and trade-off analysis",
        "Escalate immediately to your manager and let them decide",
        "Just do it your own way without telling anyone",
        "Avoid the disagreement entirely and let the other person win every time",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "respectful communication",
        "data-driven argument",
        "compromise",
        "team alignment",
        "outcome focus",
      ],
      redFlags: ["I just did it my way", "I never disagree"],
      rubric: {
        criteria: [
          {
            name: "Communication",
            weight: 4,
            keywords: [
              "discussed",
              "presented",
              "listened",
              "respectful",
              "constructive",
              "meeting",
            ],
          },
          {
            name: "Evidence-based",
            weight: 3,
            keywords: [
              "data",
              "benchmark",
              "proof of concept",
              "trade-offs",
              "pros and cons",
            ],
          },
          {
            name: "Resolution",
            weight: 3,
            keywords: [
              "compromise",
              "agreed",
              "team decision",
              "moved forward",
              "alignment",
              "outcome",
            ],
          },
        ],
      },
      modelAnswer:
        "A strong answer shows: 1) You identified the disagreement clearly, 2) You communicated your concerns respectfully with evidence (benchmarks, examples, trade-off analysis), 3) You listened to the other perspective, 4) The team reached a decision together (even if it wasn't your preferred approach), and 5) You committed to the team's decision and it had a positive outcome.",
      followUpIds: [],
    },
    // --- Frontend / CSS / Junior ---
    {
      id: "iq-fe-css-jr-1",
      track: "frontend",
      tags: ["css", "layout", "flexbox"],
      difficulty: 1,
      type: "theory",
      level: "junior",
      prompt: "Explain the CSS Box Model. How does it affect layout?",
      options: [
        "Makes width and height include padding and border, so the total size is more predictable",
        "Adds a visible border around every element on the page",
        "Changes the element from block to inline-block display",
        "Removes all margins and padding from the element",
      ],
      correctOptionIndex: 0,
      expectedPoints: ["content", "padding", "border", "margin", "box-sizing"],
      redFlags: [
        "box model only applies to divs",
        "margin is part of the element size",
      ],
      rubric: {
        criteria: [
          {
            name: "Box model layers",
            weight: 4,
            keywords: [
              "content",
              "padding",
              "border",
              "margin",
              "layers",
              "box",
            ],
          },
          {
            name: "box-sizing",
            weight: 3,
            keywords: [
              "box-sizing",
              "border-box",
              "content-box",
              "width calculation",
            ],
          },
          {
            name: "Layout impact",
            weight: 3,
            keywords: [
              "total width",
              "spacing",
              "overflow",
              "collapsing margins",
            ],
          },
        ],
      },
      modelAnswer:
        "The CSS Box Model describes every HTML element as a box with four layers: content (the actual content area), padding (space between content and border), border (the element's border), and margin (space outside the border). By default (content-box), width/height only set the content area, so padding and border add to the total size. With box-sizing: border-box, width/height include padding and border, making layouts more predictable. Margins can collapse vertically between adjacent elements.",
      followUpIds: [],
    },
    // --- Backend / Senior ---
    {
      id: "iq-be-arch-sr-1",
      track: "backend",
      tags: ["architecture", "patterns", "scalability"],
      difficulty: 4,
      type: "system-design",
      level: "senior",
      prompt:
        "Compare monolithic vs microservices architecture. When would you choose each, and what are the key trade-offs?",
      options: [
        "Start with a modular monolith for simplicity, then extract microservices when you have clear bounded contexts and scaling needs",
        "Always start with microservices because they are superior in every way",
        "Monoliths are always bad and should never be used for any project",
        "Use microservices only for frontend applications and monoliths only for backend",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "monolith simpler to start",
        "microservices scale independently",
        "network overhead",
        "data consistency challenges",
        "team autonomy",
        "operational complexity",
      ],
      redFlags: ["monoliths are always bad", "microservices are always better"],
      rubric: {
        criteria: [
          {
            name: "Monolith advantages",
            weight: 3,
            keywords: [
              "simple",
              "single deployment",
              "easier debugging",
              "transaction",
              "less overhead",
              "start with",
            ],
          },
          {
            name: "Microservice advantages",
            weight: 3,
            keywords: [
              "independent scaling",
              "team autonomy",
              "technology diversity",
              "fault isolation",
              "deploy independently",
            ],
          },
          {
            name: "Trade-offs",
            weight: 4,
            keywords: [
              "network latency",
              "data consistency",
              "distributed systems",
              "operational complexity",
              "monitoring",
              "service discovery",
            ],
          },
        ],
      },
      modelAnswer:
        "Monoliths are a single deployable unit — simpler to develop, test, debug, and deploy initially. They work well for small teams and early-stage products. Microservices decompose the application into independent services that can be developed, deployed, and scaled independently. They enable team autonomy and technology diversity. However, they introduce network latency, distributed data consistency challenges (eventual consistency, sagas), and significant operational complexity (service discovery, monitoring, tracing). Start with a modular monolith and extract microservices when you have clear bounded contexts and scaling needs.",
      followUpIds: [],
    },
    // Extra fullstack questions
    {
      id: "iq-fs-auth-mid-1",
      track: "fullstack",
      tags: ["authentication", "security", "jwt"],
      difficulty: 2,
      type: "theory",
      level: "mid",
      prompt:
        "Explain how JWT-based authentication works. What are the security considerations?",
      options: [
        "In an httpOnly, Secure, SameSite cookie to prevent XSS and CSRF attacks",
        "In localStorage because it persists across browser sessions",
        "In a global JavaScript variable so it's easily accessible",
        "In the URL query string so it's included in every request automatically",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "token structure",
        "stateless",
        "signing",
        "expiration",
        "refresh tokens",
        "XSS and CSRF risks",
      ],
      redFlags: [
        "JWT is encrypted",
        "store JWT in localStorage is always safe",
      ],
      rubric: {
        criteria: [
          {
            name: "JWT structure",
            weight: 3,
            keywords: [
              "header",
              "payload",
              "signature",
              "base64",
              "claims",
              "three parts",
            ],
          },
          {
            name: "Auth flow",
            weight: 4,
            keywords: [
              "login",
              "issue token",
              "send in header",
              "verify signature",
              "stateless",
              "Bearer",
            ],
          },
          {
            name: "Security",
            weight: 3,
            keywords: [
              "expiration",
              "refresh token",
              "httpOnly cookie",
              "XSS",
              "CSRF",
              "secret key",
              "algorithm",
            ],
          },
        ],
      },
      modelAnswer:
        "JWT (JSON Web Token) has three parts: header (algorithm), payload (claims like userId, expiration), and signature (HMAC or RSA signed). On login, the server issues a JWT. The client sends it in the Authorization header for subsequent requests. The server verifies the signature without a session store (stateless). Security considerations: set short expiration times, use refresh tokens for renewal, store tokens in httpOnly cookies (not localStorage) to prevent XSS, protect against CSRF with SameSite cookies, use strong signing keys, and validate the algorithm to prevent 'none' algorithm attacks.",
      followUpIds: [],
    },
    {
      id: "iq-fs-testing-jr-1",
      track: "fullstack",
      tags: ["testing", "quality", "javascript"],
      difficulty: 1,
      type: "theory",
      level: "junior",
      prompt:
        "What are the different types of software testing? Explain unit, integration, and end-to-end tests.",
      options: [
        "Unit tests — they test single functions in isolation, are fast, and form the base of the test pyramid",
        "End-to-end tests — they simulate real user interactions through the entire stack",
        "Integration tests — they verify multiple modules working together with real dependencies",
        "Manual tests — a QA tester clicks through the application by hand",
      ],
      correctOptionIndex: 0,
      expectedPoints: [
        "unit tests single functions",
        "integration tests modules together",
        "e2e tests full user flow",
        "test pyramid",
        "mocking",
      ],
      redFlags: ["testing is optional", "only manual testing matters"],
      rubric: {
        criteria: [
          {
            name: "Unit tests",
            weight: 3,
            keywords: [
              "single function",
              "isolated",
              "mock dependencies",
              "fast",
              "jest",
              "small scope",
            ],
          },
          {
            name: "Integration tests",
            weight: 3,
            keywords: [
              "modules together",
              "API tests",
              "database",
              "real dependencies",
              "boundaries",
            ],
          },
          {
            name: "E2E tests",
            weight: 2,
            keywords: [
              "full flow",
              "browser",
              "user perspective",
              "cypress",
              "playwright",
              "slow",
            ],
          },
          {
            name: "Test pyramid",
            weight: 2,
            keywords: [
              "pyramid",
              "more unit",
              "fewer e2e",
              "cost",
              "speed",
              "confidence",
            ],
          },
        ],
      },
      modelAnswer:
        "Unit tests verify individual functions or components in isolation, mocking external dependencies. They're fast and form the base of the test pyramid. Integration tests verify that multiple modules work together correctly — e.g., testing an API endpoint with a real database. E2E tests simulate real user interactions through the entire application stack (browser → API → database). The test pyramid suggests having many unit tests, fewer integration tests, and even fewer E2E tests, balancing speed and confidence.",
      followUpIds: [],
    },
    // === Multi-select questions ===
    // --- Frontend / React / Mid / Multi-select ---
    {
      id: "iq-fe-react-mid-ms-1",
      track: "frontend",
      tags: ["react", "hooks", "performance"],
      difficulty: 3,
      type: "theory",
      level: "mid",
      prompt:
        "Which of the following are valid React hooks? (Select all that apply)",
      options: [
        "useState",
        "useEffect",
        "useQuery",
        "useMemo",
        "useThread",
        "useCallback",
      ],
      correctOptionIndex: 0,
      correctOptionIndices: [0, 1, 3, 5],
      multiSelect: true,
      expectedPoints: [
        "useState for state",
        "useEffect for side effects",
        "useMemo for memoization",
        "useCallback for stable references",
      ],
      redFlags: ["useQuery is a built-in hook", "useThread exists in React"],
      rubric: {
        criteria: [
          {
            name: "Hook identification",
            weight: 5,
            keywords: ["useState", "useEffect", "useMemo", "useCallback"],
          },
          {
            name: "False positives",
            weight: 5,
            keywords: ["useQuery is not built-in", "useThread does not exist"],
          },
        ],
      },
      modelAnswer:
        "The valid built-in React hooks are: useState (state management), useEffect (side effects), useMemo (memoized values), and useCallback (memoized callbacks). useQuery is from React Query / TanStack Query — it's not a built-in React hook. useThread does not exist in React.",
      followUpIds: [],
    },
    {
      id: "iq-fe-css-mid-ms-1",
      track: "frontend",
      tags: ["css", "layout", "responsive"],
      difficulty: 2,
      type: "theory",
      level: "mid",
      prompt:
        "Which of the following CSS properties can be used to create a responsive layout? (Select all that apply)",
      options: [
        "display: flex",
        "display: grid",
        "font-weight: bold",
        "media queries (@media)",
        "text-decoration: underline",
        "container queries (@container)",
      ],
      correctOptionIndex: 0,
      correctOptionIndices: [0, 1, 3, 5],
      multiSelect: true,
      expectedPoints: [
        "flexbox for one-dimensional layouts",
        "grid for two-dimensional layouts",
        "media queries for breakpoints",
        "container queries for component-level responsiveness",
      ],
      redFlags: ["font-weight affects layout", "text-decoration is for layout"],
      rubric: {
        criteria: [
          {
            name: "Layout techniques",
            weight: 5,
            keywords: ["flex", "grid", "media queries", "container queries"],
          },
          {
            name: "Exclusions",
            weight: 5,
            keywords: [
              "font-weight is not layout",
              "text-decoration is not layout",
            ],
          },
        ],
      },
      modelAnswer:
        "display: flex (flexbox — one-dimensional responsive layouts), display: grid (CSS Grid — two-dimensional responsive layouts), @media queries (apply styles based on viewport size), and @container queries (apply styles based on container size) are all used for responsive layouts. font-weight and text-decoration are purely visual/text properties and do not affect layout responsiveness.",
      followUpIds: [],
    },
    // --- Backend / Node / Mid / Multi-select ---
    {
      id: "iq-be-node-mid-ms-1",
      track: "backend",
      tags: ["node", "security", "best-practices"],
      difficulty: 3,
      type: "theory",
      level: "mid",
      prompt:
        "Which of the following are common Node.js security best practices? (Select all that apply)",
      options: [
        "Validate and sanitize all user input",
        "Store passwords in plain text for easier debugging",
        "Use helmet middleware to set security headers",
        "Rate-limit API endpoints",
        "Disable CORS entirely so any origin can access the API",
        "Keep dependencies up to date and audit for vulnerabilities",
      ],
      correctOptionIndex: 0,
      correctOptionIndices: [0, 2, 3, 5],
      multiSelect: true,
      expectedPoints: [
        "input validation",
        "helmet for headers",
        "rate limiting",
        "dependency auditing",
      ],
      redFlags: ["store passwords in plain text", "disable CORS entirely"],
      rubric: {
        criteria: [
          {
            name: "Security practices",
            weight: 5,
            keywords: [
              "validate input",
              "helmet",
              "rate limit",
              "audit dependencies",
            ],
          },
          {
            name: "Anti-patterns",
            weight: 5,
            keywords: [
              "never store plain text passwords",
              "CORS should be configured properly",
            ],
          },
        ],
      },
      modelAnswer:
        "Key Node.js security best practices include: validating and sanitizing all user input to prevent injection attacks, using helmet middleware to set security HTTP headers, rate-limiting API endpoints to prevent abuse, and keeping dependencies up to date with regular audits (npm audit). Storing passwords in plain text is a critical vulnerability — always hash them. Disabling CORS entirely exposes the API to cross-origin attacks — configure it properly.",
      followUpIds: [],
    },
    // --- Fullstack / Mid / Multi-select ---
    {
      id: "iq-fs-http-mid-ms-1",
      track: "fullstack",
      tags: ["http", "api", "web"],
      difficulty: 2,
      type: "theory",
      level: "mid",
      prompt:
        "Which HTTP status codes indicate a successful response? (Select all that apply)",
      options: [
        "200 OK",
        "201 Created",
        "204 No Content",
        "301 Moved Permanently",
        "400 Bad Request",
        "404 Not Found",
      ],
      correctOptionIndex: 0,
      correctOptionIndices: [0, 1, 2],
      multiSelect: true,
      expectedPoints: [
        "2xx codes indicate success",
        "200 for general success",
        "201 for resource creation",
        "204 for successful deletion with no body",
      ],
      redFlags: ["301 is a success code", "400 is a success code"],
      rubric: {
        criteria: [
          {
            name: "Success codes",
            weight: 5,
            keywords: ["200", "201", "204", "2xx"],
          },
          {
            name: "Non-success codes",
            weight: 5,
            keywords: [
              "301 is redirect",
              "400 is client error",
              "404 is not found",
            ],
          },
        ],
      },
      modelAnswer:
        "HTTP status codes in the 2xx range indicate success: 200 OK (general success), 201 Created (resource successfully created, e.g., after POST), and 204 No Content (success with no response body, e.g., after DELETE). 301 Moved Permanently is a redirect (3xx), 400 Bad Request is a client error (4xx), and 404 Not Found is also a client error.",
      followUpIds: [],
    },
  ];

  for (const q of interviewQuestions) {
    const qData: any = q;
    const existing = await prisma.interviewQuestion.findFirst({
      where: { id: q.id },
    });
    if (existing) {
      // Update existing questions with new multiple-choice fields
      await prisma.interviewQuestion.update({
        where: { id: q.id },
        data: {
          prompt: q.prompt,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          correctOptionIndices: qData.correctOptionIndices ?? [],
          multiSelect: qData.multiSelect ?? false,
        },
      });
      continue;
    }

    await prisma.interviewQuestion.create({
      data: {
        id: q.id,
        track: q.track,
        tags: q.tags,
        difficulty: q.difficulty,
        type: q.type,
        level: q.level,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        correctOptionIndices: qData.correctOptionIndices ?? [],
        multiSelect: qData.multiSelect ?? false,
        expectedPoints: q.expectedPoints,
        redFlags: q.redFlags,
        rubric: q.rubric,
        modelAnswer: q.modelAnswer,
        followUpIds: q.followUpIds,
      },
    });
  }

  console.log("Seeded interview prep question bank");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
