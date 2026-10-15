/* ═══════════════════════════════════════════════════════════════════════════
 * TECH TAG CATALOG — canonical tech-stack tags for interview sessions,
 * technical tests and the question bank.
 *
 * This file exists twice, byte-identical:
 *   libs/shared/types/src/tech-tags.ts   (web)
 *   apps/api/src/common/tech-tags.ts     (API — cannot import libs at runtime)
 * apps/api/src/common/shared-mirror.spec.ts fails if they drift, so edit one
 * and copy it over the other.
 *
 * `id` is the lowercase value stored on sessions/tests/questions. Aliases are
 * other spellings (including legacy stored values such as "postgres") that
 * normalise to the id. Call normalizeTag() on raw input before validating —
 * do not strip characters first.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type TechTagCategoryKey =
  | "languages"
  | "language-concepts"
  | "frontend-frameworks"
  | "state-management"
  | "styling"
  | "frontend-concepts"
  | "build-tooling"
  | "testing"
  | "backend-frameworks"
  | "databases"
  | "orm-data-access"
  | "api-design"
  | "messaging"
  | "security"
  | "cloud-infrastructure"
  | "containers"
  | "iac"
  | "devops-delivery"
  | "observability"
  | "networking"
  | "reliability"
  | "system-design"
  | "engineering-practices"
  | "behavioral";

export interface TechTagCategory {
  key: TechTagCategoryKey;
  label: string;
}

export interface TechTag {
  /** Lowercase canonical id (what the API stores and filters on). */
  id: string;
  /** Display label. */
  label: string;
  category: TechTagCategoryKey;
  /** Lowercase alternative spellings that normalise to `id`. */
  aliases?: string[];
}

/** Maximum number of tags on one interview session or technical test. */
export const MAX_SELECTED_TAGS = 12;

export const TECH_TAG_CATEGORIES: readonly TechTagCategory[] = [
  { key: "languages", label: "Languages & Runtimes" },
  { key: "language-concepts", label: "Language Fundamentals" },
  { key: "frontend-frameworks", label: "Frontend Frameworks" },
  { key: "state-management", label: "State Management" },
  { key: "styling", label: "Styling & UI" },
  { key: "frontend-concepts", label: "Frontend Concepts" },
  { key: "build-tooling", label: "Build & Tooling" },
  { key: "testing", label: "Testing" },
  { key: "backend-frameworks", label: "Backend Frameworks" },
  { key: "databases", label: "Databases" },
  { key: "orm-data-access", label: "ORM / Data Access" },
  { key: "api-design", label: "APIs & Protocols" },
  { key: "messaging", label: "Messaging & Events" },
  { key: "security", label: "Security & Auth" },
  { key: "cloud-infrastructure", label: "Cloud & Hosting" },
  { key: "containers", label: "Containers & Orchestration" },
  { key: "iac", label: "Infrastructure as Code" },
  { key: "devops-delivery", label: "CI/CD & Delivery" },
  { key: "observability", label: "Observability" },
  { key: "networking", label: "Networking" },
  { key: "reliability", label: "SRE & Reliability" },
  { key: "system-design", label: "System Design & Architecture" },
  { key: "engineering-practices", label: "Engineering Practices" },
  { key: "behavioral", label: "Behavioral" },
];

