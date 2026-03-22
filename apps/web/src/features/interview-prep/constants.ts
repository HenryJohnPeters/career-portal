import type { OptionItem } from "../shared";
import type { InterviewRoleFocus } from "@careerportal/shared/types";

export const PERSONA_ITEMS: OptionItem[] = [
  {
    key: "friendly",
    icon: "Smile",
    label: "Friendly",
    description: "Encouraging and supportive",
  },
  {
    key: "neutral",
    icon: "Handshake",
    label: "Neutral",
    description: "Professional and balanced",
  },
  {
    key: "tough",
    icon: "Flame",
    label: "Tough",
    description: "Challenging and direct",
  },
];

export const ROLE_FOCUS_ITEMS: OptionItem[] = [
  {
    key: "frontend",
    icon: "Palette",
    label: "Frontend",
    description: "UI frameworks, state, styling",
  },
  {
    key: "backend",
    icon: "Settings",
    label: "Backend",
    description: "APIs, databases, services",
  },
  {
    key: "fullstack",
    icon: "Link",
    label: "Fullstack",
    description: "End-to-end development",
  },
  {
    key: "platform",
    icon: "Cloud",
    label: "Platform / DevOps",
    description: "Cloud, CI/CD, infrastructure",
  },
];

export const INTERVIEW_TYPE_ITEMS: OptionItem[] = [
  {
    key: "coding",
    icon: "Laptop",
    label: "Coding",
    description: "Algorithms & implementation",
  },
  {
    key: "system-design",
    icon: "Building",
    label: "System Design",
    description: "Architecture & trade-offs",
  },
  {
    key: "behavioral",
    icon: "MessageCircle",
    label: "Behavioral",
    description: "STAR format & soft skills",
  },
];

export const DIFFICULTY_ITEMS: OptionItem[] = [
  { key: "easy", icon: "Circle", label: "Easy" },
  { key: "medium", icon: "Circle", label: "Medium" },
  { key: "hard", icon: "Circle", label: "Hard" },
];

export const DURATION_ITEMS: OptionItem[] = [
  { key: "30", icon: "Zap", label: "30 min", description: "Quick round" },
  { key: "60", icon: "Clock", label: "60 min", description: "Standard" },
  { key: "90", icon: "Clock", label: "90 min", description: "Deep dive" },
];

export const COMPANY_STYLE_ITEMS: OptionItem[] = [
  {
    key: "faang",
    icon: "Building2",
    label: "FAANG-style",
    description: "LC-heavy, bar-raiser",
  },
  {
    key: "startup",
    icon: "Rocket",
    label: "Startup",
    description: "Practical, ship-fast",
  },
  {
    key: "enterprise",
    icon: "Building2",
    label: "Enterprise",
    description: "Process & compliance",
  },
];

/* ── Role-aware Tech Stack Pathway ── */

export interface TechPathway {
  key: string;
  label: string;
  icon: string;
  description: string;
  items: string[];
}

/**
 * Each role focus maps to a curated set of "pathways" —
 * logical groupings of technologies relevant to that interview track.
 * This replaces the big flat category list with something niche & intuitive.
 */
