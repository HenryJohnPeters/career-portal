import {
  byDifficulty,
  defineTemplate,
  difficultyAdjective,
  extraRequirements,
  hardOnly,
  levelLabel,
} from "./helpers";

export const realtimeDashboardTemplate = defineTemplate({
  id: "realtime-dashboard",
  roles: ["frontend", "fullstack"],
  levels: ["mid", "senior"],
  difficulties: ["medium", "hard"],
  slots: {
    framework: ["React", "Vue", "Angular", "Svelte"],
    state: ["Redux", "Zustand", "MobX", "Jotai", "Recoil", "Pinia", "NgRx", "TanStack Query"],
  },
  topics: ["TypeScript", "State Management", "Performance", "Caching", "WebSockets"],
  build: ({ level, difficulty, choose, pick }) => {
    const framework = choose("framework", "React");
    const stateLib = choose("state", "your preferred state management solution");
    const companyName = pick(["MetricDash", "FlowBoard", "InsightHQ", "TrackPad", "DataLens"]);
    return {
      title: `${companyName} — Real-Time Dashboard with Complex State`,
      companyContext: `${companyName} builds analytics tools for SaaS companies. They need a ${levelLabel(level)} frontend engineer to build a ${difficultyAdjective(difficulty)} real-time dashboard that handles complex data flows, caching, and optimistic updates.`,
      brief: `Build a **real-time analytics dashboard** using **${framework}** with **${stateLib}** that displays live-updating metrics, supports filtering and drill-downs, and handles complex state synchronization between multiple views.`,
      background:
        "The current dashboard is slow and buggy — state is scattered across 40+ local state hooks with no clear data flow. Your task is to rebuild the dashboard with a proper state architecture that's maintainable and performant.",
      requirements: [
        {
          key: "Dashboard",
          text: "Create a dashboard view with at least 4 metric cards (KPIs) and 2 chart/visualization areas that update in real-time (simulated via polling or WebSocket mock).",
        },
        {
          key: "Filters",
          text: "Implement a global filter bar (date range, team, metric type) that affects all widgets. Filter state should be URL-synced so dashboards are shareable.",
        },
        {
          key: "Drill-down",
          text: "Clicking a metric card or chart segment should navigate to a detail view with more granular data.",
        },
        {
          key: "State",
          text: `Use ${stateLib} to manage application state with clear separation between server state (cached API data) and client state (UI preferences, filters).`,
        },
        {
          key: "Caching",
          text: "Implement smart data caching — navigating between views should not refetch data unnecessarily. Stale data should be shown while revalidating.",
        },
        ...hardOnly(difficulty, [
          {
            key: "Optimistic",
            text: "Add at least one optimistic update flow (e.g., pinning a metric, favoriting a dashboard, or changing a setting).",
          },
          {
            key: "Virtualization",
            text: "Implement list virtualization for a data table with 10,000+ rows that scrolls smoothly.",
          },
        ]),
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
        "Create a reusable hook or service that abstracts the polling/WebSocket logic.",
      ],
      evaluationCriteria: [
        {
          name: "State Architecture",
          weight: 30,
          description: "Clear data flow, proper separation of concerns, predictable state updates.",
        },
        {
          name: "Performance",
          weight: 20,
          description: "No unnecessary re-renders, efficient data fetching, smooth interactions.",
        },
        {
          name: "UX Quality",
          weight: 20,
          description: "Loading states, error handling, responsive layout, intuitive navigation.",
        },
        {
          name: "Code Organization",
          weight: 15,
          description: "File structure, custom hooks, component composition, TypeScript usage.",
        },
        {
          name: "Testing",
          weight: 15,
          description: "Unit tests for state logic, integration tests for key flows.",
        },
      ],
      hints: [
        "Design your state shape on paper first — draw the state tree before coding.",
        'Separate "server state" (API data) from "UI state" (filters, open panels) from the start.',
        "Use mock data generators so you can develop the UI without a real API.",
        "Profile your renders with your framework's devtools to catch performance issues early.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "3–4 hours",
        medium: "4–6 hours",
        hard: "6–8 hours",
      }),
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
});