export const TECH_TAG_CATALOG: readonly TechTag[] = [
  // Languages & runtimes
  { id: "typescript", label: "TypeScript", category: "languages", aliases: ["ts"] },
  { id: "javascript", label: "JavaScript", category: "languages", aliases: ["js", "ecmascript"] },
  { id: "node.js", label: "Node.js", category: "languages", aliases: ["node", "nodejs"] },
  { id: "c#", label: "C#", category: "languages", aliases: ["csharp", "c sharp"] },
  { id: "java", label: "Java", category: "languages" },
  { id: "python", label: "Python", category: "languages" },
  { id: "go", label: "Go", category: "languages", aliases: ["golang"] },
  { id: "rust", label: "Rust", category: "languages" },
  { id: "php", label: "PHP", category: "languages" },
  { id: "ruby", label: "Ruby", category: "languages" },
  { id: "kotlin", label: "Kotlin", category: "languages" },

  // Language fundamentals
  { id: "types", label: "Type Systems", category: "language-concepts", aliases: ["type system"] },
  { id: "generics", label: "Generics", category: "language-concepts" },
  { id: "async", label: "Async Programming", category: "language-concepts", aliases: ["async/await", "asynchronous programming"] },
  { id: "event-loop", label: "Event Loop", category: "language-concepts", aliases: ["event loop"] },

  // Frontend frameworks
  { id: "react", label: "React", category: "frontend-frameworks", aliases: ["react.js", "reactjs"] },
  { id: "angular", label: "Angular", category: "frontend-frameworks" },
  { id: "vue", label: "Vue", category: "frontend-frameworks", aliases: ["vue.js", "vuejs"] },
  { id: "svelte", label: "Svelte", category: "frontend-frameworks" },
  { id: "solid", label: "Solid", category: "frontend-frameworks", aliases: ["solidjs", "solid.js"] },
  { id: "next.js", label: "Next.js", category: "frontend-frameworks", aliases: ["nextjs"] },
  { id: "nuxt", label: "Nuxt", category: "frontend-frameworks", aliases: ["nuxt.js", "nuxtjs"] },
  { id: "remix", label: "Remix", category: "frontend-frameworks" },
  { id: "astro", label: "Astro", category: "frontend-frameworks" },
  { id: "sveltekit", label: "SvelteKit", category: "frontend-frameworks" },

  // State management
  { id: "state", label: "State Management", category: "state-management" },
  { id: "redux", label: "Redux", category: "state-management", aliases: ["redux toolkit"] },
  { id: "zustand", label: "Zustand", category: "state-management" },
  { id: "mobx", label: "MobX", category: "state-management" },
  { id: "jotai", label: "Jotai", category: "state-management" },
  { id: "recoil", label: "Recoil", category: "state-management" },
  { id: "pinia", label: "Pinia", category: "state-management" },
  { id: "ngrx", label: "NgRx", category: "state-management" },
  { id: "context api", label: "Context API", category: "state-management", aliases: ["react context"] },
  { id: "tanstack query", label: "TanStack Query", category: "state-management", aliases: ["react query", "react-query"] },
  { id: "swr", label: "SWR", category: "state-management" },

  // Styling & UI
  { id: "css", label: "CSS", category: "styling" },
  { id: "layout", label: "CSS Layout", category: "styling" },
  { id: "flexbox", label: "Flexbox", category: "styling" },
  { id: "responsive design", label: "Responsive Design", category: "styling", aliases: ["responsive"] },
  { id: "tailwind css", label: "Tailwind CSS", category: "styling", aliases: ["tailwind", "tailwindcss"] },
  { id: "css modules", label: "CSS Modules", category: "styling" },
  { id: "styled components", label: "Styled Components", category: "styling", aliases: ["styled-components"] },
  { id: "sass/scss", label: "Sass/SCSS", category: "styling", aliases: ["sass", "scss"] },
  { id: "emotion", label: "Emotion", category: "styling" },
  { id: "chakra ui", label: "Chakra UI", category: "styling" },
  { id: "material ui", label: "Material UI", category: "styling", aliases: ["mui"] },
  { id: "radix ui", label: "Radix UI", category: "styling" },
  { id: "shadcn", label: "Shadcn", category: "styling", aliases: ["shadcn/ui"] },
  { id: "ant design", label: "Ant Design", category: "styling", aliases: ["antd"] },

  // Frontend concepts
  { id: "components", label: "Components", category: "frontend-concepts" },
  { id: "hooks", label: "Hooks", category: "frontend-concepts", aliases: ["react hooks"] },
  { id: "performance", label: "Performance", category: "frontend-concepts", aliases: ["performance optimization", "performance optimisation"] },
  { id: "accessibility", label: "Accessibility", category: "frontend-concepts", aliases: ["accessibility (a11y)", "accessibility a11y", "a11y"] },
  { id: "seo", label: "SEO", category: "frontend-concepts" },
  { id: "web vitals", label: "Web Vitals", category: "frontend-concepts", aliases: ["core web vitals"] },
  { id: "pwa", label: "PWA", category: "frontend-concepts", aliases: ["progressive web apps"] },
  { id: "browser apis", label: "Browser APIs", category: "frontend-concepts" },
  { id: "ssr vs csr", label: "SSR vs CSR", category: "frontend-concepts", aliases: ["ssr", "server-side rendering"] },
  { id: "web", label: "Web Fundamentals", category: "frontend-concepts" },

  // Build & tooling
  { id: "vite", label: "Vite", category: "build-tooling" },
  { id: "webpack", label: "Webpack", category: "build-tooling" },
  { id: "esbuild", label: "esbuild", category: "build-tooling" },
  { id: "turbopack", label: "Turbopack", category: "build-tooling" },
  { id: "eslint", label: "ESLint", category: "build-tooling" },
  { id: "prettier", label: "Prettier", category: "build-tooling" },
  { id: "monorepos", label: "Monorepos", category: "build-tooling", aliases: ["monorepo"] },
  { id: "nx", label: "Nx", category: "build-tooling" },

  // Testing
  { id: "testing", label: "Testing", category: "testing" },
  { id: "jest", label: "Jest", category: "testing" },
  { id: "vitest", label: "Vitest", category: "testing" },
  { id: "react testing library", label: "React Testing Library", category: "testing", aliases: ["testing library"] },
  { id: "cypress", label: "Cypress", category: "testing" },
  { id: "playwright", label: "Playwright", category: "testing" },
  { id: "storybook", label: "Storybook", category: "testing" },
  { id: "supertest", label: "Supertest", category: "testing" },
  { id: "xunit", label: "xUnit", category: "testing" },
  { id: "pytest", label: "pytest", category: "testing" },
  { id: "integration testing", label: "Integration Testing", category: "testing" },
  { id: "contract testing", label: "Contract Testing", category: "testing" },
  { id: "load testing", label: "Load Testing", category: "testing" },

  // Backend frameworks
  { id: "nestjs", label: "NestJS", category: "backend-frameworks", aliases: ["nest.js"] },
  { id: "express", label: "Express", category: "backend-frameworks", aliases: ["express.js", "expressjs"] },
  { id: "fastify", label: "Fastify", category: "backend-frameworks" },
  { id: ".net", label: ".NET", category: "backend-frameworks", aliases: ["dotnet", "asp.net", "asp.net core"] },
  { id: "spring boot", label: "Spring Boot", category: "backend-frameworks", aliases: ["spring"] },
  { id: "django", label: "Django", category: "backend-frameworks" },
  { id: "fastapi", label: "FastAPI", category: "backend-frameworks" },
  { id: "flask", label: "Flask", category: "backend-frameworks" },
  { id: "rails", label: "Rails", category: "backend-frameworks", aliases: ["ruby on rails"] },
  { id: "gin", label: "Gin", category: "backend-frameworks" },
  { id: "actix", label: "Actix", category: "backend-frameworks", aliases: ["actix web"] },
  { id: "laravel", label: "Laravel", category: "backend-frameworks" },
  { id: "hono", label: "Hono", category: "backend-frameworks" },

  // Databases
  { id: "database", label: "Databases", category: "databases" },
  { id: "sql", label: "SQL", category: "databases" },
  { id: "postgresql", label: "PostgreSQL", category: "databases", aliases: ["postgres"] },
  { id: "mysql", label: "MySQL", category: "databases" },
  { id: "sql server", label: "SQL Server", category: "databases", aliases: ["mssql"] },
  { id: "mongodb", label: "MongoDB", category: "databases", aliases: ["mongo"] },
  { id: "redis", label: "Redis", category: "databases" },
  { id: "dynamodb", label: "DynamoDB", category: "databases" },
  { id: "cassandra", label: "Cassandra", category: "databases" },
  { id: "elasticsearch", label: "Elasticsearch", category: "databases" },
  { id: "sqlite", label: "SQLite", category: "databases" },
  { id: "neo4j", label: "Neo4j", category: "databases" },

  // ORM / data access
  { id: "prisma", label: "Prisma", category: "orm-data-access" },
  { id: "typeorm", label: "TypeORM", category: "orm-data-access" },
  { id: "drizzle", label: "Drizzle", category: "orm-data-access", aliases: ["drizzle orm"] },
  { id: "sequelize", label: "Sequelize", category: "orm-data-access" },
  { id: "ef core", label: "EF Core", category: "orm-data-access", aliases: ["entity framework", "entity framework core"] },
  { id: "dapper", label: "Dapper", category: "orm-data-access" },
  { id: "hibernate", label: "Hibernate", category: "orm-data-access" },
  { id: "sqlalchemy", label: "SQLAlchemy", category: "orm-data-access" },
  { id: "mongoose", label: "Mongoose", category: "orm-data-access" },
  { id: "knex", label: "Knex", category: "orm-data-access", aliases: ["knex.js"] },

  // APIs & protocols
  { id: "api", label: "API Design", category: "api-design", aliases: ["apis"] },
  { id: "http", label: "HTTP", category: "api-design" },
  { id: "rest", label: "REST", category: "api-design", aliases: ["rest api", "restful"] },
  { id: "graphql", label: "GraphQL", category: "api-design" },
  { id: "grpc", label: "gRPC", category: "api-design" },
  { id: "websockets", label: "WebSockets", category: "api-design", aliases: ["websocket"] },
  { id: "trpc", label: "tRPC", category: "api-design" },
  { id: "openapi/swagger", label: "OpenAPI/Swagger", category: "api-design", aliases: ["openapi", "swagger"] },
  { id: "api versioning", label: "API Versioning", category: "api-design" },
  { id: "server-sent events", label: "Server-Sent Events", category: "api-design", aliases: ["sse"] },

  // Messaging & events
  { id: "queues", label: "Queues", category: "messaging", aliases: ["message queues"] },
  { id: "rabbitmq", label: "RabbitMQ", category: "messaging" },
  { id: "kafka", label: "Kafka", category: "messaging", aliases: ["apache kafka"] },
  { id: "sqs/sns", label: "SQS/SNS", category: "messaging", aliases: ["sqs", "sns"] },
  { id: "redis pub/sub", label: "Redis Pub/Sub", category: "messaging" },
  { id: "event sourcing", label: "Event Sourcing", category: "messaging" },
  { id: "cqrs", label: "CQRS", category: "messaging" },
  { id: "bullmq", label: "BullMQ", category: "messaging" },

  // Security & auth
  { id: "security", label: "Security", category: "security" },
  { id: "authentication", label: "Authentication", category: "security", aliases: ["auth"] },
  { id: "jwt", label: "JWT", category: "security" },
  { id: "oauth", label: "OAuth 2.0", category: "security", aliases: ["oauth2"] },
  { id: "oidc", label: "OIDC", category: "security", aliases: ["openid connect"] },
  { id: "passport.js", label: "Passport.js", category: "security", aliases: ["passport"] },
  { id: "rbac", label: "RBAC", category: "security" },
  { id: "owasp", label: "OWASP", category: "security" },
  { id: "encryption", label: "Encryption", category: "security" },
  { id: "rate limiting", label: "Rate Limiting", category: "security" },
  { id: "cors", label: "CORS", category: "security" },
  { id: "secrets management", label: "Secrets Management", category: "security" },
  { id: "vault", label: "Vault", category: "security", aliases: ["hashicorp vault"] },
  { id: "iam", label: "IAM", category: "security" },
  { id: "network policies", label: "Network Policies", category: "security" },
  { id: "compliance", label: "Compliance", category: "security" },
  { id: "threat modeling", label: "Threat Modeling", category: "security", aliases: ["threat modelling"] },

  // Cloud & hosting
  { id: "aws", label: "AWS", category: "cloud-infrastructure", aliases: ["amazon web services"] },
  { id: "azure", label: "Azure", category: "cloud-infrastructure", aliases: ["microsoft azure"] },
  { id: "gcp", label: "GCP", category: "cloud-infrastructure", aliases: ["google cloud", "google cloud platform"] },
  { id: "digitalocean", label: "DigitalOcean", category: "cloud-infrastructure" },
  { id: "cloudflare", label: "Cloudflare", category: "cloud-infrastructure" },
  { id: "hetzner", label: "Hetzner", category: "cloud-infrastructure" },
  { id: "vercel", label: "Vercel", category: "cloud-infrastructure" },
  { id: "netlify", label: "Netlify", category: "cloud-infrastructure" },
  { id: "railway", label: "Railway", category: "cloud-infrastructure" },
  { id: "fly.io", label: "Fly.io", category: "cloud-infrastructure" },
  { id: "serverless", label: "Serverless", category: "cloud-infrastructure" },

  // Containers & orchestration
  { id: "containers", label: "Containers", category: "containers" },
  { id: "orchestration", label: "Container Orchestration", category: "containers" },
  { id: "docker", label: "Docker", category: "containers" },
  { id: "kubernetes", label: "Kubernetes", category: "containers", aliases: ["k8s"] },
  { id: "ecs", label: "ECS", category: "containers" },
  { id: "helm", label: "Helm", category: "containers" },
  { id: "podman", label: "Podman", category: "containers" },
  { id: "docker compose", label: "Docker Compose", category: "containers", aliases: ["docker-compose"] },
  { id: "k3s", label: "K3s", category: "containers" },

  // Infrastructure as code
  { id: "iac", label: "Infrastructure as Code", category: "iac" },
  { id: "terraform", label: "Terraform", category: "iac" },
  { id: "pulumi", label: "Pulumi", category: "iac" },
  { id: "cloudformation", label: "CloudFormation", category: "iac", aliases: ["aws cloudformation"] },
  { id: "bicep", label: "Bicep", category: "iac" },
  { id: "ansible", label: "Ansible", category: "iac" },
  { id: "cdk", label: "CDK", category: "iac", aliases: ["aws cdk"] },
  { id: "crossplane", label: "Crossplane", category: "iac" },

  // CI/CD & delivery
  { id: "devops", label: "DevOps", category: "devops-delivery" },
  { id: "github actions", label: "GitHub Actions", category: "devops-delivery" },
  { id: "gitlab ci", label: "GitLab CI", category: "devops-delivery" },
  { id: "azure devops", label: "Azure DevOps", category: "devops-delivery" },
  { id: "jenkins", label: "Jenkins", category: "devops-delivery" },
  { id: "circleci", label: "CircleCI", category: "devops-delivery" },
  { id: "argocd", label: "ArgoCD", category: "devops-delivery", aliases: ["argo cd"] },
  { id: "flux", label: "Flux", category: "devops-delivery", aliases: ["fluxcd"] },
  { id: "tekton", label: "Tekton", category: "devops-delivery" },
  { id: "gitops", label: "GitOps", category: "devops-delivery" },
  { id: "release strategies", label: "Release Strategies", category: "devops-delivery" },
  { id: "blue/green deploys", label: "Blue/Green Deploys", category: "devops-delivery", aliases: ["blue/green", "blue-green deployments"] },
  { id: "canary releases", label: "Canary Releases", category: "devops-delivery", aliases: ["canary deployments"] },
  { id: "feature flags", label: "Feature Flags", category: "devops-delivery" },

  // Observability
  { id: "logging", label: "Logging", category: "observability" },
  { id: "metrics", label: "Metrics", category: "observability" },
  { id: "tracing", label: "Tracing", category: "observability", aliases: ["distributed tracing"] },
  { id: "opentelemetry", label: "OpenTelemetry", category: "observability", aliases: ["otel"] },
  { id: "sentry", label: "Sentry", category: "observability" },
  { id: "cloudwatch", label: "CloudWatch", category: "observability" },
  { id: "prometheus", label: "Prometheus", category: "observability" },
  { id: "grafana", label: "Grafana", category: "observability" },
  { id: "datadog", label: "Datadog", category: "observability" },
  { id: "elk stack", label: "ELK Stack", category: "observability", aliases: ["elk"] },
  { id: "loki", label: "Loki", category: "observability" },
  { id: "jaeger", label: "Jaeger", category: "observability" },

  // Networking
  { id: "dns", label: "DNS", category: "networking" },
  { id: "load balancers", label: "Load Balancers", category: "networking", aliases: ["load balancing"] },
  { id: "cdn", label: "CDN", category: "networking" },
  { id: "service mesh", label: "Service Mesh", category: "networking" },
  { id: "istio", label: "Istio", category: "networking" },
  { id: "nginx", label: "Nginx", category: "networking" },
  { id: "traefik", label: "Traefik", category: "networking" },
  { id: "api gateway", label: "API Gateway", category: "networking" },

  // SRE & reliability
  { id: "slos/slas", label: "SLOs/SLAs", category: "reliability", aliases: ["slo", "sla", "slos", "slas"] },
  { id: "incident management", label: "Incident Management", category: "reliability" },
  { id: "chaos engineering", label: "Chaos Engineering", category: "reliability" },
  { id: "runbooks", label: "Runbooks", category: "reliability" },
  { id: "disaster recovery", label: "Disaster Recovery", category: "reliability" },
  { id: "high availability", label: "High Availability", category: "reliability" },
  { id: "fault tolerance", label: "Fault Tolerance", category: "reliability" },

  // System design & architecture
  { id: "system design", label: "System Design", category: "system-design", aliases: ["system-design"] },
  { id: "architecture", label: "Software Architecture", category: "system-design" },
  { id: "patterns", label: "Design Patterns", category: "system-design" },
  { id: "scaling", label: "Scaling", category: "system-design", aliases: ["scalability"] },
  { id: "caching", label: "Caching", category: "system-design" },
  { id: "consistency", label: "Consistency", category: "system-design" },
  { id: "distributed systems", label: "Distributed Systems", category: "system-design" },
  { id: "microservices", label: "Microservices", category: "system-design" },
  { id: "monolith", label: "Monolith", category: "system-design" },
  { id: "transactions", label: "Transactions", category: "system-design" },
  { id: "connection pooling", label: "Connection Pooling", category: "system-design" },
  { id: "background jobs", label: "Background Jobs", category: "system-design" },
  { id: "cost optimization", label: "Cost Optimization", category: "system-design", aliases: ["cost optimisation"] },
  { id: "immutable infrastructure", label: "Immutable Infrastructure", category: "system-design" },
  { id: "12-factor app", label: "12-Factor App", category: "system-design", aliases: ["twelve-factor app"] },

  // Engineering practices
  { id: "quality", label: "Code Quality", category: "engineering-practices" },
  { id: "best-practices", label: "Best Practices", category: "engineering-practices" },

  // Behavioral
  { id: "behavioral", label: "Behavioral", category: "behavioral", aliases: ["behavioural"] },
  { id: "communication", label: "Communication", category: "behavioral" },
  { id: "teamwork", label: "Teamwork", category: "behavioral" },
  { id: "conflict", label: "Conflict Resolution", category: "behavioral" },
];

