import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { isKnownTag, normalizeTag, normalizeTags } from "../src/common/tech-tags";

/*
 * Seeds the interview question bank (reference data) and, outside production,
 * a few dev accounts. Safe to re-run: every write is an upsert or a no-op.
 *
 *   pnpm db:seed                          question bank + dev users
 *   pnpm db:seed -- --no-dev-users        question bank only
 *   NODE_ENV=production pnpm db:seed      question bank only (dev users are refused)
 */

const prisma = new PrismaClient();

/** Far-future period end so dev premium accounts count as active premium. */
const DEV_PREMIUM_PERIOD_END = new Date("2099-12-31T00:00:00.000Z");

const DEV_USERS = [
  { email: "premium@careerportal.dev", name: "Premium User", premium: true },
  { email: "free@careerportal.dev", name: "Free User", premium: false },
  { email: "admin@careerportal.dev", name: "Dev Admin", premium: true },
] as const;

/** Level given to AI questions taken out of every pool (rows stay for session history). */
const ARCHIVED_LEVEL = "archived";

/**
 * One bank question. Authoring conventions:
 * - The correct option is written first (index 0), and for multi-select the
 *   correct options are listed in correctOptionIndices. The seed stores the
 *   options in a fixed shuffled order per question (see storedOptionOrder),
 *   so the answer is not always "A".
 * - Ids are versioned: changing a question's options or meaning needs a new
 *   id. The old row is then archived (or deleted when no session used it),
 *   so answered sessions keep the version they were graded against.
 */
interface SeedQuestion {
  id: string;
  track: string;
  /** Canonical tech-tag catalog ids. */
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  /** "Select all that apply" questions: every correct option. */
  correctOptionIndices?: number[];
  multiSelect?: boolean;
  expectedPoints: string[];
  redFlags: string[];
  rubric: { criteria: { name: string; weight: number; keywords: string[] }[] };
  modelAnswer: string;
  followUpIds: string[];
}

