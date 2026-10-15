import {
  ALL_DIFFICULTIES,
  ALL_LEVELS,
  beyondJunior,
  byDifficulty,
  defineTemplate,
  difficultyAdjective,
  extraRequirements,
  hardOnly,
  levelLabel,
} from "./helpers";

const DOMAINS = [
  { company: "BookShelf", entity: "Book", entities: "books", desc: "an online bookstore" },
  { company: "TaskForge", entity: "Task", entities: "tasks", desc: "a project management tool" },
  { company: "EventHub", entity: "Event", entities: "events", desc: "an event booking platform" },
  { company: "FreshCart", entity: "Product", entities: "products", desc: "an e-commerce grocery service" },
  { company: "MedTrack", entity: "Appointment", entities: "appointments", desc: "a healthcare scheduling system" },
] as const;

export const restApiTemplate = defineTemplate({
  id: "rest-api",
  roles: ["backend", "fullstack"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    framework: [
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
    ],
    database: ["PostgreSQL", "MySQL", "MongoDB", "SQL Server", "SQLite", "Redis"],
    orm: ["Prisma", "TypeORM", "Drizzle", "EF Core", "Mongoose", "SQLAlchemy", "Sequelize"],
  },
  topics: ["REST", "API", "Authentication", "JWT", "Database", "SQL"],
  build: ({ level, difficulty, choose, chooseOptional, pick }) => {
    const framework = choose("framework", "a framework of your choice");
    const db = choose("database", "PostgreSQL");
    const orm = chooseOptional("orm");
    const domain = pick(DOMAINS);
    const entityLower = domain.entity.toLowerCase();
    return {
      title: `${domain.company} REST API — ${domain.entity} Management Service`,
      companyContext: `${domain.company} is building ${domain.desc}. The backend team needs a ${levelLabel(level)} engineer to design and implement a ${difficultyAdjective(difficulty)} RESTful API that will serve as the backbone for their web and mobile applications.`,
      brief: `Design and build a REST API for managing **${domain.entities}** using **${framework}** with **${db}**${orm ? ` and **${orm}**` : ""}. The API should follow REST best practices, include authentication, validation, and proper error handling.`,
      background:
        "The current system is a monolithic application that's being decomposed into microservices. Your service will be one of the first standalone APIs. It needs to be well-structured, testable, and ready for production deployment.",
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
          text: "All request bodies must be validated with clear error messages. Return appropriate HTTP status codes (400, 401, 403, 404, 409, 500).",
        },
        {
          key: "Pagination",
          text: "The list endpoint should support cursor-based or offset pagination, sorting by multiple fields, and text search/filtering.",
        },
        ...beyondJunior(level, [
          {
            key: "Relations",
            text: `Add at least one related resource (e.g., ${domain.entity} has many Comments, or belongs to a Category). Include nested create and eager/lazy loading options.`,
          },
          {
            key: "Middleware",
            text: "Implement request logging, rate limiting, and CORS configuration.",
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Caching",
            text: "Implement response caching (Redis or in-memory) for the list and detail endpoints with proper cache invalidation.",
          },
          {
            key: "Events",
            text: "Emit domain events on create/update/delete (e.g., to a message queue or event bus). Include at least one event consumer.",
          },
        ]),
      ],
      nonFunctional: [
        "Follow RESTful naming conventions and HTTP semantics strictly.",
        "Use environment variables for all configuration (DB URL, JWT secret, etc.).",
        "Include database migrations — the schema should be reproducible from scratch.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        `POST /api/${domain.entities} creates a new ${entityLower} and returns 201.`,
        `GET /api/${domain.entities} returns a paginated list with filtering support.`,
        `GET /api/${domain.entities}/:id returns a single ${entityLower} or 404.`,
        `PUT /api/${domain.entities}/:id updates and returns the ${entityLower}.`,
        `DELETE /api/${domain.entities}/:id soft-deletes or hard-deletes the resource.`,
        "Unauthenticated requests to protected routes return 401.",
        "Invalid request bodies return 400 with field-level error details.",
        ...beyondJunior(level, ["Rate limiting returns 429 after threshold is exceeded."]),
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
          description: "RESTful conventions, proper status codes, consistent response shapes.",
        },
        {
          name: "Code Architecture",
          weight: 25,
          description: "Clean separation of concerns, proper layering (controller → service → repository).",
        },
        {
          name: "Data Modeling",
          weight: 15,
          description: "Schema design, relationships, indexes, and migration strategy.",
        },
        {
          name: "Error Handling",
          weight: 15,
          description: "Consistent error responses, validation, edge cases, and 404 handling.",
        },
        {
          name: "Security",
          weight: 10,
          description: "JWT implementation, input sanitization, authorization checks.",
        },
        {
          name: "Testing & Docs",
          weight: 10,
          description: "Test coverage of critical paths, API documentation, and clear README.",
        },
      ],
      hints: [
        "Start by designing your data model and creating the migration before writing any routes.",
        "Use a layered architecture: routes/controllers → service/business logic → data access.",
        "Write your validation schemas early — they act as documentation for your API contract.",
        "Test with curl, Postman, or a simple HTTP client file before writing automated tests.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "2–3 hours",
        medium: "3–5 hours",
        hard: "5–8 hours",
      }),
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
});