function cleanTag(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** id, lowercase label and every alias → canonical tag. */
const TAG_LOOKUP: ReadonlyMap<string, TechTag> = (() => {
  const map = new Map<string, TechTag>();
  for (const tag of TECH_TAG_CATALOG) {
    for (const key of [tag.id, tag.label, ...(tag.aliases ?? [])]) {
      const cleaned = cleanTag(key);
      if (!map.has(cleaned)) map.set(cleaned, tag);
    }
  }
  return map;
})();

/** Trim, collapse whitespace, lowercase and resolve aliases to the canonical id. Unknown tags come back cleaned but otherwise unchanged. */
export function normalizeTag(raw: string): string {
  const cleaned = cleanTag(raw);
  return TAG_LOOKUP.get(cleaned)?.id ?? cleaned;
}

/** True when `raw` is a catalog id, label or alias (case/whitespace-insensitive). */
export function isKnownTag(raw: string): boolean {
  return TAG_LOOKUP.has(cleanTag(raw));
}

export function findTechTag(raw: string): TechTag | undefined {
  return TAG_LOOKUP.get(cleanTag(raw));
}

/** Display label for a tag id (or any known spelling); unknown tags are returned trimmed. */
export function getTechTagLabel(raw: string): string {
  return TAG_LOOKUP.get(cleanTag(raw))?.label ?? (typeof raw === "string" ? raw.trim() : "");
}

/**
 * Normalise a list of raw tags: canonical ids, de-duplicated, order kept.
 * Unknown (or empty) inputs are returned separately so callers can reject them.
 */
export function normalizeTags(raws: readonly string[]): {
  tags: string[];
  unknown: string[];
} {
  const tags: string[] = [];
  const unknown: string[] = [];
  for (const raw of raws) {
    const tag = TAG_LOOKUP.get(cleanTag(raw));
    if (!tag) {
      unknown.push(typeof raw === "string" ? raw.trim() : String(raw));
    } else if (!tags.includes(tag.id)) {
      tags.push(tag.id);
    }
  }
  return { tags, unknown };
}

/** Catalog grouped by category (category order, then catalog order) for pickers and option lists. */
export function groupTechTagsByCategory(): {
  key: TechTagCategoryKey;
  label: string;
  tags: TechTag[];
}[] {
  return TECH_TAG_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    tags: TECH_TAG_CATALOG.filter((tag) => tag.category === category.key),
  }));
}

/**
 * Every stored spelling of the given tags (canonical id, lowercase label and
 * aliases), for matching rows saved before normalisation, e.g.
 * `tags: { hasSome: expandTagAliases(ids) }`.
 */
export function expandTagAliases(raws: readonly string[]): string[] {
  const out = new Set<string>();
  for (const raw of raws) {
    const cleaned = cleanTag(raw);
    const tag = TAG_LOOKUP.get(cleaned);
    if (!tag) {
      if (cleaned) out.add(cleaned);
      continue;
    }
    out.add(tag.id);
    out.add(cleanTag(tag.label));
    for (const alias of tag.aliases ?? []) out.add(alias);
  }
  return [...out];
}