const INTERVIEW_QUESTIONS: SeedQuestion[] = [
  // --- Frontend / React / Junior ---
  {
    id: "iq-fe-react-jr-1-v2",
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
    followUpIds: ["iq-fe-react-jr-2-v2"],
  },
  {
    id: "iq-fe-react-jr-2-v2",
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
    id: "iq-fe-ts-mid-1-v2",
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
    followUpIds: ["iq-fe-ts-mid-2-v2"],
  },
  {
    id: "iq-fe-ts-mid-2-v2",
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
    id: "iq-be-node-jr-1-v2",
    track: "backend",
    tags: ["node.js", "javascript", "event-loop"],
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
    followUpIds: ["iq-be-node-jr-2-v2"],
  },
  {
    id: "iq-be-node-jr-2-v2",
    track: "backend",
    tags: ["node.js", "javascript", "async"],
    difficulty: 2,
    type: "coding",
    level: "junior",
    prompt: "What is async/await in JavaScript and Node.js?",
    options: [
      "Syntactic sugar over Promises that lets you write asynchronous code in a synchronous-looking style using try/catch",
      "A way to run code synchronously by blocking the event loop until the operation completes",
      "A replacement for callbacks that only works with the fs module",
      "A Node.js-specific feature not available in browser JavaScript",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "async/await is syntactic sugar over Promises",
      "await pauses the async function, not the event loop",
      "errors are handled with try/catch",
      "more readable than callbacks or promise chains",
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
    id: "iq-be-sql-mid-1-v2",
    track: "backend",
    tags: ["postgresql", "sql", "database"],
    difficulty: 3,
    type: "theory",
    level: "mid",
    prompt: "When can adding a database index hurt overall performance?",
    options: [
      "On a table with heavy write traffic, because every INSERT/UPDATE/DELETE must also update the index",
      "On a column that queries frequently filter on in WHERE clauses",
      "On a high-cardinality column used to JOIN two large tables",
      "On a large table that is read far more often than it is written",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "indexes speed up reads",
      "every write must also update each index",
      "extra storage and maintenance",
      "avoid over-indexing write-heavy tables",
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
    id: "iq-fs-api-mid-1-v2",
    track: "fullstack",
    tags: ["api", "rest", "http"],
    difficulty: 2,
    type: "theory",
    level: "mid",
    prompt: "In a RESTful API for a blog, how should a client create a new post?",
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
    id: "iq-fs-sd-sr-1-v2",
    track: "fullstack",
    tags: ["system design", "architecture", "scaling"],
    difficulty: 4,
    type: "system-design",
    level: "senior",
    prompt:
      "Designing a URL shortener like bit.ly: which way of generating the short codes is the most robust?",
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
    id: "iq-do-docker-jr-1-v2",
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
    id: "iq-do-k8s-mid-1-v2",
    track: "devops",
    tags: ["kubernetes", "orchestration", "devops"],
    difficulty: 3,
    type: "ops",
    level: "mid",
    prompt: "In Kubernetes, what does a Service provide?",
    options: [
      "A stable network endpoint with load balancing to access a set of Pods selected by labels",
      "A way to build Docker images directly inside the cluster",
      "An auto-scaling mechanism that adjusts CPU allocation per container",
      "A CI/CD pipeline that automatically deploys new code to production",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "stable virtual IP and DNS name",
      "load balancing across matching pods",
      "pods selected by labels",
      "service types: ClusterIP, NodePort, LoadBalancer",
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
    id: "iq-beh-all-1-v2",
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
    id: "iq-beh-all-2-v2",
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
    id: "iq-fe-css-jr-1-v2",
    track: "frontend",
    tags: ["css", "layout"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt:
      "In the CSS box model, what does `box-sizing: border-box` do?",
    options: [
      "Makes width and height include padding and border, so the total size is more predictable",
      "Adds a visible border around every element on the page",
      "Changes the element from block to inline-block display",
      "Removes all margins and padding from the element",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "box model layers: content, padding, border, margin",
      "border-box: width includes padding and border",
      "content-box (default): padding and border add to the width",
      "margin is never part of the element's size",
    ],
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
    id: "iq-be-arch-sr-1-v2",
    track: "backend",
    tags: ["architecture", "patterns", "scaling"],
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
    id: "iq-fs-auth-mid-1-v2",
    track: "fullstack",
    tags: ["authentication", "security", "jwt"],
    difficulty: 2,
    type: "theory",
    level: "mid",
    prompt:
      "Where should a browser app keep its JWT so that a cross-site scripting (XSS) bug cannot steal it?",
    options: [
      "In an httpOnly, Secure, SameSite cookie, which page scripts cannot read",
      "In localStorage because it persists across browser sessions",
      "In a global JavaScript variable so it's easily accessible",
      "In the URL query string so it's included in every request automatically",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "httpOnly cookies cannot be read by JavaScript",
      "localStorage is readable by any script on the page",
      "SameSite and CSRF protection for cookies",
      "short expiry and refresh tokens",
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
    id: "iq-fs-testing-jr-1-v2",
    track: "fullstack",
    tags: ["testing", "quality", "javascript"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt:
      "Which kind of test checks a single function or component in isolation, with its dependencies mocked?",
    options: [
      "A unit test",
      "An end-to-end test",
      "An integration test",
      "A load test",
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
    id: "iq-fe-react-mid-ms-1-v2",
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
    id: "iq-fe-css-mid-ms-1-v2",
    track: "frontend",
    tags: ["css", "layout", "responsive design"],
    difficulty: 2,
    type: "theory",
    level: "mid",
    prompt:
      "Which of the following CSS features can be used to create a responsive layout? (Select all that apply)",
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
    id: "iq-be-node-mid-ms-1-v2",
    track: "backend",
    tags: ["node.js", "security", "best-practices"],
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
    id: "iq-fs-http-mid-ms-1-v2",
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
  // === Reference questions so every track/level the app offers has a pool ===
  // --- Frontend / Senior ---
  {
    id: "iq-fe-perf-sr-1",
    track: "frontend",
    tags: ["performance", "web vitals", "browser apis"],
    difficulty: 4,
    type: "theory",
    level: "senior",
    prompt:
      "A page's Largest Contentful Paint (LCP) is slow because the browser discovers its hero image late. Which change most directly improves LCP?",
    options: [
      'Preload the hero image (or give it fetchpriority="high") and serve it at the size it is displayed',
      'Add loading="lazy" to the hero image',
      "Merge all JavaScript into one larger bundle",
      "Debounce the page's scroll handlers",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "LCP measures when the largest above-the-fold element renders",
      "late discovery delays the image request",
      "preload or fetchpriority starts the download early",
      "right-sized, modern image formats",
    ],
    redFlags: ["lazy-load the LCP image", "LCP depends on scroll handlers"],
    rubric: {
      criteria: [
        { name: "LCP causes", weight: 5, keywords: ["discovery", "request", "render", "largest"] },
        { name: "Fixes", weight: 5, keywords: ["preload", "fetchpriority", "image size", "avif", "webp"] },
      ],
    },
    modelAnswer:
      "LCP is the time until the largest element in the viewport renders, often a hero image. If the image is only discovered after CSS or JavaScript runs, its download starts late. Preloading it (<link rel=\"preload\" as=\"image\">) or marking it fetchpriority=\"high\" starts the request early, and serving it at its display size in a modern format shortens the download. Lazy-loading the hero image delays it further and makes LCP worse.",
    followUpIds: [],
  },
  {
    id: "iq-fe-react-sr-1",
    track: "frontend",
    tags: ["react", "performance", "hooks"],
    difficulty: 4,
    type: "debugging",
    level: "senior",
    prompt:
      "A child wrapped in React.memo still re-renders every time its parent renders. The parent passes `onSelect={() => setId(item.id)}` and `style={{ margin: 8 }}`. Why?",
    options: [
      "The parent creates a new function and a new object on every render, so the props are never shallow-equal",
      "React.memo only works for class components",
      "The setId function returned by useState changes on every render",
      "React.memo compares props deeply, and skips memoising when that is too slow",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "React.memo compares props shallowly",
      "inline functions and objects are new references each render",
      "useCallback and useMemo keep references stable",
      "state setters from useState are stable",
    ],
    redFlags: ["React.memo deep-compares props", "useState setters change every render"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["shallow", "reference", "new function", "new object"] },
        { name: "Fix", weight: 5, keywords: ["useCallback", "useMemo", "hoist", "stable"] },
      ],
    },
    modelAnswer:
      "React.memo skips a re-render only when every prop is shallowly equal to the previous one. An inline arrow function and an inline object literal are new references on every parent render, so the comparison always fails. Wrap the callback in useCallback and the style object in useMemo (or hoist the constant object outside the component). The setter returned by useState is already stable.",
    followUpIds: [],
  },
  {
    id: "iq-fe-a11y-sr-1",
    track: "frontend",
    tags: ["accessibility", "browser apis"],
    difficulty: 4,
    type: "theory",
    level: "senior",
    prompt:
      "Which approach gives a modal dialog correct keyboard and screen-reader behaviour with the least custom code?",
    options: [
      "The native <dialog> element opened with showModal(), which makes the rest of the page inert and closes on Escape",
      "A <div> with a high z-index and a click handler on the backdrop to close it",
      'Setting tabindex="-1" on a few elements behind the modal',
      'Putting aria-hidden="true" on the modal itself',
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "focus must stay inside the open modal",
      "the background must be inert for assistive technology",
      "Escape closes the dialog and focus returns to the trigger",
      "native <dialog> with showModal() provides this",
    ],
    redFlags: ["aria-hidden on the dialog itself", "z-index makes a modal accessible"],
    rubric: {
      criteria: [
        { name: "Requirements", weight: 5, keywords: ["focus", "inert", "escape", "screen reader"] },
        { name: "Approach", weight: 5, keywords: ["dialog", "showModal", "native", "role=dialog"] },
      ],
    },
    modelAnswer:
      "An accessible modal keeps focus inside itself, hides the rest of the page from keyboard and assistive technology, closes on Escape and returns focus to the element that opened it. The native <dialog> element opened with showModal() makes the rest of the document inert and handles Escape, so little custom code is needed. A styled <div> needs all of that built by hand, and aria-hidden on the dialog would hide it from screen readers entirely.",
    followUpIds: [],
  },
  {
    id: "iq-fe-ts-sr-1",
    track: "frontend",
    tags: ["typescript", "types"],
    difficulty: 4,
    type: "coding",
    level: "senior",
    prompt:
      "What does `const config = { ... } satisfies Config` give you that `const config: Config = { ... }` does not?",
    options: [
      "It checks the object against Config but keeps its narrower inferred type, such as the exact keys and literal values",
      "It casts the object to Config without any type checking",
      "It makes every property of config readonly at runtime",
      "It turns the Config type into a runtime validator",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "satisfies validates without widening",
      "a type annotation widens the variable to Config",
      "literal types and exact keys are preserved",
      "types are erased at runtime",
    ],
    redFlags: ["satisfies is a type assertion", "TypeScript types exist at runtime"],
    rubric: {
      criteria: [
        { name: "Checking", weight: 5, keywords: ["checks", "excess property", "error", "validate"] },
        { name: "Inference", weight: 5, keywords: ["narrow", "literal", "inferred", "widen"] },
      ],
    },
    modelAnswer:
      "An annotation (`const config: Config`) checks the object and then gives the variable the declared type Config, losing what was specific about the literal. `satisfies Config` performs the same check, including excess-property errors, but the variable keeps its inferred type, so literal values and exact keys stay available to later code. Neither changes runtime behaviour: types are erased.",
    followUpIds: [],
  },
  // --- Backend / Junior ---
  {
    id: "iq-be-http-jr-1",
    track: "backend",
    tags: ["http", "rest", "api"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt:
      "Which HTTP status code should an API return when a request has no valid authentication token?",
    options: [
      "401 Unauthorized",
      "403 Forbidden",
      "404 Not Found",
      "500 Internal Server Error",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "401 means the client is not authenticated",
      "403 means authenticated but not allowed",
      "4xx codes are client errors",
    ],
    redFlags: ["return 500 for auth failures", "401 and 403 are interchangeable"],
    rubric: {
      criteria: [
        { name: "Authentication", weight: 5, keywords: ["401", "unauthenticated", "token", "credentials"] },
        { name: "Authorisation", weight: 5, keywords: ["403", "forbidden", "permission"] },
      ],
    },
    modelAnswer:
      "401 Unauthorized means the request lacks valid authentication credentials, such as a missing or expired token; the client should sign in or refresh its token. 403 Forbidden is for a caller who is authenticated but not allowed to do this. 404 and 500 describe other situations.",
    followUpIds: [],
  },
  {
    id: "iq-be-sql-jr-1",
    track: "backend",
    tags: ["sql", "database", "security"],
    difficulty: 2,
    type: "theory",
    level: "junior",
    prompt:
      "Why should SQL queries use parameters (placeholders) instead of building the query string from user input?",
    options: [
      "Parameters are sent as data, so user input can never change the structure of the query (SQL injection)",
      "Queries built by string concatenation cannot use indexes",
      "Parameters encrypt the values before they reach the database",
      "Databases reject query strings longer than 255 characters",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "SQL injection",
      "parameters are bound as values, not SQL",
      "never concatenate user input into SQL",
      "ORMs and query builders parameterise for you",
    ],
    redFlags: ["escaping by hand is enough", "parameters encrypt data"],
    rubric: {
      criteria: [
        { name: "Risk", weight: 5, keywords: ["sql injection", "attacker", "input", "structure"] },
        { name: "Fix", weight: 5, keywords: ["parameter", "placeholder", "prepared statement", "bind"] },
      ],
    },
    modelAnswer:
      "If user input is concatenated into SQL, input such as `' OR 1=1 --` changes what the query does: SQL injection. With parameters (prepared statements), the query text and the values travel separately, so the database always treats the input as a value. ORMs and query builders do this for you; avoid raw string building.",
    followUpIds: [],
  },
  // --- Backend / Senior ---
  {
    id: "iq-be-outbox-sr-1",
    track: "backend",
    tags: ["distributed systems", "queues", "transactions"],
    difficulty: 4,
    type: "system-design",
    level: "senior",
    prompt:
      "A service saves an order to its database and must publish an OrderCreated event to a message broker. How do you make sure the event is never lost when the save commits, and never published when it rolls back?",
    options: [
      "Write the event to an outbox table in the same database transaction, and have a relay publish it from there afterwards",
      "Publish the event first, then save the order",
      "Save the order, then publish the event, and log an error if publishing fails",
      "Put the database insert and the broker publish inside one database transaction",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "dual writes are not atomic",
      "transactional outbox",
      "a relay publishes outbox rows at least once",
      "consumers must be idempotent",
    ],
    redFlags: ["a database transaction covers the broker", "logging the failure is enough"],
    rubric: {
      criteria: [
        { name: "Problem", weight: 5, keywords: ["dual write", "atomic", "crash", "inconsistent"] },
        { name: "Pattern", weight: 5, keywords: ["outbox", "same transaction", "relay", "idempotent"] },
      ],
    },
    modelAnswer:
      "Saving and publishing are two separate systems, so a crash between them loses the event or publishes one for a rolled-back order. The transactional outbox pattern writes the event into an outbox table in the same transaction as the order; a relay (polling or change data capture) then publishes outbox rows and marks them sent. Delivery is at least once, so consumers must be idempotent. A database transaction cannot include the broker.",
    followUpIds: [],
  },
  {
    id: "iq-be-cache-sr-1",
    track: "backend",
    tags: ["caching", "redis", "scaling"],
    difficulty: 4,
    type: "system-design",
    level: "senior",
    prompt:
      "A very popular cache key expires and hundreds of concurrent requests miss the cache and hit the database at once. What best mitigates this?",
    options: [
      "Let one request recompute the value (a lock or request coalescing) while the others wait or are served the stale value",
      "Encrypt the cache entries",
      "Restart the cache server every night",
      "Lower the key's time-to-live so it expires more often",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "cache stampede (thundering herd)",
      "only one request recomputes the value",
      "serve stale while revalidating",
      "jittered expiry or early refresh",
    ],
    redFlags: ["shorter TTLs fix stampedes", "the database will cope"],
    rubric: {
      criteria: [
        { name: "Problem", weight: 5, keywords: ["stampede", "thundering herd", "expiry", "concurrent"] },
        { name: "Mitigation", weight: 5, keywords: ["lock", "coalescing", "stale", "jitter", "early refresh"] },
      ],
    },
    modelAnswer:
      "This is a cache stampede (thundering herd). Make sure only one request recomputes the value, using a short lock or request coalescing, while the others wait briefly or get the stale value (stale-while-revalidate). Adding jitter to expiry times or refreshing hot keys before they expire also stops many keys or requests expiring together. A shorter TTL makes it happen more often.",
    followUpIds: [],
  },
  {
    id: "iq-be-idempotency-sr-1",
    track: "backend",
    tags: ["api", "rest", "distributed systems"],
    difficulty: 4,
    type: "system-design",
    level: "senior",
    prompt:
      "Clients retry POST /payments after network timeouts, and some customers are charged twice. What is the standard fix?",
    options: [
      "Idempotency keys: the client sends a unique key per payment, and the server stores the first result and returns it for any retry with that key",
      "Return 500 for slow requests so clients stop retrying",
      "Change the endpoint to GET, because GET is idempotent",
      "Raise the client timeout to five minutes",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "POST is not idempotent by default",
      "retries after timeouts are normal",
      "idempotency key per operation",
      "store and replay the first response",
    ],
    redFlags: ["clients should never retry", "use GET for payments"],
    rubric: {
      criteria: [
        { name: "Problem", weight: 5, keywords: ["retry", "timeout", "duplicate", "not idempotent"] },
        { name: "Fix", weight: 5, keywords: ["idempotency key", "unique", "store result", "replay"] },
      ],
    },
    modelAnswer:
      "A timeout does not tell the client whether the payment happened, so retries are expected and POST is not idempotent. The client generates an idempotency key per payment and sends it with every attempt; the server records the key with the outcome (under a unique constraint) and returns the stored result for repeats instead of charging again. Changing the method or the timeout does not remove duplicates.",
    followUpIds: [],
  },
  // --- Fullstack / Junior ---
  {
    id: "iq-fs-cors-jr-1",
    track: "fullstack",
    tags: ["cors", "http", "security"],
    difficulty: 2,
    type: "debugging",
    level: "junior",
    prompt:
      "A web app on https://app.example.com calls an API on https://api.example.com, and the browser blocks the response with a CORS error. Where is this fixed?",
    options: [
      "On the API, which must answer with Access-Control-Allow-Origin (and related headers) allowing the app's origin",
      "In the frontend, by adding mode: \"no-cors\" to the fetch call",
      "By asking users to turn off the browser's same-origin policy",
      "By moving the fetch call into a different component",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the browser enforces the same-origin policy",
      "the server opts in with CORS headers",
      "preflight OPTIONS requests",
      "no-cors gives an unreadable (opaque) response",
    ],
    redFlags: ["CORS is fixed in the frontend", "disable browser security"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["same-origin", "different origin", "browser", "blocked"] },
        { name: "Fix", weight: 5, keywords: ["Access-Control-Allow-Origin", "server", "headers", "preflight"] },
      ],
    },
    modelAnswer:
      "Different subdomains are different origins, so the browser only lets the page read the response if the API allows it. The fix is on the server: return Access-Control-Allow-Origin for the app's origin (plus allowed methods and headers for preflight OPTIONS requests). mode: \"no-cors\" only produces an opaque response the page cannot read.",
    followUpIds: [],
  },
  {
    id: "iq-fs-http-jr-1",
    track: "fullstack",
    tags: ["http", "rest", "api"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt:
      "Which HTTP method is conventionally used to change only some fields of an existing resource, such as a user's email address?",
    options: ["PATCH", "PUT, which replaces the whole resource", "GET", "DELETE"],
    correctOptionIndex: 0,
    expectedPoints: [
      "PATCH for partial updates",
      "PUT replaces the whole resource",
      "GET must not change data",
    ],
    redFlags: ["GET can update data", "POST and PATCH are identical"],
    rubric: {
      criteria: [
        { name: "Method", weight: 5, keywords: ["PATCH", "partial"] },
        { name: "Semantics", weight: 5, keywords: ["PUT replaces", "GET is safe", "idempotent"] },
      ],
    },
    modelAnswer:
      "PATCH applies a partial update, sending only the fields that change. PUT replaces the whole resource with the representation sent. GET is a safe method that must never change data, and DELETE removes the resource.",
    followUpIds: [],
  },
  {
    id: "iq-fs-secrets-jr-1",
    track: "fullstack",
    tags: ["security", "secrets management"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt: "Where should a full-stack app keep its database password and third-party API keys?",
    options: [
      "In environment variables or a secrets manager on the server, never in the frontend bundle or the git repository",
      "In a config file that ships with the frontend bundle",
      "In the project README so the whole team can find them",
      "In the source code, Base64-encoded so they are hidden",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "anything in the frontend bundle is public",
      "never commit secrets to git",
      "environment variables or a secrets manager",
      "rotate leaked secrets",
    ],
    redFlags: ["Base64 hides secrets", "frontend code is private"],
    rubric: {
      criteria: [
        { name: "Exposure", weight: 5, keywords: ["public", "bundle", "git history", "leak"] },
        { name: "Storage", weight: 5, keywords: ["environment variable", "secrets manager", "server", "rotate"] },
      ],
    },
    modelAnswer:
      "Everything shipped to the browser can be read by anyone, and anything committed to git stays in its history. Keep secrets on the server in environment variables or a secrets manager, inject them at runtime, and rotate any secret that leaks. Base64 is an encoding, not encryption.",
    followUpIds: [],
  },
  // --- Fullstack / Senior ---
  {
    id: "iq-fs-caching-sr-1",
    track: "fullstack",
    tags: ["caching", "performance", "web"],
    difficulty: 4,
    type: "debugging",
    level: "senior",
    prompt:
      "After each deploy, some users get a broken single-page app: their browser cached index.html for a day, and it points at JavaScript bundles that no longer exist. What is the standard fix?",
    options: [
      "Serve index.html with Cache-Control: no-cache, and give content-hashed asset files a long-lived immutable cache",
      "Cache index.html and every asset for a year",
      "Add a random query string to every link in the app",
      "Turn off HTTP caching for every file",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "index.html must be revalidated on every load",
      "hashed file names change when content changes",
      "hashed assets can be cached for a long time",
      "keep previous assets available during rollout",
    ],
    redFlags: ["disable all caching", "cache the HTML for a year"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["stale html", "old bundle", "404", "cached"] },
        { name: "Fix", weight: 5, keywords: ["no-cache", "content hash", "immutable", "max-age"] },
      ],
    },
    modelAnswer:
      "The HTML entry point must always be revalidated (Cache-Control: no-cache), because it decides which bundles load. Bundles get content hashes in their file names, so they can be cached for a year as immutable: a new deploy produces new names. Keeping the previous build's assets available for a while also protects users who already have the old page open. Disabling caching everywhere fixes the bug but makes every visit slow.",
    followUpIds: [],
  },
  {
    id: "iq-fs-hydration-sr-1",
    track: "fullstack",
    tags: ["ssr vs csr", "next.js", "react"],
    difficulty: 4,
    type: "debugging",
    level: "senior",
    prompt:
      "A server-rendered React page logs hydration mismatch warnings. Its component renders `new Date().toLocaleTimeString()`. What is the cause?",
    options: [
      "The server and the browser produce different text (a different time and locale), so the first client render does not match the server HTML",
      "React cannot hydrate components that render Date values",
      "Only class components can be hydrated",
      "Server rendering does not support JavaScript's Intl APIs",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "hydration expects the same output on server and client",
      "time, randomness and locale differ between environments",
      "render such values after mount (useEffect) or pass them from the server",
    ],
    redFlags: ["ignore hydration warnings", "SSR cannot render dates"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["mismatch", "server", "client", "different output"] },
        { name: "Fix", weight: 5, keywords: ["useEffect", "after mount", "pass from server", "suppressHydrationWarning"] },
      ],
    },
    modelAnswer:
      "Hydration attaches React to the server's HTML and expects the client's first render to produce the same output. The current time and the user's locale differ between the server and the browser, so the text differs. Render such values after mount (for example in useEffect), or compute them once on the server and pass them down, so both renders agree.",
    followUpIds: [],
  },
  {
    id: "iq-fs-idor-sr-1",
    track: "fullstack",
    tags: ["security", "authentication", "owasp"],
    difficulty: 4,
    type: "theory",
    level: "senior",
    prompt:
      "A signed-in user changes /api/invoices/123 to /api/invoices/124 and sees another customer's invoice. What is the vulnerability, and the fix?",
    options: [
      "Broken object-level authorisation (IDOR): on every request, check on the server that the record belongs to the caller",
      "Cross-site scripting: escape the invoice HTML",
      "Cross-site request forgery: add a CSRF token to the request",
      "SQL injection: use parameterised queries",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "authentication is not authorisation",
      "scope every query to the caller's ownership",
      "unguessable ids are not access control",
      "return 404 for other users' records",
    ],
    redFlags: ["hiding the id in the UI is enough", "random ids fix it"],
    rubric: {
      criteria: [
        { name: "Vulnerability", weight: 5, keywords: ["IDOR", "object-level", "authorisation", "broken access control"] },
        { name: "Fix", weight: 5, keywords: ["ownership check", "server-side", "scope query", "404"] },
      ],
    },
    modelAnswer:
      "This is broken object-level authorisation, also called an insecure direct object reference (IDOR): the API checks that the user is signed in but not that the invoice is theirs. Every read and write must be scoped on the server to the caller (for example `WHERE id = $1 AND user_id = $2`), returning 404 otherwise. Unguessable ids reduce the risk but are not access control.",
    followUpIds: [],
  },
  // --- DevOps / Junior ---
  {
    id: "iq-do-docker-jr-2",
    track: "devops",
    tags: ["docker", "containers"],
    difficulty: 2,
    type: "ops",
    level: "junior",
    prompt:
      "In a Node.js Dockerfile, why copy package.json and install dependencies before copying the rest of the source code?",
    options: [
      "So the dependency layer stays cached and is only rebuilt when package.json changes, which makes rebuilds faster",
      "Because npm install must be the first instruction in a Dockerfile",
      "To make the container run as a non-root user",
      "Because copying the source first deletes node_modules",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "each instruction creates a cached layer",
      "a changed input invalidates that layer and the ones after it",
      "dependencies change less often than source code",
    ],
    redFlags: ["layer order does not matter", "caching makes images insecure"],
    rubric: {
      criteria: [
        { name: "Layers", weight: 5, keywords: ["layer", "cache", "invalidate", "order"] },
        { name: "Practice", weight: 5, keywords: ["package.json", "lockfile", "install first", "faster builds"] },
      ],
    },
    modelAnswer:
      "Docker caches each instruction as a layer and reuses it until one of its inputs changes; a change invalidates that layer and every later one. Copying only package.json and the lockfile, installing, and then copying the source means ordinary code changes reuse the cached dependency layer, so rebuilds take seconds instead of reinstalling everything.",
    followUpIds: [],
  },
  {
    id: "iq-do-ci-jr-1",
    track: "devops",
    tags: ["devops", "github actions", "testing"],
    difficulty: 1,
    type: "ops",
    level: "junior",
    prompt: "What is the main purpose of a CI pipeline that runs on every pull request?",
    options: [
      "To build and test each change automatically, so problems are caught before it is merged",
      "To deploy every branch straight to production",
      "To replace code review",
      "To back up the repository",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "automated build, lint and tests",
      "fast feedback before merging",
      "keeps the main branch releasable",
    ],
    redFlags: ["CI replaces code review", "CI deploys every branch to production"],
    rubric: {
      criteria: [
        { name: "Purpose", weight: 5, keywords: ["automated", "build", "test", "before merge"] },
        { name: "Benefits", weight: 5, keywords: ["fast feedback", "main branch", "releasable", "regressions"] },
      ],
    },
    modelAnswer:
      "Continuous integration builds the code and runs linting and tests automatically for every change, so broken builds and regressions are found before merging and the main branch stays releasable. It complements code review rather than replacing it; deployment is a separate (continuous delivery) step.",
    followUpIds: [],
  },
  {
    id: "iq-do-config-jr-1",
    track: "devops",
    tags: ["devops", "12-factor app", "secrets management"],
    difficulty: 1,
    type: "theory",
    level: "junior",
    prompt:
      "Following the twelve-factor app, where should settings that differ between staging and production (such as the database URL) live?",
    options: [
      "In environment variables that the app reads when it starts",
      "In the source code, with an if-statement per environment",
      "In a separate git branch for each environment",
      "Baked into a separate Docker image built for each environment",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "config is separate from code",
      "environment variables per deploy",
      "build once, deploy the same artifact everywhere",
    ],
    redFlags: ["one branch per environment", "rebuild the image per environment"],
    rubric: {
      criteria: [
        { name: "Principle", weight: 5, keywords: ["config", "environment", "separate from code"] },
        { name: "Practice", weight: 5, keywords: ["environment variable", "same artifact", "build once"] },
      ],
    },
    modelAnswer:
      "Twelve-factor apps keep configuration that varies between deploys out of the code, in environment variables read at startup. The same build artifact (for example one Docker image) is then promoted from staging to production unchanged; only the environment differs. Per-environment branches or images drift apart and mean production runs something that was never tested.",
    followUpIds: [],
  },
  // --- DevOps / Mid ---
  {
    id: "iq-do-probes-mid-1",
    track: "devops",
    tags: ["kubernetes", "high availability"],
    difficulty: 3,
    type: "ops",
    level: "mid",
    prompt: "What is the difference between a Kubernetes readiness probe and a liveness probe?",
    options: [
      "A failing readiness probe takes the pod out of Service endpoints (no traffic); a failing liveness probe makes the kubelet restart the container",
      "A failing readiness probe restarts the container; a failing liveness probe takes it out of Service endpoints",
      "They are the same check; liveness is the older name",
      "Readiness runs once at startup and liveness only runs in development",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "readiness controls whether traffic is sent",
      "liveness restarts stuck containers",
      "a liveness check should not depend on downstream services",
    ],
    redFlags: ["probes are interchangeable", "liveness should check the database"],
    rubric: {
      criteria: [
        { name: "Readiness", weight: 5, keywords: ["traffic", "endpoints", "not ready", "service"] },
        { name: "Liveness", weight: 5, keywords: ["restart", "kubelet", "deadlock", "stuck"] },
      ],
    },
    modelAnswer:
      "Readiness answers 'can this pod take traffic now?': while it fails, the pod is removed from the Service's endpoints but keeps running. Liveness answers 'is this container stuck?': when it fails repeatedly, the kubelet restarts the container. Liveness checks should be cheap and not depend on databases or other services, or an outage elsewhere turns into a restart loop.",
    followUpIds: [],
  },
  {
    id: "iq-do-canary-mid-1",
    track: "devops",
    tags: ["release strategies", "canary releases", "blue/green deploys"],
    difficulty: 2,
    type: "ops",
    level: "mid",
    prompt: "What is a canary release?",
    options: [
      "Rolling a new version out to a small share of traffic first, watching its metrics, then widening the rollout or rolling back",
      "Running two full environments and switching all traffic from one to the other at once",
      "Deploying at night, when traffic is lowest",
      "Testing a release in a staging environment that mirrors production",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "small percentage of traffic first",
      "compare error rates and latency",
      "automatic rollback on bad metrics",
      "blue/green switches all traffic at once",
    ],
    redFlags: ["canary means deploying at night", "canary and blue/green are the same"],
    rubric: {
      criteria: [
        { name: "Definition", weight: 5, keywords: ["small share", "percentage", "gradual", "subset"] },
        { name: "Safety", weight: 5, keywords: ["metrics", "rollback", "monitor", "compare"] },
      ],
    },
    modelAnswer:
      "A canary release sends a small share of real traffic (say 5%) to the new version, compares its error rate and latency with the current version, and then increases the share step by step, or rolls back if the metrics get worse. Blue/green deployment instead keeps two full environments and switches all traffic at once.",
    followUpIds: [],
  },
  {
    id: "iq-do-tfstate-mid-1",
    track: "devops",
    tags: ["terraform", "iac"],
    difficulty: 3,
    type: "ops",
    level: "mid",
    prompt:
      "Why should a team keep Terraform state in a remote backend with locking (for example S3 with a lock table, or Terraform Cloud)?",
    options: [
      "So everyone works from the same state, and two applies cannot run at once and corrupt it",
      "Because local state files cannot hold more than 100 resources",
      "Because remote state makes terraform plan unnecessary",
      "Because locking encrypts the cloud provider's credentials",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "state maps configuration to real resources",
      "one shared source of truth",
      "locking prevents concurrent applies",
      "state can contain secrets: encrypt and restrict it",
    ],
    redFlags: ["commit the state file to git", "state is optional"],
    rubric: {
      criteria: [
        { name: "Shared state", weight: 5, keywords: ["shared", "remote", "source of truth", "team"] },
        { name: "Locking", weight: 5, keywords: ["lock", "concurrent", "corrupt", "apply"] },
      ],
    },
    modelAnswer:
      "Terraform state records which real resources each piece of configuration manages. A remote backend gives the whole team (and CI) one shared copy instead of diverging local files, and state locking stops two applies running at the same time and corrupting it. State can contain secrets, so the backend should be encrypted and access-controlled, and never committed to git.",
    followUpIds: [],
  },
  // --- DevOps / Senior ---
  {
    id: "iq-do-slo-sr-1",
    track: "devops",
    tags: ["slos/slas", "incident management", "metrics"],
    difficulty: 4,
    type: "ops",
    level: "senior",
    prompt:
      "Your service has a 99.9% monthly availability SLO and its error budget for the month is already used up. What does SRE practice suggest?",
    options: [
      "Put reliability work first and slow down or freeze risky releases until the budget recovers",
      "Raise the SLO to 99.99% to motivate the team",
      "Stop measuring availability until next month",
      "Ship features faster to win users back",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the error budget is 100% minus the SLO",
      "an exhausted budget shifts effort to reliability",
      "release policy is tied to the budget",
      "blameless postmortems for the incidents that used it",
    ],
    redFlags: ["ignore the SLO", "raise targets when they are missed"],
    rubric: {
      criteria: [
        { name: "Error budget", weight: 5, keywords: ["error budget", "0.1%", "SLO", "consumed"] },
        { name: "Response", weight: 5, keywords: ["freeze", "reliability", "postmortem", "slow releases"] },
      ],
    },
    modelAnswer:
      "A 99.9% SLO allows 0.1% unavailability per month: the error budget. While budget remains, the team can take release risk; once it is spent, the agreed policy is to prioritise reliability fixes and slow or freeze risky changes until the service is back within budget, and to learn from the incidents in blameless postmortems.",
    followUpIds: [],
  },
  {
    id: "iq-do-oom-sr-1",
    track: "devops",
    tags: ["kubernetes", "containers", "performance"],
    difficulty: 4,
    type: "debugging",
    level: "senior",
    prompt:
      "Under load, a pod's container is repeatedly OOMKilled even though its node still has free memory. What is the most likely cause?",
    options: [
      "The container's memory limit is below what the app needs at peak, so it is killed when it exceeds its own limit",
      "The node's CPU limit is too low",
      "The liveness probe timeout is too short",
      "The Service in front of the pod has too few endpoints",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "limits are enforced per container (cgroup)",
      "OOMKilled means the memory limit was exceeded",
      "measure peak usage and set requests and limits to match",
      "runtimes like Node.js or the JVM need heap settings that fit the limit",
    ],
    redFlags: ["CPU limits cause OOMKilled", "free node memory prevents OOM kills"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["memory limit", "cgroup", "exceeds", "OOMKilled"] },
        { name: "Fix", weight: 5, keywords: ["raise limit", "requests", "heap size", "profile"] },
      ],
    },
    modelAnswer:
      "Memory limits are enforced per container by its cgroup: when the container goes over its own limit, the kernel kills it (OOMKilled), regardless of free memory on the node. Measure peak usage, set requests and limits to match, and size the runtime's heap (for example Node's --max-old-space-size or the JVM's -Xmx) to fit inside the limit. A failing liveness probe causes restarts, not OOM kills.",
    followUpIds: [],
  },
  {
    id: "iq-do-tracing-sr-1",
    track: "devops",
    tags: ["tracing", "opentelemetry", "microservices"],
    difficulty: 4,
    type: "ops",
    level: "senior",
    prompt:
      "A request passes through six microservices and is only sometimes slow. What shows where the time went in one slow request?",
    options: [
      "Distributed tracing (for example OpenTelemetry), which records a timed span for each hop under one trace id",
      "CPU usage charts for each host",
      "Setting one service's log level to DEBUG",
      "An uptime check that runs every minute",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "a trace follows one request across services",
      "spans record timing per operation",
      "context propagation between services",
      "metrics and logs show aggregates, not one request's path",
    ],
    redFlags: ["averages find intermittent latency", "uptime checks show latency per hop"],
    rubric: {
      criteria: [
        { name: "Concept", weight: 5, keywords: ["trace", "span", "trace id", "propagation"] },
        { name: "Tooling", weight: 5, keywords: ["OpenTelemetry", "Jaeger", "sampling", "waterfall"] },
      ],
    },
    modelAnswer:
      "Distributed tracing gives each request a trace id that is propagated between services; every hop records a span with its start time and duration, so one slow request shows as a waterfall that points at the slow hop. OpenTelemetry is the common standard, with backends such as Jaeger. Host metrics and logs show aggregates or isolated events, not one request's path.",
    followUpIds: [],
  },
];

/**
 * Salt for storedOptionOrder, picked so the current bank's answer keys are
 * spread evenly over A-D. Never change it: that would reorder the options
 * of every question, including ones that sessions have answered.
 */
const OPTION_ORDER_SALT = "option-order-2288";

/**
 * A fixed pseudo-random order of a question's options, derived from its id
 * (sha256-seeded Fisher–Yates): the same on every run, so re-seeding never
 * reorders the options of a question that sessions are using.
 * `order[stored] = authored index`.
 */
function storedOptionOrder(id: string, count: number): number[] {
  const seed = createHash("sha256").update(`${OPTION_ORDER_SALT}:${id}`).digest();
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = seed.readUInt16BE((i * 2) % (seed.length - 1)) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The options in stored order, with the answer key remapped to match. */
function storedOptions(q: SeedQuestion): {
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices: number[];
} {
  const order = storedOptionOrder(q.id, q.options.length);
  const storedIndexOf = (authored: number) => order.indexOf(authored);
  const correct = q.multiSelect ? (q.correctOptionIndices ?? []) : [q.correctOptionIndex];
  return {
    options: order.map((authored) => q.options[authored]),
    correctOptionIndex: storedIndexOf(q.correctOptionIndex),
    correctOptionIndices: [...new Set(correct.map(storedIndexOf))].sort((a, b) => a - b),
  };
}

const TRACKS = new Set(["frontend", "backend", "fullstack", "devops"]);
const LEVELS = new Set(["junior", "mid", "senior"]);

/** Fails loudly on bad seed data instead of writing an unusable question. */
function validateQuestion(q: SeedQuestion, ids: ReadonlySet<string>): void {
  const problems: string[] = [];
  if (!TRACKS.has(q.track)) problems.push(`unknown track "${q.track}"`);
  if (!LEVELS.has(q.level)) problems.push(`unknown level "${q.level}"`);
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) {
    problems.push("difficulty must be 1-5");
  }
  for (const tag of q.tags) {
    if (!isKnownTag(tag) || normalizeTag(tag) !== tag) {
      problems.push(`tag "${tag}" is not a catalog id (use "${normalizeTag(tag)}")`);
    }
  }
  if (q.options.length < 2) problems.push("needs at least 2 options");
  if (new Set(q.options).size !== q.options.length) problems.push("options must be unique");
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < q.options.length;
  if (!inRange(q.correctOptionIndex)) problems.push("correctOptionIndex out of range");
  if (q.multiSelect) {
    const indices = q.correctOptionIndices ?? [];
    if (indices.length < 2 || !indices.every(inRange)) {
      problems.push("multi-select questions need 2+ valid correctOptionIndices");
    }
    if (!indices.includes(q.correctOptionIndex)) {
      problems.push("correctOptionIndex must be one of correctOptionIndices");
    }
  }
  for (const id of q.followUpIds) {
    if (!ids.has(id)) problems.push(`follow-up "${id}" is not a seed question`);
  }
  if (problems.length > 0) {
    throw new Error(`Seed question ${q.id}: ${problems.join("; ")}`);
  }
}

async function seedQuestionBank(): Promise<void> {
  const ids = new Set(INTERVIEW_QUESTIONS.map((q) => q.id));
  for (const q of INTERVIEW_QUESTIONS) validateQuestion(q, ids);

  for (const q of INTERVIEW_QUESTIONS) {
    const multiSelect = q.multiSelect ?? false;
    const fields = {
      track: q.track,
      tags: q.tags,
      difficulty: q.difficulty,
      type: q.type,
      level: q.level,
      prompt: q.prompt,
      ...storedOptions(q),
      multiSelect,
      expectedPoints: q.expectedPoints,
      redFlags: q.redFlags,
      rubric: q.rubric,
      modelAnswer: q.modelAnswer,
      followUpIds: q.followUpIds,
      source: "seed",
      generatedForHash: null,
    };
    await prisma.interviewQuestion.upsert({
      where: { id: q.id },
      create: { id: q.id, ...fields },
      update: fields,
    });
  }
  console.log(`Seeded ${INTERVIEW_QUESTIONS.length} interview questions`);
}

/**
 * Seed questions whose id is no longer in INTERVIEW_QUESTIONS (replaced by a
 * new version): archived (moved out of every pool) when a session used
 * them, so its history still shows what was asked; deleted otherwise.
 */
async function retireOldSeedQuestions(): Promise<void> {
  const current = INTERVIEW_QUESTIONS.map((q) => q.id);
  const rows = await prisma.interviewQuestion.findMany({
    where: { source: "seed", id: { notIn: current }, level: { not: ARCHIVED_LEVEL } },
    select: { id: true, _count: { select: { sessionQuestions: true } } },
  });
  const used = rows.filter((row) => row._count.sessionQuestions > 0).map((row) => row.id);
  const unused = rows.filter((row) => row._count.sessionQuestions === 0).map((row) => row.id);
  if (used.length > 0) {
    await prisma.interviewQuestion.updateMany({
      where: { id: { in: used } },
      data: { level: ARCHIVED_LEVEL, followUpIds: [] },
    });
  }
  if (unused.length > 0) {
    await prisma.interviewQuestion.deleteMany({ where: { id: { in: unused } } });
  }
  if (rows.length > 0) {
    console.log(`Old seed questions: ${used.length} archived, ${unused.length} removed`);
  }
}

/**
 * AI questions generated before tags were validated may carry free-text tags.
 * Keep only catalog tags; a question whose tags were all outside the catalog
 * is deleted, or archived (moved out of every pool) when sessions reference it.
 */
async function tidyAiQuestionTags(): Promise<void> {
  const rows = await prisma.interviewQuestion.findMany({
    where: { source: "ai-generated", level: { not: ARCHIVED_LEVEL } },
    select: { id: true, tags: true, _count: { select: { sessionQuestions: true } } },
  });
  let retagged = 0;
  let removed = 0;
  let archived = 0;
  for (const row of rows) {
    const { tags } = normalizeTags(row.tags);
    if (row.tags.length > 0 && tags.length === 0) {
      if (row._count.sessionQuestions === 0) {
        await prisma.interviewQuestion.delete({ where: { id: row.id } });
        removed++;
      } else {
        await prisma.interviewQuestion.update({
          where: { id: row.id },
          data: { tags: [], level: ARCHIVED_LEVEL },
        });
        archived++;
      }
    } else if (tags.length !== row.tags.length || tags.some((tag, i) => tag !== row.tags[i])) {
      await prisma.interviewQuestion.update({ where: { id: row.id }, data: { tags } });
      retagged++;
    }
  }
  if (retagged + removed + archived > 0) {
    console.log(
      `AI questions: ${retagged} retagged, ${removed} removed, ${archived} archived (non-catalog tags)`,
    );
  }
}

async function seedDevUsers(): Promise<void> {
  for (const dev of DEV_USERS) {
    const plan = dev.premium
      ? {
          isPremium: true,
          stripeCurrentPeriodEnd: DEV_PREMIUM_PERIOD_END,
          subscriptionStatus: "active",
        }
      : { isPremium: false, stripeCurrentPeriodEnd: null, subscriptionStatus: null };
    await prisma.user.upsert({
      where: { email: dev.email },
      update: plan,
      create: { email: dev.email, name: dev.name, ...plan },
    });
  }
  console.log(`Seeded dev users: ${DEV_USERS.map((u) => u.email).join(", ")}`);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && args.has("--with-dev-users")) {
    throw new Error("Refusing to create dev users when NODE_ENV=production.");
  }

  await seedQuestionBank();
  await retireOldSeedQuestions();
  await tidyAiQuestionTags();

  if (isProduction) {
    console.log("NODE_ENV=production: dev users skipped.");
  } else if (args.has("--no-dev-users")) {
    console.log("--no-dev-users: dev users skipped.");
  } else {
    await seedDevUsers();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
