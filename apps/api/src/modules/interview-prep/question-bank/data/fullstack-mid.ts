import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ───────────────────────────────────────────────────────
  {
    id: "qb-fullstack-mid-01",
    track: "fullstack",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["security", "api", "best-practices"],
    prompt:
      "A React sign-up form checks its fields against a validation schema before it calls POST /api/signup, and shows errors as the user types. A teammate suggests removing the same checks from the API to avoid duplicating them. What is the right response?",
    options: [
      "Remove them: browsers only send requests to the API that come from the form's submit handler, so it never sees unvalidated data",
      "Remove them, and restrict CORS to the app's origin, so that only the validated form is able to call the POST /api/signup endpoint",
      "Keep them: anyone can call the API directly, so the server is the authority and client checks are for feedback; share one schema",
      "Keep them only in development builds, because minified production bundles stop users from changing the client-side checks",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "client-side validation is for user experience only",
      "requests can be sent without the UI (curl, scripts, a modified bundle)",
      "the server validates every request as the source of truth",
      "share one schema between client and server to avoid drift",
      "CORS does not stop non-browser clients",
    ],
    redFlags: ["CORS protects the API from direct calls", "client-side validation is a security control"],
    rubric: {
      criteria: [
        { name: "Trust boundary", weight: 5, keywords: ["server", "authority", "bypass", "curl", "untrusted", "trust boundary"] },
        { name: "Shared validation", weight: 3, keywords: ["shared schema", "single source", "duplication", "user feedback", "zod"] },
      ],
    },
    modelAnswer:
      "Anything running in the browser is under the user's control: requests can be replayed with curl, sent from a script or made from a modified bundle, so the API must validate every request as the source of truth. Client-side checks exist to give fast feedback, not to protect data. Duplication is avoided by defining the schema once in a shared package and running it on both sides. CORS only controls which web pages may read responses in a browser; it does nothing to stop another client calling the endpoint.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-02",
    track: "fullstack",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["graphql", "rest", "caching"],
    prompt:
      "A team is moving the API behind its web and mobile apps from REST to GraphQL. Which trade-off should they expect?",
    options: [
      "Clients fetch exactly the fields they need in one request, but URL-based HTTP caching is harder as queries usually POST to one endpoint",
      "N+1 queries go away because each query compiles to one SQL statement, but every schema change now needs a new versioned endpoint",
      "Field-level authorisation is no longer needed as the schema hides other fields, but every client must download the full schema first",
      "Payloads shrink as GraphQL swaps JSON for a compact binary format, but a response can no longer return partial data with errors",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "clients choose the fields they need (less over- and under-fetching)",
      "nested data in one round trip",
      "a single POST endpoint makes CDN and browser HTTP caching harder",
      "client-side normalised caches or persisted queries",
      "resolvers can still cause N+1 queries (DataLoader)",
      "authorisation is still needed per field or resolver",
    ],
    redFlags: ["GraphQL removes N+1 queries automatically", "the schema replaces authorisation", "GraphQL uses a binary wire format"],
    rubric: {
      criteria: [
        { name: "Benefits", weight: 4, keywords: ["fields", "over-fetching", "under-fetching", "single request", "typed schema"] },
        { name: "Costs", weight: 5, keywords: ["http caching", "cdn", "post", "single endpoint", "persisted queries", "n+1", "dataloader"] },
      ],
    },
    modelAnswer:
      "GraphQL lets each client ask for exactly the shape it needs, so one request can replace several REST calls and avoid over-fetching. The cost is that queries usually go to a single endpoint, often as POST, so the URL-based HTTP caching that CDNs and browsers apply to REST GETs no longer works out of the box; teams rely on client-side normalised caches or persisted queries sent as GETs. Resolvers still cause N+1 queries unless they are batched (for example with DataLoader), and authorisation still has to be enforced per field or resolver. Schemas usually evolve by adding fields and deprecating old ones rather than versioning URLs, clients can send queries without downloading the schema, and responses are ordinary JSON that can carry partial data alongside an errors array.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-03",
    track: "fullstack",
    level: "mid",
    difficulty: 1,
    type: "coding",
    tags: ["async", "performance", "javascript"],
    prompt:
      "A server-side loader for an account page makes three independent API calls, and the page waits for the sum of their latencies. Which replacement for the three await lines returns the same data fastest?\n\n    export async function loader({ userId }) {\n      const profile = await getProfile(userId);\n      const orders = await getOrders(userId);\n      const settings = await getSettings(userId);\n      return { profile, orders, settings };\n    }",
    options: [
      "const [profile, orders, settings] = [await getProfile(userId), await getOrders(userId), await getSettings(userId)];",
      "const [profile, orders, settings] = await Promise.all([await getProfile(userId), await getOrders(userId), await getSettings(userId)]);",
      "const [profile, orders, settings] = await Promise.all([getProfile, getOrders, getSettings]);",
      "const [profile, orders, settings] = await Promise.all([getProfile(userId), getOrders(userId), getSettings(userId)]);",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "each await waits for the previous call to finish",
      "start independent requests before awaiting them",
      "total time becomes roughly that of the slowest call",
      "Promise.all rejects as soon as one call fails",
      "await expressions inside an array literal still run one after another",
    ],
    redFlags: ["putting awaits in an array makes them parallel", "Promise.all calls the functions it is given"],
    rubric: {
      criteria: [
        { name: "Concurrency", weight: 5, keywords: ["promise.all", "concurrent", "parallel", "independent", "slowest call"] },
        { name: "Await semantics", weight: 3, keywords: ["sequential", "await", "waterfall", "left to right"] },
      ],
    },
    modelAnswer:
      "Each `await` pauses the loader until that call settles, so the three independent requests run one after another and their latencies add up. Calling all three functions first and awaiting `Promise.all` on the resulting promises lets them run concurrently, so the loader takes roughly as long as the slowest call (and rejects as soon as one fails). An array literal of `await` expressions is still evaluated left to right, one call at a time, whether or not it is then passed to `Promise.all`, and passing the functions themselves just resolves to the functions without calling them.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-04",
    track: "fullstack",
    level: "mid",
    difficulty: 1,
    type: "debugging",
    tags: ["ssr vs csr", "react", "browser apis"],
    prompt:
      "This component worked in a client-only React app. After the app moved to server-side rendering, the server throws `ReferenceError: localStorage is not defined`. What is the right fix?\n\n    function ThemeToggle() {\n      const [theme, setTheme] = useState(\n        localStorage.getItem(\"theme\") ?? \"light\"\n      );\n      // ...\n    }",
    options: [
      "Add \"use client\" at the top of the file, which tells the framework to skip this component while rendering on the server",
      "Start from a default on the server and read localStorage in a useEffect, which only runs in the browser after hydration",
      "Read the value from sessionStorage instead, which the server can access because it is scoped to the current request",
      "Move the localStorage call out of useState into the component body, so that it runs after the first server render",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "browser-only APIs do not exist on the server",
      "the component body and useState initialisers run during server rendering",
      "useEffect runs only on the client, after hydration",
      "render the same default on both sides to avoid a hydration mismatch",
      "a cookie lets the server render the right theme without a flash",
    ],
    redFlags: ["\"use client\" components are not server-rendered", "typeof window checks during render are always safe"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["server", "node", "localstorage", "browser-only", "window"] },
        { name: "Fix", weight: 4, keywords: ["useeffect", "hydration", "default", "mismatch", "cookie"] },
      ],
    },
    modelAnswer:
      "During server rendering the component body, including the useState initialiser, runs in Node, where browser APIs such as localStorage do not exist. Render a default on the server and read localStorage in a useEffect, which only runs in the browser after hydration, then update the state; storing the theme in a cookie instead lets the server render the right theme with no flash. A \"use client\" directive does not help, because Client Components are still pre-rendered on the server, and sessionStorage is a browser API too.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-05",
    track: "fullstack",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["performance", "tracing", "opentelemetry"],
    prompt:
      "Users say the orders page is slow. In the browser's network panel, GET /api/orders, which returns the signed-in user's orders, spends 2.4 s in \"Waiting for server response\" (time to first byte) and 30 ms downloading. What is the most useful next step?",
    options: [
      "Split the frontend bundle into smaller chunks, so that the browser can parse the orders page's JavaScript sooner",
      "Put the orders endpoint behind a CDN, so that the 2.4 s response is cached at an edge location close to each user",
      "Trace the request on the server, timing its database queries and downstream calls, to find what takes the 2.4 s",
      "Enable gzip or Brotli compression on the API, so that the JSON response travels to the browser in fewer bytes",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "time to first byte is spent on the server (plus the network round trip)",
      "measure before optimising",
      "server-side tracing or timing around queries and downstream calls",
      "Server-Timing header or APM spans",
      "bundle and compression changes do not touch server time",
    ],
    redFlags: ["optimise the frontend bundle for a slow API response", "cache per-user responses on a CDN"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 5, keywords: ["ttfb", "server", "waiting", "measure", "bottleneck"] },
        { name: "Tools", weight: 3, keywords: ["tracing", "spans", "server-timing", "opentelemetry", "query time", "logs"] },
      ],
    },
    modelAnswer:
      "Time to first byte covers the round trip plus the server's work before it sends anything, and with only 30 ms of download the 2.4 s is almost all server-side. The next step is to measure where it goes: tracing spans (for example with OpenTelemetry) or a Server-Timing header around the database queries and downstream calls show whether a slow query, an N+1 pattern or a slow dependency dominates. Bundle splitting and compression affect download and parse time, which is not the problem here, and a CDN cannot safely cache a per-user list of orders.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ───────────────────────────────────────────────────────
  {
    id: "qb-fullstack-mid-06",
    track: "fullstack",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["cors", "authentication", "http"],
    prompt:
      "The SPA on https://app.example.com signs in through https://api.example.com, which replies with a session cookie (HttpOnly; Secure; SameSite=Lax). Every call, including the login, is made as below, and GET /me always returns 401. What is the fix?\n\n    const res = await fetch(\"https://api.example.com/me\", {\n      headers: { Accept: \"application/json\" },\n    });",
    options: [
      "Set SameSite=None on the cookie, because app.example.com and api.example.com count as two different sites",
      "Drop HttpOnly so that the SPA can read the session cookie and copy it into a Cookie header on every API request",
      "Add mode: \"cors\" to every request, so that the browser attaches the API's cookies to cross-origin calls",
      "Use credentials: \"include\", with the API sending Allow-Credentials: true and the exact app origin in Allow-Origin",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "fetch defaults to credentials: \"same-origin\"",
      "cross-origin requests omit cookies and ignore Set-Cookie unless credentials are included",
      "Access-Control-Allow-Credentials: true on the API",
      "Access-Control-Allow-Origin must name the exact origin, not *",
      "subdomains of one registrable domain are the same site",
    ],
    redFlags: ["make the session cookie readable by JavaScript", "SameSite=None is required between subdomains"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["credentials", "same-origin", "cross-origin", "cookie not sent", "set-cookie ignored"] },
        { name: "Fix", weight: 4, keywords: ["include", "access-control-allow-credentials", "allow-origin", "wildcard", "exact origin"] },
      ],
    },
    modelAnswer:
      "fetch defaults to `credentials: \"same-origin\"`, and the API is a different origin, so the browser neither sends cookies to it nor stores the Set-Cookie from the login response. Passing `credentials: \"include\"` fixes the client side, and the API must answer with `Access-Control-Allow-Credentials: true` and the exact origin in Access-Control-Allow-Origin, since a `*` wildcard is rejected for credentialed requests. The two subdomains share the registrable domain example.com, so they are the same site and SameSite=Lax is not the problem; mode \"cors\" is already the default for cross-origin fetches.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-07",
    track: "fullstack",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["tanstack query", "react", "caching"],
    prompt:
      "Clicking \"Next\" increases `page`, but this table keeps showing the first page of orders. What is the fix?\n\n    function OrdersTable({ page }) {\n      const { data } = useQuery({\n        queryKey: [\"orders\"],\n        queryFn: () => fetchOrders(page),\n      });\n      return <Table rows={data?.items ?? []} />;\n    }",
    options: [
      "Set staleTime: 0, so that the query treats its data as stale and refetches every time the component renders",
      "Add page to the key, as queryKey: [\"orders\", page], because the key identifies the cached data a query reads",
      "Wrap the queryFn in useCallback with [page] as its dependencies, so that the query notices the new function",
      "Pass the call itself as queryFn: fetchOrders(page), so that a new request starts whenever the page prop changes",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the query key identifies the cache entry",
      "every variable the query function uses belongs in the key",
      "a key change fetches and caches each page separately",
      "a new queryFn closure alone does not trigger a refetch",
      "placeholderData can keep the previous page visible while loading",
    ],
    redFlags: ["re-renders trigger refetches", "queryFn identity is tracked like an effect dependency"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["query key", "cache entry", "same key", "closure", "dependencies"] },
        { name: "Fix", weight: 4, keywords: ["querykey", "page in the key", "refetch", "placeholderdata", "separate cache"] },
      ],
    },
    modelAnswer:
      "TanStack Query stores and looks up data by query key, and it fetches when the key changes, not when the component re-renders with a new queryFn closure. With the key fixed at [\"orders\"], every page shares one cache entry, so the table keeps showing page 1. Including every variable the query function depends on, as [\"orders\", page], gives each page its own entry and fetches it when page changes (placeholderData can keep the previous page on screen meanwhile). staleTime: 0 is already the default and does not make renders refetch.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-08",
    track: "fullstack",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["api", "http", "rest"],
    prompt:
      "A booking form posts to a JSON API, which rejects the request because the end date is before the start date and the postcode is malformed. Which response lets the form show each error beside the right field, and also suits other API clients?",
    options: [
      "422 or 400, with a structured body that lists each failing field by its path, with a machine-readable code and a message",
      "200 OK with { success: false, message: \"Invalid booking\" }, so that clients never need to handle HTTP error statuses",
      "500 with the validation library's exception message as plain text, so that the form can show the user exactly what went wrong",
      "302 back to the form page with the error messages in the query string, so that the browser can redisplay them",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "a 4xx status because the client sent invalid data",
      "errors keyed by field path so the form can map them",
      "machine-readable codes as well as messages",
      "one consistent error format, such as RFC 9457 problem details",
      "client-side checks stay, but the server's errors are authoritative",
    ],
    redFlags: ["return 200 for failed requests", "use 500 for invalid input"],
    rubric: {
      criteria: [
        { name: "Status", weight: 4, keywords: ["422", "400", "client error", "4xx"] },
        { name: "Body", weight: 5, keywords: ["field", "path", "code", "message", "problem details", "structured"] },
      ],
    },
    modelAnswer:
      "Invalid input is a client error, so a 4xx status (400 or 422) lets every client, and monitoring, recognise the failure without parsing the body. A structured body that lists each problem with a field path (such as `endDate` or `address.postcode`), a stable code and a message lets the form attach errors to inputs and translate them; a standard shape such as RFC 9457 problem details keeps this consistent across endpoints. A 200 with a success flag hides failures from HTTP tooling, a 500 signals a server bug, and a redirect suits server-rendered HTML forms rather than a JSON API.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-09",
    track: "fullstack",
    level: "mid",
    difficulty: 2,
    type: "system-design",
    tags: ["database", "sql", "system design"],
    prompt:
      "Users can like a post once and unlike it later. Each post shows its like count and whether the current user has liked it. Which relational model fits best?",
    options: [
      "A likes JSON array of user ids on each post row, updated by reading the array, changing it in the app and writing it back",
      "Only a like_count column on posts, which the client increments or decrements and sends to the API as the new total",
      "A post_likes table with primary key (post_id, user_id) and foreign keys, so the database itself rejects a duplicate like",
      "A likes table with its own auto-increment id plus post_id and user_id, relying on the UI to disable the button once clicked",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a join table between users and posts",
      "a composite primary key or unique constraint prevents duplicate likes",
      "foreign keys with cascading deletes",
      "count via the index on post_id, or a counter updated in the same transaction",
      "read-modify-write of arrays or totals loses concurrent updates",
    ],
    redFlags: ["the UI can enforce uniqueness", "trust counts sent by the client"],
    rubric: {
      criteria: [
        { name: "Model", weight: 5, keywords: ["join table", "composite key", "unique", "foreign key", "post_likes"] },
        { name: "Integrity", weight: 4, keywords: ["duplicate", "race", "lost update", "transaction", "counter", "index"] },
      ],
    },
    modelAnswer:
      "Likes are a many-to-many relationship between users and posts, so a post_likes join table with (post_id, user_id) as its primary key lets the database reject a second like even from a double click or two tabs, and the foreign keys keep it consistent when users or posts are deleted. \"Has the current user liked it?\" is a primary-key lookup, and the count is a COUNT using the key's leading post_id column, or a counter column updated in the same transaction as the insert or delete. A JSON array or a client-supplied total loses updates when two users like at once, and a button that disables itself cannot stop duplicate requests.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-10",
    track: "fullstack",
    level: "mid",
    difficulty: 2,
    type: "behavioral",
    tags: ["behavioral", "security", "api", "communication"],
    prompt:
      "The day before a release, you notice that the endpoint behind your new team-members page returns each member's full user record, including email address, password hash and MFA settings. The page only displays names and avatars. The product manager wants to ship on schedule. What do you do?",
    options: [
      "Ship as planned and add a ticket for next sprint, since the page never displays the sensitive fields to anyone",
      "Raise it as a release blocker, make the API return only the fields the page needs, then re-test and ship",
      "Filter the sensitive fields out in the React component before rendering, so that they never appear on screen",
      "Rename the sensitive fields in the JSON to short codes, so that they are much harder to spot in the network tab",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "everything an API returns is visible to the client",
      "leaking password hashes and personal data is a release blocker",
      "return an explicit allowlist of fields (response DTO or select)",
      "explain the risk and the small size of the fix to the product manager",
      "add a test so the leak cannot regress",
    ],
    redFlags: ["hiding data in the UI protects it", "obfuscation is a security measure"],
    rubric: {
      criteria: [
        { name: "Judgement", weight: 5, keywords: ["blocker", "security", "risk", "data exposure", "do not ship"] },
        { name: "Fix and communication", weight: 4, keywords: ["allowlist", "dto", "select fields", "product manager", "test", "explain"] },
      ],
    },
    modelAnswer:
      "Anything an API returns can be read by whoever calls it or opens the browser's network tab, so this is a live data leak, not a cosmetic issue. Raise it as a blocker, explain the risk and the small size of the fix to the product manager, and change the endpoint to return an explicit allowlist of fields (a response DTO or a select), with a test so it cannot regress. Filtering in the component or renaming fields leaves the data in the response, and shipping first exposes every member's details from day one.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ───────────────────────────────────────────────────────
  {
    id: "qb-fullstack-mid-11",
    track: "fullstack",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["vite", "12-factor app", "devops"],
    prompt:
      "A Vite React app reads its API base URL from `import.meta.env.VITE_API_URL`. The team builds one Docker image and promotes it from staging to production, setting VITE_API_URL differently in each environment's container. Production still calls the staging API. Why, and what is the fix?",
    options: [
      "Browsers cache environment variables for each domain, so production users have to clear site data after each promotion",
      "Container environment variables only apply after a restart, so the production pods must be restarted after each promotion",
      "The static file server resolves import.meta.env per request, but only exposes variables listed in its config file",
      "Vite inlines VITE_ values into the bundle at build time; build per environment or load config from the server at runtime",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "import.meta.env values are replaced with literals at build time",
      "the bundle is static files, so container environment variables never reach it",
      "serve runtime configuration (for example /config.json) from the server",
      "or build a separate bundle per environment",
      "never put secrets in VITE_ variables",
    ],
    redFlags: ["the browser reads the server's environment variables", "VITE_ variables are safe for secrets"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["build time", "inlined", "static", "bundle", "replaced"] },
        { name: "Fix", weight: 4, keywords: ["runtime config", "config.json", "per environment", "build once", "promote", "secrets"] },
      ],
    },
    modelAnswer:
      "Vite statically replaces `import.meta.env.VITE_*` references with their values when the bundle is built, so the image contains JavaScript with the staging URL baked in, and environment variables on the container that serves those files never reach the browser. To promote one artefact, serve runtime configuration instead, for example a /config.json or an inline script generated by the server at start-up, which the app loads before calling the API; otherwise build a separate bundle per environment. Because the values end up in public JavaScript, VITE_ variables must never hold secrets.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-12",
    track: "fullstack",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["security", "owasp", "authentication"],
    prompt:
      "An SPA and its API are served from the same site and authenticate with a session cookie. Which measures help stop cross-site request forgery (CSRF) against the API's state-changing endpoints? Select all that apply.",
    options: [
      "Marking the session cookie HttpOnly, so that JavaScript is unable to read its value",
      "Setting SameSite=Lax or Strict on the session cookie, and keeping GET requests free of side effects",
      "Requiring a CSRF token or a custom request header on state-changing requests and checking it on the server",
      "Restricting Access-Control-Allow-Origin to the SPA's origin, so that other sites cannot send requests",
      "Rejecting state-changing requests whose Origin or Sec-Fetch-Site header shows they came from another site",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "CSRF relies on the browser attaching cookies automatically",
      "SameSite keeps the cookie off cross-site requests",
      "tokens or custom headers that another site cannot produce",
      "Origin or Fetch Metadata checks",
      "CORS controls reading responses, not sending requests",
      "HttpOnly defends against cookie theft via XSS, not CSRF",
    ],
    redFlags: ["CORS prevents CSRF", "HttpOnly prevents CSRF"],
    rubric: {
      criteria: [
        { name: "Mechanism", weight: 3, keywords: ["cookies sent automatically", "cross-site", "forged request", "browser"] },
        { name: "Defences", weight: 5, keywords: ["samesite", "csrf token", "custom header", "origin", "sec-fetch-site", "preflight"] },
        { name: "Misconceptions", weight: 2, keywords: ["cors", "httponly", "reading responses", "xss"] },
      ],
    },
    modelAnswer:
      "CSRF works because the browser attaches cookies to requests that another site triggers, so defences either keep the cookie off cross-site requests or require proof that the request came from your own pages. SameSite=Lax or Strict stops the cookie being sent on cross-site POSTs (as long as GETs never change state), a CSRF token or custom header cannot be produced by a cross-site form or by a fetch whose preflight the API refuses, and Origin or Sec-Fetch-Site checks reject requests from other sites outright. HttpOnly only stops JavaScript reading the cookie, which a CSRF attack never needs to do, and CORS decides who may read responses, not whether a simple cross-site request is sent.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-13",
    track: "fullstack",
    level: "mid",
    difficulty: 3,
    type: "coding",
    tags: ["sql", "security", "postgresql"],
    prompt:
      "A product search endpoint uses node-postgres, and `q` comes straight from the query string. Which implementation is safe from SQL injection?",
    options: [
      "db.query(`SELECT id, name FROM products WHERE name ILIKE '%${q}%'`)",
      "db.query(\"SELECT id, name FROM products WHERE name ILIKE '%\" + encodeURIComponent(q) + \"%'\")",
      "db.query(\"SELECT id, name FROM products WHERE name ILIKE $1\", [`%${q}%`])",
      "db.query(`SELECT id, name FROM products WHERE name ILIKE '%${JSON.stringify(q).slice(1, -1)}%'`)",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a placeholder sends the value separately from the SQL text",
      "the database never parses user input as SQL",
      "building SQL strings with ad hoc encoding is unsafe",
      "encodeURIComponent and JSON.stringify leave single quotes unescaped",
      "LIKE wildcards in the input are a separate, non-injection concern",
    ],
    redFlags: ["encodeURIComponent or JSON.stringify make input safe for SQL", "any template literal is parameterised"],
    rubric: {
      criteria: [
        { name: "Parameterisation", weight: 5, keywords: ["$1", "placeholder", "bind parameter", "parameterised", "separate from sql"] },
        { name: "Why the others fail", weight: 3, keywords: ["single quote", "string concatenation", "template literal", "encoding", "escape"] },
      ],
    },
    modelAnswer:
      "With a `$1` placeholder and a values array, node-postgres sends the SQL text and the value separately, so the database never parses the user's input as SQL whatever characters it contains; the `%` wildcards are simply part of the value. The other versions all build SQL text from the input: a template literal passed to an ordinary function is plain string interpolation, and neither encodeURIComponent nor JSON.stringify escapes a single quote, so an input such as `'or(true)--` closes the string literal and rewrites the WHERE clause. A `%` or `_` typed by the user only widens the search and can be escaped separately; it is not an injection.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-14",
    track: "fullstack",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["testing", "integration testing"],
    prompt:
      "A new feature adds a sign-up form with client-side validation, a POST /signup endpoint that validates input and relies on a unique index on users.email, and a redirect to a welcome page. Which test plan gives the most confidence for its cost?",
    options: [
      "Component tests for the form with the network mocked, API integration tests against a real database, and one end-to-end happy path",
      "End-to-end browser tests for every validation rule and error message, because only they exercise the real frontend and backend together",
      "Only unit tests, with fetch and the ORM mocked everywhere, including a stubbed duplicate-key error for the unique-email rule",
      "Snapshot tests of the rendered form, plus manual checks of the API in the staging environment before each release",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "test each rule at the lowest layer that can prove it",
      "component tests with the network mocked (for example MSW) for form behaviour",
      "API integration tests against a real database for validation and the unique constraint",
      "a small number of end-to-end tests for the critical path",
      "a mocked ORM cannot prove the constraint exists",
    ],
    redFlags: ["end-to-end tests for every rule", "mocks prove database constraints"],
    rubric: {
      criteria: [
        { name: "Layering", weight: 5, keywords: ["component test", "integration test", "end-to-end", "test pyramid", "layer"] },
        { name: "Realism", weight: 4, keywords: ["real database", "container", "unique constraint", "msw", "mock", "flaky"] },
      ],
    },
    modelAnswer:
      "Each behaviour is best tested at the lowest layer that can actually prove it. Form validation and error display are quick to cover in component tests with the network mocked (for example with MSW); the API's validation and the unique-email rule need integration tests against a real database, often in a container, because a mocked ORM cannot show that the index exists or how a duplicate is reported. One end-to-end test then proves the layers are wired together. Pushing every rule into browser tests makes the suite slow and flaky, while mocking everything leaves the real integration untested.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ───────────────────────────────────────────────────────
  {
    id: "qb-fullstack-mid-15",
    track: "fullstack",
    level: "mid",
    difficulty: 4,
    type: "debugging",
    tags: ["security", "owasp", "api"],
    prompt:
      "Members of a project may delete its tasks. What is wrong with this Express 5 handler?\n\n    app.delete(\"/projects/:projectId/tasks/:taskId\", requireAuth, async (req, res) => {\n      const { projectId, taskId } = req.params;\n      await assertProjectMember(req.user.id, projectId); // throws a 403 error if not\n      await db.task.delete({ where: { id: taskId } });\n      res.sendStatus(204);\n    });",
    options: [
      "Deleting by primary key lets the ORM interpolate taskId into the SQL, so a crafted id can inject extra statements",
      "projectId should be read from the request body rather than the URL, because users are able to edit path parameters",
      "The membership check belongs in the frontend before the request is sent, so that non-members never reach the API",
      "It checks membership of the project in the URL but deletes by taskId alone, so any project's task can be deleted",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "authorise the object actually changed, not only the parent named in the URL",
      "insecure direct object reference (broken access control, OWASP A01)",
      "scope the query by both taskId and projectId",
      "return 404 when nothing matches",
      "add a test that a member of project A cannot delete a task in project B",
    ],
    redFlags: ["path parameters are trustworthy", "frontend checks are authorisation"],
    rubric: {
      criteria: [
        { name: "Vulnerability", weight: 5, keywords: ["idor", "broken access control", "object level", "authorisation", "another project"] },
        { name: "Fix", weight: 4, keywords: ["scope", "projectid", "where", "404", "ownership", "test"] },
      ],
    },
    modelAnswer:
      "The handler proves that the caller belongs to the project named in the URL, then deletes the task by id without checking that the task belongs to that project. A user can put their own project in the path and another project's task id after it: an insecure direct object reference (broken access control, OWASP A01). Scope the write to both ids, for example `db.task.deleteMany({ where: { id: taskId, projectId } })`, and return 404 when nothing matched. ORMs bind the id as a parameter, so this is not SQL injection, and anything in the request, body or path, is equally under the user's control.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-16",
    track: "fullstack",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["security", "owasp", "http"],
    prompt:
      "Customers attach files to support tickets, and staff open them from the support app at https://support.example.com. Which measures reduce the risk that an uploaded file runs script in the support app's origin? Select all that apply.",
    options: [
      "Serving uploaded files from a separate, cookieless domain rather than from the support app's own origin",
      "Checking the file extension in the browser with the file input's accept attribute before each upload is allowed to start",
      "Trusting the Content-Type that the browser sent with the upload, and serving the file back with that type",
      "Serving files with Content-Disposition: attachment, X-Content-Type-Options: nosniff and an allowlisted type",
      "Limiting each upload to 5 MB, so that files are too small to contain a working script payload",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 3],
    multiSelect: true,
    expectedPoints: [
      "an HTML or SVG upload served inline from the app's origin is stored XSS",
      "isolate user content on a separate domain",
      "Content-Disposition: attachment forces a download",
      "nosniff stops MIME sniffing",
      "the server picks the Content-Type from an allowlist",
      "client-side checks and size limits do not stop malicious files",
    ],
    redFlags: ["the accept attribute validates uploads", "small files are safe"],
    rubric: {
      criteria: [
        { name: "Threat", weight: 4, keywords: ["stored xss", "html", "svg", "same origin", "script"] },
        { name: "Defences", weight: 5, keywords: ["separate domain", "content-disposition", "attachment", "nosniff", "content-type", "allowlist"] },
      ],
    },
    modelAnswer:
      "If an uploaded HTML or SVG file is served from the app's own origin and rendered inline, any script in it runs with the staff member's session: stored XSS. Serving uploads from a separate domain means such script runs in an origin with no access to the app, and Content-Disposition: attachment, nosniff and a Content-Type chosen by the server from an allowlist stop the browser rendering the file as a page. The accept attribute and the browser-supplied Content-Type are both under the uploader's control, and a working script payload fits in a few bytes, so a size limit does not help.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-17",
    track: "fullstack",
    level: "mid",
    difficulty: 4,
    type: "coding",
    tags: ["tanstack query", "react", "caching"],
    prompt:
      "Toggling a todo updates the list optimistically. Sometimes, right after a click, the checkbox flips back for a moment and then forward again; it happens when a background refetch of the list was already in flight. What fixes it while keeping the update optimistic?\n\n    useMutation({\n      mutationFn: toggleTodo,\n      onMutate: async (id) => {\n        const previous = queryClient.getQueryData([\"todos\"]);\n        queryClient.setQueryData([\"todos\"], (old) => toggle(old, id));\n        return { previous };\n      },\n      onError: (_err, _id, ctx) => queryClient.setQueryData([\"todos\"], ctx.previous),\n      onSettled: () => queryClient.invalidateQueries({ queryKey: [\"todos\"] }),\n    });",
    options: [
      "Remove the invalidateQueries call in onSettled, because the refetch after the mutation is what overwrites the optimistic value",
      "Call await queryClient.cancelQueries({ queryKey: [\"todos\"] }) at the start of onMutate, before reading and writing the cache",
      "Move the setQueryData call from onMutate into onSuccess, so that the cache is only written once the server has confirmed it",
      "Deep-copy the previous list with structuredClone before setQueryData, so that the optimistic write cannot mutate the snapshot",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a refetch started before the mutation resolves with stale data",
      "its result overwrites the optimistic cache entry",
      "cancel in-flight queries before the optimistic write",
      "keep a snapshot for rollback on error",
      "invalidate on settle to resync with the server",
    ],
    redFlags: ["remove invalidation to keep optimistic state", "apply optimistic updates only in onSuccess"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["in-flight", "refetch", "race", "stale", "overwrite"] },
        { name: "Fix", weight: 4, keywords: ["cancelqueries", "onmutate", "rollback", "invalidatequeries", "snapshot"] },
      ],
    },
    modelAnswer:
      "A refetch that started before the click returns the list as it was before the toggle and writes it over the optimistic value, so the checkbox flips back until the onSettled refetch brings the server's new state. Awaiting `queryClient.cancelQueries({ queryKey: [\"todos\"] })` at the start of onMutate cancels that in-flight request, so its stale result is discarded, before the snapshot and the optimistic write. The onSettled invalidation is not the culprit: it starts after the mutation and is what keeps the cache in line with the server, and moving the write into onSuccess gives up the optimistic update.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-18",
    track: "fullstack",
    level: "mid",
    difficulty: 4,
    type: "system-design",
    tags: ["system design", "api", "background jobs"],
    prompt:
      "Users upload videos of up to 2 GB. Today the browser posts them as multipart form data to the API, which buffers each file and then writes it to object storage; API instances run out of memory and requests time out. Which design fits best?",
    options: [
      "Raise the API's memory limit and request timeout and add autoscaling, so that each instance can buffer several large uploads at once",
      "Base64-encode each video into the JSON body of a single POST, so that the API can validate the file together with its metadata",
      "The API issues a short-lived pre-signed URL for a key it picks; the browser uploads straight to storage, then the API verifies it",
      "Stream each video to the API in chunks over a WebSocket, and have the API append them to a file on its local disk until complete",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "keep large file bytes off the API servers",
      "a pre-signed URL scoped to one server-chosen key, with a short expiry and size/type limits",
      "multipart or resumable uploads for very large files",
      "confirm completion (callback or storage event) and verify the object before using it",
      "transcode or scan asynchronously in a background job",
    ],
    redFlags: ["scale the API to buffer whole files", "base64 in JSON for large files"],
    rubric: {
      criteria: [
        { name: "Design", weight: 5, keywords: ["pre-signed url", "direct upload", "object storage", "server-chosen key", "expiry"] },
        { name: "Follow-through", weight: 4, keywords: ["multipart", "resumable", "verify", "background job", "scan", "transcode"] },
      ],
    },
    modelAnswer:
      "Large file bytes should not pass through the API at all. The API authenticates the user, creates a record and returns a short-lived pre-signed URL (or multipart upload) for a key it chooses, with size and content-type conditions where the storage supports them; the browser uploads straight to object storage, ideally in resumable parts. On completion, signalled by the client or a storage event, the API verifies the object and hands transcoding or virus scanning to a background job. More memory only raises the ceiling, base64 inflates the payload by about a third, and chunking over a WebSocket still routes every byte through one API instance and its disk.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-19",
    track: "fullstack",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["graphql", "security", "rate limiting"],
    prompt:
      "A public GraphQL API lets anyone send queries such as `{ user(id: 1) { friends { friends { friends { posts { comments { author { name } } } } } } } }`. A handful of these requests can saturate the database. Which defence addresses this directly?",
    options: [
      "Disable schema introspection in production, so that attackers are unable to discover which nested fields exist to query",
      "Add DataLoader to the resolvers, so that each level of nested fields is batched into fewer database queries",
      "Rate-limit each client to a fixed number of HTTP requests per minute, whatever each of those requests asks for",
      "Reject queries over a depth and cost limit before execution, cap list sizes, and use persisted queries for own apps",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "one GraphQL request can fan out multiplicatively through nested lists",
      "analyse depth and estimated cost before executing",
      "require pagination arguments with maximum page sizes",
      "persisted (allowlisted) queries for first-party clients",
      "rate limit by query cost rather than request count",
    ],
    redFlags: ["disabling introspection is enough", "request-count rate limiting covers GraphQL"],
    rubric: {
      criteria: [
        { name: "Threat", weight: 4, keywords: ["nested", "fan-out", "denial of service", "expensive query", "resource exhaustion"] },
        { name: "Defence", weight: 5, keywords: ["depth limit", "complexity", "cost analysis", "persisted queries", "pagination", "max page size"] },
      ],
    },
    modelAnswer:
      "In GraphQL the cost of a request depends on its shape, and nested list fields multiply: a few levels of friends and comments can touch millions of rows from a single HTTP request. Analysing each query's depth and estimated cost before executing it, requiring pagination with maximum page sizes, and accepting only persisted queries from your own apps bound that work directly; rate limits help most when they count cost rather than requests. Disabling introspection only hides the schema, a request-count limit still lets every request be enormous, and DataLoader reduces round trips without shrinking the amount of data a query asks for.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ───────────────────────────────────────────────────────
  {
    id: "qb-fullstack-mid-20",
    track: "fullstack",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["database", "postgresql", "release strategies"],
    prompt:
      "You must rename users.name to users.full_name in PostgreSQL. The API is deployed with rolling updates, so old and new versions serve traffic side by side for several minutes. Which sequence avoids errors and downtime?",
    options: [
      "Add full_name; deploy code that writes both and reads full_name with a fallback; backfill; switch to full_name only; drop name later",
      "Run ALTER TABLE ... RENAME COLUMN as the first step of the deploy, so that the column is renamed before any new pods start",
      "Deploy the new code first and rename the column once every pod is updated, letting the new pods retry their failed queries until then",
      "Add full_name and drop name in one migration inside a transaction, so no version of the code ever sees a half-finished schema",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "old and new code run against the same schema during a rollout",
      "expand and contract (parallel change)",
      "add the new column, dual-write and backfill in batches",
      "switch reads and writes, then drop the old column in a later release",
      "every step must stay compatible with the previous version and with rollback",
    ],
    redFlags: ["rename in place during a rolling deploy", "a transaction makes the change safe for running code"],
    rubric: {
      criteria: [
        { name: "Compatibility", weight: 5, keywords: ["backward compatible", "old version", "rolling", "side by side", "rollback"] },
        { name: "Steps", weight: 5, keywords: ["expand", "contract", "dual write", "backfill", "drop later", "parallel change"] },
      ],
    },
    modelAnswer:
      "During a rolling deploy the schema must work for both the old and the new code, and a rename breaks whichever version expects the other name. The expand-and-contract (parallel change) pattern adds full_name, deploys code that writes both columns and reads full_name with a fallback to name, backfills existing rows in batches, then deploys code that uses only full_name, and drops name in a later release once rolling back to the old code is no longer needed. Renaming first breaks the old pods, renaming last breaks the new ones, and a single transaction only makes the migration atomic: the old code still queries a column that no longer exists.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-21",
    track: "fullstack",
    level: "mid",
    difficulty: 5,
    type: "system-design",
    tags: ["server-sent events", "redis pub/sub", "scaling"],
    prompt:
      "A web app runs six API instances behind a round-robin load balancer. You are adding a notification badge that must update within a few seconds when, for example, someone comments on the user's post. Updates only flow from server to browser. Which design works?",
    options: [
      "Each browser keeps a Server-Sent Events stream open; the instance that saves the comment finds the recipient's stream in its own memory and writes to it",
      "Each browser keeps a Server-Sent Events stream open; instances publish events to a shared pub/sub channel, and each pushes them to its own connected users",
      "Each browser keeps a WebSocket open; every instance broadcasts every notification to all its clients, and each browser discards those meant for other users",
      "Each browser polls GET /notifications every 100 ms, so that new notifications appear almost instantly without any long-lived connections to manage",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a connection lives on one instance, but the event can happen on another",
      "fan out through pub/sub (for example Redis) or a message broker",
      "SSE suits one-way updates over plain HTTP and reconnects automatically",
      "resync on reconnect (Last-Event-ID or fetch the unread count)",
      "never send other users' data to a client to filter",
    ],
    redFlags: ["in-memory connection maps work across instances", "filtering other users' notifications on the client"],
    rubric: {
      criteria: [
        { name: "Fan-out", weight: 5, keywords: ["pub/sub", "redis", "broker", "instance", "subscribe", "fan-out"] },
        { name: "Transport", weight: 4, keywords: ["server-sent events", "sse", "websocket", "reconnect", "last-event-id", "polling"] },
      ],
    },
    modelAnswer:
      "Each browser's long-lived connection is held by one instance, while the comment that triggers the notification can be saved on any of the six, so instances need a shared channel: the writer publishes the event (for example to Redis pub/sub or a message broker) and every instance forwards it to the recipient if that user is connected to it. Server-Sent Events fit one-way updates over ordinary HTTP and reconnect automatically; on reconnect the client resyncs using Last-Event-ID or by fetching the unread count. Looking up the stream in local memory only works when both users happen to be on the same instance, broadcasting everything leaks other users' notifications, and 100 ms polling multiplies load for no benefit.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-22",
    track: "fullstack",
    level: "mid",
    difficulty: 5,
    type: "coding",
    tags: ["authentication", "oauth", "async"],
    prompt:
      "The auth server rotates refresh tokens and, if an old refresh token is ever reused, revokes the whole session as suspected theft. When the access token expires while the dashboard fires five requests at once, users are often logged out. Which change fixes it?\n\n    async function apiFetch(url, init) {\n      let res = await fetch(url, withAccessToken(init));\n      if (res.status === 401) {\n        await refreshTokens(); // POST /auth/refresh, stores the new token pair\n        res = await fetch(url, withAccessToken(init));\n      }\n      return res;\n    }",
    options: [
      "Retry refreshTokens up to three times with exponential backoff, so that one failed refresh does not log the user out",
      "Call refreshTokens before every request instead of after a 401, so that each request always carries a freshly issued token",
      "Send the dashboard's five requests with Promise.allSettled instead of Promise.all, so one rejected request cannot affect the rest",
      "Share one in-flight refresh promise, so that concurrent 401s all await the same refresh and then retry with the new token",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "each 401 starts its own refresh",
      "concurrent refreshes present the same refresh token",
      "reuse detection revokes the session",
      "single-flight: share one refresh promise (and a cross-tab lock)",
      "retry each original request once after the shared refresh",
    ],
    redFlags: ["retry the refresh when it fails", "refresh before every request"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["concurrent", "race", "reuse", "rotation", "revoked", "same refresh token"] },
        { name: "Fix", weight: 4, keywords: ["single-flight", "shared promise", "in-flight", "deduplicate", "lock", "retry once"] },
      ],
    },
    modelAnswer:
      "Five requests fail with 401 at almost the same moment, and each one calls refreshTokens with the same refresh token. The first call rotates it, so the other four present a token that has already been used, and reuse detection revokes the session. Keeping a module-level promise for the refresh in progress (for example `refreshing ??= refreshTokens().finally(() => { refreshing = null; })`) makes every concurrent 401 await that single refresh and then retry once with the new access token; apps open in several tabs also need a cross-tab lock such as the Web Locks API. Retrying the refresh or refreshing before every request only produces more uses of rotated tokens.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-23",
    track: "fullstack",
    level: "mid",
    difficulty: 5,
    type: "debugging",
    tags: ["ssr vs csr", "security", "owasp"],
    prompt:
      "A server-rendered app embeds its initial state like this, where appHtml comes from React's renderToString and the state includes each user's profile bio. Why is it vulnerable, and what is the fix?\n\n    res.send(`<!doctype html>\n      <div id=\"root\">${appHtml}</div>\n      <script>window.__STATE__ = ${JSON.stringify(state)};</script>\n      <script src=\"/assets/app.js\"></script>`);",
    options: [
      "renderToString does not escape text, so a bio inside appHtml can run as script; HTML-encode appHtml before inserting it",
      "It is safe: JSON.stringify escapes quotes and backslashes, so a bio can never end the string or the statement it is in",
      "A bio containing </script> ends the script element early; escape < in the JSON (as \\u003c) or use a serialiser that does",
      "Encode the JSON with HTML entities such as &lt; and &quot; before embedding it, as you would for any other text in the HTML",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the HTML parser ends a script element at </script>, whatever the JavaScript around it",
      "JSON.stringify does not escape < or /",
      "escape < (and usually > and &) as \\u003c-style sequences in the serialised JSON",
      "or embed it in a type=\"application/json\" script and JSON.parse it",
      "HTML entities are not decoded inside script elements",
    ],
    redFlags: ["JSON.stringify output is safe to embed in HTML", "HTML-encode the contents of a script element"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["</script>", "html parser", "script element", "breaks out", "stored xss"] },
        { name: "Fix", weight: 4, keywords: ["\\u003c", "escape", "serialiser", "application/json", "json.parse"] },
      ],
    },
    modelAnswer:
      "The browser's HTML parser ends a script element at the first `</script>` it meets, before any JavaScript runs, and JSON.stringify leaves `<` and `/` untouched. A bio such as `</script><script>alert(document.domain)</script>` therefore closes the state script and injects a new one for every visitor who loads the page: stored XSS. Escaping `<` (and conventionally `>` and `&`) as `\\u003c`-style sequences, or using a serialiser that does, keeps the JSON valid while making `</script>` impossible. HTML entities are the wrong tool because they are not decoded inside a script element, and React already escapes the text it renders into appHtml.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-mid-24",
    track: "fullstack",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["postgresql", "database", "sql"],
    prompt:
      "Users are soft-deleted by setting deleted_at, and a UNIQUE (email) constraint now stops anyone re-registering with a deleted user's email. Emails must stay unique among active users only. What is the best fix in PostgreSQL?",
    options: [
      "Replace the constraint with a partial unique index on email WHERE deleted_at IS NULL, so only active rows must be unique",
      "Replace the constraint with UNIQUE (email, deleted_at), so that a deleted row and an active row with one email can coexist",
      "Drop the constraint and have the sign-up handler run a SELECT for an active user with that email before each INSERT",
      "Keep the constraint and add an index on deleted_at, so that the uniqueness check skips rows that are already deleted",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the full unique constraint also covers soft-deleted rows",
      "a partial unique index WHERE deleted_at IS NULL",
      "unique constraints treat NULLs as distinct by default",
      "check-then-insert races under concurrency",
      "consider lower(email) or citext for case-insensitive uniqueness",
    ],
    redFlags: ["UNIQUE (email, deleted_at) enforces uniqueness among active users", "an application-level SELECT check is enough"],
    rubric: {
      criteria: [
        { name: "Mechanism", weight: 5, keywords: ["partial index", "where deleted_at is null", "unique index", "active rows", "predicate"] },
        { name: "Pitfalls", weight: 4, keywords: ["null", "distinct", "race", "concurrent", "check-then-insert"] },
      ],
    },
    modelAnswer:
      "A partial unique index, `CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL`, enforces uniqueness only among rows that match its predicate, so deleted users no longer block their email while two active users still cannot share one. UNIQUE (email, deleted_at) looks right but fails: unique constraints treat NULLs as distinct by default, so any number of active rows with the same email and a NULL deleted_at are allowed. Checking with a SELECT before the INSERT races when two sign-ups arrive together, and an index on deleted_at does not change which rows the constraint covers.",
    followUpIds: [],
  },
];
