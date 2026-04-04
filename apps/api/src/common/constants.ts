/* ═══════════════════════════════════════════════════════════════════════════
 * FREE-TIER LIMITS — Single source of truth for all free-user restrictions.
 * Every enforcement point in the codebase imports from here.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const FREE_TIER = {
  /** Max CV versions a free user can create */
  cvVersions: 1,
  /** Max cover letters a free user can create */
  coverLetters: 3,
  /** Monthly AI action quota (generate, improve, tailor, etc.) */
  monthlyAiActions: 5,
  /** Monthly mock interview sessions a free user can start */
  monthlyMockSessions: 3,
  /** Monthly interview questions a free user can answer */
  monthlyQuestions: 50,
  /** Monthly technical tests a free user can create */
  monthlyTechTests: 2,
  /** Number of interviewers available to free users (first N in the list) */
  interviewerCount: 3,
  /** CV template IDs available to free users */
  templateIds: [
    "classic",
    "modern",
    "minimal",
    "executive",
    "creative",
  ] as readonly string[],
} as const;

/** Templates available to free users */
export const FREE_TEMPLATE_IDS = FREE_TIER.templateIds;

/** Default CV sections created for every new version */
export const DEFAULT_CV_SECTIONS = [
  { title: "Profile", sectionType: "profile" },
  { title: "Experience", sectionType: "experience" },
  { title: "Education", sectionType: "education" },
  { title: "Skills", sectionType: "skills" },
  { title: "Projects", sectionType: "projects" },
] as const;

/** AI question-generation tunables */
export const AI_QUESTION_POOL_THRESHOLD = 5;
export const AI_QUESTION_BATCH_SIZE = 8;
export const AI_GENERATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const AI_URGENT_COOLDOWN_MS = 5 * 60 * 1000;
export const AI_MAX_USER_DAILY_GENERATIONS = 2;
export const AI_BACKGROUND_BUDGET = 30;
export const AI_PIGGYBACK_CHANCE = 0.15;

/** Difficulty mapping: label → numeric value */
export const DIFFICULTY_MAP: Readonly<Record<string, number>> = {
  easy: 1,
  medium: 3,
  hard: 5,
};

/** Difficulty label → numeric range for DB queries */
export const DIFFICULTY_RANGES: Readonly<
  Record<string, { gte: number; lte: number }>
> = {
  easy: { gte: 1, lte: 2 },
  medium: { gte: 2, lte: 4 },
  hard: { gte: 4, lte: 5 },
};

/** Level → default difficulty label */
export const LEVEL_TO_DIFFICULTY: Readonly<Record<string, string>> = {
  junior: "easy",
  mid: "medium",
  senior: "hard",
};

/** Role focus → track mapping for technical tests */
export const ROLE_TO_TRACK: Readonly<Record<string, string>> = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  platform: "devops",
};

/** Standard API success payload for delete operations */
export const DELETED_RESPONSE = { success: true } as const;

/** Structured tech-stack catalog for interview session setup. */
export const TECH_CATEGORIES: {
  key: string;
  label: string;
  items: string[];
}[] = [
  {
    key: "languages",
    label: "Languages",
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
    key: "frontend-frameworks",
    label: "Frontend Frameworks",
    items: ["React", "Angular", "Vue", "Svelte", "Next.js", "Nuxt", "Remix"],
  },
  {
    key: "backend-frameworks",
    label: "Backend Frameworks",
    items: [
      ".NET",
      "NestJS",
      "Express",
      "Fastify",
      "Spring Boot",
      "Django",
      "FastAPI",
    ],
  },
  {
    key: "databases",
    label: "Databases",
    items: ["Postgres", "MySQL", "SQL Server", "MongoDB", "Redis", "DynamoDB"],
  },
  {
    key: "orm-data-access",
    label: "ORM / Data Access",
    items: ["Prisma", "TypeORM", "EF Core", "Dapper", "Hibernate", "Mongoose"],
  },
  {
    key: "cloud-infrastructure",
    label: "Cloud / Infrastructure",
    items: [
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Terraform",
      "Serverless",
    ],
  },
  {
    key: "devops-delivery",
    label: "DevOps / Delivery",
    items: [
      "GitHub Actions",
      "GitLab CI",
      "Azure DevOps",
      "IaC",
      "Release Strategies",
    ],
  },
  {
    key: "observability",
    label: "Observability",
    items: [
      "Logging",
      "Metrics",
      "Tracing",
      "OpenTelemetry",
      "Sentry",
      "CloudWatch",
    ],
  },
  {
    key: "security",
    label: "Security",
    items: [
      "JWT",
      "OAuth",
      "OIDC",
      "OWASP",
      "Secrets Management",
      "Encryption",
      "RBAC",
      "Threat Modeling",
    ],
  },
  {
    key: "system-design",
    label: "System Design",
    items: [
      "Scaling",
      "Caching",
      "Queues",
      "Consistency",
      "Distributed Systems",
    ],
  },
];

/**
 * Sanitise a user-supplied tag before interpolating it into an AI prompt.
 * Strips anything that isn't alphanumeric, spaces, hyphens, dots, plus signs,
 * hash signs, or slashes (covers "C#", "C++", ".NET", "Next.js", "Node/Express").
 * Returns the cleaned string truncated to 50 chars, or null if empty after cleaning.
 */
export function sanitiseTag(raw: string): string | null {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9 \-_.+#/]/g, "")
    .trim()
    .slice(0, 50);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Sanitise an array of user-supplied tags for safe AI prompt interpolation.
 */
export function sanitiseTags(tags: string[]): string[] {
  return tags.map(sanitiseTag).filter((t): t is string => t !== null);
}
