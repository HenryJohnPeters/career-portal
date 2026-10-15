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

export const designSystemTemplate = defineTemplate({
  id: "design-system",
  roles: ["frontend", "fullstack"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    framework: ["React", "Vue", "Angular", "Svelte"],
    styling: ["Tailwind CSS", "CSS Modules", "Styled Components", "Sass/SCSS", "Emotion"],
  },
  topics: ["TypeScript", "JavaScript", "Components", "Accessibility", "Storybook"],
  build: ({ level, difficulty, choose, pick }) => {
    const framework = choose("framework", "React");
    const styling = choose("styling", "CSS of your choice");
    const companyName = pick(["StreamLine", "Pixel Corp", "NovaTech", "CloudView", "DataPulse"]);
    return {
      title: `${framework} Design System — Reusable Component Library`,
      companyContext: `${companyName} is a fast-growing SaaS company building a unified design system. The frontend team needs a ${levelLabel(level)} engineer to build a set of ${difficultyAdjective(difficulty)} reusable UI components that will be shared across multiple product teams.`,
      brief: `Build a small design system library containing a set of composable, accessible UI components using **${framework}** and **${styling}**. The library should demonstrate your understanding of component architecture, API design, accessibility, and styling best practices.`,
      background: `The existing codebase has inconsistent component patterns across 4 product squads. Your task is to create a foundational component library that establishes patterns the rest of the team will follow. Think of this as the "seed" of the company's design system.`,
      requirements: [
        {
          key: "Button",
          text: "Create a `Button` component with variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state, disabled state, and icon support.",
        },
        {
          key: "Input",
          text: "Create a `TextInput` component with label, placeholder, error state, helper text, prefix/suffix icons, and character count.",
        },
        {
          key: "Modal",
          text: "Create a `Modal` / `Dialog` component with customizable header, body, footer, backdrop click dismiss, escape key handling, and focus trapping.",
        },
        {
          key: "Toast",
          text: "Create a `Toast` / notification system with variants (success, error, warning, info), auto-dismiss, stacking, and manual dismiss.",
        },
        ...beyondJunior(level, [
          {
            key: "Composition",
            text: "Demonstrate compound component patterns or render props / slots to allow maximum consumer flexibility.",
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Theming",
            text: "Implement a theming system (light/dark mode + custom brand tokens) that all components consume via context/CSS variables.",
          },
        ]),
      ],
      nonFunctional: [
        "All components must be fully keyboard navigable and meet WCAG 2.1 AA.",
        "Components should be tree-shakable when imported individually.",
        "Use TypeScript with strict types — all props must be fully typed with JSDoc or TSDoc comments.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "Each component renders correctly with all variant/size combinations.",
        "Components handle edge cases (empty content, extremely long text, rapid clicks).",
        "No runtime errors in the console during normal usage.",
        "A demo page or Storybook showcases each component.",
        ...beyondJunior(level, [
          "Components are accessible — tested with a screen reader or axe-core.",
        ]),
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
          description: "Props are intuitive, well-typed, and follow established patterns.",
        },
        {
          name: "Code Quality",
          weight: 20,
          description: "Clean, readable code with consistent patterns and proper separation of concerns.",
        },
        {
          name: "Accessibility",
          weight: 20,
          description: "Keyboard navigation, ARIA attributes, focus management, and color contrast.",
        },
        {
          name: "Styling Architecture",
          weight: 15,
          description: "Styling approach is scalable, themeable, and avoids specificity issues.",
        },
        {
          name: "Edge Cases & Polish",
          weight: 10,
          description: "Handles unusual inputs, loading states, and error boundaries gracefully.",
        },
        {
          name: "Documentation",
          weight: 10,
          description: "Props are documented, usage examples provided, and README explains decisions.",
        },
      ],
      hints: [
        "Start with the `Button` component — it's the simplest and establishes your patterns.",
        "Use a compound component or context pattern for complex components like Modal.",
        "Think about the consumer DX: what would make these components delightful to use?",
        "Don't over-engineer — a clean, simple API is better than maximum configurability.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "1–2 hours",
        medium: "2–4 hours",
        hard: "4–6 hours",
      }),
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
});