export const ROLE_TECH_PATHWAYS: Record<InterviewRoleFocus, TechPathway[]> = {
  frontend: [
    {
      key: "fe-language",
      label: "Language",
      icon: "FileCode",
      description: "Pick your primary language",
      items: ["TypeScript", "JavaScript"],
    },
    {
      key: "fe-framework",
      label: "UI Framework",
      icon: "Layout",
      description: "Which framework are you interviewing for?",
      items: ["React", "Angular", "Vue", "Svelte", "Solid"],
    },
    {
      key: "fe-meta-framework",
      label: "Meta-Framework",
      icon: "Package",
      description: "Full-stack or SSR framework",
      items: ["Next.js", "Nuxt", "Remix", "Astro", "SvelteKit"],
    },
    {
      key: "fe-state",
      label: "State Management",
      icon: "RefreshCw",
      description: "How you manage application state",
      items: [
        "Redux",
        "Zustand",
        "MobX",
        "Jotai",
        "Recoil",
        "Pinia",
        "NgRx",
        "Context API",
        "TanStack Query",
      ],
    },
    {
      key: "fe-styling",
      label: "Styling & UI",
      icon: "Paintbrush",
      description: "CSS approach and component libraries",
      items: [
        "Tailwind CSS",
        "CSS Modules",
        "Styled Components",
        "Sass/SCSS",
        "Emotion",
        "Chakra UI",
        "Material UI",
        "Radix UI",
        "Shadcn",
        "Ant Design",
      ],
    },
    {
      key: "fe-testing",
      label: "Testing",
      icon: "FlaskConical",
      description: "Testing tools and approaches",
      items: [
        "Jest",
        "Vitest",
        "React Testing Library",
        "Cypress",
        "Playwright",
        "Storybook",
      ],
    },
    {
      key: "fe-tooling",
      label: "Build & Tooling",
      icon: "Wrench",
      description: "Bundlers, linters, and dev tools",
      items: [
        "Vite",
        "Webpack",
        "esbuild",
        "Turbopack",
        "ESLint",
        "Prettier",
        "Monorepos",
        "Nx",
      ],
    },
    {
      key: "fe-concepts",
      label: "Core Concepts",
      icon: "Lightbulb",
      description: "Key frontend interview topics",
      items: [
        "Performance Optimization",
        "Accessibility (a11y)",
        "SEO",
        "Web Vitals",
        "PWA",
        "Responsive Design",
        "Browser APIs",
        "WebSockets",
        "GraphQL",
        "REST",
      ],
    },
  ],

  backend: [
    {
      key: "be-language",
      label: "Language",
      icon: "FileCode",
      description: "Pick your primary backend language",
      items: [
        "TypeScript",
        "JavaScript",
        "C#",
        "Java",
        "Python",
        "Go",
        "Rust",
        "PHP",
        "Ruby",
        "Kotlin",
      ],
    },
    {
      key: "be-framework",
      label: "Framework",
      icon: "Layers",
      description: "Which backend framework are you interviewing for?",
      items: [
        "NestJS",
        "Express",
        "Fastify",
        ".NET",
        "Spring Boot",
        "Django",
        "FastAPI",
        "Flask",
        "Rails",
        "Gin",
        "Actix",
        "Laravel",
        "Hono",
      ],
    },
    {
      key: "be-database",
      label: "Database",
      icon: "Database",
      description: "Primary database technology",
      items: [
        "PostgreSQL",
        "MySQL",
        "SQL Server",
        "MongoDB",
        "Redis",
        "DynamoDB",
        "Cassandra",
        "Elasticsearch",
        "SQLite",
        "Neo4j",
      ],
    },
    {
      key: "be-orm",
      label: "ORM / Data Access",
      icon: "Link",
      description: "How you interact with your database",
      items: [
        "Prisma",
        "TypeORM",
        "Drizzle",
        "Sequelize",
        "EF Core",
        "Dapper",
        "Hibernate",
        "SQLAlchemy",
        "Mongoose",
        "Knex",
      ],
    },
    {
      key: "be-api",
      label: "API Design",
      icon: "Globe",
      description: "API patterns and protocols",
      items: [
        "REST",
        "GraphQL",
        "gRPC",
        "WebSockets",
        "tRPC",
        "OpenAPI/Swagger",
        "API Versioning",
      ],
    },
    {
      key: "be-messaging",
      label: "Messaging & Events",
      icon: "Mail",
      description: "Async communication patterns",
      items: [
        "RabbitMQ",
        "Kafka",
        "SQS/SNS",
        "Redis Pub/Sub",
        "Event Sourcing",
        "CQRS",
        "BullMQ",
      ],
    },
    {
      key: "be-auth",
      label: "Auth & Security",
      icon: "Lock",
      description: "Authentication and security patterns",
      items: [
        "JWT",
        "OAuth 2.0",
        "OIDC",
        "Passport.js",
        "RBAC",
        "OWASP",
        "Encryption",
        "Rate Limiting",
        "CORS",
      ],
    },
    {
      key: "be-testing",
      label: "Testing",
      icon: "FlaskConical",
      description: "Backend testing strategies",
      items: [
        "Jest",
        "Vitest",
        "Supertest",
        "xUnit",
        "pytest",
        "Integration Testing",
        "Contract Testing",
        "Load Testing",
      ],
    },
    {
      key: "be-concepts",
      label: "Core Concepts",
      icon: "Lightbulb",
      description: "Key backend interview topics",
      items: [
        "Scaling",
        "Caching",
        "Queues",
        "Microservices",
        "Monolith",
        "Distributed Systems",
        "Consistency",
        "Transactions",
        "Connection Pooling",
        "Background Jobs",
      ],
    },
  ],

  fullstack: [
    {
      key: "fs-language",
      label: "Language",
      icon: "FileCode",
      description: "Your primary development language",
      items: [
        "TypeScript",
        "JavaScript",
        "C#",
        "Java",
        "Python",
        "Go",
        "Rust",
        "PHP",
      ],
    },
    {
      key: "fs-frontend",
      label: "Frontend Framework",
      icon: "Layout",
      description: "UI framework you'll be tested on",
      items: ["React", "Angular", "Vue", "Svelte", "Next.js", "Nuxt", "Remix"],
    },
    {
      key: "fs-backend",
      label: "Backend Framework",
      icon: "Layers",
      description: "Server-side framework",
      items: [
        "NestJS",
        "Express",
        "Fastify",
        ".NET",
        "Spring Boot",
        "Django",
        "FastAPI",
        "Rails",
        "Hono",
      ],
    },
    {
      key: "fs-database",
      label: "Database",
      icon: "Database",
      description: "Database technologies",
      items: [
        "PostgreSQL",
        "MySQL",
        "SQL Server",
        "MongoDB",
        "Redis",
        "DynamoDB",
        "SQLite",
      ],
    },
    {
      key: "fs-orm",
      label: "ORM / Data Access",
      icon: "Link",
      description: "Data layer tooling",
      items: [
        "Prisma",
        "TypeORM",
        "Drizzle",
        "EF Core",
        "Mongoose",
        "SQLAlchemy",
      ],
    },
    {
      key: "fs-api",
      label: "API & Communication",
      icon: "Globe",
      description: "How frontend and backend talk",
      items: ["REST", "GraphQL", "tRPC", "WebSockets", "Server-Sent Events"],
    },
    {
      key: "fs-state",
      label: "State & Data Fetching",
      icon: "RefreshCw",
      description: "Client-side state and data",
      items: [
        "Redux",
        "Zustand",
        "TanStack Query",
        "SWR",
        "Pinia",
        "NgRx",
        "Context API",
      ],
    },
    {
      key: "fs-testing",
      label: "Testing",
      icon: "FlaskConical",
      description: "Full-stack testing approach",
      items: [
        "Jest",
        "Vitest",
        "Cypress",
        "Playwright",
        "React Testing Library",
        "Supertest",
      ],
    },
    {
      key: "fs-deploy",
      label: "Deployment",
      icon: "Rocket",
      description: "How you ship to production",
      items: [
        "Vercel",
        "Netlify",
        "Docker",
        "AWS",
        "Azure",
        "GCP",
        "Railway",
        "Fly.io",
      ],
    },
    {
      key: "fs-concepts",
      label: "Core Concepts",
      icon: "Lightbulb",
      description: "Key fullstack interview topics",
      items: [
        "SSR vs CSR",
        "Authentication",
        "Caching",
        "Performance",
        "SEO",
        "Accessibility",
        "Monorepos",
        "Microservices",
        "System Design",
      ],
    },
  ],

  platform: [
    {
      key: "pl-cloud",
      label: "Cloud Provider",
      icon: "Cloud",
      description: "Which cloud platform?",
      items: ["AWS", "Azure", "GCP", "DigitalOcean", "Cloudflare", "Hetzner"],
    },
    {
      key: "pl-containers",
      label: "Containers & Orchestration",
      icon: "Box",
      description: "Container runtime and management",
      items: [
        "Docker",
        "Kubernetes",
        "ECS",
        "Helm",
        "Podman",
        "Docker Compose",
        "K3s",
      ],
    },
    {
      key: "pl-iac",
      label: "Infrastructure as Code",
      icon: "FileText",
      description: "How you define infrastructure",
      items: [
        "Terraform",
        "Pulumi",
        "CloudFormation",
        "Bicep",
        "Ansible",
        "CDK",
        "Crossplane",
      ],
    },
    {
      key: "pl-cicd",
      label: "CI/CD",
      icon: "Repeat",
      description: "Build and deployment pipelines",
      items: [
        "GitHub Actions",
        "GitLab CI",
        "Azure DevOps",
        "Jenkins",
        "CircleCI",
        "ArgoCD",
        "Flux",
        "Tekton",
      ],
    },
    {
      key: "pl-observability",
      label: "Observability",
      icon: "BarChart",
      description: "Monitoring, logging, and tracing",
      items: [
        "Prometheus",
        "Grafana",
        "OpenTelemetry",
        "Datadog",
        "CloudWatch",
        "Sentry",
        "ELK Stack",
        "Loki",
        "Jaeger",
      ],
    },
    {
      key: "pl-networking",
      label: "Networking",
      icon: "Wifi",
      description: "Network and traffic management",
      items: [
        "DNS",
        "Load Balancers",
        "CDN",
        "Service Mesh",
        "Istio",
        "Nginx",
        "Traefik",
        "API Gateway",
      ],
    },
    {
      key: "pl-security",
      label: "Security",
      icon: "Shield",
      description: "Platform security practices",
      items: [
        "Secrets Management",
        "Vault",
        "IAM",
        "Network Policies",
        "RBAC",
        "Encryption",
        "Compliance",
        "Threat Modeling",
      ],
    },
    {
      key: "pl-sre",
      label: "SRE & Reliability",
      icon: "ShieldCheck",
      description: "Reliability engineering concepts",
      items: [
        "SLOs/SLAs",
        "Incident Management",
        "Chaos Engineering",
        "Runbooks",
        "Disaster Recovery",
        "Blue/Green Deploys",
        "Canary Releases",
        "Feature Flags",
      ],
    },
    {
      key: "pl-concepts",
      label: "Core Concepts",
      icon: "Lightbulb",
      description: "Key platform interview topics",
      items: [
        "Scaling",
        "High Availability",
        "Fault Tolerance",
        "Cost Optimization",
        "GitOps",
        "Immutable Infrastructure",
        "12-Factor App",
      ],
    },
  ],
};

/**
 * Collect all unique tags across all pathways for a given role.
 * Useful for validation and clearing irrelevant tags on role switch.
 */
export function getTagsForRole(role: InterviewRoleFocus): Set<string> {
  const pathways = ROLE_TECH_PATHWAYS[role] ?? [];
  const tags = new Set<string>();
  for (const p of pathways) {
    for (const item of p.items) tags.add(item);
  }
  return tags;
}
