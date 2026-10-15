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

const FLOWS = [
  {
    company: "Insurely",
    form: "Quote Form",
    desc: "a car insurance quote",
    steps: "driver details → vehicle → cover options → review",
  },
  {
    company: "Rentwise",
    form: "Rental Application",
    desc: "a rental application",
    steps: "applicant details → employment → references → review",
  },
  {
    company: "HireFlow",
    form: "Job Application",
    desc: "a job application",
    steps: "personal details → experience → screening questions → review",
  },
  {
    company: "Travelo",
    form: "Trip Booking",
    desc: "a trip booking",
    steps: "travellers → destination & dates → extras → review",
  },
] as const;

export const formWizardTemplate = defineTemplate({
  id: "form-wizard",
  roles: ["frontend", "fullstack"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    framework: ["React", "Vue", "Angular", "Svelte", "Next.js"],
    styling: ["Tailwind CSS", "CSS Modules", "Styled Components", "Sass/SCSS"],
    testing: ["React Testing Library", "Vitest", "Jest", "Playwright", "Cypress"],
  },
  topics: ["TypeScript", "JavaScript", "Accessibility", "Components", "Hooks", "State"],
  build: ({ level, difficulty, choose, pick }) => {
    const framework = choose("framework", "React");
    const styling = choose("styling", "CSS of your choice");
    const testing = choose("testing", "your preferred testing tools");
    const flow = pick(FLOWS);
    return {
      title: `${flow.company} — Accessible Multi-Step ${flow.form}`,
      companyContext: `${flow.company} loses a third of its users halfway through ${flow.desc} form. The product team needs a ${levelLabel(level)} frontend engineer to rebuild it as a ${difficultyAdjective(difficulty)} multi-step flow that is easy to complete, accessible, and forgiving of mistakes.`,
      brief: `Build a multi-step **${flow.form.toLowerCase()}** (${flow.steps}) using **${framework}** and **${styling}**. Focus on clear validation, smooth navigation between steps, and an experience that works for keyboard and screen-reader users.`,
      background:
        "The current form is one long page with validation only on submit: users lose their answers when something fails, error messages are vague, and the page is unusable with a keyboard. Analytics show most drop-offs happen right after a failed submit.",
      requirements: [
        {
          key: "Steps",
          text: "Build a form with at least 3 steps and a progress indicator. Users can move back and forth between steps without losing input.",
        },
        {
          key: "Validation",
          text: "Validate each step before moving on, with inline, field-level error messages shown on blur and on submit.",
        },
        {
          key: "Review",
          text: "A final review step summarises every answer, lets the user jump back to edit any step, and submits to a mocked API.",
        },
        {
          key: "Accessibility",
          text: "Every field has a programmatic label; errors are announced to screen readers; focus moves to the new step's heading or to the first invalid field.",
        },
        ...beyondJunior(level, [
          {
            key: "Persistence",
            text: "Persist progress (e.g. in localStorage) so a refresh resumes where the user left off; clear it after a successful submit.",
          },
          {
            key: "Conditional",
            text: "Add conditional logic: at least one step or field that only appears based on an earlier answer, and whose data is dropped when it no longer applies.",
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Async validation",
            text: "Validate one field asynchronously against the mocked API (e.g. a promo code or email availability) with debouncing and protection against out-of-order responses.",
          },
          {
            key: "Server errors",
            text: "Handle a failing submit — network errors and 422 field errors from the mocked API — by mapping server errors back to the right step and field.",
          },
        ]),
      ],
      nonFunctional: [
        "The whole flow works with a keyboard only and on mobile viewports.",
        "No layout shift when error messages appear or disappear.",
        "Form state lives in one well-defined place, not scattered across components.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "The user cannot proceed past a step with invalid input, and can see why.",
        "Going back and forward between steps preserves every answer.",
        "Submitting shows a loading state, then a confirmation; double submits are prevented.",
        "The flow can be completed using only the keyboard.",
        ...beyondJunior(level, ["Refreshing mid-flow restores the current step and answers."]),
      ],
      bonusChallenges: [
        "Add an optional file upload step with type/size validation and a preview.",
        `Add unit tests for the validation rules and an end-to-end test of the happy path with ${testing}.`,
        "Support localisation of labels and error messages.",
        "Show an autosave indicator and warn before leaving with unsaved changes.",
      ],
      evaluationCriteria: [
        {
          name: "Form Architecture",
          weight: 25,
          description: "Clear state model for steps and answers; validation rules are declarative and reusable.",
        },
        {
          name: "Validation & Error UX",
          weight: 20,
          description: "Helpful, timely field-level errors; failures never lose the user's input.",
        },
        {
          name: "Accessibility",
          weight: 20,
          description: "Labels, error announcements, focus management and keyboard support.",
        },
        {
          name: "Code Quality",
          weight: 15,
          description: "Readable components, sensible boundaries and typed form data.",
        },
        {
          name: "Edge Cases",
          weight: 10,
          description: "Back/forward navigation, refresh, double submit, slow or failing network.",
        },
        {
          name: "Testing",
          weight: 10,
          description: "Tests for the validation logic and the main flow.",
        },
      ],
      hints: [
        "Model the form as data first: a typed answers object and a list of steps with their validation rules.",
        "A schema validation library or your framework's form tooling keeps rules in one place — explain your choice.",
        "Use a mocked API with configurable latency and failures so you can exercise loading and error states.",
        "Try the flow with only a keyboard and with a screen reader (VoiceOver or NVDA) before you submit.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "1–2 hours",
        medium: "2–4 hours",
        hard: "4–6 hours",
      }),
      deliverables: [
        "Source code in a Git repository (or zip).",
        "Screenshots or a short screen recording of the flow, including error states.",
        "A README explaining your state model, validation approach, and what you'd improve next.",
      ],
      constraints: [
        `Use ${framework} as the UI framework.`,
        `Use ${styling} for styling.`,
        "No real backend is needed — mock the API (e.g. with MSW or a small fake service).",
        "You may use a form or validation library, but explain why you chose it.",
      ],
    };
  },
});
