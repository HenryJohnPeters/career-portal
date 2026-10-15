import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-senior-01",
    track: "frontend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["css", "responsive design", "layout"],
    prompt:
      "A `ProductCard` is rendered both in a wide main column and in a narrow sidebar on the same page. It should switch from a horizontal to a stacked layout based on the width available to the card, not the width of the viewport. Which CSS approach does this?",
    options: [
      "Put an `@media (min-width: 400px)` query in the card's stylesheet, so that it adapts to the space it is given",
      "Wrap the stacked layout in an `@supports (display: grid)` block, so that it applies when the card is narrow",
      "Set `container-type: inline-size` on the card's wrapper and switch layout in an `@container (min-width: 400px)` rule",
      "Size the card with `clamp()`, so that the browser stacks its content once the width reaches the minimum value",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "media queries respond to the viewport, not the component's space",
      "container-type makes an element a query container",
      "@container rules style descendants based on the container's size",
      "an element cannot query its own size, so the container is a wrapper",
      "components become reusable in any layout slot",
    ],
    redFlags: ["media queries measure the parent element", "@supports detects available space"],
    rubric: {
      criteria: [
        {
          name: "Container queries",
          weight: 5,
          keywords: ["container-type", "@container", "inline-size", "container query", "wrapper"],
        },
        {
          name: "Why not media queries",
          weight: 3,
          keywords: ["viewport", "media query", "component", "reusable", "context"],
        },
      ],
    },
    modelAnswer:
      "Media queries test the viewport, so a card in a narrow sidebar on a wide screen would still get the wide layout. Declaring `container-type: inline-size` on the card's wrapper makes it a query container, and `@container (min-width: 400px)` rules then style the card according to that wrapper's width; the container is a parent because an element cannot query its own size. `@supports` only detects whether a feature is supported, and `clamp()` only bounds a value: neither switches layout based on the space available.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-02",
    track: "frontend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["accessibility", "web", "seo"],
    prompt:
      'In a code review you find `<Button onClick={() => router.push("/orders/42")}>View order</Button>`, where `Button` renders a native `<button>`. What is the main problem with using it for navigation?',
    options: [
      "Native buttons do not respond to the Enter key, so keyboard users are unable to trigger the navigation",
      "It loses link behaviour: there is no href to open in a new tab, copy or crawl, and it is announced as a button",
      "Client-side routers only accept navigation calls from anchor elements, so the push fails at runtime",
      "Screen readers skip `<button>` elements that have a click handler, so the control is invisible to them",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "links navigate, buttons perform actions",
      "an anchor with href supports open in new tab, copy link and middle-click",
      "crawlers follow hrefs, not click handlers",
      "screen readers announce the role and list links separately",
      "a router Link renders a real anchor and intercepts the click",
    ],
    redFlags: ["links and buttons are interchangeable if styled alike", "role=link on a button fixes everything"],
    rubric: {
      criteria: [
        {
          name: "Semantics",
          weight: 5,
          keywords: ["link", "href", "anchor", "button", "role", "announce"],
        },
        {
          name: "Lost behaviour",
          weight: 4,
          keywords: ["new tab", "copy link", "crawl", "middle-click", "history", "prefetch"],
        },
      ],
    },
    modelAnswer:
      "Links navigate and buttons perform actions, and browsers and assistive technology treat them differently. A button that calls router.push has no href, so users cannot open it in a new tab, copy its address or middle-click it, crawlers cannot follow it, and screen readers announce it as a button and leave it out of their list of links. The fix is a real anchor, typically the router's Link component, which keeps the href and intercepts the click for client-side navigation. Native buttons are activated by both Enter and Space, screen readers do announce them, and routers do not care which element calls them, so the other options are wrong.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-03",
    track: "frontend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["testing", "react testing library", "playwright"],
    prompt:
      "Your team is rebuilding a multi-step checkout in React and wants a test suite that catches regressions without being slow or brittle. Which strategy gives the most confidence for its cost?",
    options: [
      "Snapshot-test every component, so that any change to the rendered markup fails the build and has to be reviewed",
      "Cover every validation rule and edge case with end-to-end browser tests, since only a real browser can be trusted",
      "Shallow-render each component with its children mocked out, and assert on the exact props passed to each child",
      "Unit-test the pricing logic, test each step through roles and labels, and add a few end-to-end tests for key journeys",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "pure logic is cheapest to cover with unit tests",
      "component tests query by role and label, as a user would",
      "a small number of end-to-end tests cover critical journeys",
      "avoid testing implementation details",
      "large snapshots are brittle and say little about behaviour",
    ],
    redFlags: ["snapshot tests prove behaviour", "everything should be an end-to-end test"],
    rubric: {
      criteria: [
        {
          name: "Layering",
          weight: 5,
          keywords: ["unit", "component", "integration", "end-to-end", "e2e", "critical path"],
        },
        {
          name: "Test quality",
          weight: 4,
          keywords: ["behaviour", "role", "label", "implementation details", "flaky", "brittle"],
        },
      ],
    },
    modelAnswer:
      "Confidence per unit of cost comes from layering: pure logic such as pricing is fast and cheap to unit-test, each step's behaviour is best tested by rendering it and interacting through roles and labels with Testing Library, and a handful of end-to-end tests (for example in Playwright) prove the critical journeys work with real routing, APIs and a real browser. Snapshotting every component fails on harmless markup changes and says little about behaviour, end-to-end tests for every edge case are slow and flaky, and shallow rendering with mocked children tests implementation details rather than what the user sees.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-04",
    track: "frontend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["browser apis", "pwa"],
    prompt:
      "A field-service PWA must keep several hundred megabytes of job records available offline and read them from both the page and its service worker. Which browser storage fits?",
    options: [
      "IndexedDB, which is asynchronous, stores structured data and blobs with indexes, and is available in workers",
      "localStorage, which persists across sessions and can be read synchronously from any script on the origin",
      "sessionStorage, which keeps data for the life of the tab and is shared automatically with the service worker",
      "Cookies with a long Max-Age, which persist offline and are attached to every request that the worker makes",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "IndexedDB is asynchronous with a large, quota-managed limit",
      "IndexedDB works in service workers and web workers",
      "localStorage is synchronous, small and unavailable in workers",
      "request persistent storage to reduce the risk of eviction",
      "cookies are tiny and sent with requests",
    ],
    redFlags: ["localStorage for large offline data", "storing records in cookies"],
    rubric: {
      criteria: [
        {
          name: "Right store",
          weight: 5,
          keywords: ["indexeddb", "asynchronous", "worker", "service worker", "quota", "structured"],
        },
        {
          name: "Why not the others",
          weight: 3,
          keywords: ["localstorage", "synchronous", "5 mb", "cookies", "persist", "eviction"],
        },
      ],
    },
    modelAnswer:
      "IndexedDB is the browser's asynchronous, transactional store for structured data and blobs; its quota is a share of available disk, and it can be used from pages, web workers and service workers. localStorage is synchronous (it blocks the main thread), limited to roughly 5 MB per origin and not available in workers, so it is wrong here despite persisting across sessions. sessionStorage is per tab and also unavailable to workers, and cookies hold only about 4 KB and are sent with requests. For data that must survive, the app can also call navigator.storage.persist() to reduce the risk of the browser evicting it.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-05",
    track: "frontend",
    level: "senior",
    difficulty: 1,
    type: "behavioral",
    tags: ["behavioral", "communication", "architecture"],
    prompt:
      "A respected engineer proposes replacing the app's Redux store with a newer state library across 200 screens, and several teammates are keen. As the tech lead, what is the best next step?",
    options: [
      "Approve the migration straight away, because blocking an enthusiastic proposal would hurt the team's morale",
      "Reject the proposal outright, because the current store works and any migration puts delivery at risk",
      "Ask for a short written proposal covering the problem and trade-offs, plus a time-boxed spike on one real feature",
      "Let each squad choose its own state library, so that the best option emerges naturally over the next year",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "start from the problem being solved, not the tool",
      "write down options and trade-offs in an RFC or ADR",
      "validate with a time-boxed spike on a representative feature",
      "plan an incremental migration with success criteria",
      "involve the team and record the decision",
    ],
    redFlags: ["deciding by enthusiasm or seniority", "big-bang rewrite", "letting every team diverge"],
    rubric: {
      criteria: [
        {
          name: "Decision process",
          weight: 5,
          keywords: ["rfc", "adr", "trade-offs", "problem", "spike", "evidence"],
        },
        {
          name: "Delivery and team",
          weight: 4,
          keywords: ["incremental", "migration", "criteria", "consensus", "risk", "document"],
        },
      ],
    },
    modelAnswer:
      "A good technical decision starts from the problem, not the tool: a short RFC or ADR makes the engineer state what is wrong with the current store, the options and their costs, and a time-boxed spike on one representative feature produces evidence instead of opinions. If the case holds, the team agrees success criteria and an incremental migration path rather than a big-bang rewrite. Approving on enthusiasm or rejecting by reflex both skip the analysis, and letting each squad pick its own library fragments the codebase and the team's knowledge.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-senior-06",
    track: "frontend",
    level: "senior",
    difficulty: 2,
    type: "debugging",
    tags: ["react", "hooks", "async"],
    prompt:
      "When users type quickly, this list sometimes shows results for an earlier query. What is the bug, and the fix?\n\n```jsx\nfunction Results({ query }) {\n  const [items, setItems] = useState([]);\n  useEffect(() => {\n    fetch(`/api/search?q=${encodeURIComponent(query)}`)\n      .then((res) => res.json())\n      .then(setItems);\n  }, [query]);\n  return <List items={items} />;\n}\n```",
    options: [
      "The dependency array should be empty, so that the request runs only once when the component mounts",
      "Responses can arrive out of order; the effect needs a cleanup that aborts the request or ignores its result",
      "`setItems` is passed by reference, so React loses track of which render each update belongs to",
      "`fetch` caches GET responses by default, so the older response is served again for the newer query",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "each keystroke starts a new request",
      "responses can resolve in a different order from requests",
      "a stale response overwrites newer results",
      "cleanup aborts with AbortController or sets an ignore flag",
      "cleanup runs before the effect re-runs and on unmount",
    ],
    redFlags: ["empty the dependency array", "fetch caches by query automatically"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["race condition", "out of order", "stale", "response", "overwrite"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["cleanup", "abortcontroller", "abort", "ignore flag", "unmount"],
        },
      ],
    },
    modelAnswer:
      "Each change to query starts a new request, and nothing guarantees responses come back in the order they were sent. If the request for \"re\" resolves after the one for \"react\", its stale results overwrite the newer ones. Returning a cleanup from the effect that calls abort() on an AbortController (or sets an ignore flag checked before setItems) discards the previous request whenever query changes or the component unmounts. An empty dependency array would stop the search updating at all, and the requests have different URLs, so the HTTP cache is not the cause.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-07",
    track: "frontend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["javascript", "performance"],
    prompt:
      "Why can bundlers tree-shake unused exports from ES modules much more reliably than from CommonJS modules?",
    options: [
      "ES modules are always minified before they are published, which removes dead code before the bundler runs",
      "CommonJS modules load asynchronously, so the bundler cannot wait for them to finish before analysing them",
      "ES modules run in strict mode, which forbids declaring functions that are never called anywhere in the code",
      "`import` and `export` are static declarations, so the bundler can see at build time which bindings are used",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "ESM imports and exports are static and top-level",
      "used bindings are known at build time",
      "require() and module.exports are runtime values that can be computed",
      "module-level side effects can still block removal",
      "the sideEffects field marks a package as safe to prune",
    ],
    redFlags: ["tree-shaking happens at runtime", "CommonJS is asynchronous"],
    rubric: {
      criteria: [
        {
          name: "Static structure",
          weight: 5,
          keywords: ["static", "import", "export", "build time", "module graph", "bindings"],
        },
        {
          name: "Limits",
          weight: 3,
          keywords: ["commonjs", "require", "dynamic", "side effects", "sideeffects", "bundle size"],
        },
      ],
    },
    modelAnswer:
      "ES module imports and exports are declared statically at the top level and cannot be computed at runtime, so a bundler can build the module graph, see exactly which exported bindings are referenced, and drop the rest. CommonJS uses require() calls and a mutable module.exports object that can be conditional or computed, so the bundler usually has to keep the whole module. Even with ESM, code with side effects at module scope is kept unless the package declares itself side-effect-free (for example \"sideEffects\": false in package.json). CommonJS is synchronous, and strict mode says nothing about unused functions.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-08",
    track: "frontend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["accessibility", "web"],
    prompt:
      'After a user changes a filter, a product listing updates its summary text to "24 results" without moving focus. How should screen-reader users be told about the new count?',
    options: [
      'Keep an element with `role="status"` in the page from the start, and update its text when the results change',
      "Move keyboard focus to the summary text after every filter change, so that the screen reader reads it out",
      "Put an `aria-label` containing the new count on the filter form, so that it is read when the form changes",
      'Give the whole results list `role="alert"`, so that the screen reader reads each new product immediately',
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "use a polite live region (role=status or aria-live=polite)",
      "the region must exist before its content changes",
      "update the text instead of moving focus",
      "assertive alerts interrupt and should be rare",
      "keep the announcement short",
    ],
    redFlags: ["move focus to announce updates", "changing an aria-label triggers an announcement"],
    rubric: {
      criteria: [
        {
          name: "Live regions",
          weight: 5,
          keywords: ["live region", "role=status", "aria-live", "polite", "announce"],
        },
        {
          name: "User experience",
          weight: 3,
          keywords: ["focus", "interrupt", "assertive", "concise", "in the dom"],
        },
      ],
    },
    modelAnswer:
      "A live region tells assistive technology to announce changes to its content. role=\"status\" is an implicit aria-live=\"polite\" region, so the new count is read once the screen reader finishes what it is currently saying, without taking focus away from the filter they are using. The region must already be in the DOM when its text changes; inserting it together with the message is often not announced. Moving focus disrupts the user's place, a changed aria-label is not announced, and role=\"alert\" on the whole list would interrupt and read far too much.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-09",
    track: "frontend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["security", "web"],
    prompt:
      "A site sends `Content-Security-Policy: script-src 'nonce-…' 'strict-dynamic'`. Why must the nonce be freshly random on every response rather than generated once at build time?",
    options: [
      "Browsers remember nonces from earlier responses and reject a policy that reuses a value they have already seen",
      "A fixed nonce makes the header too long for some proxies, which then strip the policy from the response",
      "A fixed nonce is visible in every page, so an attacker can copy it onto injected script tags and they will run",
      "The nonce also encrypts the inline scripts, and reusing it lets an attacker decrypt them from the page source",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "only scripts carrying the matching nonce run",
      "the nonce must be unpredictable and unique per response",
      "a static nonce is public and can be reused in an injected script",
      "do not cache HTML that contains a nonce",
      "CSP is defence in depth alongside output encoding",
    ],
    redFlags: ["a nonce encrypts scripts", "CSP alone makes XSS impossible"],
    rubric: {
      criteria: [
        {
          name: "How nonces work",
          weight: 5,
          keywords: ["nonce", "script-src", "inline", "injected", "matching", "blocked"],
        },
        {
          name: "Operational detail",
          weight: 3,
          keywords: ["random", "per response", "unpredictable", "cache", "strict-dynamic", "xss"],
        },
      ],
    },
    modelAnswer:
      "With a nonce-based policy the browser runs only script elements whose nonce attribute matches the value in the header, so a <script> injected through an XSS bug is blocked. That protection depends on the attacker not knowing the value. A nonce fixed at build time appears in the source of every page, so an attacker who finds an injection point can simply include it. Generating a new random nonce for each response (and not caching that HTML) keeps it unguessable. Nonces do not encrypt anything, and browsers do not track previously seen values.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-10",
    track: "frontend",
    level: "senior",
    difficulty: 2,
    type: "debugging",
    tags: ["css", "flexbox", "layout"],
    prompt:
      "The main pane should fill the space beside a 240px sidebar, but a wide code sample inside it pushes the page wider than the screen instead of scrolling within the pane. What is the cause, and the fix?\n\n```css\n.page { display: flex; }\n.sidebar { flex: 0 0 240px; }\n.main { flex: 1; }\n.main pre { overflow-x: auto; }\n```",
    options: [
      "`flex: 1` sets only `flex-grow: 1`, so the main pane may grow but is not allowed to shrink at all",
      "The sidebar needs `flex-shrink: 1`, so that it gives up some of its width to make room for the code",
      "Flex items ignore `overflow` on their descendants, so this layout has to be rebuilt with CSS Grid",
      "Flex items default to `min-width: auto`, so `.main` cannot shrink below its content; set `min-width: 0`",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "flex items have an automatic minimum size based on their content",
      "flex: 1 means flex: 1 1 0%, so shrinking is allowed",
      "the pre's full width still counts towards .main's min-content width",
      "min-width: 0 (or overflow: hidden or auto on .main) removes the automatic minimum",
      "grid 1fr tracks have the same automatic minimum and need minmax(0, 1fr)",
    ],
    redFlags: ["flex: 1 disables shrinking", "switching to grid fixes it automatically"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["min-width: auto", "automatic minimum", "min-content", "flex item", "shrink"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["min-width: 0", "overflow: hidden", "scroll container", "minmax(0, 1fr)", "scroll"],
        },
      ],
    },
    modelAnswer:
      "Flex items have an automatic minimum size: `min-width: auto` resolves to the item's min-content width, which includes the full width of the unwrapped code sample, so `.main` refuses to shrink even though `flex: 1` (shorthand for `1 1 0%`) allows it. Because `.main` is as wide as the code, the `pre` never overflows and its `overflow-x: auto` never takes effect. Setting `min-width: 0` on `.main` (or making `.main` itself a scroll container with `overflow: hidden` or `auto`) removes that floor, so the pane shrinks to its share and the code scrolls inside the `pre`. Shrinking the fixed sidebar does not help, and a Grid `1fr` track has the same automatic minimum (it needs `minmax(0, 1fr)`), so switching layout systems is not the fix.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-senior-11",
    track: "frontend",
    level: "senior",
    difficulty: 3,
    type: "coding",
    tags: ["javascript", "event-loop", "async"],
    prompt:
      "In what order are the numbers logged?\n\n```js\nasync function run() {\n  console.log(1);\n  await null;\n  console.log(2);\n}\nconsole.log(3);\nrun();\nqueueMicrotask(() => console.log(4));\nsetTimeout(() => console.log(5), 0);\nconsole.log(6);\n```",
    options: ["3, 6, 1, 2, 4, 5", "3, 1, 6, 2, 4, 5", "3, 1, 2, 6, 4, 5", "3, 1, 6, 4, 2, 5"],
    correctOptionIndex: 1,
    expectedPoints: [
      "an async function runs synchronously until its first await",
      "await always yields, even on a non-promise value",
      "the continuation is queued as a microtask before queueMicrotask's callback",
      "microtasks drain before the next task",
      "setTimeout callbacks are tasks",
    ],
    redFlags: ["the body of an async function runs later", "await on a non-promise does not yield"],
    rubric: {
      criteria: [
        {
          name: "Async functions",
          weight: 5,
          keywords: ["synchronously", "first await", "yield", "continuation", "suspend"],
        },
        {
          name: "Queues",
          weight: 5,
          keywords: ["microtask", "task", "macrotask", "queuemicrotask", "settimeout", "fifo"],
        },
      ],
    },
    modelAnswer:
      "An async function runs synchronously until its first await, so 3 and then 1 are logged. `await null` suspends run() and queues its continuation as a microtask; queueMicrotask then queues 4 behind it, setTimeout schedules 5 as a task, and 6 is logged synchronously. Once the call stack is empty the microtask queue drains in order (2, then 4) before the event loop picks up the timer task (5). Orders that log 2 before 6 forget that await always yields, and putting 4 before 2 ignores that microtasks run in the order they were queued.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-12",
    track: "frontend",
    level: "senior",
    difficulty: 3,
    type: "system-design",
    tags: ["architecture", "system design", "performance"],
    prompt:
      "Five teams share one large React front end and are slowed down by a single weekly release train. Leadership proposes splitting it into micro-frontends. Which statement best captures the trade-off?",
    options: [
      "Teams gain independent builds and deploys, but pay in runtime integration, duplicate dependencies and UX drift",
      "Pages get faster automatically, because each micro-frontend ships a smaller bundle than the single app did before",
      "Shared contracts are no longer needed, because each micro-frontend is isolated and owns its whole slice of the page",
      "End-to-end tests are no longer needed, because each micro-frontend is tested and deployed entirely on its own",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "independent deployability and team autonomy are the main benefit",
      "integration moves to runtime or the edge and needs explicit contracts",
      "risk of duplicated dependencies and larger total payload",
      "a shared design system keeps the UX consistent",
      "check whether a modular monolith or better CI solves the real problem first",
    ],
    redFlags: ["micro-frontends automatically improve performance", "no shared contracts or integration tests needed"],
    rubric: {
      criteria: [
        {
          name: "Benefits",
          weight: 4,
          keywords: ["independent deploy", "autonomy", "ownership", "release", "decoupled"],
        },
        {
          name: "Costs",
          weight: 5,
          keywords: ["integration", "duplicated dependencies", "bundle size", "consistency", "contracts", "design system"],
        },
        {
          name: "Alternatives",
          weight: 2,
          keywords: ["modular monolith", "monorepo", "ci", "feature flags", "ownership boundaries"],
        },
      ],
    },
    modelAnswer:
      "Micro-frontends are an organisational tool: their main benefit is that each team can build, test and deploy its part independently. The cost is that composition moves to runtime (or the edge), so teams need explicit contracts for routing, shared state and events, risk shipping several copies of the same libraries, and need a shared design system to keep the experience consistent. Performance does not improve automatically and often gets worse, and integration still has to be tested end to end. If the real problem is the release process, a modular monolith with clear ownership and better CI may be cheaper.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-13",
    track: "frontend",
    level: "senior",
    difficulty: 3,
    type: "debugging",
    tags: ["security", "browser apis", "javascript"],
    prompt:
      'A page receives the session token from the company\'s sign-in pop-up with this code. What is the security flaw?\n\n```js\nwindow.addEventListener("message", (event) => {\n  if (event.data?.type === "SESSION") {\n    sessionStorage.setItem("token", event.data.token);\n    location.assign("/dashboard");\n  }\n});\n```',
    options: [
      "`sessionStorage` is readable by other origins, so the token leaks to the next site that the user visits",
      "`message` events are only delivered between same-origin windows, so the pop-up's message never arrives",
      "It never checks `event.origin`, so any window that can reference this page can post a forged session",
      "`event.data` always arrives as a JSON string, so `event.data?.type` is undefined and the check never passes",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "postMessage works across origins by design",
      "the receiver must compare event.origin with an allow-list",
      "the sender should pass an explicit targetOrigin, not *",
      "validate the shape of event.data",
      "message data is structured-cloned, not stringified",
    ],
    redFlags: ["postMessage is same-origin only", "checking the message type is enough"],
    rubric: {
      criteria: [
        {
          name: "Flaw",
          weight: 5,
          keywords: ["event.origin", "cross-origin", "forged", "any window", "untrusted"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["allow-list", "targetorigin", "event.source", "validate", "exact origin"],
        },
      ],
    },
    modelAnswer:
      "postMessage is designed for cross-origin communication, so a message listener receives messages from any window that holds a reference to this one, such as a page that opened it or framed it. Because the handler checks only the message type, an attacker's page can post a SESSION message carrying the attacker's own token, silently signing the victim into the attacker's account. The handler must compare event.origin with the exact expected origin (and ideally check event.source), and the pop-up should send with a specific targetOrigin rather than \"*\". Message data is structured-cloned, so objects arrive as objects.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-14",
    track: "frontend",
    level: "senior",
    difficulty: 3,
    type: "coding",
    tags: ["typescript", "types"],
    prompt:
      'A teammate adds `| { kind: "triangle"; base: number; height: number }` to `Shape` but does not change `area`. What happens?\n\n```ts\ntype Shape =\n  | { kind: "circle"; radius: number }\n  | { kind: "square"; size: number };\n\nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case "circle": return Math.PI * shape.radius ** 2;\n    case "square": return shape.size ** 2;\n  }\n  const unhandled: never = shape;\n  throw new Error("Unhandled shape");\n}\n```',
    options: [
      "It compiles, and at runtime `area` returns `undefined` for triangles because no case matches them",
      "It compiles, and TypeScript widens the return type of `area` to `number | undefined` to cover triangles",
      "It compiles without errors, and the `throw` fires the first time a triangle is passed to `area`",
      "It no longer compiles: after the switch, `shape` is the triangle type, which is not assignable to `never`",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "kind is a discriminant that narrows the union",
      "control-flow analysis narrows shape after each returning case",
      "with every case handled, shape is never after the switch",
      "a new variant leaves a type that is not assignable to never",
      "the compiler points at every switch that needs updating",
    ],
    redFlags: ["TypeScript checks exhaustiveness only at runtime", "the return type silently widens"],
    rubric: {
      criteria: [
        {
          name: "Narrowing",
          weight: 5,
          keywords: ["discriminated union", "discriminant", "narrowing", "control flow", "kind"],
        },
        {
          name: "Exhaustiveness",
          weight: 5,
          keywords: ["never", "exhaustive", "compile error", "not assignable", "new variant"],
        },
      ],
    },
    modelAnswer:
      "Shape is a discriminated union, and each `case` that returns removes its variant from the type of `shape` through control-flow narrowing. With only circle and square, `shape` is `never` after the switch, so the assignment compiles. Once triangle is added, the leftover type after the switch is the triangle object, which is not assignable to `never`, so tsc reports an error at that line: the compiler flags every switch that has not been updated. The return type is fixed by the annotation and does not widen, and the throw is only a backstop for data that bypasses the types at runtime.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-senior-15",
    track: "frontend",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["react", "ssr vs csr", "performance"],
    prompt:
      "A server-rendered React page is streamed with `renderToPipeableStream`, and its slow comments section is wrapped in `<Suspense>`. Compared with rendering and hydrating the whole page in one pass, what does this give users?",
    options: [
      "The comments are skipped on the server and rendered only in the browser, so the server can respond sooner",
      "The rest of the page streams and hydrates first, while the comments stream in later and hydrate independently",
      "The page no longer needs any JavaScript for hydration, because Suspense boundaries are interactive as plain HTML",
      "The browser caches each Suspense boundary separately, so later visits reuse the comments HTML without a request",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the shell streams without waiting for slow data",
      "the fallback is sent first and replaced when the content streams in",
      "each boundary hydrates independently (selective hydration)",
      "React prioritises hydrating the boundary the user interacts with",
      "hydration still needs the component JavaScript",
    ],
    redFlags: ["Suspense makes content client-only", "streamed HTML needs no JavaScript to be interactive"],
    rubric: {
      criteria: [
        {
          name: "Streaming",
          weight: 5,
          keywords: ["stream", "shell", "fallback", "suspense", "html", "ttfb"],
        },
        {
          name: "Selective hydration",
          weight: 5,
          keywords: ["selective hydration", "independently", "prioritise", "interaction", "hydrate"],
        },
      ],
    },
    modelAnswer:
      "With streaming SSR the server sends the page shell and the Suspense fallback straight away, then streams the comments' HTML (with a small inline script that swaps it in) once their data is ready, so slow data no longer delays the whole response. On the client, each Suspense boundary hydrates independently, and if the user clicks inside a boundary that has not hydrated yet React hydrates that one first. The comments are still rendered on the server, hydration still requires the components' JavaScript, and the browser does not cache boundaries separately.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-16",
    track: "frontend",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["web vitals", "performance", "css"],
    prompt:
      "A news page has a poor Cumulative Layout Shift (CLS) score. Which of these cause layout shifts that count towards CLS? Select all that apply.",
    options: [
      "Images and embeds without `width` and `height` attributes or a CSS `aspect-ratio`",
      "A `position: fixed` toast that slides into view using a `transform: translateY()` animation",
      "A consent banner or ad slot injected above content that has already rendered",
      "A web font swapping in with different metrics from its fallback font",
      "An accordion panel expanding straight after the user clicks its heading",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2, 3],
    multiSelect: true,
    expectedPoints: [
      "CLS counts unexpected movement of visible elements",
      "reserve space for media with dimensions or aspect-ratio",
      "reserve slots for late-injected banners and ads",
      "match fallback font metrics or use font-display: optional",
      "transforms and shifts just after user input are not counted",
    ],
    redFlags: ["every animation hurts CLS", "user-triggered expansion always counts"],
    rubric: {
      criteria: [
        {
          name: "Causes",
          weight: 5,
          keywords: ["dimensions", "aspect-ratio", "injected", "font swap", "reserve space"],
        },
        {
          name: "Exclusions",
          weight: 4,
          keywords: ["transform", "composited", "user input", "500 ms", "hadrecentinput"],
        },
      ],
    },
    modelAnswer:
      "CLS sums unexpected movements of visible elements. Media without reserved dimensions push content down when they load, content injected above what the user is reading shifts everything below it, and a web font with different metrics from its fallback reflows text when it swaps in (fixable with size-adjust and metric overrides, or font-display: optional). Animating transform moves an element visually without changing layout boxes, so it does not count, and shifts within 500 ms of a discrete user input such as a click are excluded because the user expects them.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-17",
    track: "frontend",
    level: "senior",
    difficulty: 4,
    type: "coding",
    tags: ["css"],
    prompt:
      'The markup is `<div class="card"><button class="btn btn-primary">Buy</button></div>`. A design system ships its styles inside a cascade layer, and the app adds the unlayered rule below. What colour is the button text, and why?\n\n```css\n@layer components {\n  .card .btn.btn-primary { color: blue; }\n}\n\n.btn { color: red; }\n```',
    options: [
      "Blue, because `.card .btn.btn-primary` is more specific than `.btn`",
      "Blue, because rules inside a layer are applied after unlayered rules",
      "Red, because unlayered styles beat layered ones whatever their specificity",
      "Red, because the rule declared later in the stylesheet always beats earlier ones",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "layer order is resolved before specificity",
      "unlayered normal styles beat every layer",
      "later-declared layers beat earlier ones",
      "specificity only decides between rules in the same layer",
      "!important declarations reverse the layer order",
    ],
    redFlags: ["specificity always wins", "the last rule in the file always wins", "layers behave like !important"],
    rubric: {
      criteria: [
        {
          name: "Cascade order",
          weight: 5,
          keywords: ["cascade layers", "@layer", "unlayered", "layer order", "specificity"],
        },
        {
          name: "Nuances",
          weight: 3,
          keywords: ["!important", "reverse", "declaration order", "design system", "override"],
        },
      ],
    },
    modelAnswer:
      "In the cascade, layer order is compared before specificity. Unlayered styles sit in an implicit final layer that beats every named layer for normal declarations, so the simple `.btn` rule wins and the text is red, even though the layered selector is more specific. Specificity only decides between rules in the same layer, and source order is only the final tie-breaker, so the text would still be red if the `.btn` rule came before the layer. This is what lets a design system ship layered styles that apps can override without specificity battles; for !important declarations the order reverses, so an important layered rule would beat an important unlayered one.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-18",
    track: "frontend",
    level: "senior",
    difficulty: 4,
    type: "debugging",
    tags: ["react", "hooks"],
    prompt:
      'In React 19, this button is never disabled while the `signup` action is running. Why?\n\n```jsx\nimport { useFormStatus } from "react-dom";\n\nfunction SignupForm() {\n  const { pending } = useFormStatus();\n  return (\n    <form action={signup}>\n      <input name="email" type="email" />\n      <button disabled={pending}>Sign up</button>\n    </form>\n  );\n}\n```',
    options: [
      "`useFormStatus` reads only a parent `<form>`, so it must be called in a component rendered inside the form",
      "`pending` is set only when `signup` is a server function; client-side async actions never mark the form as pending",
      'The `<button>` needs an explicit `type="submit"`, otherwise React does not treat it as the form\'s submit control',
      "`useFormStatus` must be imported from `react` instead of `react-dom`, or it always returns a default status",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "useFormStatus reads the status of the nearest parent form",
      "a component that renders the form is not inside it",
      "move the button into a child component rendered inside the form",
      "it works for client and server actions",
      "a button in a form defaults to type submit",
    ],
    redFlags: ["useFormStatus comes from react", "pending only works with server functions"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["useformstatus", "parent form", "inside the form", "context", "same component"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["child component", "submitbutton", "pending", "action", "disabled"],
        },
      ],
    },
    modelAnswer:
      "useFormStatus returns the status of the nearest parent <form>, much like reading a context that the form provides. Called in SignupForm, the component that renders the form, there is no parent form, so pending is always false. Moving the button into a SubmitButton component rendered inside the <form> and calling useFormStatus there fixes it. The hook is correctly imported from react-dom, a <button> inside a form already defaults to type=\"submit\", and pending is reported for client and server actions alike.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-19",
    track: "frontend",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["accessibility", "web"],
    prompt:
      "In a client-side routed single-page app, screen-reader users report that navigation links seem to do nothing: the content changes, but nothing is announced and focus stays where it was. What is the recommended fix?",
    options: [
      'Add `aria-live="assertive"` to the main content area, so that the whole new page is read out on each change',
      "Switch every internal link to a full page reload, because client-side routing cannot be made accessible",
      "Put `autofocus` on the first form field of every page, so that focus always lands somewhere useful",
      'On route change, update `document.title` and move focus to the new page\'s main heading using `tabindex="-1"`',
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "client-side navigation does not trigger the browser's page-load announcement",
      "update document.title on every route",
      "move focus to the h1 or main region with tabindex=-1",
      "optionally announce the new page in a polite live region",
      "do not move focus on in-page updates",
    ],
    redFlags: ["make the whole page an assertive live region", "SPAs cannot be accessible"],
    rubric: {
      criteria: [
        {
          name: "Problem",
          weight: 3,
          keywords: ["page load", "announcement", "route change", "focus", "spa"],
        },
        {
          name: "Focus management",
          weight: 5,
          keywords: ["document.title", "heading", "tabindex", "focus", "main", "live region"],
        },
      ],
    },
    modelAnswer:
      "A full page load makes the browser reset focus and screen readers announce the new title, but client-side routing only swaps DOM content, so nothing tells the user that anything happened. After each route change the app should update document.title and move focus to the new page's main heading or content container (made focusable with tabindex=\"-1\"), which announces the new context and starts keyboard navigation from the top of it; a polite live region announcing the page can complement this. An assertive live region would read the entire page, autofocusing a form field skips the page's context, and full reloads are unnecessary.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-frontend-senior-20",
    track: "frontend",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["ssr vs csr", "caching", "cdn", "seo"],
    prompt:
      "An online shop has two million product pages that must rank in search and load fast on mobile. Prices and stock change several times an hour, and each page also shows personalised recommendations. Which rendering strategy fits best?",
    options: [
      "Server-render every request with the user's recommendations included, and turn off CDN caching so prices stay fresh",
      "Serve the shared product HTML from a CDN with short revalidation, and load the personalised recommendations separately",
      "Ship a client-rendered SPA that fetches product data from the API, since crawlers run JavaScript and caching gets simpler",
      "Pre-render all two million pages at build time, and run the full build again whenever any price or stock level changes",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "product content is shared by all users and changes in minutes",
      "render on the server and cache at the CDN with stale-while-revalidate or incremental regeneration",
      "keep personalised parts out of the cacheable HTML",
      "load recommendations client-side or as a streamed or edge-composed fragment",
      "full rebuilds and uncached per-request rendering do not scale",
    ],
    redFlags: ["client-only rendering is fine for SEO-critical pages", "personalise the cached HTML per user"],
    rubric: {
      criteria: [
        {
          name: "Cacheable core",
          weight: 5,
          keywords: ["cdn", "cache", "revalidate", "stale-while-revalidate", "isr", "s-maxage"],
        },
        {
          name: "Personalisation",
          weight: 4,
          keywords: ["personalised", "client-side", "fragment", "edge", "stream", "separate"],
        },
        {
          name: "Trade-offs",
          weight: 3,
          keywords: ["seo", "lcp", "ttfb", "build time", "origin load", "freshness"],
        },
      ],
    },
    modelAnswer:
      "The product content is the same for everyone and changes on a scale of minutes, so it can be rendered on the server, cached at the CDN and revalidated in the background (Cache-Control with a short s-maxage and stale-while-revalidate, or incremental regeneration), which gives fast, crawlable HTML at low origin cost. Personalised recommendations would make every response unique and uncacheable, so they are loaded separately, client-side or as a streamed or edge-composed fragment, without blocking the main content. Rendering everything per request without caching wastes origin capacity and slows TTFB, a client-only SPA delays LCP and makes indexing slower and less reliable, and rebuilding two million pages on each price change is impractical.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-21",
    track: "frontend",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["performance", "websockets", "react", "state"],
    prompt:
      "A trading dashboard receives about 200 price updates per second over a WebSocket and calls `setState` for each one. The UI stutters and typing in the order form lags. Which design fixes this at the source?",
    options: [
      "Replace the WebSocket with HTTP polling every 100 ms, so that the browser receives fewer and larger messages",
      "Wrap every row in `React.memo`, which stops React from scheduling a render for each incoming price message",
      "Write each price to localStorage as it arrives, and have the components read the latest value when they render",
      "Buffer messages outside React, keep the latest price per symbol, flush once per frame, and virtualise the rows",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "decouple the message rate from the render rate",
      "coalesce to the latest value per symbol",
      "flush in batches per animation frame or interval",
      "components subscribe only to the symbols they show",
      "virtualise long lists",
      "consider parsing in a Web Worker",
    ],
    redFlags: ["setState per message is fine with React.memo", "polling reduces load at the source"],
    rubric: {
      criteria: [
        {
          name: "Throttling updates",
          weight: 5,
          keywords: ["buffer", "coalesce", "batch", "requestanimationframe", "latest value", "throttle"],
        },
        {
          name: "Rendering cost",
          weight: 4,
          keywords: ["selector", "subscribe", "virtualise", "virtualization", "re-render", "memo"],
        },
        {
          name: "Main thread",
          weight: 2,
          keywords: ["main thread", "web worker", "input", "long task"],
        },
      ],
    },
    modelAnswer:
      "The screen can only show about 60 frames a second, so rendering 200 times a second wastes main-thread time that the order form's input needs. Holding incoming messages in a buffer outside React, keeping only the latest price per symbol and flushing them to a store once per animation frame caps the render rate, and selectors mean each row re-renders only when its own symbol changes; virtualising the table keeps the number of mounted rows small. React.memo can skip unchanged rows but does nothing to stop a render being scheduled for every message, polling adds latency without reducing work, and localStorage is synchronous and does not trigger renders.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-22",
    track: "frontend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["react", "context api", "state", "performance"],
    prompt:
      "A large React app keeps the signed-in user, the theme and a live cursor position (updated on every `mousemove`) in one `AppContext` value. Profiling shows hundreds of components re-rendering on each mouse move, including ones that read only `theme`. Which change fixes the root cause?",
    options: [
      "Move the fast-changing state into its own narrowly used context, or into a store with selector subscriptions",
      "Wrap each consumer in `React.memo`, so that components that read only `theme` skip the re-render on each move",
      "Wrap the provider's `value` object in `useMemo`, so that consumers re-render only when the fields they read change",
      "Replace `useContext(AppContext)` with React 19's `use(AppContext)`, which re-renders only the readers of changed fields",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "every consumer re-renders when the context value changes",
      "context has no per-field subscription",
      "context updates bypass React.memo",
      "split contexts by update frequency",
      "an external store with selectors (useSyncExternalStore) limits re-renders to affected components",
    ],
    redFlags: ["React.memo blocks context updates", "use(Context) subscribes per field"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["context value", "consumers", "re-render", "identity", "no selector", "bypass memo"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["split context", "external store", "selector", "usesyncexternalstore", "zustand", "redux"],
        },
      ],
    },
    modelAnswer:
      "Every component that reads a context re-renders whenever the provider's value changes, and React compares only the value's identity: there is no per-field subscription. Because the cursor position changes on every mouse move, the value changes constantly and consumers re-render even if they read only theme. Context updates also bypass React.memo, useMemo cannot help when the value really has changed, and use(Context) has the same semantics as useContext. The fix is to keep rarely changing data such as user and theme in context and move high-frequency state into its own context used only by the few components that need it, or into an external store (via useSyncExternalStore, as Zustand and React Redux do) whose selectors re-render only the components whose slice changed.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-23",
    track: "frontend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["web vitals", "performance", "event-loop"],
    prompt:
      'Field data shows poor Interaction to Next Paint (INP) on a page whose "Apply filters" click handler runs about 400 ms of JavaScript before anything changes on screen. Which changes improve INP? Select all that apply.',
    options: [
      'Add `loading="lazy"` to the product images that are below the fold',
      "Paint immediate feedback first, and defer the heavy work until after the next frame",
      "Move the filtering and sorting computation into a Web Worker",
      "Serve the HTML from a CDN edge to cut the Time to First Byte",
      "Split the remaining work into smaller tasks that yield to the main thread",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "INP measures input delay, processing time and presentation delay",
      "a 400 ms handler is a long task that blocks the next paint",
      "give visual feedback before the heavy work",
      "yield between chunks (scheduler.yield or setTimeout)",
      "move computation off the main thread into a Web Worker",
    ],
    redFlags: ["INP is a loading metric", "lazy-loading or TTFB fixes slow interactions"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 4,
          keywords: ["long task", "main thread", "event handler", "next paint", "processing time"],
        },
        {
          name: "Fixes",
          weight: 5,
          keywords: ["yield", "scheduler.yield", "chunk", "web worker", "feedback", "defer"],
        },
      ],
    },
    modelAnswer:
      "INP measures the time from a user interaction to the next frame the browser paints, and here a 400 ms handler occupies the main thread so the browser cannot paint a response. Showing feedback first and deferring the heavy work, breaking the remaining work into chunks that yield (scheduler.yield() where supported, or setTimeout), and moving the computation into a Web Worker all let the next frame paint sooner. Lazy-loading images and reducing TTFB help loading metrics such as LCP but do nothing for a long task inside an event handler.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-senior-24",
    track: "frontend",
    level: "senior",
    difficulty: 5,
    type: "debugging",
    tags: ["javascript", "performance", "react"],
    prompt:
      'After users switch between dashboard tabs for a while, heap snapshots show thousands of detached `<div>` elements and the page slows down. What causes the leak?\n\n```jsx\nfunction Chart({ data }) {\n  const ref = useRef(null);\n  useEffect(() => {\n    const el = ref.current;\n    const chart = createChart(el, data);\n    const onResize = () => chart.resize(el.clientWidth);\n    window.addEventListener("resize", onResize);\n    return () => chart.destroy();\n  }, [data]);\n  return <div ref={ref} />;\n}\n```',
    options: [
      "`useRef` keeps every element it has ever pointed to, so old containers stay in memory until a full reload",
      "React keeps the previous virtual DOM tree of each tab, and those trees retain the old chart containers",
      "The `resize` listener is never removed, so `window` keeps each closure, its chart and its container alive",
      "The effect depends on `data`, so React skips the cleanup when props change and runs it only on unmount",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a detached node leaks while something reachable still references it",
      "window holds every listener that was added",
      "each closure captures its container element and its chart",
      "remove the listener in the cleanup or use an AbortController signal",
      "cleanup runs before each re-run and on unmount",
    ],
    redFlags: ["refs retain all previous values", "the garbage collector ignores DOM nodes"],
    rubric: {
      criteria: [
        {
          name: "Retention path",
          weight: 5,
          keywords: ["detached", "closure", "listener", "window", "reference", "garbage collection"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["removeeventlistener", "cleanup", "abortcontroller", "signal", "unmount"],
        },
      ],
    },
    modelAnswer:
      "A removed DOM node can only be collected once nothing reachable references it. Each time the effect runs it adds a resize listener to window, but the cleanup only destroys the chart, so window keeps every onResize closure alive; each closure captures its own container element (el) and its chart, long after React removed that container from the page. Removing the listener in the cleanup (removeEventListener with the same function, or passing an AbortController signal and aborting it) lets the closure, chart and node be collected. React runs an effect's cleanup before every re-run as well as on unmount, and a ref holds only its current value.",
    followUpIds: [],
  },
];
