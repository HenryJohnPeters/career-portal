import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-junior-01",
    track: "frontend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["web", "accessibility", "seo"],
    prompt:
      "Why should a page use elements such as `<header>`, `<nav>`, `<main>` and `<footer>` instead of wrapping every region in a `<div>`?",
    options: [
      "They render faster, because browsers skip layout work for elements that carry a semantic meaning",
      "They expose each region's purpose, so screen readers can jump between landmarks and crawlers see the structure",
      "They are required before CSS Grid or Flexbox can be applied to the main regions of the page",
      "They come with built-in responsive styles that adapt the layout of the page to small screens",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "semantic elements describe meaning, not appearance",
      "they map to landmark roles such as navigation and main",
      "screen-reader users can jump between landmarks",
      "search engines and tools understand the structure",
      "they style and render like a div",
    ],
    redFlags: ["semantic elements render faster", "grid or flexbox only work on semantic elements"],
    rubric: {
      criteria: [
        {
          name: "Meaning and accessibility",
          weight: 5,
          keywords: ["semantic", "landmark", "screen reader", "assistive technology", "navigate", "role"],
        },
        {
          name: "Other benefits",
          weight: 3,
          keywords: ["seo", "search engine", "structure", "readability", "maintainability"],
        },
      ],
    },
    modelAnswer:
      "Semantic elements describe what a region is rather than how it looks. Browsers expose <nav>, <main> and (at the top level) <header> and <footer> as landmark roles, so screen-reader users can jump straight to the navigation or the main content, and search engines and other tools can understand the structure of the page. They render and can be styled exactly like a <div>: they do not make a page faster or responsive, and Grid and Flexbox work on any element.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-02",
    track: "frontend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["react", "components"],
    prompt:
      "When rendering a list in React with `items.map(...)`, why should each element get a stable, unique `key` prop?",
    options: [
      "So React sorts the list by key automatically before it renders the items to the page",
      "So the browser can apply a different CSS style to each item in the list through its key",
      "So React can match each element to the same item between renders, keeping its state and DOM node",
      "So screen readers can announce the position of each item within the list to the user",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "keys identify list items between renders",
      "React uses them to match old and new elements during reconciliation",
      "items keep their state and DOM nodes when the list is reordered",
      "use a stable id from the data rather than the array index",
      "keys only need to be unique among siblings",
    ],
    redFlags: ["keys are used for styling or sorting", "Math.random() is a good key", "the array index is always a safe key"],
    rubric: {
      criteria: [
        {
          name: "Purpose",
          weight: 5,
          keywords: ["identify", "reconciliation", "match", "between renders", "state", "dom node"],
        },
        {
          name: "Choosing keys",
          weight: 4,
          keywords: ["stable", "unique", "id", "index", "reorder", "siblings"],
        },
      ],
    },
    modelAnswer:
      "React uses keys during reconciliation to work out which element in the new list corresponds to which element in the previous render. With stable keys, inserting, removing or reordering items only touches the affected elements, and each item keeps its own state and DOM node, such as the text typed into an input. Use an id from the data: the array index breaks when the list is reordered or filtered, and a random key remounts every item on every render. Keys have nothing to do with styling, sorting or accessibility.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-03",
    track: "frontend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["css", "flexbox", "layout"],
    prompt:
      "A container has `display: flex` with the default `flex-direction: row`. Which property centres its children horizontally?",
    options: ["align-items: center", "text-align: center", "vertical-align: middle", "justify-content: center"],
    correctOptionIndex: 3,
    expectedPoints: [
      "justify-content aligns items along the main axis",
      "align-items aligns items along the cross axis",
      "in a row the main axis is horizontal",
      "the axes swap with flex-direction: column",
    ],
    redFlags: ["justify-content is always horizontal", "text-align positions flex items"],
    rubric: {
      criteria: [
        {
          name: "Axes",
          weight: 5,
          keywords: ["main axis", "cross axis", "row", "column", "flex-direction"],
        },
        {
          name: "Properties",
          weight: 4,
          keywords: ["justify-content", "align-items", "center", "horizontal", "vertical"],
        },
      ],
    },
    modelAnswer:
      "In a flex container, justify-content distributes items along the main axis and align-items aligns them along the cross axis. With the default flex-direction: row the main axis is horizontal, so justify-content: center centres the children horizontally, while align-items: center would centre them vertically. If flex-direction is column the axes swap. text-align and vertical-align do not position flex items.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-04",
    track: "frontend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["browser apis", "web"],
    prompt: "How does `sessionStorage` differ from `localStorage` in the browser?",
    options: [
      "sessionStorage belongs to one tab and is cleared when that tab closes; localStorage persists until it is removed",
      "sessionStorage is sent to the server with every request, while localStorage always stays in the browser",
      "sessionStorage is shared by every site the user visits, while localStorage is limited to a single origin",
      "sessionStorage can store objects directly, while localStorage can only store string values",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "both are per-origin key-value stores of strings",
      "sessionStorage lasts for one tab and survives reloads",
      "localStorage is shared across tabs and survives browser restarts",
      "neither is sent to the server automatically, unlike cookies",
      "objects need JSON.stringify and JSON.parse",
    ],
    redFlags: ["web storage is sent with requests like cookies", "web storage is a safe place for secrets"],
    rubric: {
      criteria: [
        {
          name: "Lifetime and scope",
          weight: 5,
          keywords: ["tab", "closed", "persist", "origin", "reload", "shared"],
        },
        {
          name: "Data and transport",
          weight: 3,
          keywords: ["string", "json", "cookie", "not sent", "server"],
        },
      ],
    },
    modelAnswer:
      "Both are synchronous, per-origin key-value stores that only hold strings, so objects must be serialised with JSON.stringify. sessionStorage belongs to a single tab: it survives reloads but is cleared when the tab is closed and is not shared with other tabs. localStorage is shared by all tabs of the same origin and persists until code or the user clears it. Unlike cookies, neither is sent to the server with requests.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-05",
    track: "frontend",
    level: "junior",
    difficulty: 1,
    type: "behavioral",
    tags: ["behavioral", "communication", "teamwork"],
    prompt:
      "You have spent most of a day stuck on a bug in a feature you own, and the sprint ends in two days. What is the best next step?",
    options: [
      "Keep working on it alone until it is fixed, so the team does not think you need too much help",
      "Write up what you have tried, ask a teammate or your lead for help, and flag the risk to the deadline",
      "Quietly move the ticket out of the sprint without telling anyone, and pick up an easier one instead",
      "Wrap the failing code in a try/catch that hides the error, so the feature appears to work for now",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "time-box solo debugging before asking for help",
      "summarise symptoms, what was tried and what was ruled out",
      "ask a teammate or lead",
      "raise the deadline risk early",
      "never hide errors to make work look finished",
    ],
    redFlags: ["asking for help is a weakness", "hiding an error to make the feature look done"],
    rubric: {
      criteria: [
        {
          name: "Asking for help well",
          weight: 5,
          keywords: ["ask", "help", "teammate", "tried", "summary", "time-box"],
        },
        {
          name: "Transparency",
          weight: 4,
          keywords: ["flag", "risk", "deadline", "communicate", "lead", "honest"],
        },
      ],
    },
    modelAnswer:
      "After a reasonable time-box, asking for help is the professional choice. A short write-up of the symptoms, what you have tried and what you have ruled out makes it quick for a teammate to help, and often reveals the answer itself. Flagging the deadline risk early lets your lead re-plan. Struggling alone for days wastes the team's time, and silently dropping the ticket or swallowing the error hides the problem instead of solving it.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-junior-06",
    track: "frontend",
    level: "junior",
    difficulty: 2,
    type: "coding",
    tags: ["javascript"],
    prompt:
      "Another file needs both the function and `PI` from this module. Which import statement works?\n\n```js\n// math.js\nexport default function add(a, b) {\n  return a + b;\n}\nexport const PI = 3.14159;\n```",
    options: [
      '`import { add, PI } from "./math.js";`',
      '`import { default: add, PI } from "./math.js";`',
      '`import addNumbers, { PI } from "./math.js";`',
      '`import * as math from "./math.js";` and then call `math.add(1, 2)`',
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a module has at most one default export",
      "a default import has no braces and can take any local name",
      "named imports use braces and must match the exported name",
      "a namespace import exposes the default export as .default",
      "default and named imports can be combined in one statement",
    ],
    redFlags: ["default exports are imported by name inside braces", "named exports can be imported without braces"],
    rubric: {
      criteria: [
        {
          name: "Default exports",
          weight: 5,
          keywords: ["default", "no braces", "any name", "one per module"],
        },
        {
          name: "Named exports",
          weight: 4,
          keywords: ["named", "braces", "exact name", "namespace", "import *"],
        },
      ],
    },
    modelAnswer:
      "A default export is imported without braces and can be given any local name, while named exports are imported inside braces using their exported names, so `import addNumbers, { PI } from \"./math.js\"` works: the default export is bound to the local name addNumbers. `import { add, PI }` fails because the module has no export named add: the function is the default export. With a namespace import the function is available as math.default, not math.add, and `{ default: add }` is object-destructuring syntax that import statements do not accept (the rename form is `default as add`).",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-07",
    track: "frontend",
    level: "junior",
    difficulty: 2,
    type: "coding",
    tags: ["css"],
    prompt:
      'The HTML is `<nav id="main"><a class="link" href="/">Home</a></nav>`. With the CSS below, what colour is the link text?\n\n```css\n#main a { color: red; }\nnav a.link { color: green; }\n.link { color: blue; }\n```',
    options: [
      "Red, because an ID selector outweighs any number of class and type selectors",
      "Green, because nav a.link combines the most selectors of the three rules",
      "Blue, because .link is the last matching rule in the stylesheet",
      "The default link colour, because the conflicting rules cancel each other out",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "specificity is compared before source order",
      "specificity counts IDs, then classes/attributes/pseudo-classes, then types",
      "#main a is (1,0,1) and beats nav a.link at (0,1,2)",
      "source order only breaks ties",
      "keeping selectors low-specificity avoids these fights",
    ],
    redFlags: ["the last rule always wins", "the rule with more selectors always wins"],
    rubric: {
      criteria: [
        {
          name: "Specificity",
          weight: 5,
          keywords: ["specificity", "id", "class", "type selector", "weight"],
        },
        {
          name: "Cascade order",
          weight: 3,
          keywords: ["source order", "tie", "last rule", "cascade"],
        },
      ],
    },
    modelAnswer:
      "When several rules set the same property, the browser compares specificity first and uses source order only to break ties. Specificity is compared column by column: IDs, then classes, attributes and pseudo-classes, then type selectors. `#main a` is (1,0,1), `nav a.link` is (0,1,2) and `.link` is (0,1,0), so the ID rule wins and the link is red. Blue would win only if the specificities were equal, because .link comes last.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-08",
    track: "frontend",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["react", "state", "components"],
    prompt:
      'Users cannot type into this field: the input stays empty whatever they press. What is the bug?\n\n```jsx\nfunction NameField() {\n  const [name, setName] = useState("");\n  return <input value={name} />;\n}\n```',
    options: [
      "React only applies typed text to an input once the surrounding <form> is submitted",
      "The input needs a name attribute before the browser allows the user to edit it",
      "State from useState is read-only in function components, so a class component is needed",
      "value makes it a controlled input, but nothing updates name, so React keeps it empty",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "the value prop makes the input controlled",
      "React state is the single source of truth for the field",
      "onChange must call setName with e.target.value",
      "defaultValue gives an uncontrolled input instead",
      "React warns about value without onChange",
    ],
    redFlags: ["inputs need a name attribute to be editable", "function components cannot update inputs"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["controlled", "value", "state", "source of truth", "reset"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["onchange", "setname", "e.target.value", "defaultvalue", "uncontrolled"],
        },
      ],
    },
    modelAnswer:
      "Passing value makes this a controlled input: React renders whatever the state holds, and because nothing ever calls setName, each keystroke is immediately reverted to the empty string. Add `onChange={(e) => setName(e.target.value)}` so typing updates the state that drives the input. If React does not need to own the value, use defaultValue for an uncontrolled input instead. React logs a warning about a value prop without an onChange handler for exactly this reason.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-09",
    track: "frontend",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["accessibility"],
    prompt:
      'A close button contains only an icon: `<button onClick={close}><svg aria-hidden="true">…</svg></button>`. A screen reader announces it as just "button". What is the best fix?',
    options: [
      'Add role="button" to the button element so that screen readers recognise it',
      'Add aria-label="Close dialog" to the button so that it has an accessible name',
      'Add a title attribute to the svg so that sighted users see a tooltip on hover',
      'Add tabindex="0" to the button element so that it can receive keyboard focus',
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "every interactive control needs an accessible name",
      "an icon-only button has no text to use as its name",
      "aria-label or visually hidden text provides the name",
      "a native button already has the button role and is focusable",
      "decorative icons stay hidden with aria-hidden",
    ],
    redFlags: ["a native button needs role=button", "tabindex fixes what a screen reader announces"],
    rubric: {
      criteria: [
        {
          name: "Accessible name",
          weight: 5,
          keywords: ["accessible name", "aria-label", "visually hidden", "screen reader", "announce"],
        },
        {
          name: "Native semantics",
          weight: 3,
          keywords: ["native", "button", "role", "focusable", "keyboard"],
        },
      ],
    },
    modelAnswer:
      "Screen readers announce a control's role and its accessible name. A native <button> already has the button role and is keyboard-focusable, but with its only content hidden it has no name, so users hear just \"button\". Adding aria-label=\"Close dialog\" (or visually hidden text inside the button) gives it a name. Adding role=\"button\" or tabindex=\"0\" changes nothing, because the button already has both behaviours.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-10",
    track: "frontend",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["testing", "playwright", "cypress"],
    prompt:
      "Your team wants confidence that a user can sign in through the real login page and reach their dashboard, with routing, the API and a real browser all involved. Which kind of test fits best?",
    options: [
      "A unit test of the login form's validation function, with the API calls mocked out",
      "A component test that renders the login form in jsdom with a stubbed API client",
      "An end-to-end test, for example with Playwright or Cypress, that drives a real browser",
      "A snapshot test that compares the dashboard's rendered markup with a saved copy",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "end-to-end tests drive a real browser through a user journey",
      "they exercise routing, network calls and the backend together",
      "unit and component tests isolate pieces behind mocks",
      "e2e tests are slower, so keep them for critical journeys",
    ],
    redFlags: ["a snapshot test proves a flow works", "mocked unit tests verify the integration"],
    rubric: {
      criteria: [
        {
          name: "Test level",
          weight: 5,
          keywords: ["end-to-end", "e2e", "real browser", "user journey", "playwright", "cypress"],
        },
        {
          name: "Trade-offs",
          weight: 3,
          keywords: ["unit", "component", "mock", "slower", "critical path", "pyramid"],
        },
      ],
    },
    modelAnswer:
      "An end-to-end test runs the real application in a real browser and acts like a user: it fills in the login form, submits it and asserts that the dashboard appears, so routing, API calls, cookies and rendering are all exercised together. Unit and component tests are faster and ideal for logic and individual components, but they mock the very boundaries this scenario needs to cover. Because e2e tests are slower and more brittle, teams keep them for critical journeys such as sign-in and checkout.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-junior-11",
    track: "frontend",
    level: "junior",
    difficulty: 3,
    type: "coding",
    tags: ["javascript", "event-loop"],
    prompt:
      "What does this code log, and why?\n\n```js\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}\n```",
    options: [
      "0, 1, 2, because each callback captures the value i had when setTimeout was called",
      "3, 3, 3, because var creates one shared i, which is 3 by the time the callbacks run",
      "undefined three times, because i goes out of scope as soon as the loop has finished",
      "0, 0, 0, because a 0 ms delay runs each callback before the loop increments i",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "var is function-scoped, so every callback shares one i",
      "closures capture variables, not copies of their values",
      "timer callbacks run after the synchronous loop finishes",
      "let creates a new binding per iteration and logs 0, 1, 2",
    ],
    redFlags: ["closures copy the value when they are created", "setTimeout with 0 runs synchronously"],
    rubric: {
      criteria: [
        {
          name: "Closures and scope",
          weight: 5,
          keywords: ["closure", "var", "function-scoped", "shared", "binding", "let"],
        },
        {
          name: "Timing",
          weight: 4,
          keywords: ["settimeout", "after the loop", "event loop", "task", "queue"],
        },
      ],
    },
    modelAnswer:
      "The arrow functions close over the variable i, not over its value at the time. Because var is function-scoped there is only one i, and the timer callbacks run only after the synchronous loop has finished, when i is 3, so it logs 3 three times. Declaring the loop variable with let creates a fresh binding for each iteration, so each callback sees its own value and the output becomes 0, 1, 2. A 0 ms delay still queues the callback to run after the current script.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-12",
    track: "frontend",
    level: "junior",
    difficulty: 3,
    type: "debugging",
    tags: ["react", "hooks", "state"],
    prompt:
      "Clicking the button should add 2, but the count only goes up by 1. Why, and what fixes it?\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  function addTwo() {\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n  return <button onClick={addTwo}>{count}</button>;\n}\n```",
    options: [
      "Both calls read the same count from this render; use the updater form setCount(c => c + 1)",
      "React ignores the second call, because a setter may only run once per event handler",
      "The setter is asynchronous, so add await before each setCount call so that they finish",
      "count must be declared with let instead of const so that the setter is able to modify it",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "state is a fixed snapshot for each render",
      "both calls compute count + 1 from the same snapshot",
      "updates are batched and applied on the next render",
      "an updater function receives the latest pending state",
      "setCount(c => c + 1) twice adds 2",
    ],
    redFlags: ["the state setter returns a promise to await", "mutating or reassigning count directly"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["snapshot", "same value", "stale", "batched", "next render"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["updater", "functional update", "previous state", "c => c + 1"],
        },
      ],
    },
    modelAnswer:
      "Each render sees a fixed snapshot of state, so inside addTwo count holds the same value for both calls: on the first click it is 0, and both calls queue the value 1. React batches the updates and re-renders once with count set to 1. Passing an updater function, setCount(c => c + 1), makes React apply each update to the latest pending value, so two calls add 2. The setter does not return a promise, so await does not help, and reassigning the local count variable would not change React's state.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-13",
    track: "frontend",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["accessibility", "css"],
    prompt:
      "A designer wants the focus ring gone because it looks untidy after buttons are clicked, and a teammate suggests `*:focus { outline: none; }`. What is the better approach?",
    options: [
      "Apply outline: none as suggested and rely on the hover styles, which keyboard users also see",
      "Keep a visible focus style but apply it with :focus-visible, which shows for keyboard focus, not usually clicks",
      'Add tabindex="-1" to every button so that clicking them no longer moves focus onto them',
      "Apply outline: none and add aria-live to each button so screen readers announce focus changes",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "keyboard users rely on a visible focus indicator",
      "outline: none on :focus removes it for everyone",
      ":focus-visible matches when the browser decides focus should be shown",
      "WCAG requires a visible focus indicator",
      "tabindex=-1 removes buttons from the tab order",
    ],
    redFlags: ["hover styles replace focus styles", "removing focus outlines is harmless"],
    rubric: {
      criteria: [
        {
          name: "Why focus matters",
          weight: 5,
          keywords: ["keyboard", "focus indicator", "visible", "wcag", "tab"],
        },
        {
          name: "Approach",
          weight: 4,
          keywords: [":focus-visible", "outline", "mouse", "style", "tab order"],
        },
      ],
    },
    modelAnswer:
      "Keyboard users rely on the focus indicator to know where they are on the page, and WCAG requires focus to be visible, so removing outlines on :focus breaks keyboard navigation. The :focus-visible pseudo-class matches only when the browser decides focus should be shown, such as when moving with Tab, and usually not after a mouse click on a button, so styling focus with it satisfies the designer and keyboard users alike. Hover styles never appear for keyboard users, and tabindex=\"-1\" would remove the buttons from the tab order entirely.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-14",
    track: "frontend",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["typescript", "types"],
    prompt: "In TypeScript, how does a value typed `unknown` differ from one typed `any`?",
    options: [
      "unknown is validated at runtime and throws on a wrong type, while any is only checked at compile time",
      "unknown can only hold null or undefined, while any can hold a value of every other type",
      "unknown is the type a variable has before assignment, and any is the type it has afterwards",
      "Both accept any value, but unknown must be narrowed, e.g. with typeof, before use, while any disables checks",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "any value can be assigned to both",
      "any switches off type checking for that value",
      "unknown must be narrowed before property access or calls",
      "narrow with typeof, instanceof, in or a type guard",
      "unknown suits untrusted data such as parsed JSON or caught errors",
    ],
    redFlags: ["TypeScript checks types at runtime", "unknown and any are interchangeable"],
    rubric: {
      criteria: [
        {
          name: "Difference",
          weight: 5,
          keywords: ["narrow", "type checking", "unsafe", "type-safe", "assignable"],
        },
        {
          name: "Narrowing",
          weight: 4,
          keywords: ["typeof", "instanceof", "type guard", "in operator", "compile time"],
        },
      ],
    },
    modelAnswer:
      "Any value can be assigned to both, but they behave in opposite ways when you use the value. any turns type checking off, so `value.foo.bar()` compiles even if it will crash. unknown is the type-safe counterpart: you cannot access properties on it or call it until you narrow it with typeof, instanceof, in or a type guard. Neither does anything at runtime, because TypeScript types are erased, which is why unknown is a good choice for parsed JSON and caught errors.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-junior-15",
    track: "frontend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["web vitals", "performance"],
    prompt: "Which of these metrics are Core Web Vitals? Select all that apply.",
    options: [
      "Largest Contentful Paint (LCP)",
      "Time to First Byte (TTFB)",
      "Interaction to Next Paint (INP)",
      "Total Blocking Time (TBT)",
      "Cumulative Layout Shift (CLS)",
    ],
    correctOptionIndex: 2,
    correctOptionIndices: [0, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "LCP measures loading",
      "INP measures responsiveness and replaced FID in 2024",
      "CLS measures visual stability",
      "TTFB and TBT are diagnostic metrics, not Core Web Vitals",
      "assessed on real-user data at the 75th percentile",
    ],
    redFlags: ["First Input Delay is still a Core Web Vital", "the Lighthouse score is a Core Web Vital"],
    rubric: {
      criteria: [
        {
          name: "The three vitals",
          weight: 5,
          keywords: ["lcp", "inp", "cls", "loading", "responsiveness", "visual stability"],
        },
        {
          name: "Supporting metrics",
          weight: 3,
          keywords: ["ttfb", "tbt", "diagnostic", "lab", "field data", "75th percentile"],
        },
      ],
    },
    modelAnswer:
      "The Core Web Vitals are Largest Contentful Paint (loading: when the largest visible element renders), Interaction to Next Paint (responsiveness: how quickly the page paints after user input; it replaced First Input Delay in March 2024) and Cumulative Layout Shift (visual stability: how much content moves unexpectedly). Time to First Byte and Total Blocking Time are useful diagnostics, TBT being a lab metric that correlates with INP, but they are not Core Web Vitals. Google assesses the vitals on real-user data at the 75th percentile.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-16",
    track: "frontend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["react", "state", "context api"],
    prompt: "Which of these cause a React function component to re-render? Select all that apply.",
    options: [
      "Its own state is set to a different value with the setter from useState",
      "The component that renders it re-renders, and it is not wrapped in React.memo",
      "A value it keeps in a useRef is changed by assigning to ref.current",
      "A context it reads with useContext is given a new value by its provider",
      "A module-level variable it reads is reassigned by code outside React",
    ],
    correctOptionIndex: 3,
    correctOptionIndices: [0, 1, 3],
    multiSelect: true,
    expectedPoints: [
      "setting state to a new value schedules a render",
      "by default a component re-renders whenever the component that renders it does",
      "context consumers re-render when the provider value changes",
      "changing ref.current never triggers a render",
      "React cannot see changes to plain variables",
    ],
    redFlags: ["changing ref.current re-renders the component", "components only re-render when their props change"],
    rubric: {
      criteria: [
        {
          name: "Render triggers",
          weight: 5,
          keywords: ["state", "parent", "context", "setter", "provider"],
        },
        {
          name: "Non-triggers",
          weight: 4,
          keywords: ["ref", "mutable", "module variable", "react.memo", "object.is"],
        },
      ],
    },
    modelAnswer:
      "A function component re-renders when its own state changes (React skips the render if the new value is Object.is-equal to the old one), when the parent component that renders it re-renders (unless it is memoised and its props are shallowly equal) and when a context it reads receives a new value. (An element passed in as children was created further up the tree, so it is not re-rendered when only the component that receives it re-renders.) Changing ref.current is deliberately invisible to React, and React has no way of knowing that a plain module variable changed, so neither schedules a render. A common misconception is that components re-render only when their props change; by default they re-render whenever their parent does.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-17",
    track: "frontend",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["react", "hooks"],
    prompt:
      "This clock is mounted and unmounted many times as users move around the app. What is wrong with the effect?\n\n```jsx\nfunction Clock() {\n  const [now, setNow] = useState(Date.now());\n  useEffect(() => {\n    setInterval(() => setNow(Date.now()), 1000);\n  }, []);\n  return <p>{new Date(now).toLocaleTimeString()}</p>;\n}\n```",
    options: [
      "The empty dependency array stops the interval from ever firing; the array should list now",
      "It never clears the interval, so each mount leaks a timer; return () => clearInterval(id)",
      "setInterval cannot run inside useEffect, so the timer must be started in the render body",
      "Date.now() must be wrapped in useMemo, otherwise the interval callback throws on each tick",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "effects that start timers or subscriptions need cleanup",
      "return a cleanup function from the effect",
      "clearInterval with the id returned by setInterval",
      "cleanup runs on unmount and before the effect re-runs",
      "Strict Mode runs effects twice in development to expose missing cleanup",
    ],
    redFlags: ["timers stop automatically when a component unmounts", "starting side effects in the render body"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["cleanup", "leak", "unmount", "interval", "still running"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["return", "clearinterval", "id", "strict mode", "re-run"],
        },
      ],
    },
    modelAnswer:
      "An effect that starts something long-lived must undo it in a cleanup function. Here each mount starts a new interval that is never cleared, so after the component unmounts the timer keeps running and calling setNow, and every remount adds another one. Store the id and return `() => clearInterval(id)` from the effect; React runs the cleanup on unmount and before re-running the effect. Adding now to the dependency array would make things worse by starting a new uncleared interval every second. Strict Mode deliberately mounts components twice in development to expose this kind of missing cleanup.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-18",
    track: "frontend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["performance", "react"],
    prompt:
      "The app's initial JavaScript bundle includes a large charting library that is only used on the Reports page. What most effectively reduces what users download on first load?",
    options: [
      "Keep the static import but minify the charting library separately before running the build",
      'Add loading="lazy" to the main bundle\'s script tag so that it downloads after the page appears',
      "Move the import statement to the bottom of the file so that the browser evaluates it last",
      "Load the Reports page with dynamic import() via React.lazy, so the library ships in its own chunk",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "code splitting with dynamic import()",
      "React.lazy with Suspense for route-level components",
      "the bundler emits a separate chunk loaded on demand",
      "a smaller initial bundle loads and becomes interactive sooner",
      "verify with a bundle analyser",
    ],
    redFlags: ["the position of an import changes what is downloaded", "loading=lazy works on script tags"],
    rubric: {
      criteria: [
        {
          name: "Code splitting",
          weight: 5,
          keywords: ["dynamic import", "react.lazy", "suspense", "chunk", "on demand", "route"],
        },
        {
          name: "Bundle awareness",
          weight: 3,
          keywords: ["initial bundle", "bundle size", "analyser", "static import", "minify"],
        },
      ],
    },
    modelAnswer:
      "A static import puts the library in the initial bundle wherever the statement appears in the file. Turning the Reports route into a dynamic import, for example `const Reports = lazy(() => import(\"./Reports\"))` rendered inside <Suspense>, tells the bundler to emit a separate chunk that is only downloaded when the page is visited. Minifying shrinks the code a little but still ships it to everyone, and loading=\"lazy\" applies to images and iframes, not scripts. A bundle analyser confirms that the library has moved out of the initial chunk.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-19",
    track: "frontend",
    level: "junior",
    difficulty: 4,
    type: "coding",
    tags: ["css", "layout", "responsive design"],
    prompt:
      "A grid of product cards should show as many columns as fit, each at least 200px wide and sharing any leftover space, and drop to fewer columns on narrow screens without media queries. Which declaration does this?",
    options: [
      "`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));`",
      "`grid-template-columns: repeat(4, 200px);`",
      "`grid-template-columns: minmax(200px, 1fr) auto;`",
      "`grid-auto-flow: column; grid-auto-columns: 200px;`",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "repeat() with auto-fit creates as many columns as fit",
      "minmax(200px, 1fr) sets a minimum and shares the remaining space",
      "items wrap onto new rows as the container narrows",
      "no media queries are needed",
      "auto-fill keeps empty tracks, auto-fit collapses them",
    ],
    redFlags: ["a fixed column count is responsive", "grid always needs media queries to wrap"],
    rubric: {
      criteria: [
        {
          name: "Grid syntax",
          weight: 5,
          keywords: ["repeat", "auto-fit", "minmax", "1fr", "grid-template-columns"],
        },
        {
          name: "Responsive behaviour",
          weight: 4,
          keywords: ["wrap", "fewer columns", "media query", "intrinsic", "container width"],
        },
      ],
    },
    modelAnswer:
      "`repeat(auto-fit, minmax(200px, 1fr))` asks the grid to create as many columns as fit in the container, each at least 200px wide and growing equally to share leftover space. As the container narrows, fewer columns fit and the cards wrap onto new rows automatically, so no media query is needed. `repeat(4, 200px)` always makes four fixed columns and overflows on small screens, and grid-auto-flow: column places every card in one horizontal row. auto-fill behaves similarly but keeps empty tracks when there are few items, while auto-fit collapses them.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-junior-20",
    track: "frontend",
    level: "junior",
    difficulty: 5,
    type: "coding",
    tags: ["javascript", "event-loop", "async"],
    prompt:
      'In what order are the letters logged?\n\n```js\nconsole.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");\n```',
    options: ["A, B, C, D", "A, D, B, C", "A, C, D, B", "A, D, C, B"],
    correctOptionIndex: 3,
    expectedPoints: [
      "synchronous code runs to completion first",
      "promise callbacks are queued as microtasks",
      "setTimeout callbacks are queued as tasks",
      "the microtask queue is drained before the next task runs",
      "a 0 ms timeout is never immediate",
    ],
    redFlags: ["setTimeout with 0 runs immediately", "then callbacks run synchronously"],
    rubric: {
      criteria: [
        {
          name: "Queues",
          weight: 5,
          keywords: ["microtask", "task", "macrotask", "queue", "event loop"],
        },
        {
          name: "Ordering",
          weight: 4,
          keywords: ["synchronous", "call stack", "drained", "before", "settimeout", "promise"],
        },
      ],
    },
    modelAnswer:
      "The synchronous code runs first, logging A and then D. The .then callback is queued as a microtask and the setTimeout callback as a task. When the call stack empties, the event loop drains the whole microtask queue before taking the next task, so C is logged before B, giving A, D, C, B. A 0 ms timeout only means \"as soon as possible after the current work\", never before pending microtasks.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-21",
    track: "frontend",
    level: "junior",
    difficulty: 5,
    type: "debugging",
    tags: ["javascript", "async"],
    prompt:
      '"All saved" is logged before the saves have finished, and a failed save never reaches the caller. What is the bug?\n\n```js\nasync function saveAll(items) {\n  items.forEach(async (item) => {\n    await save(item);\n  });\n  console.log("All saved");\n}\n```',
    options: [
      "The callback must be a regular function rather than an arrow function for await to pause forEach",
      "save() must accept a callback, because await does not work inside functions passed to array methods",
      "forEach ignores the promises its callback returns; use for...of with await, or await Promise.all(...)",
      "saveAll must be awaited where it is called; then forEach waits for each save to finish in turn",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "forEach discards the callback's return value, including promises",
      "saveAll logs and resolves before the saves settle",
      "rejections become unhandled instead of reaching the caller",
      "for...of with await runs the saves one after another",
      "await Promise.all(items.map(...)) runs them in parallel",
    ],
    redFlags: ["awaiting the caller makes forEach wait", "arrow functions cannot be async"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["foreach", "ignores", "promise", "not awaited", "unhandled rejection"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["for...of", "promise.all", "map", "sequential", "parallel"],
        },
      ],
    },
    modelAnswer:
      "Array.prototype.forEach calls the callback and throws away its return value, so the promises returned by the async callback are never awaited. saveAll therefore logs \"All saved\" and resolves straight away, and a rejected save becomes an unhandled rejection rather than an error the caller can catch. Use `for (const item of items) await save(item);` to save one after another, or `await Promise.all(items.map((item) => save(item)))` to run them in parallel and fail if any rejects. Awaiting saveAll at the call site does not help, because saveAll itself never waits.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-22",
    track: "frontend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["typescript", "types"],
    prompt:
      'This compiles without errors, yet in production `toUpperCase` throws because the API returned `{ "fullName": "Ana" }`. Why did TypeScript not catch it?\n\n```ts\ninterface User { name: string }\n\nasync function greet() {\n  const res = await fetch("/api/me");\n  const user = (await res.json()) as User;\n  return user.name.toUpperCase();\n}\n```',
    options: [
      "`as User` is only a compile-time assertion and types are erased, so nothing checks the real JSON",
      "res.json() is typed any, and TypeScript only validates parsed JSON when strict mode is enabled",
      "Interfaces are checked only for class instances; a type alias would make the cast check the JSON",
      "TypeScript does check the response at runtime, but it logs a warning rather than throwing an error",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "type assertions neither convert nor check runtime values",
      "TypeScript types are erased from the emitted JavaScript",
      "res.json() resolves to any",
      "data from outside the program must be validated at runtime",
      "use a schema library such as Zod or a type guard",
    ],
    redFlags: ["as converts or validates the object", "TypeScript validates data at runtime"],
    rubric: {
      criteria: [
        {
          name: "Why it compiled",
          weight: 5,
          keywords: ["assertion", "compile time", "erased", "any", "trust"],
        },
        {
          name: "Safer approach",
          weight: 4,
          keywords: ["runtime validation", "schema", "zod", "type guard", "unknown"],
        },
      ],
    },
    modelAnswer:
      "TypeScript only checks code at compile time, and its types are erased from the emitted JavaScript. res.json() resolves to any, and `as User` simply tells the compiler to trust you, so the actual JSON is never checked and the mismatch only surfaces when user.name is undefined at runtime. Data from outside the program, such as API responses, storage and user input, should be validated at runtime, for example with a schema library such as Zod or a type guard that returns `value is User`. Strict mode and the choice between an interface and a type alias make no difference.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-23",
    track: "frontend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["react", "context api", "performance", "hooks"],
    prompt:
      "The components that read `AuthContext` are wrapped in `React.memo`, yet they all re-render whenever `App` re-renders for an unrelated reason (code not shown), even though `user` has not changed. Why?\n\n```jsx\nfunction App() {\n  const [user, setUser] = useState(null);\n  return (\n    <AuthContext.Provider value={{ user, setUser }}>\n      <Routes />\n    </AuthContext.Provider>\n  );\n}\n```",
    options: [
      "React.memo has no effect on components that are rendered anywhere inside a context provider",
      "setUser gets a new identity on every render, so React treats the context value as changed",
      "The value object is recreated on every render, so consumers see a new value; memoise it with useMemo",
      "A provider always re-renders every component below it, whether or not they read the context",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "React compares the provider value with Object.is",
      "an inline object literal is a new reference on every render",
      "every consumer re-renders when the value changes, even memoised ones",
      "useMemo(() => ({ user, setUser }), [user]) keeps it stable",
      "state setters from useState are already stable",
    ],
    redFlags: ["React.memo blocks context updates", "useState setters change on every render"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["new object", "reference", "object.is", "every render", "consumers"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["usememo", "stable", "dependency", "split context", "memoise"],
        },
      ],
    },
    modelAnswer:
      "React decides whether a context value changed by comparing it with Object.is. The inline object `{ user, setUser }` is a new reference on every render of App, so React treats it as a new value and re-renders every component that reads the context, and React.memo cannot prevent a re-render caused by context. Writing `useMemo(() => ({ user, setUser }), [user])` keeps the same object until user actually changes. setUser itself is stable, and memoised components below the provider that do not read the context are not re-rendered by it.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-junior-24",
    track: "frontend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["security", "react", "owasp"],
    prompt:
      "A React app displays comments written by users. Which measures help protect it against cross-site scripting (XSS)? Select all that apply.",
    options: [
      "Rendering comment text with JSX expressions such as {comment.body}, which React escapes",
      "Sanitising any HTML with a library such as DOMPurify before using dangerouslySetInnerHTML",
      "Configuring CORS on the API so that only the app's own origin is allowed to call it",
      "Sending a Content-Security-Policy that blocks inline scripts and untrusted script sources",
      "Serving the whole site over HTTPS so that comments cannot be altered in transit",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 1, 3],
    multiSelect: true,
    expectedPoints: [
      "XSS runs attacker-supplied script in other users' browsers",
      "React escapes values rendered as text in JSX",
      "dangerouslySetInnerHTML bypasses escaping, so sanitise first",
      "a CSP restricts which scripts can run, as defence in depth",
      "CORS and HTTPS do not stop XSS",
    ],
    redFlags: ["CORS prevents XSS", "HTTPS prevents XSS"],
    rubric: {
      criteria: [
        {
          name: "Output handling",
          weight: 5,
          keywords: ["escape", "sanitise", "dompurify", "dangerouslysetinnerhtml", "text"],
        },
        {
          name: "Defence in depth",
          weight: 4,
          keywords: ["content-security-policy", "csp", "inline script", "script-src", "nonce"],
        },
        {
          name: "Misconceptions",
          weight: 2,
          keywords: ["cors", "https", "transport", "not xss"],
        },
      ],
    },
    modelAnswer:
      "XSS happens when attacker-controlled input ends up executing as script in another user's browser. React escapes strings rendered in JSX, so plain-text comments are safe by default; dangerouslySetInnerHTML bypasses that, so any HTML must be sanitised first with a library such as DOMPurify. A Content-Security-Policy that disallows inline scripts and limits script sources is defence in depth: even if malicious markup slips through, the injected script is blocked. CORS controls which origins may read API responses and HTTPS protects data in transit; neither stops a script that is already in the page.",
    followUpIds: [],
  },
];
