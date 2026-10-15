import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-senior-01",
    track: "fullstack",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["oauth", "oidc", "authentication", "security"],
    prompt:
      "A banking single-page app signs users in through an OpenID Connect provider. The security team requires that no access or refresh token is ever readable by JavaScript in the browser, so that even an XSS bug cannot steal one. Which architecture meets that requirement?",
    options: [
      "Keep the access token in memory and the refresh token in sessionStorage, and rotate the refresh token every time the app uses it",
      "Encrypt both tokens with a non-extractable Web Crypto key before saving them in localStorage, and decrypt them for each API call",
      "Use a backend-for-frontend as a confidential OAuth client that keeps tokens server-side and gives the browser an httpOnly cookie",
      "Run the authorisation code flow with PKCE in the browser, and hold both tokens in a closure inside a dedicated web worker",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "backend-for-frontend (BFF) acts as a confidential OAuth client",
      "tokens stay on the server; the browser gets an httpOnly, Secure, SameSite session cookie",
      "the BFF proxies API calls and attaches the access token",
      "anything held or decrypted in the browser is within reach of injected script",
      "the cookie session still needs CSRF protection",
    ],
    redFlags: [
      "encrypting tokens in localStorage protects them from XSS",
      "a web worker keeps tokens out of browser JavaScript",
    ],
    rubric: {
      criteria: [
        {
          name: "Architecture",
          weight: 5,
          keywords: ["bff", "backend-for-frontend", "confidential client", "server-side tokens", "httponly", "session cookie"],
        },
        {
          name: "Why browser storage fails",
          weight: 3,
          keywords: ["xss", "localstorage", "sessionstorage", "web crypto", "worker", "csrf"],
        },
      ],
    },
    modelAnswer:
      "Only a backend-for-frontend keeps tokens out of the browser entirely: the BFF runs the code flow as a confidential client, stores the access and refresh tokens server-side, gives the SPA an httpOnly, Secure, SameSite session cookie and attaches the access token when it proxies API calls. The other options all keep tokens in browser JavaScript, which the requirement rules out; storage is readable by any injected script, and a non-extractable Web Crypto key can still be used by that script to decrypt. An XSS bug could still send requests through the BFF while the page is open, but it cannot steal long-lived tokens to use elsewhere, and the cookie session needs CSRF protection.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-02",
    track: "fullstack",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["graphql", "rest", "api"],
    prompt:
      "One product API serves a web app and two mobile apps whose screens need different, deeply nested slices of the same data, and mobile users suffer from over-fetching and many round trips. The team is considering GraphQL. Which statement about that move is accurate?",
    options: [
      "GraphQL resolves each query in a single database call, so the N+1 query problems seen with nested REST calls disappear",
      "Clients shape every query themselves, so the server needs depth and cost limits or an allowlist of persisted queries",
      "Because the schema lists only the fields clients may see, resolvers no longer need their own authorisation checks",
      "GraphQL runs only over WebSockets, so the existing HTTP load balancers, authentication and logging must be replaced",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "one request can fetch exactly the nested data a screen needs",
      "clients can send arbitrarily deep or expensive queries",
      "depth and complexity limits, timeouts or persisted queries",
      "nested resolvers create N+1 risk; batch with DataLoader",
      "authorisation is still enforced per object and field",
      "normally served over plain HTTP",
    ],
    redFlags: ["GraphQL removes the need for authorisation", "GraphQL solves N+1 queries automatically"],
    rubric: {
      criteria: [
        {
          name: "Fit for the problem",
          weight: 3,
          keywords: ["over-fetching", "round trips", "nested", "schema", "single endpoint"],
        },
        {
          name: "Operational risks",
          weight: 5,
          keywords: ["query cost", "depth limit", "persisted queries", "n+1", "dataloader", "authorisation"],
        },
      ],
    },
    modelAnswer:
      "GraphQL suits this case because each client asks for exactly the nested fields a screen needs in one request, but the same flexibility lets any client send very deep or expensive queries, so production servers add depth and complexity limits, timeouts and often an allowlist of persisted queries. It does not remove N+1 queries; naive nested resolvers cause them, which is why batching with DataLoader is standard. Authorisation must still be enforced for each object and field, and GraphQL is normally served over ordinary HTTP, with WebSockets used only for subscriptions in some setups.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-03",
    track: "fullstack",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["api", "http", "rest"],
    prompt:
      "A sign-up form validates input in the browser, and the API validates it again, including rules only the server can check, such as whether a username is already taken. How should the API report validation failures so that the React form can show each one next to the right field?",
    options: [
      'Return 200 OK with `{ success: false, message: "Username taken" }`, so that the client\'s HTTP error handling is never triggered',
      "Return 500 with the validation library's exception message and stack trace, and show it in a banner above the form",
      "Return 400 with one human-readable sentence listing every problem, which the client splits into fields with regular expressions",
      "Return 400 or 422 with a machine-readable body, such as RFC 9457 problem details, listing each error's field path and code",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "4xx status for client input errors (400 or 422)",
      "structured, machine-readable errors per field",
      "stable error codes the client can map and translate",
      "the client maps errors onto form fields",
      "server validation is authoritative; browser validation is for UX",
      "never leak stack traces",
    ],
    redFlags: ["200 OK for a failed request", "returning stack traces to clients"],
    rubric: {
      criteria: [
        {
          name: "Status and format",
          weight: 5,
          keywords: ["400", "422", "problem details", "rfc 9457", "field path", "error code"],
        },
        {
          name: "Client integration",
          weight: 3,
          keywords: ["map to fields", "translate", "shared schema", "authoritative", "stack trace"],
        },
      ],
    },
    modelAnswer:
      "Validation failures are client errors, so the API should return 400 or 422 with a structured body, for example RFC 9457 problem details with an errors array giving each field path and a stable error code. The form can then map each error onto its field and turn the code into a message, while the server remains the authority for rules the browser cannot check. A 200 with an error flag hides failures from monitoring and generic client handling, a free-text sentence cannot be mapped reliably, and a 500 with a stack trace misreports the fault and leaks internals.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-04",
    track: "fullstack",
    level: "senior",
    difficulty: 1,
    type: "behavioral",
    tags: ["behavioral", "conflict", "architecture", "communication"],
    prompt:
      "Two senior engineers on your team have argued for two weeks about whether a new internal API should be REST or GraphQL, and work that depends on it is now blocked. As the tech lead, what is the best next step?",
    options: [
      "Agree criteria from the real requirements, hear each case against them (spiking any open question), then decide and record it in an ADR",
      "Let them keep debating until they reach consensus, because a decision imposed by the tech lead would damage trust within the team",
      "Ask the whole team to vote and adopt the majority view, so that nobody can say the decision was made unfairly or behind closed doors",
      "Have each engineer build their version of the API in parallel for a sprint, then keep whichever one the consuming teams like best",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the cost of delay now exceeds the difference between the options",
      "make the criteria explicit and tie them to requirements",
      "time-boxed spike for a genuine unknown",
      "the lead decides when consensus fails (disagree and commit)",
      "record the decision, trade-offs and revisit triggers in an ADR",
    ],
    redFlags: ["waiting indefinitely for consensus", "a majority vote in place of technical judgement"],
    rubric: {
      criteria: [
        {
          name: "Decision process",
          weight: 5,
          keywords: ["criteria", "requirements", "spike", "time-box", "decide", "adr"],
        },
        {
          name: "Leadership",
          weight: 3,
          keywords: ["unblock", "disagree and commit", "trade-offs", "communicate", "respect"],
        },
      ],
    },
    modelAnswer:
      "Two weeks of blocked work costs more than either choice, so the lead should turn the argument into a decision: agree criteria from the actual requirements (consumers, caching, tooling, team skills), let each engineer argue against them, time-box a spike if a factual question remains, then decide and record the reasoning and trade-offs in an architecture decision record. This respects both people while ending the stalemate, and the ADR lets the team revisit the choice if the criteria change. Waiting for consensus prolongs the block, a vote replaces judgement with popularity, and building both doubles the cost.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-05",
    track: "fullstack",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["jwt", "authentication", "security"],
    prompt:
      'A product must support "sign out of all devices" and instant account suspension by support staff. Its SPA calls the API with self-contained JWT access tokens that are valid for 12 hours and checked only by their signature. What is the problem, and a sound fix?',
    options: [
      "There is no problem: clearing the token from the browser at sign-out also makes the API reject every later request that carries it",
      "The signature check is too weak; moving from HS256 to RS256 makes the tokens of suspended users fail verification straight away",
      "A signed token stays valid until it expires; use server-side sessions, or short-lived tokens refreshed against a revocable session",
      "JWTs cannot carry an expiry time, so the API has to store every token it issues and delete all of a user's tokens on sign-out",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "self-contained tokens stay valid until exp, whatever the server's state",
      "revocation needs server-side state",
      "server-side sessions can be deleted instantly",
      "short-lived access tokens with refresh checked against a session record",
      "the exposure window equals the access token's lifetime; a denylist closes it when revocation must be instant",
    ],
    redFlags: ["deleting the token in the browser revokes it", "changing the signing algorithm revokes tokens"],
    rubric: {
      criteria: [
        {
          name: "Problem",
          weight: 4,
          keywords: ["stateless", "until expiry", "exp", "cannot revoke", "signature only"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["server-side session", "short-lived", "refresh token", "revocation", "denylist", "session store"],
        },
      ],
    },
    modelAnswer:
      "A self-contained JWT checked only by its signature stays valid until its exp claim, so a suspended user's token, or any copy of it, keeps working for up to 12 hours; clearing it from one browser does nothing for copies elsewhere. Immediate revocation needs server-side state: either server-side sessions that can be deleted at once, or access tokens of a few minutes whose refresh is checked against a revocable session record. Short-lived tokens still leave a window of a few minutes, so where suspension must be truly instant the API also checks a denylist of revoked sessions or token IDs. Changing the signing algorithm has no effect on revocation, and JWTs do carry an expiry in the exp claim.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-senior-06",
    track: "fullstack",
    level: "senior",
    difficulty: 2,
    type: "coding",
    tags: ["async", "javascript", "performance"],
    prompt:
      "A server-side page loader needs the user and their orders (both required) and recommendations (optional: if that service fails, the page should render without them). The three calls are independent. Which implementation meets these requirements while running the calls concurrently?",
    options: [
      "`const [user, orders, recs] = await Promise.all([getUser(), getOrders(), getRecs()]);`",
      "`const [user, orders, recs] = await Promise.all([getUser(), getOrders(), getRecs().catch(() => null)]);`",
      "`const user = await getUser(); const orders = await getOrders(); const recs = await getRecs().catch(() => null);`",
      "`const [user, orders, recs] = await Promise.allSettled([getUser(), getOrders(), getRecs()]);`",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "start independent calls together to avoid a server-side waterfall",
      "Promise.all rejects as soon as any promise rejects",
      "catch the optional call on its own so it resolves to a fallback",
      "allSettled returns status objects and hides failures of required calls",
      "sequential awaits add the latencies together",
    ],
    redFlags: ["sequential awaits run in parallel", "allSettled results can be used as the data directly"],
    rubric: {
      criteria: [
        {
          name: "Concurrency",
          weight: 4,
          keywords: ["promise.all", "concurrent", "parallel", "waterfall", "latency"],
        },
        {
          name: "Failure handling",
          weight: 5,
          keywords: ["reject", "catch", "fallback", "allsettled", "status", "optional"],
        },
      ],
    },
    modelAnswer:
      "Promise.all starts all three calls at once, so the loader takes as long as the slowest call rather than the sum, and attaching `.catch(() => null)` to the optional call turns its failure into null while failures of the required calls still reject and reach the error handling. Plain Promise.all fails the whole page when recommendations fail, and the sequential version behaves correctly but adds the three latencies together. Promise.allSettled never rejects, so it yields `{ status, value }` objects rather than the data and silently lets a failed user or orders call through.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-07",
    track: "fullstack",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["database", "sql", "api", "performance"],
    prompt:
      "An infinite-scroll activity feed loads pages with `ORDER BY created_at DESC LIMIT 20 OFFSET :offset`. New items arrive every few seconds, users see the same items twice while scrolling, and deep pages are slow. What is the best fix?",
    options: [
      "Keep OFFSET but cache each page in Redis for an hour, so that repeated requests for the same page never reach the database",
      "Send the last item's `created_at` alone as the cursor, and load the next page with `WHERE created_at < :cursor LIMIT 20`",
      "Return the total row count with every page, so that the client can detect and drop any items it has already shown to the user",
      "Use keyset pagination on `(created_at, id)` with an opaque cursor, `WHERE (created_at, id) < (:ts, :id)` and a matching index",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "new rows shift OFFSET pages, causing duplicates or skipped items",
      "OFFSET reads and discards skipped rows, so deep pages are slow",
      "keyset (cursor) pagination on a stable, unique sort key",
      "tie-breaker column such as id",
      "composite index matching the sort order",
      "opaque cursor in the API contract",
    ],
    redFlags: ["a timestamp alone is a unique cursor", "caching fixes offset drift"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 4,
          keywords: ["offset", "inserts", "shift", "duplicates", "scan"],
        },
        {
          name: "Keyset design",
          weight: 5,
          keywords: ["keyset", "cursor", "tie-breaker", "composite index", "created_at", "id"],
        },
      ],
    },
    modelAnswer:
      "With OFFSET, every new item inserted at the top shifts the rows down, so the next page repeats items the user has already seen, and the database must read and discard all skipped rows, which makes deep pages slow. Keyset pagination remembers the last row's sort key and asks for rows strictly after it, using `(created_at, id)` so that ties are broken deterministically, with a matching index so each page is a short index range scan. A cursor on created_at alone skips or repeats rows that share a timestamp, and caching pages only makes the duplicates stale.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-08",
    track: "fullstack",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["database", "release strategies", "postgresql"],
    prompt:
      "You need to rename the `users.fullname` column to `display_name`. The app is deployed with rolling updates, so old and new versions serve traffic side by side for several minutes. How do you make the change without errors or downtime?",
    options: [
      "Add `display_name`, dual-write both columns, backfill, switch reads to it, then drop `fullname` in a later release",
      "Run `ALTER TABLE ... RENAME COLUMN` in a migration just before the rollout starts, since a rename is a fast metadata-only change",
      "Deploy the new code first and rename the column once the rollout completes, so that the migration never runs against old code",
      "Rename the column inside a transaction, so that old instances only see the change after they have been restarted by the rollout",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "old and new code run at the same time during a rolling deploy",
      "every schema state must work with both versions",
      "expand: add the new column, dual-write, backfill in batches",
      "switch reads, then stop writing the old column",
      "contract: drop the old column in a later release",
    ],
    redFlags: ["renaming before or after the deploy is safe", "a transaction hides a schema change from running code"],
    rubric: {
      criteria: [
        {
          name: "Compatibility",
          weight: 5,
          keywords: ["rolling", "old version", "new version", "backward compatible", "side by side"],
        },
        {
          name: "Migration steps",
          weight: 4,
          keywords: ["expand", "contract", "dual write", "backfill", "drop", "later release"],
        },
      ],
    },
    modelAnswer:
      "During a rolling deploy both versions query the same database, so every schema state must work with both. Expand and contract achieves that: add display_name, deploy code that writes both columns, backfill existing rows in batches, switch reads to the new column, stop writing the old one, and drop fullname in a later release. Renaming before the rollout breaks old instances that still select fullname, renaming afterwards breaks new instances until it runs, and a transaction only hides the change until it commits.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-09",
    track: "fullstack",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["caching", "cdn", "http"],
    prompt:
      "A CDN that honours `stale-while-revalidate` caches `GET /api/catalogue` with `Cache-Control: public, max-age=60, stale-while-revalidate=600`. A request arrives 300 seconds after the CDN last fetched the response from the origin. What happens?",
    options: [
      "The CDN treats its copy as expired and makes this client wait while it fetches a fresh response from the origin",
      "The CDN still treats its copy as fresh, because `stale-while-revalidate` extends the `max-age` lifetime to 600 seconds",
      "The CDN returns its stale copy immediately and fetches a fresh response from the origin in the background",
      "The CDN returns 504 Gateway Timeout until the origin responds, because the copy is older than both of the windows",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "fresh for max-age (60 seconds), then stale",
      "within the stale-while-revalidate window the stale copy is served at once",
      "revalidation with the origin happens asynchronously",
      "later requests get the refreshed copy",
      "after max-age plus the window, the cache must wait for the origin",
    ],
    redFlags: ["stale-while-revalidate replaces max-age", "a stale response is never served"],
    rubric: {
      criteria: [
        {
          name: "Semantics",
          weight: 5,
          keywords: ["max-age", "stale", "background", "revalidate", "window", "asynchronous"],
        },
        {
          name: "Trade-off",
          weight: 3,
          keywords: ["latency", "freshness", "origin load", "staleness"],
        },
      ],
    },
    modelAnswer:
      "The response is fresh for 60 seconds; for a further 600 seconds after that, a cache that supports stale-while-revalidate may serve the stale copy straight away while it revalidates with the origin in the background, so at 300 seconds this client gets an instant response and later clients get the refreshed one. Only after 660 seconds must the cache wait for the origin before responding. The directive does not extend freshness; it trades a short period of staleness for consistently low latency and smoother load on the origin.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-10",
    track: "fullstack",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["testing", "playwright"],
    prompt:
      "Your Playwright end-to-end suite runs in CI with parallel workers against a shared staging database. Tests pass on their own but fail randomly together, often because one test edits or deletes records that another relies on. What is the best fix?",
    options: [
      "Run the suite with a single worker in a fixed order, so that tests always see each other's changes in the same sequence",
      "Have each test create its own data via the API or a seeding helper, with unique IDs, in an environment the suite owns",
      "Add retries and longer timeouts to every test, so that temporary conflicts between parallel workers resolve themselves",
      "Restore the staging database from a nightly snapshot before each test file, so that every file starts from the same records",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "tests sharing mutable data become order-dependent",
      "each test arranges its own data, via the API or seeding rather than the UI",
      "unique identifiers per test or worker",
      "a dedicated, disposable environment for the suite",
      "retries hide real problems",
    ],
    redFlags: ["retries fix flaky tests", "running serially is the solution"],
    rubric: {
      criteria: [
        {
          name: "Isolation",
          weight: 5,
          keywords: ["own data", "unique", "isolated", "independent", "seed", "api"],
        },
        {
          name: "Environment",
          weight: 3,
          keywords: ["dedicated", "ephemeral", "parallel", "workers", "retries"],
        },
      ],
    },
    modelAnswer:
      "The failures come from shared mutable state: tests depend on records that other tests change. Each test should arrange its own data through the API or a seeding helper, use unique identifiers so parallel workers never collide, and run against an environment the suite owns, for example an ephemeral database per CI run. A single worker in a fixed order makes the suite slow and order-dependent, retries hide the underlying conflict, and restoring a shared snapshot wipes data that tests in other workers are still using.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-senior-11",
    track: "fullstack",
    level: "senior",
    difficulty: 3,
    type: "debugging",
    tags: ["tanstack query", "react", "caching"],
    prompt:
      'With this optimistic update, ticking a todo sometimes flips the checkbox back for a moment and then forward again, typically just after the tab has regained focus. What is the fix?\n\n```js\nconst toggle = useMutation({\n  mutationFn: (id) => api.toggleTodo(id),\n  onMutate: async (id) => {\n    const previous = queryClient.getQueryData(["todos"]);\n    queryClient.setQueryData(["todos"], (old) =>\n      old.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));\n    return { previous };\n  },\n  onError: (_err, _id, ctx) => queryClient.setQueryData(["todos"], ctx.previous),\n  onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),\n});\n```',
    options: [
      "Also call `invalidateQueries` inside `onMutate`, so that the list refetches straight away and already shows the new state",
      "Remove the `onSettled` handler, because the refetch it triggers after the mutation is what overwrites the optimistic value",
      "Return the updated list from `onMutate` instead of the previous one, so that `onError` restores the correct data",
      'Start `onMutate` with `await queryClient.cancelQueries({ queryKey: ["todos"] })`, so an in-flight refetch cannot overwrite it',
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "a background refetch (for example on window focus) started before the mutation",
      "its response carries the old server state and overwrites the optimistic cache entry",
      "cancel outgoing queries before setQueryData",
      "snapshot previous data for rollback in onError",
      "invalidate in onSettled to resync with the server",
    ],
    redFlags: ["remove the resync after the mutation", "refetch before the write has completed"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["in-flight", "refetch", "window focus", "race", "overwrite", "stale response"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["cancelqueries", "snapshot", "rollback", "onsettled", "invalidate"],
        },
      ],
    },
    modelAnswer:
      "When the tab regains focus, TanStack Query starts a background refetch of the todos; if that request left before the mutation reached the server, its response carries the old state and replaces the optimistic data, and then the onSettled invalidation fetches the new state, so the box flips back and forth. Awaiting `cancelQueries` for the key at the start of onMutate stops in-flight fetches before the optimistic write, which is the documented pattern alongside the snapshot, rollback and final invalidation. Removing onSettled would leave the cache out of sync with the server, and invalidating in onMutate fetches the old state before the write has happened.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-12",
    track: "fullstack",
    level: "senior",
    difficulty: 3,
    type: "debugging",
    tags: ["cors", "security", "express"],
    prompt:
      "To stop CORS errors in local development and preview deployments, a developer configures the API like this. The API authenticates browsers with a `SameSite=None; Secure` session cookie. What is the risk, and the fix?\n\n```js\napp.use(\n  cors({\n    origin: (origin, callback) => callback(null, true),\n    credentials: true,\n  })\n);\n```",
    options: [
      "It reflects and trusts every origin with credentials, so any site a signed-in user visits can read API responses; allowlist exact origins",
      'Browsers reject a reflected origin combined with credentials, so the setup is broken but harmless; use `origin: "*"` with credentials instead',
      "Only GET responses are exposed, because CORS always blocks credentialed cross-origin POST requests; add CSRF tokens to the GET routes",
      "The risk is limited to stale preflight results cached by browsers; set `maxAge: 0` so that every request is checked again by the API",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "returning true from the origin function reflects any Origin",
      "Access-Control-Allow-Credentials: true lets the page read credentialed responses",
      "SameSite=None means the cookie is sent on cross-site requests",
      "any website can read user data and act as the user",
      "allowlist exact origins per environment",
      "browsers reject the wildcard with credentials",
    ],
    redFlags: ["reflecting the origin is as safe as *", "CORS stops requests from being sent"],
    rubric: {
      criteria: [
        {
          name: "Risk",
          weight: 5,
          keywords: ["reflect", "any origin", "credentials", "read responses", "samesite=none", "cross-site"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["allowlist", "exact origins", "per environment", "wildcard", "configuration"],
        },
      ],
    },
    modelAnswer:
      "Returning true from the origin function makes the cors middleware echo whatever Origin the request carries, and with `credentials: true` the browser lets that page send the session cookie (which SameSite=None allows cross-site) and read the response. Any website a signed-in user visits can therefore read their data and act as them. The fix is an explicit allowlist of exact origins for each environment. Browsers refuse `*` for credentialed requests, which is exactly the safeguard that reflecting the origin bypasses.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-13",
    track: "fullstack",
    level: "senior",
    difficulty: 3,
    type: "theory",
    tags: ["security", "owasp", "web"],
    prompt:
      "Users can upload attachments, which the app serves from `https://app.example.com/files/<id>` with whatever Content-Type the browser reported at upload. An attacker uploads an HTML file and sends its link to an admin. Which changes stop such uploads from running script on the app's origin? Select all that apply.",
    options: [
      'Restrict the file picker with `accept="image/*"`, so that browsers only let users choose image files to upload',
      "Serve uploads from a separate, cookieless registrable domain, such as `example-usercontent.net`, instead of the app's origin",
      "Set the Content-Type on the server from the file's actual bytes, accept only raster image types, and send `X-Content-Type-Options: nosniff`",
      "Reject uploads whose file names do not end in .png, .jpg or .gif, while still serving the Content-Type the browser reported",
      "Send `Content-Disposition: attachment` for every type that is not on a short inline allowlist, such as PNG and JPEG",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "a client-chosen Content-Type lets HTML render as a page on the app's origin",
      "isolate user content on a separate registrable domain without cookies",
      "server-side type detection with an allowlist, plus nosniff",
      "Content-Disposition: attachment for anything not safe to render inline",
      "the accept attribute and file-name checks are easily bypassed",
    ],
    redFlags: ["client-side file type checks are a security control", "a file extension proves the file type"],
    rubric: {
      criteria: [
        {
          name: "Isolation",
          weight: 4,
          keywords: ["separate domain", "sandbox domain", "cookieless", "origin", "usercontent"],
        },
        {
          name: "Content handling",
          weight: 5,
          keywords: ["content-type", "allowlist", "nosniff", "content-disposition", "attachment", "magic bytes"],
        },
      ],
    },
    modelAnswer:
      "The attack works because the file is served from the app's own origin with an attacker-chosen Content-Type, so the browser renders the HTML and its script runs with the app's privileges. Serving uploads from a separate cookieless domain confines any script to an origin with nothing to steal; setting the type on the server from the real bytes with an allowlist and nosniff stops HTML being served as HTML; and Content-Disposition: attachment makes the browser download, rather than render, anything not on the inline list. The accept attribute is only a hint to the file picker that a direct request ignores, and a file-name check does nothing while the reported Content-Type is still served.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-14",
    track: "fullstack",
    level: "senior",
    difficulty: 3,
    type: "theory",
    tags: ["api versioning", "release strategies", "api"],
    prompt:
      "Your SPA is served from a CDN and its API runs on Kubernetes. Each deploys independently several times a day, and many users keep a tab open for days. Which practices keep old and new clients working across API changes? Select all that apply.",
    options: [
      "Make API changes additive, for example adding a new field alongside the old one rather than renaming or retyping it in place",
      "Deploy the SPA and the API in the same pipeline step, so that the client and server versions always change at the same moment",
      "Have clients ignore response fields they do not recognise, and have the API accept requests that omit new optional fields",
      "Serve the JavaScript bundles with `Cache-Control: no-store`, so that every user is always running the latest client code",
      "Send the client build version in a request header, and remove an old field only once telemetry shows no client still uses it",
    ],
    correctOptionIndex: 2,
    correctOptionIndices: [0, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "version skew: old clients keep running after a deploy",
      "backward-compatible, additive API changes (expand and contract)",
      "tolerant readers on both sides",
      "track client versions and deprecate based on data",
      "optionally prompt long-lived tabs to reload when a newer build exists",
    ],
    redFlags: ["deploying together makes the change atomic for users", "cache headers update code in tabs that are already open"],
    rubric: {
      criteria: [
        {
          name: "Compatibility",
          weight: 5,
          keywords: ["backward compatible", "additive", "tolerant reader", "optional fields", "expand and contract"],
        },
        {
          name: "Rollout control",
          weight: 3,
          keywords: ["client version", "telemetry", "deprecation", "reload prompt", "version skew"],
        },
      ],
    },
    modelAnswer:
      "A tab opened yesterday keeps running yesterday's JavaScript, so the API must serve several client versions at once. Additive changes, tolerant readers on both sides, and removing old fields only when telemetry from a client-version header shows they are unused keep every recent client working; many teams also prompt long-lived tabs to reload when they detect a newer build. Deploying both in one step cannot change code already loaded in open tabs (and the CDN and pods do not switch at the same instant anyway), and no-store on bundles only affects the next page load while making every visit slower.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-senior-15",
    track: "fullstack",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["next.js", "security", "react"],
    prompt:
      'In a Next.js App Router app, a project page shows a Delete button only to admins, and the button calls this Server Action. During a penetration test, a regular signed-in user deletes projects. Why is this possible, and what is the fix?\n\n```ts\n"use server";\n\nexport async function deleteProject(id: string) {\n  await db.project.delete({ where: { id } });\n  revalidatePath("/projects");\n}\n```',
    options: [
      "The page was served from a cache built for an admin, so its action ran with admin rights; render the page dynamically for each user",
      "A Server Action is a public POST endpoint anyone can call with their own arguments; check the session and permissions inside it",
      "The action has no CSRF token; adding one ensures that only the form rendered for the admin is able to invoke the action",
      'Next.js runs an action only from a component that rendered it, so the button must be missing its `"use client"` directive',
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "Server Actions are exposed as HTTP POST endpoints",
      "hiding a button is not access control",
      "authenticate and authorise inside every action",
      "validate the arguments and scope by ownership or role",
      "CSRF protection is not authorisation",
    ],
    redFlags: ["actions are private because they are server code", "hiding the button secures the action"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["public endpoint", "post", "direct call", "hidden button", "not access control"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["authorise", "session", "role check", "inside the action", "validate input", "data access layer"],
        },
      ],
    },
    modelAnswer:
      "A Server Action is compiled into an HTTP POST endpoint, and anyone who can reach the app can invoke it directly with arguments of their choosing; rendering the button only for admins is a UI decision, not access control. Each action must authenticate the caller, check that they may perform this operation on this object and validate its input, ideally through a shared data-access layer that applies the same rules everywhere. CSRF defences (Next.js already compares the Origin header for actions) only stop other sites triggering the action in a victim's browser; they do nothing about a signed-in user calling it themselves.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-16",
    track: "fullstack",
    level: "senior",
    difficulty: 4,
    type: "debugging",
    tags: ["node.js", "ssr vs csr", "security", "async"],
    prompt:
      "Pages call `getCurrentUser()` while rendering, after awaiting their data loaders. Under load, users occasionally see another person's name and account menu. Responses are sent with `Cache-Control: private, no-store`, and nothing caches them. What is the cause, and the fix?\n\n```js\n// auth.js — one Node.js process serves many requests\nlet currentUser = null;\n\nexport async function withUser(req, next) {\n  currentUser = await sessions.lookup(req.cookies.sid);\n  return next();\n}\n\nexport function getCurrentUser() {\n  return currentUser;\n}\n```",
    options: [
      "Node.js runs each request on its own thread, so the assignment needs a mutex to stop two threads from writing `currentUser` at once",
      "Session IDs are colliding between users; generate longer, cryptographically random IDs so that each lookup returns the right user",
      "The module variable is shared by all requests in the process, so another request overwrites it during an await; make it request-scoped",
      "Because the lookup is awaited, `next()` runs before it resolves; call it without `await` so that `currentUser` is set synchronously",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "module state lives for the whole process and is shared by all requests",
      "concurrent requests interleave at every await",
      "request B overwrites the value before request A renders",
      "request-scoped context: parameters, AsyncLocalStorage or the framework's per-request API",
      "this is a data-exposure bug, not just a rendering glitch",
    ],
    redFlags: ["Node.js runs each request on its own thread", "a lock fixes async interleaving of shared state"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["module scope", "shared", "concurrent", "await", "interleave", "overwrite"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["request-scoped", "asynclocalstorage", "context", "per request", "pass explicitly"],
        },
      ],
    },
    modelAnswer:
      "A module-level variable exists once per Node.js process, and the process interleaves many requests on one thread: while request A awaits its data loaders, request B runs withUser and overwrites currentUser, so A renders B's identity. The user must be request-scoped: pass it explicitly, keep it in an AsyncLocalStorage store set up per request, or use the framework's per-request context. Node.js does not give each request its own thread, so a mutex is beside the point, and the session lookup itself returns the right user; the shared variable is what leaks it.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-17",
    track: "fullstack",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["graphql", "security", "owasp"],
    prompt:
      'A GraphQL API checks ownership in its `myInvoices` resolver, which filters by the signed-in user. A security test still reads another customer\'s invoice in two ways: through the Relay-style `node(id: "SW52b2ljZToxMjQ=")` lookup, and as a nested field, `payment { invoice { total } }`. What is the most robust fix?',
    options: [
      "Enforce object-level authorisation in the data-access layer that every resolver uses to load an invoice, covering all paths",
      "Add the same ownership check to the `node` resolver and the `Payment.invoice` field resolver, the two paths the test found",
      "Encrypt global IDs with a server-side key, so that clients cannot construct IDs for invoices the API never sent them",
      "Disable introspection in production, so that attackers cannot discover the `node` field or the `invoice` field on payments",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "GraphQL offers many paths to the same object (node, nested fields, connections)",
      "checks in entry-point resolvers miss other paths",
      "enforce authorisation where objects are loaded (business or data-access layer)",
      "deny by default, with tests per type",
      "encrypted IDs and a hidden schema are not access control",
    ],
    redFlags: ["securing top-level queries is enough", "patching each reported resolver one by one", "obscure IDs or schemas as protection"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 4,
          keywords: ["idor", "object-level", "node", "nested", "multiple paths", "bola"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["data-access layer", "business layer", "authorisation", "per object", "deny by default"],
        },
      ],
    },
    modelAnswer:
      "This is broken object-level authorisation: the check lives in one entry-point resolver, but a GraphQL schema offers many routes to the same object, such as node lookups, nested fields and connections. Putting the ownership check in the shared layer that loads invoices, the business or data-access layer that every resolver (and any DataLoader) goes through, means every current and future path applies it. Patching the node and Payment.invoice resolvers closes the two paths the test found but leaves every other or future route to an invoice (another connection, another nested field) unchecked, and encrypted IDs or disabled introspection are obscurity, not access control.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-18",
    track: "fullstack",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["opentelemetry", "tracing", "web vitals", "performance"],
    prompt:
      "After a release, field data shows that p75 Largest Contentful Paint on the order history page rose from 1.8 s to 3.2 s for some users, while lab tests in CI are unchanged. The page is client-rendered and calls three APIs. Which approach most directly shows whether front-end work or a specific backend call caused the regression?",
    options: [
      "Run Lighthouse ten times per build in CI and compare the averages, which removes the noise that hides regressions in single lab runs",
      "Compare each API's average latency on the server dashboards before and after the release, and blame whichever of the averages went up",
      "Turn on verbose request logging in all three APIs and look for the slowest requests that were logged during the regression window",
      "Collect web vitals with attribution from real users, and send W3C `traceparent` from the browser so each fetch joins its backend trace",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "lab tests do not reproduce field conditions (devices, networks, data volumes)",
      "real-user monitoring with LCP attribution by phase and element",
      "browser instrumentation propagates traceparent on fetch",
      "front-end and backend spans join one trace per page view",
      "segment by release, device and region",
      "cross-origin APIs must allow the traceparent header in CORS",
    ],
    redFlags: ["averages reveal p75 regressions", "lab data alone explains a field regression"],
    rubric: {
      criteria: [
        {
          name: "Field measurement",
          weight: 4,
          keywords: ["rum", "real users", "field data", "p75", "attribution", "web vitals"],
        },
        {
          name: "End-to-end correlation",
          weight: 5,
          keywords: ["traceparent", "opentelemetry", "distributed tracing", "span", "correlation", "cors"],
        },
      ],
    },
    modelAnswer:
      "Only real-user data shows the regression, so the investigation must start in the field: collect LCP with attribution (which element, and how much time went to server response, resource loading and render delay), segmented by release and device. Propagating the W3C traceparent header from browser fetch instrumentation links each page view's API calls to their backend spans, so a slow page can be followed to the slow service or query; cross-origin APIs must allow that header in their CORS configuration. More lab runs cannot reproduce field conditions, server averages hide tail regressions and cannot be tied to page views, and uncorrelated logs cannot show which requests delayed LCP.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-19",
    track: "fullstack",
    level: "senior",
    difficulty: 4,
    type: "system-design",
    tags: ["system design", "background jobs", "queues", "security"],
    prompt:
      "Users upload photos straight from the browser to object storage using presigned URLs. Each photo must be malware-scanned and get thumbnails before it appears in the gallery, and the API must not trust anything the browser says about the file. Which design is most robust?",
    options: [
      "The API stores a pending record and presigns a short-lived, size- and type-limited URL for a key it picks; a storage event queues a worker that verifies, scans, thumbnails and marks it ready",
      "The browser uploads under a key built from the original file name, then calls `POST /photos` with that key, its size and MIME type, which the API saves and shows in the gallery at once",
      "The API presigns an upload URL for a key it picks; a storage event triggers a worker that scans the file, makes thumbnails with the decoder for the Content-Type stored with the object, and publishes it",
      "After uploading, the browser calls `POST /photos/:id/process`, and the API downloads, scans and resizes the file within that request before it sends any response to the browser",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the server chooses the object key and limits size, type and expiry",
      "pending, processing and ready states in the database",
      "a storage event on a queue triggers asynchronous processing",
      "the worker checks the real content, scans and creates thumbnails idempotently",
      "the client polls or is notified; failed jobs are retried or marked failed",
      "never trust client-reported metadata; the object's Content-Type comes from the upload request",
    ],
    redFlags: [
      "trusting client-provided file names or MIME types, including an object's stored Content-Type",
      "doing heavy processing inside the HTTP request",
    ],
    rubric: {
      criteria: [
        {
          name: "Upload control",
          weight: 4,
          keywords: ["presigned", "server-chosen key", "expiry", "size limit", "pending"],
        },
        {
          name: "Processing pipeline",
          weight: 5,
          keywords: ["event", "queue", "worker", "idempotent", "scan", "thumbnail", "retry"],
        },
      ],
    },
    modelAnswer:
      "The server should own every decision: it creates a pending record, chooses the object key and presigns a short-lived URL limited in size and content type, so the browser only transfers bytes. A storage event puts a job on a queue, and a worker checks the real content, scans it, generates thumbnails and marks the photo ready, idempotently so that duplicate events and retries are harmless, while the client polls or is notified. Trusting file names or MIME types from the browser lets attackers plant content, and that includes the Content-Type stored with the object, which is simply the header the upload request sent, so the worker must detect the type from the bytes. Processing inside an HTTP request ties slow work to timeouts and client retries.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-senior-20",
    track: "fullstack",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["security", "authentication", "web"],
    prompt:
      "The app at https://app.example.com relies only on its session cookie's `SameSite=Lax` attribute for CSRF protection. The community team now hosts user-written HTML pages at https://community.example.com. Is the app still protected against CSRF?",
    options: [
      "Yes: SameSite compares the full origin, including the host, so requests from community.example.com are cross-site and get no cookie",
      "No: both hosts are the same site (same scheme and registrable domain), so a page there can POST to the app with the cookie",
      "Yes, provided the API's CORS policy does not list community.example.com, because the browser will then not send the POST at all",
      "No, but only for GET requests, because Lax cookies are withheld from every POST that is sent from a different host",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "SameSite is based on the site (scheme plus registrable domain), not the origin",
      "sibling subdomains are same-site, so Lax and Strict cookies are sent",
      "a page on the community host can auto-submit a POST form",
      "CORS does not stop a simple form POST from being sent",
      "host untrusted content on a separate registrable domain",
      "add CSRF tokens or check Origin or Sec-Fetch-Site",
    ],
    redFlags: ["SameSite compares full origins", "CORS prevents CSRF"],
    rubric: {
      criteria: [
        {
          name: "Same-site semantics",
          weight: 5,
          keywords: ["same-site", "registrable domain", "etld+1", "subdomain", "origin", "lax"],
        },
        {
          name: "Mitigation",
          weight: 4,
          keywords: ["separate domain", "csrf token", "origin header", "sec-fetch-site", "defence in depth"],
        },
      ],
    },
    modelAnswer:
      "SameSite decisions use the site, meaning the scheme plus registrable domain, so https://community.example.com and https://app.example.com are the same site even though they are different origins. A user-written page there can auto-submit a form POST to the app, the browser attaches the Lax cookie, and CORS does not stop such a request from being sent. Untrusted content belongs on a separate registrable domain, and the app needs a real CSRF defence as well, such as tokens or rejecting state-changing requests whose Origin or Sec-Fetch-Site header shows they did not come from the app itself.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-21",
    track: "fullstack",
    level: "senior",
    difficulty: 5,
    type: "debugging",
    tags: ["security", "owasp", "ssr vs csr", "javascript"],
    prompt:
      'A security scan reports stored XSS on profile pages through the `bio` field, even though React renders the bio as escaped text. The server builds each page like this, where `appHtml` comes from React\'s server renderer and `state.profile.bio` is text the user typed. What is the bug, and the fix?\n\n```js\nconst html = `<!doctype html>\n<div id="root">${appHtml}</div>\n<script>\n  window.__STATE__ = ${JSON.stringify(state)};\n</script>\n<script src="/app.js" defer></script>`;\n```',
    options: [
      "`appHtml` is inserted without escaping; pass it through an HTML-escaping function before interpolating it into the template",
      'The bio breaks out of a JavaScript string because JSON.stringify leaves double quotes unescaped; escape `"` before embedding',
      "JSON.stringify leaves `<` unescaped, so a bio containing `</script>` ends the script element early; escape `<` as `\\u003c`",
      "Text inside a script element is inert until JavaScript parses it; the hole is that React skips escaping during server rendering",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the HTML parser ends a script element at the first </script, regardless of JavaScript strings",
      "JSON.stringify does not escape <, > or /",
      "escape < (or use a serialiser that does) before embedding",
      "or embed the JSON in a non-executable script type and parse it",
      "React's escaping covers rendered markup, not hand-built HTML",
      "a nonce-based CSP as defence in depth",
    ],
    redFlags: ["JSON.stringify output is safe inside HTML", "escaping React's output again fixes it"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["</script>", "html parser", "json.stringify", "breakout", "script element", "unescaped"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["u003c", "serialiser", "application/json", "escape", "csp", "nonce"],
        },
      ],
    },
    modelAnswer:
      'The HTML parser decides where a script element ends before any JavaScript runs, and it stops at the first `</script` it meets, even inside a JavaScript string. JSON.stringify escapes quotes and backslashes but not `<`, so a bio containing `</script><script>…` closes the state script and injects a new one. Escape `<` as `\\u003c` (or use a serialiser that does), or embed the JSON in a `<script type="application/json">` element and JSON.parse it; a nonce-based CSP adds defence in depth. React has already escaped appHtml, so escaping it again would only corrupt the markup.',
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-22",
    track: "fullstack",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["server-sent events", "redis pub/sub", "scaling", "system design"],
    prompt:
      "An app runs eight stateless API instances behind a load balancer, and you are adding in-app notifications pushed over Server-Sent Events. Any instance or background worker can create a notification, a user may have tabs connected to different instances, and users must not miss notifications during brief disconnects. Which design works?",
    options: [
      "Enable sticky sessions on the load balancer, so that each user's connections and all of their notifications are handled by one instance",
      "Publish each notification on a channel every instance subscribes to, and rely on EventSource's automatic reconnection to cover brief disconnects",
      "Store each notification with an increasing ID and replay after `Last-Event-ID`, with the instance that created it pushing it to the connections it holds",
      "Store each notification with an increasing ID, publish it on a channel every instance subscribes to, and replay after `Last-Event-ID`",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "connections are spread across instances; producers do not know where a user is connected",
      "pub/sub fan-out (for example Redis) to every instance, which pushes to its local connections",
      "a durable store with ordered IDs is the source of truth",
      "EventSource reconnects and sends Last-Event-ID; the server replays missed events",
      "heartbeats and proxy timeouts; HTTP/2 avoids per-host connection limits across tabs",
    ],
    redFlags: [
      "sticky sessions route events to users",
      "automatic reconnection recovers messages published during the gap",
      "only the instance that created a notification needs to push it",
    ],
    rubric: {
      criteria: [
        {
          name: "Fan-out",
          weight: 5,
          keywords: ["pub/sub", "redis", "subscribe", "fan-out", "local connections", "instances"],
        },
        {
          name: "Delivery guarantees",
          weight: 4,
          keywords: ["persist", "last-event-id", "replay", "reconnect", "ordered id", "heartbeat"],
        },
      ],
    },
    modelAnswer:
      "Connections are spread across instances and notifications are produced anywhere, so producers need a way to reach every instance: publishing to a pub/sub channel that all instances subscribe to lets each one push to the connections it holds for that user. Because pub/sub is fire-and-forget, each notification is first persisted with an increasing ID; EventSource reconnects automatically and sends Last-Event-ID, so the server can replay anything missed. Pub/sub on its own loses whatever is published while a tab is reconnecting, because reconnection cannot bring back a message nobody stored; persistence and replay on their own leave tabs on other instances, and every notification created by a background worker, waiting until the next reconnect; and sticky sessions only pin where a user's connections land, not where notifications are created. SSE itself works through load balancers given suitable timeouts and heartbeats.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-23",
    track: "fullstack",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["system design", "security", "api"],
    prompt:
      "An SPA's checkout redirects to a payment provider's hosted page, which redirects back to `/checkout/success?order=123` after payment. That page currently calls `POST /api/orders/123/mark-paid`. Which design should replace this?",
    options: [
      'Show "processing" and poll; the server marks the order paid only from a verified webhook or its own provider lookup, deduplicated by event ID',
      "Keep the endpoint, but have it mark the order paid only when the caller's session is valid and the order belongs to them, with the provider's webhooks as a backup",
      "Mark the order paid from the provider's webhook and process each event as it arrives, since providers deliver every event exactly once and in order",
      "Have the success page send the checkout session ID from the redirect URL, and mark the order paid if it matches the ID the API stored when it created that session",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the browser and the redirect are untrusted; anyone can call mark-paid",
      "payment state comes from the provider, server to server",
      "verify webhook signatures on the raw body",
      "webhooks are at-least-once and may arrive out of order: deduplicate and process idempotently",
      "the success page shows a pending state and polls",
      "periodic reconciliation catches missed webhooks",
    ],
    redFlags: [
      "the success redirect proves payment",
      "a checkout session ID echoed back by the browser proves payment",
      "webhooks are delivered exactly once",
    ],
    rubric: {
      criteria: [
        {
          name: "Trust boundary",
          weight: 5,
          keywords: ["untrusted client", "server-to-server", "webhook", "signature", "source of truth"],
        },
        {
          name: "Reliability",
          weight: 4,
          keywords: ["idempotent", "at-least-once", "event id", "out of order", "reconciliation", "pending"],
        },
      ],
    },
    modelAnswer:
      "Anything the browser does is under the user's control, so a user can call mark-paid, or open the success URL, without paying; payment state must come from the provider over a server-to-server channel. The server marks the order paid only on a signature-verified webhook or its own lookup of the payment, records processed event IDs so that redelivered or out-of-order events are harmless, and runs a periodic reconciliation for missed webhooks, while the success page shows a pending state and polls the order. Providers deliver webhooks at least once, not exactly once, and a checkout session ID that matches the stored one proves nothing about payment: the session and its ID exist before the customer pays, and the ID is typically visible in the hosted page's URL.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-senior-24",
    track: "fullstack",
    level: "senior",
    difficulty: 5,
    type: "coding",
    tags: ["javascript", "security", "node.js"],
    prompt:
      '`PATCH /api/prefs` runs `merge(user.prefs, JSON.parse(rawBody))` with the function below. Admin-only routes check `if (user.isAdmin)`, and that property is set only on admins\' user objects. Which request body makes every user pass that check until the process restarts?\n\n```js\nfunction merge(target, source) {\n  for (const key in source) {\n    const value = source[key];\n    if (value && typeof value === "object") {\n      target[key] = merge(target[key] ?? {}, value);\n    } else {\n      target[key] = value;\n    }\n  }\n  return target;\n}\n```',
    options: [
      '`{ "prefs": { "isAdmin": true } }`',
      '`{ "constructor": { "isAdmin": true } }`',
      '`{ "isAdmin": true }`',
      '`{ "__proto__": { "isAdmin": true } }`',
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "JSON.parse creates an own property named __proto__",
      "for...in visits it, and target[\"__proto__\"] returns Object.prototype",
      "the merge writes isAdmin onto Object.prototype, which every object inherits",
      "a one-level constructor key only touches the Object function, not the prototype",
      "fix: validate against a schema, skip __proto__/constructor/prototype keys, or use null-prototype objects or a Map",
    ],
    redFlags: ["JSON.parse strips __proto__", "only the prefs object can be affected"],
    rubric: {
      criteria: [
        {
          name: "Mechanism",
          weight: 5,
          keywords: ["prototype pollution", "__proto__", "object.prototype", "inherited", "json.parse", "for...in"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["block keys", "schema validation", "allowlist", "object.create(null)", "map", "hasown"],
        },
      ],
    },
    modelAnswer:
      'JSON.parse turns `"__proto__"` into an ordinary own property, so for...in visits it, and `target["__proto__"]` on a normal object returns Object.prototype; the recursive merge then writes isAdmin onto Object.prototype, and every object without its own isAdmin, including every non-admin user, inherits true. A one-level `constructor` key only adds a property to the Object function itself, and the other bodies merely change the user\'s prefs. Fix it by validating the body against a schema of allowed keys, skipping `__proto__`, `constructor` and `prototype` when merging, or using null-prototype objects or a Map.',
    followUpIds: [],
  },
];
