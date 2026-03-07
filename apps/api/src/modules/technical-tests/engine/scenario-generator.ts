/**
 * Technical Test Scenario Generator
 *
 * Generates rich, in-depth technical test scenarios (like real take-home tests)
 * based on role focus, level, difficulty, and selected tech stack tags.
 *
 * Each scenario includes:
 *  - A realistic company/project context
 *  - A detailed problem brief
 *  - Functional & non-functional requirements
 *  - Acceptance criteria
 *  - Bonus challenges
 *  - Evaluation rubric
 *  - Hints / suggested approach
 */

export interface TechTestScenario {
  title: string;
  companyContext: string;
  brief: string;
  background: string;
  requirements: { key: string; text: string }[];
  nonFunctional: string[];
  acceptanceCriteria: string[];
  bonusChallenges: string[];
  evaluationCriteria: { name: string; weight: number; description: string }[];
  hints: string[];
  estimatedTime: string;
  deliverables: string[];
  constraints: string[];
}

interface GenerateInput {
  roleFocus: string;
  level: string;
  difficulty: string;
  tags: string[];
}

/* ───────── scenario templates ───────── */

interface ScenarioTemplate {
  roles: string[];
  levels: string[];
  difficulties: string[];
  tagMatch?: string[];
  generate: (
    tags: string[],
    level: string,
    difficulty: string
  ) => TechTestScenario;
}

const pickRandom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

/**
 * Case-insensitive match: find the first item in `candidates` whose
 * lowercase form matches any of the (already-lowercase) `tags`.
 * Returns the *candidate* string (title-cased) so scenario text reads nicely.
 */
const findTag = (tags: string[], candidates: string[]): string | undefined => {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  return candidates.find((c) => tagSet.has(c.toLowerCase()));
};

/* ── helpers that adjust wording by level/difficulty ── */

function levelLabel(level: string): string {
  if (level === "junior") return "Junior";
  if (level === "senior") return "Senior / Staff";
  return "Mid-Level";
}

function diffAdj(diff: string): string {
  if (diff === "easy") return "straightforward";
  if (diff === "hard") return "complex, production-grade";
  return "moderately complex";
}

function extraRequirements(level: string, difficulty: string): string[] {
  const extras: string[] = [];
  if (level !== "junior")
    extras.push(
      "Include proper error handling and input validation throughout."
    );
  if (level === "senior" || difficulty === "hard") {
    extras.push("Write unit and/or integration tests for critical paths.");
    extras.push(
      "Document your architectural decisions and trade-offs in a short README."
    );
  }
  if (difficulty === "hard") {
    extras.push(
      "Consider scalability — your solution should handle at least 10,000 concurrent users."
    );
    extras.push("Implement proper logging and observability hooks.");
  }
  return extras;
}

/* ── TEMPLATES ── */

