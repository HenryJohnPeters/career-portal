import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ───────────────────────────────────────────────────────
  {
    id: "qb-frontend-mid-01",
    track: "frontend",
    level: "mid",
    difficulty: 1,
    type: "coding",
    tags: ["javascript"],
    prompt:
      "What does this code log, and why?\n\n    for (var i = 0; i < 3; i++) {\n      setTimeout(() => console.log(i), 0);\n    }",
    options: [
      "0, 1, 2, because each arrow function captures the value i had when setTimeout was called",
      "Nothing, because the timers are discarded once the loop that created them has finished",
      "3, 3, 3, because all three callbacks close over the same function-scoped i, which is 3 when they run",
      "undefined three times, because var is hoisted and i is not yet initialised inside the callbacks",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "var is function-scoped, so there is a single i",
      "closures capture variables, not copies of values",
      "timer callbacks run after the loop has finished",
      "let creates a new binding per iteration",
    ],
    redFlags: ["closures copy the value at creation time", "setTimeout with 0 ms runs immediately"],
    rubric: {
      criteria: [
        { name: "Closure semantics", weight: 5, keywords: ["closure", "binding", "function-scoped", "var", "same variable"] },
        { name: "Timing and fix", weight: 3, keywords: ["after the loop", "let", "block-scoped", "per iteration"] },
      ],
    },
    modelAnswer:
      "It logs 3, 3, 3. `var` is function-scoped, so the loop has a single `i` binding, and closures capture that variable rather than a copy of its value. The timer callbacks only run after the synchronous loop has finished, by which point `i` is 3. Declaring the counter with `let` creates a fresh binding for each iteration, so the same code would log 0, 1, 2.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-02",
    track: "frontend",
    level: "mid",
    difficulty: 1,
    type: "debugging",
    tags: ["web", "react", "components"],
    prompt:
      'Clicking "Show" in this React form submits the form instead of only revealing the password. What is the fix?\n\n    <form onSubmit={handleSave}>\n      <input name="password" type={visible ? "text" : "password"} />\n      <button onClick={() => setVisible(!visible)}>Show</button>\n      <button>Save</button>\n    </form>',
    options: [
      "Call e.stopPropagation() in the Show button's click handler so the click never reaches the form",
      'Give the Show button type="button", because a button inside a form defaults to type="submit"',
      'Add role="button" to the Show button so the form treats it as a plain control rather than a submit',
      "Move handleSave from the form's onSubmit to the Save button's onClick so only Save triggers it",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      'buttons inside a form default to type="submit"',
      'type="button" makes it a plain button',
      "stopPropagation does not cancel a default action",
      "keep a native button for keyboard and screen-reader support",
    ],
    redFlags: ["replace the button with a clickable div", "stopPropagation prevents form submission"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["submit", "default type", "button", "form"] },
        { name: "Fix", weight: 4, keywords: ['type="button"', "native button", "default action", "preventdefault"] },
      ],
    },
    modelAnswer:
      'A `<button>` inside a `<form>` has `type="submit"` by default, so activating the Show button submits the form. Setting `type="button"` makes it a plain button while keeping native keyboard and screen-reader behaviour. `stopPropagation()` does not help, because submission is the button\'s default action rather than a bubbling handler, and `role="button"` changes nothing on an element that is already a button. Moving `handleSave` to the Save button\'s `onClick` leaves Show as a submit button, so clicking it still submits the form, now as a full page navigation.',
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-03",
    track: "frontend",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["security", "javascript", "react"],
    prompt:
      "Which of these insert an untrusted string, userBio, into a <div> or <p> on the page in a way that can run an attacker's script? Select all that apply.",
    options: [
      "div.innerHTML = userBio",
      "div.textContent = userBio",
      "<div dangerouslySetInnerHTML={{ __html: userBio }} /> in React",
      "<p>{userBio}</p> in React",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2],
    multiSelect: true,
    expectedPoints: [
      "innerHTML parses the string as HTML",
      "dangerouslySetInnerHTML bypasses React's escaping",
      "textContent and JSX text children are treated as text",
      "sanitise user HTML with a vetted library such as DOMPurify",
      "a Content Security Policy as defence in depth",
    ],
    redFlags: ["React escapes dangerouslySetInnerHTML", "only <script> tags can cause XSS"],
    rubric: {
      criteria: [
        { name: "Dangerous sinks", weight: 5, keywords: ["innerhtml", "dangerouslysetinnerhtml", "parsed as html", "onerror", "event handler"] },
        { name: "Safe alternatives", weight: 3, keywords: ["textcontent", "escaping", "jsx text", "sanitise", "dompurify"] },
      ],
    },
    modelAnswer:
      "`innerHTML` and React's `dangerouslySetInnerHTML` parse the string as HTML, so markup such as `<img src=x onerror=...>` runs the attacker's code (an inserted `<script>` tag does not run, but event-handler attributes do). `textContent` and a JSX text child treat the value as text, and React escapes it, so it is displayed rather than executed. If user-supplied HTML really must be rendered, sanitise it with a vetted library such as DOMPurify and back it with a Content Security Policy.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-04",
    track: "frontend",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["browser apis", "web"],
    prompt:
      "A multi-step form saves its draft to sessionStorage. The draft survives a page reload, but when the user pastes the same URL into a new tab, the draft is missing. Why?",
    options: [
      "sessionStorage is cleared each time the page loses focus, which happens when another tab opens",
      "sessionStorage writes are asynchronous, and this one had not been flushed when the new tab loaded",
      "sessionStorage expires after a short idle timeout, which had elapsed before the new tab was opened",
      "sessionStorage is scoped to the origin and to each tab, so the new tab starts with its own, empty storage",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "sessionStorage is per origin and per tab",
      "it survives reloads and is cleared when the tab closes",
      "localStorage is shared by all tabs of the same origin",
      "Web Storage is synchronous and has no expiry",
    ],
    redFlags: ["sessionStorage is shared between tabs", "Web Storage writes are asynchronous"],
    rubric: {
      criteria: [
        { name: "Scope", weight: 5, keywords: ["per tab", "browsing context", "origin", "reload", "tab closes"] },
        { name: "Alternatives", weight: 3, keywords: ["localstorage", "indexeddb", "storage event", "broadcastchannel"] },
      ],
    },
    modelAnswer:
      "`sessionStorage` is partitioned by origin and by top-level browsing context, so each tab has its own copy that survives reloads and is discarded when the tab closes. A new tab opened by typing or pasting the URL therefore starts with empty session storage (duplicating a tab is the exception: it copies the original tab's session storage). To share a draft across tabs, use `localStorage` or IndexedDB (with the `storage` event or BroadcastChannel to keep tabs in sync). Web Storage is synchronous and has no idle expiry.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-05",
    track: "frontend",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["accessibility", "web"],
    prompt:
      'An icon-only close button is written as <button><svg aria-hidden="true">...</svg></button>, and screen readers announce it only as "button". Which changes give it an accessible name? Select all that apply.',
    options: [
      'Add role="button" to the <button> element so assistive technology treats it as a control',
      'Add aria-label="Close dialog" to the <button> element so it has a text alternative',
      'Add tabindex="0" to the <button> element so that screen readers can reach it with Tab',
      'Put visually hidden text, such as <span class="sr-only">Close dialog</span>, inside the button',
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 3],
    multiSelect: true,
    expectedPoints: [
      "a button's name comes from its content, aria-label or aria-labelledby",
      "an aria-hidden icon contributes no name",
      "a native button already has the button role and is focusable",
      "visually hidden text stays available to assistive technology",
    ],
    redFlags: ['role="button" gives an element a name', "tabindex makes an element accessible"],
    rubric: {
      criteria: [
        { name: "Accessible name", weight: 5, keywords: ["accessible name", "aria-label", "aria-labelledby", "visually hidden", "screen reader"] },
        { name: "Native semantics", weight: 3, keywords: ["native button", "role", "focusable", "redundant"] },
      ],
    },
    modelAnswer:
      'A button\'s accessible name is computed from `aria-labelledby`, `aria-label` or its text content. With the SVG hidden, the button has no content to name it, so either an `aria-label` or visually hidden text inside the button fixes it. `role="button"` and `tabindex="0"` are redundant on a native `<button>`, which already has the button role and is focusable, and neither supplies a name.',
    followUpIds: [],
  },

  // ─── Difficulty 2 ───────────────────────────────────────────────────────
  {
    id: "qb-frontend-mid-06",
    track: "frontend",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["javascript", "async"],
    prompt:
      'This function logs "All saved" before the saves have finished, and a failed save shows up only as an unhandled rejection. What is the correct fix?\n\n    async function saveAll(items) {\n      items.forEach(async (item) => {\n        await api.save(item);\n      });\n      console.log("All saved");\n    }',
    options: [
      "Await Promise.all(items.map((item) => api.save(item))), or use for...of with await to save one at a time",
      "Put await in front of items.forEach(...) so that the function waits for every async callback to finish",
      "Wrap the forEach call in a try/catch block so that failed saves are caught before the message is logged",
      "Remove async from the callback but keep await api.save(item), so that forEach runs the saves in order",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "forEach ignores the promises its callback returns",
      "awaiting forEach awaits undefined",
      "Promise.all for parallel saves",
      "for...of with await for sequential saves",
      "a rejection is only caught if its promise is awaited",
    ],
    redFlags: ["await items.forEach waits for the callbacks", "try/catch catches rejections that happen later"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["foreach", "ignores", "promise", "return value", "unhandled rejection"] },
        { name: "Fix", weight: 4, keywords: ["promise.all", "map", "for...of", "await", "sequential", "parallel"] },
      ],
    },
    modelAnswer:
      "`forEach` ignores its callback's return value, so the promises returned by the async callbacks are never awaited: the function logs immediately and any rejection is unhandled. Awaiting `forEach` does nothing because it returns `undefined`, and a try/catch around it cannot catch rejections that happen later. Mapping the items to promises and awaiting `Promise.all` runs the saves in parallel and rejects on the first failure; a `for...of` loop with `await` runs them one after another.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-07",
    track: "frontend",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["react", "components", "state"],
    prompt:
      "Each TodoRow keeps an unsaved edit in its own state. After the user deletes the first todo, the row that moves up shows the deleted row's draft. What is the cause and the fix?\n\n    {todos.map((todo, index) => (\n      <TodoRow key={index} todo={todo} onDelete={remove} />\n    ))}",
    options: [
      "TodoRow should be wrapped in React.memo so React stops reusing the props from the previous render",
      "Index keys tie state to list position, so the next todo inherits the deleted row's state; key by todo.id",
      "Keys must be strings, so the index needs converting with key={String(index)} for React to match rows",
      "TodoRow should hold its draft in a ref rather than state, since refs are not carried over between renders",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "React matches children between renders by key",
      "index keys follow position, not identity",
      "state stays with the component instance for a key",
      "use a stable, unique id from the data",
    ],
    redFlags: ["keys must be strings", "React.memo fixes key problems"],
    rubric: {
      criteria: [
        { name: "Reconciliation", weight: 5, keywords: ["key", "reconciliation", "position", "identity", "instance"] },
        { name: "Fix", weight: 4, keywords: ["stable id", "unique", "todo.id", "not the index"] },
      ],
    },
    modelAnswer:
      "React matches children between renders by key. With index keys, after the first item is deleted the todo that was at index 1 now has key 0, so React keeps the first component instance, including its state, and simply passes it new props. A stable, unique key such as the todo's id makes the state move with its item and unmounts the deleted row. Converting the index to a string changes nothing, and refs belong to the instance just like state, so they are reused in the same way.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-08",
    track: "frontend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["react", "state", "context api"],
    prompt:
      "Which of these make React re-render a function component, as opposed to changes React never sees? Select all that apply.",
    options: [
      "Its state setter is called with a value that differs (by Object.is) from the current state",
      "A ref it owns has its .current property reassigned during an event handler",
      "The parent that creates its JSX element re-renders, and the child is not wrapped in memo",
      "The parent mutates an object it passed down as a prop, without updating any state",
      "A context it reads with useContext is given a new value by its provider",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "a state update with a different value",
      "the parent that creates its element re-renders (by default)",
      "an element passed in as children is not re-created by the parent's re-render",
      "a consumed context value changes",
      "ref changes and in-place mutations do not notify React",
      "memo only skips renders when props are shallowly equal",
    ],
    redFlags: ["mutating a prop object triggers a re-render", "assigning ref.current re-renders"],
    rubric: {
      criteria: [
        { name: "Triggers", weight: 5, keywords: ["state", "parent", "context", "object.is", "re-render"] },
        { name: "Non-triggers", weight: 3, keywords: ["ref", "mutation", "memo", "shallow"] },
      ],
    },
    modelAnswer:
      "A component re-renders when its own state changes, when a context it consumes gets a new value, and, by default, whenever the parent component that creates its JSX element re-renders and so passes it a new props object. (An element created higher up and passed down as `children` is the same element after the parent's re-render, so React skips it.) Reassigning `ref.current` is deliberately invisible to React, and mutating a prop object in place does not notify React at all, so neither schedules a render, which is why mutation leads to stale UI. `memo` lets a component skip a re-render when its props are shallowly equal, but it never blocks its own state or context updates.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-09",
    track: "frontend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["css", "layout", "responsive design"],
    prompt:
      "A card grid should fit as many columns as the container allows, each at least 240px wide, with the columns stretching to share any leftover space and no media queries. Which CSS does this?",
    options: [
      "display: grid; grid-template-columns: repeat(4, minmax(240px, 1fr));",
      "display: flex; flex-wrap: nowrap; with min-width: 240px on each card",
      "display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));",
      "display: grid; grid-auto-flow: column; grid-auto-columns: 240px;",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "auto-fill creates as many tracks as fit",
      "minmax sets a minimum and a flexible maximum",
      "1fr shares the leftover space",
      "responds to the container width without media queries",
    ],
    redFlags: ["a fixed column count is responsive", "a nowrap flex row moves items onto new lines"],
    rubric: {
      criteria: [
        { name: "Grid mechanics", weight: 5, keywords: ["repeat", "auto-fill", "minmax", "1fr", "tracks"] },
        { name: "Responsiveness", weight: 3, keywords: ["container width", "no media queries", "wrap", "intrinsic"] },
      ],
    },
    modelAnswer:
      "`repeat(auto-fill, minmax(240px, 1fr))` lets the grid create as many column tracks as fit at the 240px minimum, and the `1fr` maximum then shares the remaining width between them, so the layout adapts to its container without media queries. `repeat(4, ...)` always makes four columns and overflows on narrow screens, a non-wrapping flex row cannot move cards onto new lines, and `grid-auto-flow: column` places every card in one row that scrolls sideways. (`auto-fit` differs only in collapsing empty tracks when there are fewer items than columns.)",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-10",
    track: "frontend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["css"],
    prompt:
      'What colour is <a class="link active">, inside <nav class="nav">, inside <aside id="sidebar">, given these rules?\n\n    #sidebar a { color: blue; }\n    .nav .link.active { color: red; }\n    nav a.link { color: green; }',
    options: [
      "Blue, because a single ID selector outweighs any number of class selectors",
      "Red, because its three class selectors add up to more than one ID and one element",
      "Green, because it is the last matching rule, and the later rule wins any conflict",
      "It varies by browser, because ties between ID-based and class-based rules are undefined",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "specificity is compared column by column: IDs, then classes, then elements",
      "#sidebar a is (1,0,1) and .nav .link.active is (0,3,0)",
      "no number of classes outweighs an ID",
      "source order only breaks ties of equal specificity",
    ],
    redFlags: ["specificity is a sum of points", "the last rule always wins"],
    rubric: {
      criteria: [
        { name: "Specificity", weight: 5, keywords: ["specificity", "id", "class", "element", "(1,0,1)", "column"] },
        { name: "Cascade", weight: 3, keywords: ["source order", "tie", "cascade", "later rule"] },
      ],
    },
    modelAnswer:
      "Specificity is compared as (IDs, classes/attributes/pseudo-classes, elements), column by column from the left. `#sidebar a` is (1,0,1), `.nav .link.active` is (0,3,0) and `nav a.link` is (0,1,2), so the rule with the ID wins and the link is blue. Class counts never carry over into the ID column, and source order only decides between rules of equal specificity.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ───────────────────────────────────────────────────────
  {
    id: "qb-frontend-mid-11",
    track: "frontend",
    level: "mid",
    difficulty: 3,
    type: "coding",
    tags: ["typescript", "types"],
    prompt:
      'A teammate is about to add { kind: "refunded" } to the Payment union. Which default branch, used in switches like this one, makes the compiler flag every switch that does not handle the new member?\n\n    type Payment =\n      | { kind: "card"; last4: string }\n      | { kind: "paypal"; email: string };\n\n    function label(p: Payment): string {\n      switch (p.kind) {\n        case "card": return "Card ending " + p.last4;\n        case "paypal": return p.email;\n        default: /* which branch? */\n      }\n    }',
    options: [
      'default: { const unhandled: unknown = p; throw new Error("Unhandled: " + JSON.stringify(unhandled)); }',
      'default: { const unhandled: never = p; throw new Error("Unhandled: " + JSON.stringify(unhandled)); }',
      'default: { const unhandled = p as any; throw new Error("Unhandled: " + JSON.stringify(unhandled)); }',
      'default: { console.warn("Unhandled payment", p); return "Unknown payment method"; }',
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "switching on the discriminant narrows the union",
      "the default branch sees only the unhandled members",
      "assigning a remaining member to never is a compile error",
      "unknown and any accept every value, so they check nothing",
    ],
    redFlags: ["a runtime throw is a compile-time check", "casting to any keeps type safety"],
    rubric: {
      criteria: [
        { name: "Narrowing", weight: 5, keywords: ["discriminated union", "narrowing", "kind", "never", "exhaustive"] },
        { name: "Compile-time safety", weight: 3, keywords: ["compile error", "not assignable", "unknown", "any", "assertnever"] },
      ],
    },
    modelAnswer:
      'In the `default` branch TypeScript narrows `p` to the union members no `case` handled. While every member is covered that is `never`, so assigning it to a `never` variable compiles; once `refunded` is added, `p` there becomes `{ kind: "refunded" }`, which is not assignable to `never`, so the compiler points at every switch that misses it. Annotating with `unknown` or casting to `any` accepts any value, so the gap would only surface at runtime.',
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-12",
    track: "frontend",
    level: "mid",
    difficulty: 3,
    type: "system-design",
    tags: ["performance", "system design", "react"],
    prompt:
      "An admin page must show 20,000 audit-log rows in a single continuously scrollable list (pagination has been ruled out). Rendering every row makes the first paint take seconds and scrolling stutter. Which design fixes this?",
    options: [
      "Wrap each row component in React.memo so that all 20,000 rows render far more cheaply on the first paint",
      "Render every row, but hide the off-screen rows with display: none and toggle them from a scroll handler",
      "Build the rows in a Web Worker and have the worker insert them into the page's DOM in batches of 500 rows",
      "Render only the rows near the viewport, inside a spacer as tall as the full list, swapping them on scroll",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "the cost is creating and laying out thousands of DOM nodes",
      "windowing renders only visible rows plus an overscan",
      "a full-height spacer keeps the scrollbar correct",
      "handle variable row heights and keyboard scrolling",
      "memo does not reduce the initial mount",
    ],
    redFlags: ["Web Workers can update the DOM", "React.memo speeds up the first render"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 4, keywords: ["dom nodes", "layout", "mount", "main thread"] },
        { name: "Virtualisation", weight: 5, keywords: ["virtualise", "windowing", "viewport", "overscan", "spacer", "row height"] },
      ],
    },
    modelAnswer:
      "The cost comes from creating and laying out 20,000 rows of DOM, so the fix is not to create them: a virtualised (windowed) list renders only the visible rows plus a small overscan, inside a container whose height matches the full list so the scrollbar still behaves naturally. `React.memo` only avoids re-renders and still mounts every row, `display: none` keeps every node in the DOM and the React tree, and Web Workers have no access to the DOM. Established virtualisation libraries also handle details such as variable row heights.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-13",
    track: "frontend",
    level: "mid",
    difficulty: 3,
    type: "debugging",
    tags: ["testing", "react testing library", "react"],
    prompt:
      'Profile fetches the user in an effect, and the request is mocked to succeed, yet this test fails with "Unable to find an element with the text: Ada Lovelace". What is the right fix?\n\n    test("shows the user name", () => {\n      render(<Profile id="42" />);\n      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();\n    });',
    options: [
      'Use screen.queryByText("Ada Lovelace") instead, because queryBy queries wait for the element to appear',
      "Call jest.useFakeTimers() before rendering so that the mocked request resolves instantly",
      'Make the test async and assert on await screen.findByText("Ada Lovelace"), which retries until it appears',
      'Query by role with screen.getByRole("heading", { name: "Ada Lovelace" }) to make the test robust',
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the text appears only after the asynchronous request resolves",
      "getBy queries check the DOM once, synchronously",
      "findBy queries return a promise and retry until a timeout",
      "querying by role is good practice but does not fix timing",
    ],
    redFlags: ["queryBy waits for elements", "fake timers resolve pending promises"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 4, keywords: ["asynchronous", "effect", "synchronous", "getby", "first render"] },
        { name: "Fix", weight: 5, keywords: ["findby", "await", "async test", "waitfor", "retry"] },
      ],
    },
    modelAnswer:
      "The name only appears after the mocked request resolves and state updates, but `getByText` checks the DOM synchronously, straight after the first render. `findBy*` queries return a promise that retries until the element appears or a timeout passes, so awaiting `findByText` waits for the asynchronous render. `queryBy*` also checks only once (returning null instead of throwing), and querying by role is good practice but does not change the timing.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-14",
    track: "frontend",
    level: "mid",
    difficulty: 3,
    type: "behavioral",
    tags: ["testing", "behavioral", "quality"],
    prompt:
      "A checkout end-to-end test fails about one run in ten in CI, and the team has got into the habit of re-running the pipeline until it goes green. You have been asked to sort it out. What is the best course of action?",
    options: [
      "Turn on three automatic retries for the whole suite in the runner config, so the pipeline goes green and the team can move on",
      "Quarantine it with a ticket and an owner, reproduce it with traces or repeated runs, fix the root cause, then re-enable it",
      "Delete the test, since a check that fails at random gives the team no useful signal and only slows every pull request down",
      "Raise every timeout in the suite to 60 seconds, so that slower CI runners always have enough time to finish each step",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "habitual re-runs hide failures and erode trust in CI",
      "quarantine visibly, with a ticket and an owner",
      "reproduce with traces and repeated runs",
      "fix causes such as fixed waits, shared data or real race conditions",
      "restore coverage of the critical flow",
    ],
    redFlags: ["blanket retries fix flakiness", "delete flaky tests"],
    rubric: {
      criteria: [
        { name: "Ownership", weight: 4, keywords: ["quarantine", "ticket", "owner", "visible", "trust"] },
        { name: "Root cause", weight: 5, keywords: ["reproduce", "trace", "fixed wait", "test data", "race condition", "root cause"] },
      ],
    },
    modelAnswer:
      "Habitual re-runs teach the team to ignore red builds and can hide a real bug in checkout. Quarantining the test keeps the pipeline trustworthy while making the gap visible and owned; repeated runs and traces then expose the usual causes, such as fixed sleeps instead of waiting for a condition, shared or order-dependent test data, or a genuine race in the app, and the test returns once it is reliable. Blanket retries and longer timeouts mask the problem and slow every run, and deleting the test silently drops coverage of a critical flow.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ───────────────────────────────────────────────────────
  {
    id: "qb-frontend-mid-15",
    track: "frontend",
    level: "mid",
    difficulty: 4,
    type: "coding",
    tags: ["javascript", "event-loop", "async"],
    prompt:
      'In what order are the letters logged?\n\n    console.log("A");\n    setTimeout(() => console.log("B"), 0);\n    Promise.resolve().then(() => console.log("C"));\n    (async () => {\n      console.log("D");\n      await null;\n      console.log("E");\n    })();\n    console.log("F");',
    options: ["A, D, F, B, C, E", "A, F, D, C, E, B", "A, D, E, F, C, B", "A, D, F, C, E, B"],
    correctOptionIndex: 3,
    expectedPoints: [
      "synchronous code runs first",
      "an async function runs synchronously until its first await",
      "microtasks drain before the next macrotask",
      "await always yields, even for a non-promise",
      "setTimeout callbacks are macrotasks",
    ],
    redFlags: ["setTimeout 0 runs before promise callbacks", "await on a non-promise does not yield"],
    rubric: {
      criteria: [
        { name: "Ordering", weight: 5, keywords: ["synchronous", "microtask", "macrotask", "queue", "await"] },
        { name: "Reasoning", weight: 3, keywords: ["then", "settimeout", "call stack", "event loop"] },
      ],
    },
    modelAnswer:
      "Synchronous code runs first: A, then D (an async function runs synchronously until its first `await`), then F. When the call stack empties, the microtask queue drains in order: the `.then` callback C was queued before the `await` continuation E. Only then does the event loop take the next macrotask, the timer callback B. `await` always yields, even for a non-promise value, so E can never log before F.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-16",
    track: "frontend",
    level: "mid",
    difficulty: 4,
    type: "debugging",
    tags: ["react", "hooks", "async"],
    prompt:
      "When userId changes quickly, this card sometimes ends up showing the previous user's name. What is the fix?\n\n    function UserCard({ userId }) {\n      const [user, setUser] = useState(null);\n      useEffect(() => {\n        fetch(`/api/users/${userId}`)\n          .then((res) => res.json())\n          .then(setUser);\n      }, [userId]);\n      return <p>{user?.name}</p>;\n    }",
    options: [
      "Remove userId from the dependency array so that only one request is ever made for the card",
      "Switch to useLayoutEffect so that the request always finishes before the browser paints the card",
      "Call setUser(null) at the start of the effect so that the previous user is cleared before fetching",
      "Return a cleanup that aborts the request (AbortController) or sets an ignore flag checked before setUser",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "responses can arrive out of order",
      "the cleanup runs before the next effect and on unmount",
      "abort the request or ignore stale responses",
      "handle the resulting AbortError",
      "data-fetching libraries handle this for you",
    ],
    redFlags: ["remove dependencies to stop refetching", "useLayoutEffect waits for the network"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["race condition", "out of order", "stale response", "previous request"] },
        { name: "Fix", weight: 5, keywords: ["cleanup", "abortcontroller", "ignore flag", "abort", "unmount"] },
      ],
    },
    modelAnswer:
      "Each change of `userId` starts a new request, and responses can arrive out of order, so a slow response for the old id can call `setUser` after the new one. The function returned from an effect runs before the next effect (and on unmount); aborting the fetch there, or setting a flag that the `.then` checks, ensures only the latest request updates state (catch and ignore the AbortError). Clearing state first does not stop a late response overwriting it, and `useLayoutEffect` changes when the effect runs, not when the network replies.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-17",
    track: "frontend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["accessibility", "web"],
    prompt:
      "In a single-page app, clicking a nav link swaps the main content without a page load. Screen-reader users hear nothing about the new page, and keyboard focus stays on the link, so users must Tab through the whole navigation again. Which approach fixes this?",
    options: [
      'Set aria-live="assertive" on the main content container so the whole new page is read out after each navigation',
      'Add tabindex="0" to every heading so that keyboard users can Tab straight to the new content after navigating',
      'After each route change, update document.title and move focus to the new view\'s main heading (given tabindex="-1")',
      'Add role="alert" to each navigation link so that activating a link announces its text to screen readers',
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "client-side navigation neither resets focus nor announces the page",
      "update document.title on every route",
      "move focus to the new view's heading or main content",
      'tabindex="-1" makes it focusable without adding a tab stop',
      "avoid noisy live regions",
    ],
    redFlags: ["make the whole page a live region", 'add tabindex="0" to headings'],
    rubric: {
      criteria: [
        { name: "Problem", weight: 4, keywords: ["focus", "announce", "route change", "screen reader", "page load"] },
        { name: "Solution", weight: 5, keywords: ["document.title", "heading", 'tabindex="-1"', "focus management", "programmatic focus"] },
      ],
    },
    modelAnswer:
      'A full page load resets focus and makes screen readers announce the new document; client-side routing does neither, so the app has to do it. Updating `document.title` and programmatically focusing the new view\'s heading (made focusable with `tabindex="-1"`, which does not add it to the Tab order) announces the new page and puts keyboard users at the start of the new content. An assertive live region on the whole content reads out large amounts of text and interrupts users, and extra `tabindex="0"` stops on headings clutter the Tab order without announcing anything.',
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-18",
    track: "frontend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["performance", "react", "javascript"],
    prompt:
      "A React app's initial JavaScript is 2 MB because the router file statically imports every route component, including a rarely visited report page that is the only user of a large charting library. Which change cuts the initial download most effectively?",
    options: [
      'Load each route with React.lazy(() => import("./routes/Reports")) inside <Suspense>, giving each its own chunk',
      "Wrap each route component in React.memo so that its code is not downloaded until the route first renders",
      "Add the defer attribute to the main script tag so the 2 MB bundle is downloaded after the HTML is parsed",
      "Replace the static imports with require() calls inside each route component so the code loads on demand",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "dynamic import() creates a split point",
      "route-level chunks load on navigation",
      "Suspense shows a fallback while a chunk loads",
      "a library used by one route moves into that route's chunk",
      "prefetch likely routes to hide the delay",
    ],
    redFlags: ["React.memo affects downloading", "require() is lazy in a bundle"],
    rubric: {
      criteria: [
        { name: "Code splitting", weight: 5, keywords: ["dynamic import", "chunk", "code splitting", "react.lazy", "suspense"] },
        { name: "Bundle impact", weight: 3, keywords: ["initial bundle", "route", "prefetch", "bundle size"] },
      ],
    },
    modelAnswer:
      "A dynamic `import()` is a split point: the bundler emits the imported module and the dependencies only it uses, here including the charting library, as a separate chunk that is fetched only when needed. `React.lazy` with `<Suspense>` turns that into a component that shows a fallback while the chunk loads, and likely routes can be prefetched (for example on hover) to hide the delay. `React.memo` only skips re-renders, `defer` changes when the same full bundle executes rather than its size, and synchronous `require()` calls are bundled into the same chunk.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-19",
    track: "frontend",
    level: "mid",
    difficulty: 4,
    type: "system-design",
    tags: ["state", "tanstack query", "redux", "system design"],
    prompt:
      "A React app stores every API response in a global Redux store, with hand-written loading and error flags, refetch logic and cache invalidation for each endpoint. Screens often show stale data after mutations, and every new endpoint needs a lot of boilerplate. What architecture should you move towards?",
    options: [
      "Move all API data into one React context at the root, so every component reads the same shared copy without needing Redux at all",
      "Have each component fetch its own data on mount with no shared cache, so that whatever it shows is always as fresh as possible",
      "Persist every API response to localStorage and read it synchronously at startup, refreshing the whole cache once a day",
      "Treat server data as a cache owned by a server-state library such as TanStack Query, with only UI state in a small store",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "separate server state from client UI state",
      "server state needs caching, deduplication and invalidation",
      "invalidate or update queries after mutations",
      "keep the global store small",
      "far less boilerplate per endpoint",
    ],
    redFlags: ["put all API data in one context", "every component should fetch independently"],
    rubric: {
      criteria: [
        { name: "Separation", weight: 5, keywords: ["server state", "client state", "cache", "ui state"] },
        { name: "Server-state features", weight: 4, keywords: ["deduplication", "invalidation", "refetch", "stale", "mutation"] },
      ],
    },
    modelAnswer:
      "Data owned by the server is a cache of remote state: it needs request deduplication, background refetching, staleness rules and invalidation after mutations, which server-state libraries such as TanStack Query, SWR or RTK Query provide declaratively (for example, invalidating the todos query after adding a todo). Moving that data out of the global store leaves only genuinely client-side state, such as form drafts, open panels and selections, which is small and simple. A root context re-renders every consumer on each change and still needs hand-written caching, per-component fetching duplicates requests, and day-old `localStorage` copies make staleness worse.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ───────────────────────────────────────────────────────
  {
    id: "qb-frontend-mid-20",
    track: "frontend",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["react", "context api", "performance", "hooks"],
    prompt:
      "App renders <AuthContext.Provider value={{ user, login, logout }}> and also holds the state of a search box. Components that call useContext(AuthContext) are wrapped in memo, yet they all re-render on every keystroke in the search box. Why, and what is the fix?",
    options: [
      "Context consumers re-render whenever any ancestor renders, so the auth state has to move into an external store to stop it",
      "The inline value object is new on every App render, so consumers see a changed value; memoise it with useMemo and useCallback",
      "memo compares props deeply and fails on function props, so it needs a custom comparison function that ignores login and logout",
      "useContext subscribes to every context in the tree, so the consumers should read it through <AuthContext.Consumer> instead",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the provider value is compared with Object.is",
      "an inline object is a new reference on every render",
      "context changes re-render consumers even inside memo",
      "useMemo for the value and useCallback for the functions",
      "split contexts or move fast-changing state down",
    ],
    redFlags: ["memo blocks context updates", "consumers re-render on any ancestor render"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["object.is", "new reference", "inline object", "provider value", "context change"] },
        { name: "Fix", weight: 4, keywords: ["usememo", "usecallback", "split context", "move state down"] },
      ],
    },
    modelAnswer:
      "React compares a provider's `value` with `Object.is`. An inline object literal is a new reference on every render of App, so every keystroke counts as a context change, and context changes re-render consumers even when they are wrapped in `memo`. Memoising the value with `useMemo` (with `login` and `logout` stabilised by `useCallback`) means it only changes when `user` does. Moving the search state out of App, or splitting rarely and frequently changing values into separate contexts, also limits the re-renders.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-21",
    track: "frontend",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["web vitals", "performance", "browser apis"],
    prompt:
      "Field data shows a poor Interaction to Next Paint (INP) on a product listing. Profiling shows that clicking a sort button runs a 600 ms synchronous handler that sorts 50,000 items and then re-renders the list. Which change most directly improves INP?",
    options: [
      'Preload the main JavaScript bundle with <link rel="preload"> so the click handler\'s code is fetched earlier',
      "Set explicit width and height on the product images so that the list does not shift while it re-renders",
      "Paint immediate feedback, then sort in a Web Worker or in chunks that yield to the main thread, then render",
      "Move the click listener from the button to document with event delegation so fewer listeners are registered",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "INP measures the delay from an interaction to the next paint",
      "a long task in an event handler blocks the next frame",
      "give immediate visual feedback",
      "yield to the main thread or move work to a worker",
      "preload and image dimensions target loading and CLS, not INP",
    ],
    redFlags: ["INP is a loading metric", "event delegation makes handlers faster"],
    rubric: {
      criteria: [
        { name: "Metric", weight: 4, keywords: ["inp", "interaction", "next paint", "long task", "main thread"] },
        { name: "Fix", weight: 5, keywords: ["yield", "web worker", "chunk", "starttransition", "feedback"] },
      ],
    },
    modelAnswer:
      "INP is the Core Web Vital for responsiveness: it measures the latency from each user interaction to the next frame the browser paints, and reports roughly the slowest of them on the page, so a 600 ms synchronous task in a click handler hurts it directly. Painting immediate feedback and then moving the heavy work off the main thread (a Web Worker) or splitting it into chunks that yield between them (for example with `scheduler.yield()` where supported, or `setTimeout`) keeps each task short; in React, `startTransition` similarly keeps the expensive re-render interruptible. Preloading improves loading, explicit image dimensions target Cumulative Layout Shift, and event delegation does not shorten the work done per click.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-22",
    track: "frontend",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["css", "flexbox", "layout"],
    prompt:
      "In a chat list, each row is display: flex, with a 48px avatar beside a text column set to flex: 1. Inside that column the last message has white-space: nowrap; overflow: hidden; text-overflow: ellipsis, yet a long message pushes the row wider than its container instead of truncating. What is the cause and fix?",
    options: [
      "Flex items default to min-width: auto, so the column cannot shrink below its content; set min-width: 0 on the column",
      "flex: 1 sets flex-shrink to 0, so the text column is never allowed to shrink; add flex-shrink: 1 to the column",
      "text-overflow: ellipsis only works inside grid containers, so the row must become display: grid with two columns",
      "The row needs flex-wrap: wrap, so that the long message can move onto its own line and be truncated there",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "flex items default to min-width: auto",
      "nowrap text gives the column a large min-content width",
      "min-width: 0 (or overflow: hidden) lets the item shrink",
      "flex: 1 already allows shrinking",
      "the ellipsis needs a constrained width to appear",
    ],
    redFlags: ["flex: 1 prevents shrinking", "text-overflow requires grid"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["min-width: auto", "min-content", "flex item", "shrink", "nowrap"] },
        { name: "Fix", weight: 4, keywords: ["min-width: 0", "overflow: hidden", "ellipsis", "truncate"] },
      ],
    },
    modelAnswer:
      "A flex item's automatic minimum width is its min-content size, and nowrap text makes that the full length of the message, so the text column refuses to shrink and overflows the row. Setting `min-width: 0` on the flex item (or `overflow: hidden`, which makes it a scroll container and so also removes the automatic minimum) lets it shrink to the space available, and the paragraph's ellipsis then appears. `flex: 1` already allows shrinking, since it means `1 1 0%`, so `flex-shrink` is not the problem.",
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-23",
    track: "frontend",
    level: "mid",
    difficulty: 5,
    type: "system-design",
    tags: ["system design", "accessibility", "performance", "async"],
    prompt:
      "Design a search-as-you-type box for a catalogue of two million products served by a remote API. It must not flood the API, must never show results for an older query after a newer one, and must be fully usable with a keyboard and a screen reader. Which design meets all three requirements?",
    options: [
      "Download the whole catalogue into IndexedDB on first visit and filter it on every keystroke, showing matches as <div>s with click handlers",
      "Send a request on every keystroke and render each response as soon as it arrives, using a native <datalist> for the suggestions",
      'Throttle requests to one per second, show the results in a tooltip on hover, and put aria-live="polite" on the input itself',
      "Debounce input, abort or ignore superseded requests, cache recent queries, and follow the ARIA combobox pattern with arrow-key navigation",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "debounce to limit the request rate",
      "cancel or ignore stale responses",
      "cache recent results",
      "ARIA combobox with a listbox of options",
      "arrow keys, Enter and Escape for keyboard users",
    ],
    redFlags: ["render every response as it arrives", "clickable divs are accessible"],
    rubric: {
      criteria: [
        { name: "Network", weight: 5, keywords: ["debounce", "abortcontroller", "stale", "out of order", "cache"] },
        { name: "Accessibility", weight: 4, keywords: ["combobox", "listbox", "aria-activedescendant", "arrow keys", "keyboard"] },
      ],
    },
    modelAnswer:
      'Debouncing waits for a pause in typing, which cuts the request rate, and a small cache avoids refetching recent queries. Because responses can arrive out of order, each new query must abort the previous request (AbortController) or tag requests and drop any response that is not for the latest query. For accessibility, the input and suggestions follow the WAI-ARIA combobox pattern: `role="combobox"` with `aria-expanded` and `aria-controls`, a `role="listbox"` of options, arrow keys moving `aria-activedescendant`, and Enter and Escape to choose or close. Rendering every response as it arrives shows stale results, and clickable `<div>`s and hover tooltips are not keyboard accessible.',
    followUpIds: [],
  },
  {
    id: "qb-frontend-mid-24",
    track: "frontend",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["security", "owasp", "web"],
    prompt:
      "A server-rendered app wants a Content Security Policy that blocks injected scripts even if an XSS bug slips through, while its own bundles, including the scripts they load dynamically, keep working. Which policy is the strongest fit?",
    options: [
      "script-src 'self' 'unsafe-inline', so the app's inline scripts and handlers keep working while other origins are blocked",
      "script-src 'nonce-r4nd0m' 'strict-dynamic', with that same nonce value hard-coded in the app's config and used on every response",
      "script-src 'nonce-{random per response}' 'strict-dynamic'; object-src 'none'; base-uri 'none', with the nonce on each of its own scripts",
      "default-src 'self'; script-src 'self', delivered in a Content-Security-Policy-Report-Only header so violations are logged for review",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a nonce-based strict CSP",
      "a fresh, unpredictable nonce for every response",
      "'strict-dynamic' trusts scripts loaded by already-trusted scripts",
      "object-src 'none' and base-uri 'none' close common bypasses",
      "'unsafe-inline' and Report-Only do not block injection",
    ],
    redFlags: ["a fixed nonce is fine", "'unsafe-inline' keeps a CSP effective"],
    rubric: {
      criteria: [
        { name: "Policy", weight: 5, keywords: ["nonce", "strict-dynamic", "per response", "random", "object-src", "base-uri"] },
        { name: "Pitfalls", weight: 3, keywords: ["unsafe-inline", "report-only", "allowlist", "reused nonce"] },
      ],
    },
    modelAnswer:
      "A strict CSP only lets a script run if it carries a nonce the attacker cannot predict, so the nonce must be freshly random for every response and added by the server to its own `<script>` tags. `'strict-dynamic'` then extends that trust to scripts those trusted scripts load, so dynamically loaded chunks keep working, and `object-src 'none'` and `base-uri 'none'` close plugin and `<base>`-tag bypasses. `'unsafe-inline'` lets injected inline scripts run, a fixed nonce can simply be copied into the attacker's payload, and a Report-Only policy reports violations without blocking anything.",
    followUpIds: [],
  },
];
