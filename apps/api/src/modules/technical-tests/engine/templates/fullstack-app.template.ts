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

const APPS = [
  { company: "LinkDrop", name: "URL Shortener", entity: "Link", desc: "a URL shortener with analytics" },
  { company: "PollVault", name: "Poll Creator", entity: "Poll", desc: "a real-time polling application" },
  { company: "QuickNote", name: "Markdown Notes", entity: "Note", desc: "a collaborative notes application" },
  { company: "SnipBoard", name: "Snippet Manager", entity: "Snippet", desc: "a code snippet sharing tool" },
  { company: "FeedLoop", name: "Feedback Board", entity: "Feedback", desc: "a user feedback and voting board" },
] as const;

export const fullstackAppTemplate = defineTemplate({
  id: "fullstack-app",
  roles: ["fullstack"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    frontend: ["React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Remix"],
    backend: ["NestJS", "Express", "Fastify", ".NET", "Spring Boot", "Django", "FastAPI"],
    database: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
  },
  topics: ["TypeScript", "JavaScript", "Authentication", "REST", "WebSockets", "Responsive Design"],
  build: ({ level, difficulty, choose, pick }) => {
    const feFramework = choose("frontend", "React");
    const beFramework = choose("backend", "Express");
    const db = choose("database", "SQLite");
    const app = pick(APPS);
    const entity = app.entity.toLowerCase();
    return {
      title: `${app.company} — Full-Stack ${app.name}`,
      companyContext: `${app.company} is an early-stage startup building ${app.desc}. They need a ${levelLabel(level)} fullstack engineer to build a ${difficultyAdjective(difficulty)} working prototype that demonstrates the core user flow end-to-end.`,
      brief: `Build a working **${app.name}** application with a **${feFramework}** frontend and a **${beFramework}** backend backed by **${db}**. The app should demonstrate a complete user flow from creation to consumption of ${entity}s.`,
      background:
        "This is a greenfield project. You're the founding engineer tasked with building the initial MVP. The founders care about clean UX, solid engineering foundations, and the ability to iterate quickly after launch.",
      requirements: [
        { key: "Create", text: `Users can create a new ${entity} via a clean, intuitive form.` },
        { key: "List", text: `Users can view a list of all their ${entity}s with search and sorting.` },
        { key: "Detail", text: `Each ${entity} has a detail/view page showing all its information.` },
        { key: "Delete", text: `Users can delete their own ${entity}s with a confirmation dialog.` },
        {
          key: "Auth",
          text: "Implement basic authentication (signup/login) so each user has their own data.",
        },
        ...beyondJunior(level, [
          {
            key: "Realtime",
            text: `Add a real-time element — e.g., live updates when another user interacts with a shared ${entity}.`,
          },
          {
            key: "Responsive",
            text: "The UI must be fully responsive and work well on mobile devices.",
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Analytics",
            text: "Add an analytics/stats view — e.g., view counts, click tracking, usage over time with a simple chart.",
          },
          {
            key: "Share",
            text: `${app.entity}s can be shared via a public URL that works without authentication.`,
          },
        ]),
      ],
      nonFunctional: [
        "Clean, intuitive UI — no design degree required, but it should look intentional.",
        "Proper loading states, error states, and empty states throughout.",
        "API and UI validation should be consistent.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "A new user can sign up, log in, and start using the app immediately.",
        `Creating a ${entity} persists it and it appears in the list.`,
        `Deleting a ${entity} removes it from the list.`,
        "Refreshing the page preserves all data (no client-only state).",
        "The app handles network errors gracefully with user-friendly messages.",
        ...beyondJunior(level, ["The app works on both desktop and mobile viewports."]),
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
          description: "Clean architecture, proper separation between frontend and backend.",
        },
        {
          name: "UX & Polish",
          weight: 20,
          description: "Intuitive flow, loading/error/empty states, responsive design.",
        },
        {
          name: "API Design",
          weight: 15,
          description: "RESTful endpoints, proper validation, consistent error handling.",
        },
        {
          name: "Data Modeling",
          weight: 10,
          description: "Sensible schema, proper relationships, and data integrity.",
        },
        {
          name: "Developer Experience",
          weight: 10,
          description: "Easy to set up locally, clear README, consistent code style.",
        },
      ],
      hints: [
        "Start with the data model and API, then build the UI on top.",
        "Get the happy path working first, then add error handling and edge cases.",
        "Use a monorepo or simple folder structure — don't over-engineer the project setup.",
        `Focus on making the core ${entity} CRUD delightful before adding extras.`,
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "2–4 hours",
        medium: "4–6 hours",
        hard: "6–10 hours",
      }),
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
});