const TEMPLATES: ScenarioTemplate[] = [
  /* ─── Frontend: Component Library / Design System ─── */
  {
    roles: ["frontend", "fullstack"],
    levels: ["junior", "mid", "senior"],
    difficulties: ["easy", "medium", "hard"],
    tagMatch: [
      "React",
      "Vue",
      "Angular",
      "Svelte",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "CSS Modules",
      "Styled Components",
    ],
    generate: (tags, level, difficulty) => {
      const framework =
        findTag(tags, ["React", "Vue", "Angular", "Svelte"]) ?? "React";
      const styling =
        findTag(tags, [
          "Tailwind CSS",
          "CSS Modules",
          "Styled Components",
          "Sass/SCSS",
          "Emotion",
        ]) ?? "CSS of your choice";
      const companyName = pickRandom([
        "StreamLine",
        "Pixel Corp",
        "NovaTech",
        "CloudView",
        "DataPulse",
      ]);
      return {
        title: `${framework} Design System — Reusable Component Library`,
        companyContext: `${companyName} is a fast-growing SaaS company building a unified design system. The frontend team needs a ${levelLabel(
          level
        )} engineer to build a set of ${diffAdj(
          difficulty
        )} reusable UI components that will be shared across multiple product teams.`,
        brief: `Build a small design system library containing a set of composable, accessible UI components using **${framework}** and **${styling}**. The library should demonstrate your understanding of component architecture, API design, accessibility, and styling best practices.`,
        background: `The existing codebase has inconsistent component patterns across 4 product squads. Your task is to create a foundational component library that establishes patterns the rest of the team will follow. Think of this as the "seed" of the company's design system.`,
        requirements: [
          {
            key: "Button",
            text: `Create a \`Button\` component with variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state, disabled state, and icon support.`,
          },
          {
            key: "Input",
            text: `Create a \`TextInput\` component with label, placeholder, error state, helper text, prefix/suffix icons, and character count.`,
          },
          {
            key: "Modal",
            text: `Create a \`Modal\` / \`Dialog\` component with customizable header, body, footer, backdrop click dismiss, escape key handling, and focus trapping.`,
          },
          {
            key: "Toast",
            text: `Create a \`Toast\` / notification system with variants (success, error, warning, info), auto-dismiss, stacking, and manual dismiss.`,
          },
          ...(level !== "junior"
            ? [
                {
                  key: "Composition",
                  text: `Demonstrate compound component patterns or render props / slots to allow maximum consumer flexibility.`,
                },
              ]
            : []),
          ...(difficulty === "hard"
            ? [
                {
                  key: "Theming",
                  text: `Implement a theming system (light/dark mode + custom brand tokens) that all components consume via context/CSS variables.`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          "All components must be fully keyboard navigable and meet WCAG 2.1 AA.",
          "Components should be tree-shakable when imported individually.",
          `Use TypeScript with strict types — all props must be fully typed with JSDoc or TSDoc comments.`,
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          "Each component renders correctly with all variant/size combinations.",
          "Components handle edge cases (empty content, extremely long text, rapid clicks).",
          "No runtime errors in the console during normal usage.",
          "A demo page or Storybook showcases each component.",
          ...(level !== "junior"
            ? [
                "Components are accessible — tested with a screen reader or axe-core.",
              ]
            : []),
        ],
        bonusChallenges: [
          "Add animation/transitions using CSS transitions or a library like Framer Motion.",
          "Write a Storybook or interactive playground for each component.",
          "Add responsive behavior and mobile-specific touch interactions.",
          "Implement a `DataTable` component with sorting, filtering, and pagination.",
        ],
        evaluationCriteria: [
          {
            name: "Component API Design",
            weight: 25,
            description:
              "Props are intuitive, well-typed, and follow established patterns.",
          },
          {
            name: "Code Quality",
            weight: 20,
            description:
              "Clean, readable code with consistent patterns and proper separation of concerns.",
          },
          {
            name: "Accessibility",
            weight: 20,
            description:
              "Keyboard navigation, ARIA attributes, focus management, and color contrast.",
          },
          {
            name: "Styling Architecture",
            weight: 15,
            description:
              "Styling approach is scalable, themeable, and avoids specificity issues.",
          },
          {
            name: "Edge Cases & Polish",
            weight: 10,
            description:
              "Handles unusual inputs, loading states, and error boundaries gracefully.",
          },
          {
            name: "Documentation",
            weight: 10,
            description:
              "Props are documented, usage examples provided, and README explains decisions.",
          },
        ],
        hints: [
          `Start with the \`Button\` component — it's the simplest and establishes your patterns.`,
          "Use a compound component or context pattern for complex components like Modal.",
          "Think about the consumer DX: what would make these components delightful to use?",
          "Don't over-engineer — a clean, simple API is better than maximum configurability.",
        ],
        estimatedTime:
          difficulty === "easy"
            ? "1–2 hours"
            : difficulty === "hard"
            ? "4–6 hours"
            : "2–4 hours",
        deliverables: [
          "Source code in a Git repository (or zip).",
          "A demo page / Storybook showing all components in action.",
          "A README explaining your approach, trade-offs, and how to run the project.",
        ],
        constraints: [
          `Use ${framework} as the UI framework.`,
          `Use ${styling} for styling.`,
          "You may use any package manager (npm, yarn, pnpm).",
          "Do NOT use a pre-built component library (Material UI, Ant Design, etc.) — build from scratch.",
        ],
      };
    },
  },

  /* ─── Backend: REST API ─── */
  {
    roles: ["backend", "fullstack"],
    levels: ["junior", "mid", "senior"],
    difficulties: ["easy", "medium", "hard"],
    tagMatch: [
      "NestJS",
      "Express",
      "Fastify",
      ".NET",
      "Spring Boot",
      "Django",
      "FastAPI",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
    ],
    generate: (tags, level, difficulty) => {
      const framework =
        findTag(tags, [
          "NestJS",
          "Express",
          "Fastify",
          ".NET",
          "Spring Boot",
          "Django",
          "FastAPI",
          "Hono",
          "Rails",
          "Flask",
        ]) ?? "a framework of your choice";
      const db =
        findTag(tags, [
          "PostgreSQL",
          "MySQL",
          "MongoDB",
          "SQL Server",
          "SQLite",
          "Redis",
        ]) ?? "PostgreSQL";
      const orm = findTag(tags, [
        "Prisma",
        "TypeORM",
        "Drizzle",
        "EF Core",
        "Mongoose",
        "SQLAlchemy",
        "Sequelize",
      ]);
      const companyName = pickRandom([
        "BookShelf",
        "TaskForge",
        "EventHub",
        "FreshCart",
        "MedTrack",
      ]);
      const domain = pickRandom([
        {
          name: "bookshelf",
          entity: "Book",
          entities: "books",
          desc: "an online bookstore",
        },
        {
          name: "taskforge",
          entity: "Task",
          entities: "tasks",
          desc: "a project management tool",
        },
        {
          name: "eventhub",
          entity: "Event",
          entities: "events",
          desc: "an event booking platform",
        },
        {
          name: "freshcart",
          entity: "Product",
          entities: "products",
          desc: "an e-commerce grocery service",
        },
        {
          name: "medtrack",
          entity: "Appointment",
          entities: "appointments",
          desc: "a healthcare scheduling system",
        },
      ]);
      return {
        title: `${companyName} REST API — ${domain.entity} Management Service`,
        companyContext: `${companyName} is building ${
          domain.desc
        }. The backend team needs a ${levelLabel(
          level
        )} engineer to design and implement a ${diffAdj(
          difficulty
        )} RESTful API that will serve as the backbone for their web and mobile applications.`,
        brief: `Design and build a REST API for managing **${
          domain.entities
        }** using **${framework}** with **${db}**${
          orm ? ` and **${orm}**` : ""
        }. The API should follow REST best practices, include authentication, validation, and proper error handling.`,
        background: `The current system is a monolithic application that's being decomposed into microservices. Your service will be one of the first standalone APIs. It needs to be well-structured, testable, and ready for production deployment.`,
        requirements: [
          {
            key: "CRUD",
            text: `Implement full CRUD endpoints for the \`${domain.entity}\` resource (Create, Read one, Read all with filtering/pagination, Update, Delete).`,
          },
          {
            key: "Auth",
            text: `Implement JWT-based authentication with signup, login, and protected routes. Users should only access their own ${domain.entities}.`,
          },
          {
            key: "Validation",
            text: `All request bodies must be validated with clear error messages. Return appropriate HTTP status codes (400, 401, 403, 404, 409, 500).`,
          },
          {
            key: "Pagination",
            text: `The list endpoint should support cursor-based or offset pagination, sorting by multiple fields, and text search/filtering.`,
          },
          ...(level !== "junior"
            ? [
                {
                  key: "Relations",
                  text: `Add at least one related resource (e.g., ${domain.entity} has many Comments, or belongs to a Category). Include nested create and eager/lazy loading options.`,
                },
                {
                  key: "Middleware",
                  text: `Implement request logging, rate limiting, and CORS configuration.`,
                },
              ]
            : []),
          ...(difficulty === "hard"
            ? [
                {
                  key: "Caching",
                  text: `Implement response caching (Redis or in-memory) for the list and detail endpoints with proper cache invalidation.`,
                },
                {
                  key: "Events",
                  text: `Emit domain events on create/update/delete (e.g., to a message queue or event bus). Include at least one event consumer.`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          "Follow RESTful naming conventions and HTTP semantics strictly.",
          "Use environment variables for all configuration (DB URL, JWT secret, etc.).",
          "Include database migrations — the schema should be reproducible from scratch.",
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          `POST /api/${
            domain.entities
          } creates a new ${domain.entity.toLowerCase()} and returns 201.`,
          `GET /api/${domain.entities} returns a paginated list with filtering support.`,
          `GET /api/${
            domain.entities
          }/:id returns a single ${domain.entity.toLowerCase()} or 404.`,
          `PUT /api/${
            domain.entities
          }/:id updates and returns the ${domain.entity.toLowerCase()}.`,
          `DELETE /api/${domain.entities}/:id soft-deletes or hard-deletes the resource.`,
          "Unauthenticated requests to protected routes return 401.",
          "Invalid request bodies return 400 with field-level error details.",
          ...(level !== "junior"
            ? ["Rate limiting returns 429 after threshold is exceeded."]
            : []),
        ],
        bonusChallenges: [
          "Add an OpenAPI/Swagger documentation endpoint.",
          "Implement soft deletes with a `deletedAt` field and restore endpoint.",
          "Add file upload support (e.g., avatar or attachment for the resource).",
          "Implement webhook notifications for resource changes.",
          "Dockerize the application with a `docker-compose.yml` for local development.",
        ],
        evaluationCriteria: [
          {
            name: "API Design",
            weight: 25,
            description:
              "RESTful conventions, proper status codes, consistent response shapes.",
          },
          {
            name: "Code Architecture",
            weight: 25,
            description:
              "Clean separation of concerns, proper layering (controller → service → repository).",
          },
          {
            name: "Data Modeling",
            weight: 15,
            description:
              "Schema design, relationships, indexes, and migration strategy.",
          },
          {
            name: "Error Handling",
            weight: 15,
            description:
              "Consistent error responses, validation, edge cases, and 404 handling.",
          },
          {
            name: "Security",
            weight: 10,
            description:
              "JWT implementation, input sanitization, authorization checks.",
          },
          {
            name: "Testing & Docs",
            weight: 10,
            description:
              "Test coverage of critical paths, API documentation, and clear README.",
          },
        ],
        hints: [
          "Start by designing your data model and creating the migration before writing any routes.",
          `Use a layered architecture: routes/controllers → service/business logic → data access.`,
          "Write your validation schemas early — they act as documentation for your API contract.",
          "Test with curl, Postman, or a simple HTTP client file before writing automated tests.",
        ],
        estimatedTime:
          difficulty === "easy"
            ? "2–3 hours"
            : difficulty === "hard"
            ? "5–8 hours"
            : "3–5 hours",
        deliverables: [
          "Source code in a Git repository.",
          "Database migration files.",
          "A README with setup instructions, API endpoint documentation, and design decisions.",
          "A Postman collection or HTTP client file for testing (optional).",
        ],
        constraints: [
          `Use ${framework} as the server framework.`,
          `Use ${db} as the database.`,
          ...(orm ? [`Use ${orm} for data access.`] : []),
          "Do NOT use a code generator that produces the entire API scaffold for you.",
        ],
      };
    },
  },

  /* ─── Fullstack: Mini App ─── */
  {
    roles: ["fullstack"],
    levels: ["junior", "mid", "senior"],
    difficulties: ["easy", "medium", "hard"],
    generate: (tags, level, difficulty) => {
      const feFramework =
        findTag(tags, [
          "React",
          "Vue",
          "Angular",
          "Svelte",
          "Next.js",
          "Nuxt",
          "Remix",
        ]) ?? "React";
      const beFramework =
        findTag(tags, [
          "NestJS",
          "Express",
          "Fastify",
          ".NET",
          "Spring Boot",
          "Django",
          "FastAPI",
        ]) ?? "Express";
      const db =
        findTag(tags, ["PostgreSQL", "MySQL", "MongoDB", "SQLite"]) ?? "SQLite";
      const companyName = pickRandom([
        "LinkDrop",
        "PollVault",
        "QuickNote",
        "SnipBoard",
        "FeedLoop",
      ]);
      const app = pickRandom([
        {
          name: "URL Shortener",
          entity: "Link",
          desc: "a URL shortener with analytics",
        },
        {
          name: "Poll Creator",
          entity: "Poll",
          desc: "a real-time polling application",
        },
        {
          name: "Markdown Notes",
          entity: "Note",
          desc: "a collaborative notes application",
        },
        {
          name: "Snippet Manager",
          entity: "Snippet",
          desc: "a code snippet sharing tool",
        },
        {
          name: "Feedback Board",
          entity: "Feedback",
          desc: "a user feedback and voting board",
        },
      ]);
      return {
        title: `${companyName} — Full-Stack ${app.name}`,
        companyContext: `${companyName} is an early-stage startup building ${
          app.desc
        }. They need a ${levelLabel(
          level
        )} fullstack engineer to build a ${diffAdj(
          difficulty
        )} working prototype that demonstrates the core user flow end-to-end.`,
        brief: `Build a working **${
          app.name
        }** application with a **${feFramework}** frontend and a **${beFramework}** backend backed by **${db}**. The app should demonstrate a complete user flow from creation to consumption of ${app.entity.toLowerCase()}s.`,
        background: `This is a greenfield project. You're the founding engineer tasked with building the initial MVP. The founders care about clean UX, solid engineering foundations, and the ability to iterate quickly after launch.`,
        requirements: [
          {
            key: "Create",
            text: `Users can create a new ${app.entity.toLowerCase()} via a clean, intuitive form.`,
          },
          {
            key: "List",
            text: `Users can view a list of all their ${app.entity.toLowerCase()}s with search and sorting.`,
          },
          {
            key: "Detail",
            text: `Each ${app.entity.toLowerCase()} has a detail/view page showing all its information.`,
          },
          {
            key: "Delete",
            text: `Users can delete their own ${app.entity.toLowerCase()}s with a confirmation dialog.`,
          },
          {
            key: "Auth",
            text: `Implement basic authentication (signup/login) so each user has their own data.`,
          },
          ...(level !== "junior"
            ? [
                {
                  key: "Realtime",
                  text: `Add a real-time element — e.g., live updates when another user interacts with a shared ${app.entity.toLowerCase()}.`,
                },
                {
                  key: "Responsive",
                  text: `The UI must be fully responsive and work well on mobile devices.`,
                },
              ]
            : []),
          ...(difficulty === "hard"
            ? [
                {
                  key: "Analytics",
                  text: `Add an analytics/stats view — e.g., view counts, click tracking, usage over time with a simple chart.`,
                },
                {
                  key: "Share",
                  text: `${app.entity}s can be shared via a public URL that works without authentication.`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          "Clean, intuitive UI — no design degree required, but it should look intentional.",
          "Proper loading states, error states, and empty states throughout.",
          "API and UI validation should be consistent.",
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          "A new user can sign up, log in, and start using the app immediately.",
          `Creating a ${app.entity.toLowerCase()} persists it and it appears in the list.`,
          `Deleting a ${app.entity.toLowerCase()} removes it from the list.`,
          "Refreshing the page preserves all data (no client-only state).",
          "The app handles network errors gracefully with user-friendly messages.",
          ...(level !== "junior"
            ? ["The app works on both desktop and mobile viewports."]
            : []),
        ],
        bonusChallenges: [
          "Add dark mode support.",
          "Implement optimistic UI updates for create/delete operations.",
          "Add keyboard shortcuts for power users.",
          "Deploy the app to a hosting platform (Vercel, Railway, etc.) with a live URL.",
          "Add end-to-end tests with Cypress or Playwright.",
        ],
        evaluationCriteria: [
          {
            name: "Feature Completeness",
            weight: 25,
            description: "All required features work correctly end-to-end.",
          },
          {
            name: "Code Quality",
            weight: 20,
            description:
              "Clean architecture, proper separation between frontend and backend.",
          },
          {
            name: "UX & Polish",
            weight: 20,
            description:
              "Intuitive flow, loading/error/empty states, responsive design.",
          },
          {
            name: "API Design",
            weight: 15,
            description:
              "RESTful endpoints, proper validation, consistent error handling.",
          },
          {
            name: "Data Modeling",
            weight: 10,
            description:
              "Sensible schema, proper relationships, and data integrity.",
          },
          {
            name: "Developer Experience",
            weight: 10,
            description:
              "Easy to set up locally, clear README, consistent code style.",
          },
        ],
        hints: [
          "Start with the data model and API, then build the UI on top.",
          "Get the happy path working first, then add error handling and edge cases.",
          "Use a monorepo or simple folder structure — don't over-engineer the project setup.",
          `Focus on making the core ${app.entity.toLowerCase()} CRUD delightful before adding extras.`,
        ],
        estimatedTime:
          difficulty === "easy"
            ? "2–4 hours"
            : difficulty === "hard"
            ? "6–10 hours"
            : "4–6 hours",
        deliverables: [
          "Source code in a Git repository.",
          "A README with setup instructions and a description of your approach.",
          "Screenshots or a short video demo (optional but appreciated).",
        ],
        constraints: [
          `Use ${feFramework} for the frontend.`,
          `Use ${beFramework} for the backend.`,
          `Use ${db} for persistence.`,
          "The frontend and backend must communicate via HTTP (REST or tRPC).",
        ],
      };
    },
  },

  /* ─── Platform / DevOps: Infrastructure ─── */
  {
    roles: ["platform"],
    levels: ["junior", "mid", "senior"],
    difficulties: ["easy", "medium", "hard"],
    tagMatch: [
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "Terraform",
      "GitHub Actions",
      "GitLab CI",
    ],
    generate: (tags, level, difficulty) => {
      const cloud = findTag(tags, ["AWS", "Azure", "GCP"]) ?? "AWS";
      const iac =
        findTag(tags, [
          "Terraform",
          "Pulumi",
          "CloudFormation",
          "CDK",
          "Bicep",
        ]) ?? "Terraform";
      const ci =
        findTag(tags, [
          "GitHub Actions",
          "GitLab CI",
          "Azure DevOps",
          "Jenkins",
        ]) ?? "GitHub Actions";
      const companyName = pickRandom([
        "InfraCore",
        "DeployStack",
        "CloudPilot",
        "PlatformOps",
        "ShipFast",
      ]);
      return {
        title: `${companyName} — Production Deployment Pipeline & Infrastructure`,
        companyContext: `${companyName} is migrating from a manual deployment process to a fully automated, infrastructure-as-code approach. They need a ${levelLabel(
          level
        )} platform engineer to design a ${diffAdj(
          difficulty
        )} CI/CD pipeline and cloud infrastructure setup.`,
        brief: `Design and implement a deployment pipeline using **${ci}** and infrastructure definitions using **${iac}** targeting **${cloud}**. The pipeline should take a simple web application from code push to production deployment with proper staging, testing, and rollback capabilities.`,
        background: `Currently, deployments are done manually via SSH. The team deploys roughly 5 times per week, and each deployment takes 30+ minutes with frequent human errors. Your solution should reduce deployment time to under 5 minutes with zero manual steps after code merge.`,
        requirements: [
          {
            key: "CI Pipeline",
            text: `Create a CI pipeline in ${ci} that runs linting, unit tests, builds a Docker image, and pushes it to a container registry.`,
          },
          {
            key: "IaC",
            text: `Define the cloud infrastructure using ${iac} — at minimum: a container runtime (ECS/EKS/Cloud Run), a database, a load balancer, and networking.`,
          },
          {
            key: "CD Pipeline",
            text: `Implement automated deployment to a staging environment on PR merge, and production deployment on release/tag.`,
          },
          {
            key: "Secrets",
            text: `Manage secrets and environment variables securely (not hardcoded) — use ${cloud}'s secrets manager or similar.`,
          },
          ...(level !== "junior"
            ? [
                {
                  key: "Monitoring",
                  text: `Set up basic health checks, alerting, and log aggregation for the deployed application.`,
                },
                {
                  key: "Rollback",
                  text: `Implement a rollback mechanism — either blue/green deploys or easy one-click revert to previous version.`,
                },
              ]
            : []),
          ...(difficulty === "hard"
            ? [
                {
                  key: "Multi-env",
                  text: `Support multiple environments (dev, staging, production) with environment-specific configuration managed via ${iac}.`,
                },
                {
                  key: "Security",
                  text: `Implement network security (VPC, security groups, IAM roles with least privilege), and run a basic security scan in the pipeline.`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          `All infrastructure must be defined as code — no manual ${cloud} console changes.`,
          "Pipeline should complete in under 10 minutes for a typical change.",
          "Secrets must never appear in logs, code, or version control.",
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          "A code push to main triggers the CI pipeline automatically.",
          "The Docker image is built and pushed to a registry on successful CI.",
          "The staging environment is updated automatically after CI passes.",
          "Production deployment requires an explicit trigger (tag/release/approval).",
          `Running \`${
            iac === "Terraform" ? "terraform apply" : `${iac.toLowerCase()} up`
          }\` from scratch provisions the entire infrastructure.`,
          `Running \`${
            iac === "Terraform"
              ? "terraform destroy"
              : `${iac.toLowerCase()} destroy`
          }\` tears everything down cleanly.`,
        ],
        bonusChallenges: [
          "Add canary or blue/green deployment strategy.",
          "Set up a CDN for static assets.",
          "Implement database migration automation in the pipeline.",
          "Add cost estimation to PRs (e.g., Infracost for Terraform).",
          "Create a Grafana dashboard or CloudWatch dashboard for key metrics.",
        ],
        evaluationCriteria: [
          {
            name: "Pipeline Design",
            weight: 25,
            description: "Logical stages, proper gating, fast feedback loops.",
          },
          {
            name: "Infrastructure as Code",
            weight: 25,
            description:
              "Clean, modular IaC with proper state management and naming.",
          },
          {
            name: "Security",
            weight: 20,
            description:
              "Secrets management, IAM, network isolation, no hardcoded credentials.",
          },
          {
            name: "Reliability",
            weight: 15,
            description:
              "Health checks, rollback capability, failure handling.",
          },
          {
            name: "Documentation",
            weight: 15,
            description:
              "Architecture diagram, README, and runbook for common operations.",
          },
        ],
        hints: [
          "Start with the CI pipeline — get a Docker build working before touching infrastructure.",
          `Use ${iac} modules to keep your infrastructure DRY and composable.`,
          'Test your pipeline with a simple "Hello World" app first, then add complexity.',
          "Draw an architecture diagram before writing any code — it clarifies your thinking.",
        ],
        estimatedTime:
          difficulty === "easy"
            ? "2–3 hours"
            : difficulty === "hard"
            ? "6–8 hours"
            : "3–5 hours",
        deliverables: [
          "CI/CD pipeline configuration files.",
          `${iac} infrastructure definitions.`,
          "A Dockerfile for the sample application.",
          "A README with architecture diagram, setup instructions, and operational runbook.",
        ],
        constraints: [
          `Use ${ci} for CI/CD.`,
          `Use ${iac} for infrastructure definitions.`,
          `Target ${cloud} as the cloud provider.`,
          "Use Docker for containerization.",
        ],
      };
    },
  },

  /* ─── Frontend: State Management & Data Fetching ─── */
  {
    roles: ["frontend", "fullstack"],
    levels: ["mid", "senior"],
    difficulties: ["medium", "hard"],
    tagMatch: ["React", "Redux", "Zustand", "TanStack Query", "TypeScript"],
    generate: (tags, level, difficulty) => {
      const framework =
        findTag(tags, ["React", "Vue", "Angular", "Svelte"]) ?? "React";
      const stateLib =
        findTag(tags, [
          "Redux",
          "Zustand",
          "MobX",
          "Jotai",
          "Recoil",
          "Pinia",
          "NgRx",
        ]) ?? "your preferred state management solution";
      const companyName = pickRandom([
        "MetricDash",
        "FlowBoard",
        "InsightHQ",
        "TrackPad",
        "DataLens",
      ]);
      return {
        title: `${companyName} — Real-Time Dashboard with Complex State`,
        companyContext: `${companyName} builds analytics tools for SaaS companies. They need a ${levelLabel(
          level
        )} frontend engineer to build a ${diffAdj(
          difficulty
        )} real-time dashboard that handles complex data flows, caching, and optimistic updates.`,
        brief: `Build a **real-time analytics dashboard** using **${framework}** with **${stateLib}** that displays live-updating metrics, supports filtering and drill-downs, and handles complex state synchronization between multiple views.`,
        background: `The current dashboard is slow and buggy — state is scattered across 40+ useState calls with no clear data flow. Your task is to rebuild the dashboard with a proper state architecture that's maintainable and performant.`,
        requirements: [
          {
            key: "Dashboard",
            text: `Create a dashboard view with at least 4 metric cards (KPIs) and 2 chart/visualization areas that update in real-time (simulated via polling or WebSocket mock).`,
          },
          {
            key: "Filters",
            text: `Implement a global filter bar (date range, team, metric type) that affects all widgets. Filter state should be URL-synced so dashboards are shareable.`,
          },
          {
            key: "Drill-down",
            text: `Clicking a metric card or chart segment should navigate to a detail view with more granular data.`,
          },
          {
            key: "State",
            text: `Use ${stateLib} to manage application state with clear separation between server state (cached API data) and client state (UI preferences, filters).`,
          },
          {
            key: "Caching",
            text: `Implement smart data caching — navigating between views should not refetch data unnecessarily. Stale data should be shown while revalidating.`,
          },
          ...(difficulty === "hard"
            ? [
                {
                  key: "Optimistic",
                  text: `Add at least one optimistic update flow (e.g., pinning a metric, favoriting a dashboard, or changing a setting).`,
                },
                {
                  key: "Virtualization",
                  text: `Implement list virtualization for a data table with 10,000+ rows that scrolls smoothly.`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          "The dashboard should feel responsive — no layout shifts or jank during data updates.",
          "State transitions should be predictable and debuggable (consider Redux DevTools or similar).",
          "All async operations need proper loading, error, and empty states.",
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          "Dashboard loads with default filters and displays metrics immediately.",
          "Changing a filter updates all widgets without full page reload.",
          "URL reflects current filter state — copy-pasting the URL restores the view.",
          "Navigating to detail and back preserves the filter state and cached data.",
          "Simulated real-time updates appear on the dashboard without user interaction.",
        ],
        bonusChallenges: [
          "Add drag-and-drop widget reordering with persistence.",
          'Implement a "compare" mode that shows two time periods side by side.',
          "Add keyboard shortcuts for common actions (date range presets, refresh, etc.).",
          "Create a custom hook that abstracts the polling/WebSocket logic for reuse.",
        ],
        evaluationCriteria: [
          {
            name: "State Architecture",
            weight: 30,
            description:
              "Clear data flow, proper separation of concerns, predictable state updates.",
          },
          {
            name: "Performance",
            weight: 20,
            description:
              "No unnecessary re-renders, efficient data fetching, smooth interactions.",
          },
          {
            name: "UX Quality",
            weight: 20,
            description:
              "Loading states, error handling, responsive layout, intuitive navigation.",
          },
          {
            name: "Code Organization",
            weight: 15,
            description:
              "File structure, custom hooks, component composition, TypeScript usage.",
          },
          {
            name: "Testing",
            weight: 15,
            description:
              "Unit tests for state logic, integration tests for key flows.",
          },
        ],
        hints: [
          "Design your state shape on paper first — draw the state tree before coding.",
          'Separate "server state" (API data) from "UI state" (filters, open panels) from the start.',
          "Use mock data generators so you can develop the UI without a real API.",
          "Profile your renders with React DevTools or equivalent to catch performance issues early.",
        ],
        estimatedTime: difficulty === "medium" ? "4–6 hours" : "6–8 hours",
        deliverables: [
          "Source code in a Git repository.",
          "A README documenting your state architecture decisions.",
          "Screenshots or a short demo video.",
        ],
        constraints: [
          `Use ${framework} for the UI.`,
          `Use ${stateLib} for state management.`,
          "Use TypeScript with strict mode.",
          "You may use any charting library (Recharts, Victory, Chart.js, etc.).",
        ],
      };
    },
  },

  /* ─── Backend: System Design — Notification Service ─── */
  {
    roles: ["backend"],
    levels: ["mid", "senior"],
    difficulties: ["medium", "hard"],
    tagMatch: [
      "Microservices",
      "Kafka",
      "RabbitMQ",
      "Redis",
      "Scaling",
      "Distributed Systems",
    ],
    generate: (tags, level, difficulty) => {
      const language =
        findTag(tags, [
          "TypeScript",
          "JavaScript",
          "C#",
          "Java",
          "Python",
          "Go",
          "Rust",
        ]) ?? "TypeScript";
      const messaging =
        findTag(tags, [
          "Kafka",
          "RabbitMQ",
          "SQS/SNS",
          "Redis Pub/Sub",
          "BullMQ",
        ]) ?? "a message queue of your choice";
      const companyName = pickRandom([
        "NotifyPro",
        "AlertStack",
        "PingHub",
        "SignalFlow",
        "BuzzLine",
      ]);
      return {
        title: `${companyName} — Scalable Notification Service`,
        companyContext: `${companyName} is building a multi-channel notification platform. They need a ${levelLabel(
          level
        )} backend engineer to design and implement a ${diffAdj(
          difficulty
        )} notification service that handles email, SMS, and push notifications at scale.`,
        brief: `Design and implement a **notification service** in **${language}** that accepts notification requests via an API, queues them using **${messaging}**, and delivers them through multiple channels (email, SMS, push). The system should be resilient, scalable, and observable.`,
        background: `The company currently sends notifications synchronously inside the main API — this causes timeouts, lost notifications, and makes it impossible to add new channels. Your service will decouple notification delivery from the main app.`,
        requirements: [
          {
            key: "API",
            text: `Create an API endpoint that accepts notification requests: recipient, channel(s), template, and dynamic data.`,
          },
          {
            key: "Queue",
            text: `Notifications should be published to ${messaging} for async processing. Implement at least two consumer workers (email + one other channel).`,
          },
          {
            key: "Templates",
            text: `Support notification templates with variable interpolation (e.g., "Hello {{name}}, your order #{{orderId}} has shipped").`,
          },
          {
            key: "Retry",
            text: `Implement retry logic with exponential backoff for failed deliveries. After max retries, move to a dead-letter queue.`,
          },
          {
            key: "Status",
            text: `Track notification status (queued → processing → sent → failed) and expose a status lookup endpoint.`,
          },
          ...(difficulty === "hard"
            ? [
                {
                  key: "Batching",
                  text: `Implement batching — if a user receives 5 notifications within 1 minute, combine them into a single digest.`,
                },
                {
                  key: "Preferences",
                  text: `Support user notification preferences (opt-out per channel, quiet hours, frequency limits).`,
                },
              ]
            : []),
        ],
        nonFunctional: [
          "The API should respond in <100ms — all heavy work happens asynchronously.",
          "The system should handle 1,000+ notifications per second without backpressure issues.",
          "No notification should be lost — implement at-least-once delivery semantics.",
          ...extraRequirements(level, difficulty),
        ],
        acceptanceCriteria: [
          "Sending a notification via the API returns 202 Accepted immediately.",
          "The notification appears in the queue and is processed by a worker within 5 seconds.",
          "Failed deliveries are retried up to 3 times with increasing delays.",
          "The status endpoint returns the current state of any notification by ID.",
          "Dead-lettered notifications can be inspected and replayed.",
        ],
        bonusChallenges: [
          "Add a WebSocket endpoint for real-time delivery status updates.",
          "Implement priority queues (urgent vs. normal vs. low-priority).",
          "Add rate limiting per recipient to prevent spam.",
          "Build a simple admin dashboard showing throughput, failure rates, and queue depth.",
          "Support rich content (HTML emails, push notification images, SMS with links).",
        ],
        evaluationCriteria: [
          {
            name: "System Design",
            weight: 30,
            description:
              "Architecture decisions, component separation, scalability considerations.",
          },
          {
            name: "Reliability",
            weight: 25,
            description:
              "Retry logic, dead-letter handling, at-least-once delivery.",
          },
          {
            name: "Code Quality",
            weight: 20,
            description:
              "Clean interfaces, separation of concerns, error handling.",
          },
          {
            name: "API Design",
            weight: 15,
            description:
              "RESTful contract, proper status codes, clear documentation.",
          },
          {
            name: "Observability",
            weight: 10,
            description:
              "Logging, metrics, health checks, and debugging tools.",
          },
        ],
        hints: [
          "Start with the API and a simple in-memory queue, then swap for the real message broker.",
          "Use the Strategy pattern for notification channels — each channel implements a common interface.",
          "Design your notification schema carefully — it's the contract between the API and workers.",
          "Don't implement real email/SMS — use console logging or mock adapters.",
        ],
        estimatedTime: difficulty === "medium" ? "4–6 hours" : "6–10 hours",
        deliverables: [
          "Source code in a Git repository.",
          "An architecture diagram showing components, data flow, and failure paths.",
          "A README with design decisions, trade-offs, and instructions to run locally.",
          "A docker-compose.yml that starts the API, workers, and message broker.",
        ],
        constraints: [
          `Use ${language} as the primary language.`,
          `Use ${messaging} for async processing.`,
          "You may mock external delivery providers (no real emails/SMS needed).",
          "The system must run locally with docker-compose.",
        ],
      };
    },
  },
];

/**
 * Select and generate a scenario matching the given input.
 */
export function generateScenario(input: GenerateInput): TechTestScenario {
  const { roleFocus, level, difficulty, tags } = input;
  const tagsLower = new Set(tags.map((t) => t.toLowerCase()));

  // Score each template by match quality
  const scored = TEMPLATES.map((tpl) => {
    let score = 0;
    if (tpl.roles.includes(roleFocus)) score += 10;
    if (tpl.levels.includes(level)) score += 5;
    if (tpl.difficulties.includes(difficulty)) score += 3;
    if (tpl.tagMatch) {
      // Case-insensitive tag matching
      const matches = tpl.tagMatch.filter((t) =>
        tagsLower.has(t.toLowerCase())
      ).length;
      score += matches * 2;
    }
    // Add randomness to avoid always picking the same template
    score += Math.random() * 3;
    return { tpl, score };
  })
    .filter((s) => s.tpl.roles.includes(roleFocus)) // Must match role
    .sort((a, b) => b.score - a.score);

  // Pick the best-scoring template, fallback to random if nothing matches
  const best = scored.length > 0 ? scored[0].tpl : TEMPLATES[0];
  return best.generate(tags, level, difficulty);
}
