import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-junior-01",
    track: "fullstack",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["graphql", "rest", "api"],
    prompt: "Which statement describes a key difference between a typical REST API and a GraphQL API?",
    options: [
      "REST APIs must return XML documents, whereas GraphQL is the only kind of API that is able to return JSON",
      "GraphQL only works in front of a graph database such as Neo4j, while REST works with any database",
      "GraphQL requests travel over their own protocol rather than HTTP, so browser CORS rules do not apply",
      "GraphQL usually has one endpoint where each query names the fields it needs; REST has a URL per resource",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "GraphQL usually exposes a single endpoint such as /graphql",
      "the client's query selects exactly the fields it needs",
      "REST models resources at separate URLs with HTTP methods",
      "the server decides the shape of each REST response",
      "both normally send JSON over HTTP",
    ],
    redFlags: ["GraphQL requires a graph database", "GraphQL does not use HTTP"],
    rubric: {
      criteria: [
        {
          name: "GraphQL model",
          weight: 5,
          keywords: ["single endpoint", "query", "fields", "schema", "client chooses"],
        },
        {
          name: "REST model",
          weight: 3,
          keywords: ["resources", "urls", "http methods", "server-defined", "over-fetching"],
        },
      ],
    },
    modelAnswer:
      "A GraphQL API typically exposes one endpoint (such as /graphql) backed by a typed schema, and each query names exactly the fields the client wants, which avoids over- and under-fetching. A REST API exposes resources at separate URLs, uses HTTP methods for actions, and the server decides what each response contains. Both normally send JSON over HTTP, so a cross-origin GraphQL call from a browser still needs CORS, and the \"graph\" in the name describes how data is queried, not the database behind it.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-02",
    track: "fullstack",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["security", "api", "web"],
    prompt:
      "A sign-up form checks in the browser that the email address is valid and that the password has at least 12 characters before it submits. What should the API do with those fields?",
    options: [
      "Trust them, because the `required` and `type=\"email\"` attributes stop invalid values from being sent",
      "Validate them again, because anyone can skip the form and send a request straight to the API",
      "Trust them while the site uses HTTPS, because HTTPS stops anyone from changing the request",
      "Skip the checks, because the database rejects any value that is not a valid email address",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "client-side validation is for user experience",
      "requests can be sent without the UI (devtools, curl, scripts)",
      "the server is the trust boundary and must validate everything",
      "return clear field errors with a 400 response",
      "share one validation schema between client and server where possible",
    ],
    redFlags: ["the frontend's checks are enough", "HTTPS stops users from editing their own requests"],
    rubric: {
      criteria: [
        {
          name: "Trust boundary",
          weight: 5,
          keywords: ["server", "bypass", "untrusted", "curl", "direct request"],
        },
        {
          name: "Role of each layer",
          weight: 3,
          keywords: ["user experience", "feedback", "400", "schema", "both"],
        },
      ],
    },
    modelAnswer:
      "Client-side checks give instant feedback, but they run on a machine the user controls: devtools, curl or a script can send any body straight to the API. The server must validate every field again and reject bad input with a clear 400 response; sharing one schema between client and server keeps the two in step. HTTPS only protects the request from third parties in transit, it does not stop the sender choosing its contents, and a database does not check that a text column holds a valid email.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-03",
    track: "fullstack",
    level: "junior",
    difficulty: 1,
    type: "coding",
    tags: ["react", "security", "owasp"],
    prompt:
      'A user sets their display name to `<img src=x onerror="alert(1)">`. What happens when another user opens a page that renders it like this?\n\n```jsx\nfunction Author({ user }) {\n  return <p>{user.displayName}</p>;\n}\n```',
    options: [
      "The alert runs, because React inserts string children into the page as HTML",
      "The markup is shown as plain text, because React escapes strings and inserts them as text",
      "React refuses to render the component and throws an error about unsafe HTML",
      "The browser strips the tag and shows an empty paragraph, because the image cannot load",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "JSX string children are escaped",
      "they become text nodes, not parsed HTML",
      "dangerouslySetInnerHTML and innerHTML bypass this protection",
      "sanitise HTML (e.g. with DOMPurify) if it really must be rendered",
    ],
    redFlags: ["React renders strings as HTML", "every JSX value must be escaped by hand"],
    rubric: {
      criteria: [
        {
          name: "Escaping",
          weight: 5,
          keywords: ["escape", "text node", "literal", "jsx", "not html"],
        },
        {
          name: "Unsafe paths",
          weight: 3,
          keywords: ["dangerouslysetinnerhtml", "innerhtml", "sanitise", "dompurify", "xss"],
        },
      ],
    },
    modelAnswer:
      "React treats a string child as text: it becomes a text node, so the markup is displayed literally and the onerror handler never runs. This automatic escaping is one of React's main protections against cross-site scripting. It is bypassed by dangerouslySetInnerHTML and by writing to innerHTML directly, where untrusted input must be sanitised first.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-04",
    track: "fullstack",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["devops", "release strategies"],
    prompt: "Why do many teams deploy each release to a staging environment before production?",
    options: [
      "To verify the release in a production-like setup, with its own data and settings, before users get it",
      "Because staging shares the production database, so tests can run against real customer data",
      "Because code must be compiled on the staging server before it is allowed to run in production",
      "So that automated tests can be skipped, since people will click through every page of staging by hand",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "production-like configuration and infrastructure",
      "separate data and credentials from production",
      "catches configuration and migration problems before users do",
      "smoke tests or QA on staging",
      "the same build artefact is promoted to production",
    ],
    redFlags: ["staging should use real customer data", "staging replaces automated tests"],
    rubric: {
      criteria: [
        {
          name: "Purpose",
          weight: 5,
          keywords: ["production-like", "before users", "verify", "catch", "release"],
        },
        {
          name: "Isolation",
          weight: 3,
          keywords: ["separate database", "own config", "credentials", "test data", "promote"],
        },
      ],
    },
    modelAnswer:
      "Staging is a production-like environment where a release can be verified (smoke tests, QA, database migrations, configuration) before real users are exposed to it. It has its own database, secrets and test data, so mistakes there cannot damage customer data. Ideally the same build artefact that passed staging is then promoted to production, and automated tests still run in CI long before a change reaches staging.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-05",
    track: "fullstack",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["database", "sql"],
    prompt:
      "In a blogging app, a post can have many tags and each tag can be used on many posts. How is this usually modelled in a relational database?",
    options: [
      "A `tags` text column on `posts` that holds a comma-separated list such as \"react,css\"",
      "A `post_id` column on the `tags` table that points at the post using the tag",
      "A separate table for each tag, holding the ids of all the posts that use it",
      "A join table `post_tags(post_id, tag_id)` with foreign keys to both tables",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "many-to-many relationship",
      "join (junction) table with one row per pair",
      "foreign keys to posts and tags",
      "composite primary key or unique constraint on (post_id, tag_id)",
      "easy to query and index posts by tag",
    ],
    redFlags: ["store lists as comma-separated strings", "create one table per value"],
    rubric: {
      criteria: [
        {
          name: "Relationship",
          weight: 5,
          keywords: ["many-to-many", "join table", "junction", "post_tags"],
        },
        {
          name: "Integrity",
          weight: 3,
          keywords: ["foreign key", "unique", "composite key", "index", "query"],
        },
      ],
    },
    modelAnswer:
      "A many-to-many relationship needs a join (junction) table such as post_tags, with one row per post–tag pair and foreign keys to both tables; a composite primary key on (post_id, tag_id) stops duplicates. Queries such as \"all posts tagged react\" stay simple and indexable, and the database enforces integrity. A comma-separated column cannot be constrained or indexed properly, and a post_id on tags would let each tag belong to only one post.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-junior-06",
    track: "fullstack",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["ssr vs csr", "seo", "performance"],
    prompt:
      "Compared with rendering a page only in the browser (client-side rendering), what is a main benefit of server-side rendering (SSR)?",
    options: [
      "The page no longer needs any JavaScript in the browser to handle clicks, navigation and form input",
      "The first response already holds the content as HTML, so users and crawlers see it before JavaScript runs",
      "The browser keeps a copy of every rendered page, so later visits never need to make another network request",
      "The API and database are no longer needed, because the HTML already holds all of the page's data",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the HTML arrives with the content in it",
      "content can be painted before the bundle loads",
      "better for search crawlers and link previews",
      "the page still needs JavaScript to hydrate and become interactive",
      "more work on the server for each request",
    ],
    redFlags: ["SSR removes the need for JavaScript", "SSR removes the need for an API or database"],
    rubric: {
      criteria: [
        {
          name: "Benefit",
          weight: 5,
          keywords: ["html", "content", "first paint", "seo", "crawler"],
        },
        {
          name: "Trade-offs",
          weight: 3,
          keywords: ["hydration", "javascript", "server load", "interactive"],
        },
      ],
    },
    modelAnswer:
      "With SSR the server sends HTML that already contains the content, so the browser can paint it before the JavaScript bundle has downloaded and run, and crawlers and link-preview bots can read it directly. The page still has to hydrate before buttons and forms work, and the server still fetches data from the API or database on each request. The trade-off is more work on the server per request.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-07",
    track: "fullstack",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["tanstack query", "caching", "react"],
    prompt:
      'A header and a sidebar both show the signed-in user\'s name, and each fetches `/api/me` in its own `useEffect`, so every page load sends two identical requests. What do you gain by moving both to TanStack Query\'s `useQuery` with the same query key, `["me"]`?',
    options: [
      "The API stores the response in its database, so the second request is answered faster",
      "The response is saved to localStorage by default, so it survives the user closing the browser",
      "The request becomes a WebSocket subscription, so the server pushes changes to both",
      "Both components share one cached result, so one request is sent and both update together",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "the query key identifies the cached data",
      "concurrent requests for the same key are de-duplicated",
      "components share one cache entry",
      "staleTime controls when data is refetched",
      "invalidate the key after a mutation changes the data",
    ],
    redFlags: ["the cache lives on the server", "the cache is persisted to localStorage by default"],
    rubric: {
      criteria: [
        {
          name: "Client cache",
          weight: 5,
          keywords: ["query key", "dedupe", "shared cache", "single request", "cache"],
        },
        {
          name: "Freshness",
          weight: 3,
          keywords: ["staletime", "refetch", "invalidate", "mutation", "background"],
        },
      ],
    },
    modelAnswer:
      "TanStack Query keeps an in-memory cache keyed by the query key, so components that ask for [\"me\"] share one entry: concurrent requests are de-duplicated into one, and both components re-render when the data is refetched or invalidated. staleTime controls how long the cached data counts as fresh before a background refetch. The cache lives in the browser's memory, not on the server, and it is only persisted to storage if you add a persister.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-08",
    track: "fullstack",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["performance", "api", "database"],
    prompt:
      'The orders page takes several seconds to load for long-standing customers. `/api/orders` returns every order the customer has ever placed (up to 50,000), and the page shows only the first 20. What is the best fix?\n\n```jsx\nconst { data: orders = [] } = useQuery({\n  queryKey: ["orders"],\n  queryFn: () => fetch("/api/orders").then((r) => r.json()),\n});\n\nreturn <OrderTable rows={orders.slice(0, 20)} />;\n```',
    options: [
      "Wrap `orders.slice(0, 20)` in `useMemo`, so the slice is not recalculated on every render",
      "Paginate in the API: accept a page size and cursor, query only those rows, and load more on demand",
      "Raise the query's `staleTime`, so the full list is downloaded less often while the user stays on the page",
      "Save the full list to localStorage after the first load, so later visits read it from there",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the cost is loading, serialising and sending every row",
      "LIMIT the database query to one page",
      "page-size and cursor (or page number) parameters",
      "return a next cursor or total so the client can page",
      "fetch further pages on demand",
    ],
    redFlags: ["memoising the slice fixes it", "cache the whole dataset in the browser"],
    rubric: {
      criteria: [
        {
          name: "Root cause",
          weight: 5,
          keywords: ["all rows", "payload", "database", "serialise", "transfer"],
        },
        {
          name: "Pagination",
          weight: 5,
          keywords: ["limit", "cursor", "page", "next", "on demand"],
        },
      ],
    },
    modelAnswer:
      "The time goes into reading 50,000 rows from the database, serialising them, sending a huge JSON body and parsing it in the browser, only to display 20. The API should accept a page size and a cursor (or page number), run a query with LIMIT and return that page plus a way to get the next one. useMemo only saves a cheap slice, and caching the full list with staleTime or localStorage still downloads all of it on the first visit and then shows stale data.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-09",
    track: "fullstack",
    level: "junior",
    difficulty: 2,
    type: "behavioral",
    tags: ["behavioral", "incident management", "communication"],
    prompt:
      "Ten minutes after your change is deployed on a Friday afternoon, error alerts start firing and users report that checkout fails. The change is small, and the team can redeploy the previous version in one step. What should you do first?",
    options: [
      "Tell the team in the incident channel and roll back to the previous version, then look for the cause",
      "Write a quick fix and push it straight to production without review, as that is faster than a rollback",
      "Leave it until Monday, because the change was reviewed and the alerts may well clear by themselves",
      "Find the root cause on your own first, so you can explain exactly what went wrong before telling anyone",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "restore service first",
      "rolling back is the fastest low-risk mitigation",
      "tell the team early",
      "investigate once users are unblocked",
      "follow up with a tested fix and a blameless review",
    ],
    redFlags: ["hide the problem until it is understood", "hotfix production without review"],
    rubric: {
      criteria: [
        {
          name: "Mitigation",
          weight: 5,
          keywords: ["roll back", "revert", "restore", "previous version", "mitigate"],
        },
        {
          name: "Communication",
          weight: 4,
          keywords: ["tell the team", "incident", "channel", "early", "post-mortem"],
        },
      ],
    },
    modelAnswer:
      "When users are affected, the priority is to restore service, and rolling back to a known-good version is usually the fastest, lowest-risk way to do it. Telling the team straight away brings in help and avoids people working on the same problem blindly. Once checkout works again, you find the root cause, add a test and ship a reviewed fix; an unreviewed hotfix under pressure can make things worse, and waiting or investigating alone leaves users stuck.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-10",
    track: "fullstack",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["security", "owasp", "api"],
    prompt:
      'The UI shows a Delete button only on posts that the signed-in user wrote. What is wrong with the API route behind it?\n\n```js\napp.delete("/api/posts/:id", requireAuth, async (req, res) => {\n  await db.post.delete({ where: { id: req.params.id } });\n  res.sendStatus(204);\n});\n```',
    options: [
      "It never checks that the post belongs to `req.user`, so any signed-in user can delete any post via the API",
      "It should return 200 with the deleted post rather than 204, or the client cannot tell the delete worked",
      "Nothing, because the button is hidden on other users' posts and `requireAuth` checks the user is signed in",
      "A DELETE request cannot carry a route parameter, so the post id has to be sent in the request body instead",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "authentication is not authorisation",
      "check ownership on the server for every object",
      "hiding UI controls is not access control",
      "return 404 or 403 when the user does not own the post",
      "broken object-level authorisation (IDOR)",
    ],
    redFlags: ["hidden buttons protect the endpoint", "being signed in means being allowed"],
    rubric: {
      criteria: [
        {
          name: "Vulnerability",
          weight: 5,
          keywords: ["idor", "broken access control", "ownership", "any user", "direct request"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["authorise", "author", "req.user", "403", "404"],
        },
      ],
    },
    modelAnswer:
      "requireAuth only proves who the caller is; it does not check that they may delete this particular post. Anyone can call the API directly with any id, so the route must check ownership on the server, for example by deleting only where both the id and the author match req.user and returning 404 or 403 when nothing matches. Hiding the button is a UX choice, not access control, and 204 No Content is a correct response to a successful delete.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-junior-11",
    track: "fullstack",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["security", "authentication", "owasp"],
    prompt:
      "Your API signs browser users in with a session cookie, so it must protect state-changing requests against cross-site request forgery (CSRF). Which measures help? Select all that apply.",
    options: [
      "Setting `HttpOnly` on the session cookie, so that page scripts cannot read its value",
      "Setting `SameSite=Lax` or `SameSite=Strict`, so the cookie is not sent on most cross-site requests",
      "Making the session ID longer and more random, so that attackers cannot guess it",
      "Requiring a CSRF token on POST, PUT, PATCH and DELETE requests and checking it on the server",
      "Rejecting state-changing requests whose `Origin` header is not the app's own origin",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 3, 4],
    multiSelect: true,
    expectedPoints: [
      "browsers attach cookies to cross-site requests automatically",
      "SameSite limits when the cookie is sent cross-site",
      "CSRF tokens prove the request came from the app's own page",
      "checking Origin (or Sec-Fetch-Site) rejects requests started elsewhere",
      "HttpOnly is an XSS defence, not a CSRF defence",
    ],
    redFlags: ["HttpOnly prevents CSRF", "a stronger session ID stops CSRF", "GET requests may change state"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 4,
          keywords: ["automatically", "cookie", "cross-site", "forged request"],
        },
        {
          name: "Defences",
          weight: 5,
          keywords: ["samesite", "csrf token", "origin", "sec-fetch-site", "state-changing"],
        },
      ],
    },
    modelAnswer:
      "CSRF works because the browser attaches the session cookie automatically to a request that another site triggers, so the attacker never needs to know the cookie's value. SameSite=Lax or Strict stops the cookie being sent on most cross-site requests, a CSRF token proves the request came from your own page, and checking the Origin header rejects requests started by other sites. HttpOnly only hides the cookie from JavaScript, which helps against XSS, and a longer session ID does not help because the attacker never reads it.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-12",
    track: "fullstack",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["jwt", "authentication", "security"],
    prompt:
      "An API gives a single-page app a JWT access token that expires after 15 minutes, together with a long-lived refresh token. Why is the access token kept short-lived?",
    options: [
      "JWT signatures stop being valid after about 15 minutes, so a longer token lifetime is not possible",
      "Short-lived tokens are smaller, so each API request that carries one is noticeably faster",
      "It makes the user type their password every 15 minutes, which proves they are still present",
      "A stolen access token is useful only briefly, and the refresh token can be guarded and revoked",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "JWT access tokens are hard to revoke before they expire",
      "a short expiry limits the damage from a leaked token",
      "the refresh token is exchanged for new access tokens",
      "refresh tokens are checked server-side, so they can be rotated and revoked",
      "the user does not have to sign in again",
    ],
    redFlags: ["the signature expires by itself", "send the refresh token with every API call"],
    rubric: {
      criteria: [
        {
          name: "Risk limiting",
          weight: 5,
          keywords: ["stolen", "leak", "short-lived", "expiry", "revoke"],
        },
        {
          name: "Refresh flow",
          weight: 4,
          keywords: ["refresh token", "new access token", "rotation", "server-side", "httponly"],
        },
      ],
    },
    modelAnswer:
      "A JWT access token is usually verified only by its signature and expiry, so the server cannot easily cancel one before it expires; a short lifetime limits how long a leaked token is useful. The refresh token is sent only to the token endpoint, can live in an HttpOnly cookie and is checked against server-side state, so it can be rotated and revoked at logout. The user is not asked for a password again: the app silently swaps the refresh token for a new access token, and signatures themselves never expire.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-13",
    track: "fullstack",
    level: "junior",
    difficulty: 3,
    type: "debugging",
    tags: ["ssr vs csr", "next.js", "react", "hooks"],
    prompt:
      'In a server-rendered React app (for example with Next.js), this component crashes during server rendering with `ReferenceError: localStorage is not defined`. What is the right fix?\n\n```jsx\nfunction ThemeToggle() {\n  const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");\n  const next = theme === "light" ? "dark" : "light";\n  return <button onClick={() => setTheme(next)}>{theme}</button>;\n}\n```',
    options: [
      "Add the `\"use client\"` directive to the file, so the component no longer runs on the server",
      "Switch to `sessionStorage`, which is available both on the server and in the browser",
      "Render a default theme first, then read localStorage in a `useEffect`, which runs only in the browser",
      "Guard the read with `typeof window !== \"undefined\"`, so server and browser each render their own theme",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "components also render on the server, where browser APIs and the user's storage are unavailable",
      "useEffect runs only in the browser, after hydration",
      "the first client render must match the server HTML",
      "\"use client\" components are still pre-rendered on the server",
      "a cookie lets the server render the saved theme directly",
    ],
    redFlags: ["\"use client\" means browser-only rendering", "different server and client output is fine"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 4,
          keywords: ["server", "no window", "browser api", "localstorage", "pre-render"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["useeffect", "after hydration", "default", "match", "cookie"],
        },
      ],
    },
    modelAnswer:
      "During SSR the component runs in Node.js on the server, which has no browser window and no access to the user's localStorage. Render a default first and read the stored theme in useEffect, which runs only in the browser after hydration, so the first client render still matches the server HTML; storing the preference in a cookie the server can read also avoids the brief flash. \"use client\" components are still pre-rendered on the server, and a typeof window check during render makes server and client output differ, which causes a hydration mismatch.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-14",
    track: "fullstack",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["testing", "integration testing"],
    prompt:
      "You are adding discount codes to checkout: a React form field, a `POST /api/cart/discount` endpoint and a pricing function that applies a dozen rules. Which test plan gives the most confidence for the effort?",
    options: [
      "One end-to-end browser test per pricing rule, because only full browser tests show that everything works",
      "Unit tests for each pricing rule, an API integration test with a test database, and one end-to-end test",
      "Unit tests only, with the database, API and form all mocked, because they are the quickest tests to run",
      "Manual testing in staging before each release, because automated tests break whenever the UI changes",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "fast unit tests for pure business logic",
      "integration test the endpoint against a real test database",
      "a few end-to-end tests for the critical journey",
      "end-to-end tests are slow and more brittle",
      "mocking every layer misses bugs between layers",
    ],
    redFlags: ["only end-to-end tests", "mock everything", "rely on manual testing"],
    rubric: {
      criteria: [
        {
          name: "Layering",
          weight: 5,
          keywords: ["unit", "integration", "end-to-end", "pyramid", "layers"],
        },
        {
          name: "Trade-offs",
          weight: 3,
          keywords: ["fast", "slow", "brittle", "confidence", "real database"],
        },
      ],
    },
    modelAnswer:
      "Test each part where it is cheapest to test well: the dozen pricing rules are pure logic, so fast unit tests cover every case; the endpoint gets an integration test against a real test database to check validation, persistence and wiring; and one end-to-end test proves the form, API and database work together. Covering every rule end to end would be slow and brittle, while mocking everything misses the bugs that live between layers.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-junior-15",
    track: "fullstack",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["cors", "authentication", "http"],
    prompt:
      'The app on https://app.example.com signs in against https://api.example.com. The login response is 200 with a `Set-Cookie` header, and the API\'s CORS settings allow the app\'s origin, yet `/me` returns 401 because no cookie arrives. What is the fix?\n\n```js\nawait fetch("https://api.example.com/login", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email, password }),\n});\nconst res = await fetch("https://api.example.com/me");\n```',
    options: [
      "Add `mode: \"no-cors\"` to both requests, so that the browser will send and store cookies across origins",
      "Set `Access-Control-Allow-Origin: *` on the API, so that cookies are accepted from any origin",
      "Read the cookie with `document.cookie` after login and send it in an `Authorization` header",
      "Add `credentials: \"include\"` to both requests, and have the API allow credentials for that exact origin",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "fetch omits cookies on cross-origin requests by default",
      "credentials: \"include\" is needed on the login call and later calls",
      "the API must send Access-Control-Allow-Credentials: true",
      "with credentials the allowed origin must be explicit, not *",
      "no-cors responses are opaque and unreadable",
    ],
    redFlags: ["no-cors fixes cookie problems", "a wildcard origin works with credentials"],
    rubric: {
      criteria: [
        {
          name: "Client",
          weight: 4,
          keywords: ["credentials", "include", "fetch", "cross-origin", "cookie"],
        },
        {
          name: "Server",
          weight: 5,
          keywords: ["access-control-allow-credentials", "exact origin", "wildcard", "cors"],
        },
      ],
    },
    modelAnswer:
      "fetch defaults to credentials: \"same-origin\", so on a cross-origin call it neither sends cookies nor stores a Set-Cookie from the response; both the login and later requests need credentials: \"include\". The browser then only lets the page read the response if the API sends Access-Control-Allow-Credentials: true and names the exact origin, because a wildcard * is not allowed with credentials. no-cors produces an opaque response the app cannot read and still sends no cookies, and document.cookie has nothing to offer: the browser discarded the Set-Cookie, and session cookies are normally HttpOnly anyway.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-16",
    track: "fullstack",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["security", "owasp", "api"],
    prompt:
      'This endpoint lets users edit their own name and bio. What is the security problem?\n\n```js\napp.patch("/api/me", requireAuth, async (req, res) => {\n  const user = await db.user.update({\n    where: { id: req.user.id },\n    data: req.body,\n  });\n  res.json({ id: user.id, name: user.name, bio: user.bio });\n});\n```',
    options: [
      "A user can edit someone else's profile, because `req.user.id` is read from the request body",
      "Every field in the body is saved, so a user can send `{ \"role\": \"admin\" }`; allow only name and bio",
      "The query is open to SQL injection, because `req.body` is pasted straight into the SQL text",
      "PATCH may not change the caller's own record, so the route must use PUT and send the whole user object",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "mass assignment",
      "never pass a request body straight to the ORM",
      "allow-list fields with a validation schema or DTO",
      "privileged fields such as role are set only by the server",
      "req.user comes from the authentication middleware",
    ],
    redFlags: ["an ORM makes any body safe", "signed-in users can be trusted with any field"],
    rubric: {
      criteria: [
        {
          name: "Vulnerability",
          weight: 5,
          keywords: ["mass assignment", "role", "admin", "privilege", "any field"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["allow-list", "schema", "validate", "pick", "dto"],
        },
      ],
    },
    modelAnswer:
      "Passing req.body straight to update writes whatever fields the client sends, so a user can add role, emailVerified or plan to the request and raise their own privileges (mass assignment). Parse the body with a schema that allows only name and bio, and let the server alone set privileged fields. req.user comes from the authentication middleware, not the body, and the ORM sends values as bound parameters, so the problem is which fields are written, not SQL injection.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-17",
    track: "fullstack",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["http", "javascript", "browser apis"],
    prompt:
      'An avatar upload always fails: the server\'s multipart parser rejects every request with a 400 error before it reads any file data. What is the bug?\n\n```js\nconst body = new FormData();\nbody.append("avatar", fileInput.files[0]);\n\nawait fetch("/api/avatar", {\n  method: "POST",\n  headers: { "Content-Type": "multipart/form-data" },\n  body,\n});\n```',
    options: [
      "A file has to be read into a Base64 string and sent as JSON, because FormData cannot carry binary data",
      "`files[0]` is only the file's path on disk, so the server receives the file's name but none of its contents",
      "Setting `Content-Type` by hand drops the boundary parameter; remove it and let the browser set the header",
      "Uploads have to use PUT rather than POST, because a POST body is not allowed to contain multipart data",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "multipart bodies separate parts with a boundary",
      "the boundary must appear in the Content-Type header",
      "fetch sets the header and boundary itself for FormData",
      "a File object holds the file's data",
      "the server should still check size and type",
    ],
    redFlags: ["send files as Base64 JSON by default", "FormData cannot send binary files"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["boundary", "content-type", "header", "multipart", "manual"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["remove header", "browser sets", "formdata", "fetch", "automatic"],
        },
      ],
    },
    modelAnswer:
      "A multipart/form-data body separates its parts with a boundary string that the header must name, for example `multipart/form-data; boundary=----abc`. When the body is a FormData object, fetch generates the boundary and sets the full header itself, but a hand-written Content-Type replaces it without the boundary, so the server cannot split the parts. Removing the header fixes it; sending the file as Base64 inside JSON would also work but makes it about a third larger.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-18",
    track: "fullstack",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["database", "consistency", "prisma"],
    prompt:
      'Now and then two accounts end up with the same email address, usually when someone double-clicks "Sign up". What reliably prevents the duplicates?\n\n```js\nconst existing = await db.user.findFirst({ where: { email } });\nif (existing) {\n  return res.status(409).json({ error: "Email already registered" });\n}\nconst user = await db.user.create({ data: { email, passwordHash } });\n```',
    options: [
      "Disable the Sign up button after the first click, so the form cannot be submitted twice",
      "Add a unique constraint on `email` in the database and return 409 when an insert violates it",
      "Run the lookup a second time just before the insert, to catch an account created in between",
      "Wait 200 ms between the lookup and the insert, so an earlier request can finish first",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "check-then-insert is a race condition",
      "two concurrent requests can both pass the check",
      "a unique constraint is enforced atomically by the database",
      "catch the unique violation and return 409",
      "normalise emails (e.g. lower-case) before saving",
    ],
    redFlags: ["client-side measures prevent duplicates", "delays or repeated checks fix race conditions"],
    rubric: {
      criteria: [
        {
          name: "Race condition",
          weight: 5,
          keywords: ["race", "concurrent", "check-then-insert", "both pass", "double-click"],
        },
        {
          name: "Constraint",
          weight: 5,
          keywords: ["unique", "constraint", "index", "409", "violation"],
        },
      ],
    },
    modelAnswer:
      "Two requests can run the lookup at the same moment, both find no user and both insert, so any check done only in application code is a race. A unique constraint (unique index) on email makes the database reject the second insert atomically; the API catches that error and returns 409, and emails should be normalised, for example lower-cased, before saving. Disabling the button only protects one well-behaved browser, and delays or repeated checks just make the window smaller.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-19",
    track: "fullstack",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["caching", "cdn", "http"],
    prompt:
      "To speed things up, a teammate sets `Cache-Control: public, max-age=300` on every API response, and the API sits behind a CDN. Why is this dangerous for `GET /api/me`, which returns the signed-in user's profile?",
    options: [
      "The CDN may store one user's profile and serve it to other users who request the same URL",
      "CDNs cannot cache JSON responses, so the header makes every API request fail with an error",
      "max-age is measured in milliseconds, so 300 makes the cache expire before it can ever help",
      "Browsers ignore Cache-Control on fetch requests, so the profile is downloaded on every call",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "public allows shared caches such as a CDN to store the response",
      "the URL is the same for every user",
      "per-user responses need private or no-store",
      "cache at the CDN only what is identical for everyone",
      "max-age is in seconds",
    ],
    redFlags: ["every GET response can be cached publicly", "CDNs never cache authenticated responses"],
    rubric: {
      criteria: [
        {
          name: "Risk",
          weight: 5,
          keywords: ["shared cache", "cdn", "another user", "leak", "same url"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["private", "no-store", "personalised", "public", "s-maxage"],
        },
      ],
    },
    modelAnswer:
      "public tells shared caches such as a CDN that they may store the response and reuse it for other requests to the same URL, and /api/me has the same URL for every user, so one person's profile can be served to someone else. Per-user responses should use Cache-Control: private (browser only) or no-store, and CDN caching should be kept for responses that are identical for everyone, such as a public product list. max-age is in seconds, and browsers do honour it for fetch requests.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-fullstack-junior-20",
    track: "fullstack",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["vite", "devops", "12-factor app"],
    prompt:
      "A Vite React app reads `import.meta.env.VITE_API_URL`. CI runs `npm run build` once with staging settings, and the same `dist/` folder is deployed to staging and to production. In production the app still calls the staging API, even though the production server sets `VITE_API_URL` correctly. Why?",
    options: [
      "Vite reads environment variables from each visitor's browser, so local settings take priority",
      "Vite ignores variables that start with `VITE_`; they must be prefixed with `REACT_APP_` to be picked up",
      "Vite replaces `import.meta.env.VITE_*` with fixed values at build time, baking in the staging URL",
      "Browsers cache environment variables in localStorage and keep using the first values they saw",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "frontend env values are replaced at build time",
      "a static bundle cannot read the server's environment at runtime",
      "build once per environment, or load configuration at runtime",
      "for example fetch a config.json the server generates",
      "VITE_ values end up public, so never put secrets in them",
    ],
    redFlags: ["the browser can read the server's environment variables", "VITE_ variables are safe for secrets"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["build time", "replaced", "baked", "bundle", "static"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["build per environment", "runtime config", "config.json", "inject", "public"],
        },
      ],
    },
    modelAnswer:
      "Vite statically replaces import.meta.env.VITE_* references with literal values when it builds, so the bundle contains whatever URL CI had, and the production server's environment is never consulted: the browser only receives static files. Either build once per environment, or keep one build and load configuration at runtime, for example a small config.json or inline script that the production server generates. Anything exposed this way is public in the bundle, so it must never be a secret.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-21",
    track: "fullstack",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["contract testing", "testing", "openapi/swagger", "api"],
    prompt:
      'The React app\'s tests mock `GET /api/users/1` as `{ "userName": "Ana" }`, and the API\'s own tests pass as well. After release, the profile page shows a blank name because the real API returns `{ "name": "Ana" }`. Which practice would most directly have caught this before release?',
    options: [
      "Raising unit-test coverage of the React components to 100% of all lines and branches",
      "Adding snapshot tests of the profile page's rendered HTML, built from the same mocked API response",
      "Contract tests, or a shared OpenAPI schema that both the mocks and the API are checked against",
      "Running the frontend test suite several times in CI to rule out any flaky results",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "hand-written mocks can drift from the real API",
      "each side passes when tested only in isolation",
      "consumer-driven contract tests",
      "a shared schema, with client types generated from OpenAPI",
      "a few end-to-end tests against the real API",
    ],
    redFlags: ["100% coverage guarantees correctness", "mocked tests prove the integration works"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 4,
          keywords: ["mock", "drift", "isolation", "assumption", "field name"],
        },
        {
          name: "Practice",
          weight: 5,
          keywords: ["contract test", "openapi", "schema", "shared types", "pact"],
        },
      ],
    },
    modelAnswer:
      "Each side was tested only against its own assumptions: the frontend against a hand-written mock and the API against its own expectations, so nothing ever compared the two. Contract tests (for example consumer-driven contracts) or a shared OpenAPI schema that validates both the mocks and the API, ideally with client types generated from it, fail as soon as the field names disagree. More coverage, snapshots or reruns all reuse the same wrong mock, so they would still pass.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-22",
    track: "fullstack",
    level: "junior",
    difficulty: 5,
    type: "system-design",
    tags: ["system design", "scaling", "api"],
    prompt:
      "Users upload videos of up to 2 GB. Today the browser posts each file to the API, which forwards it to object storage (such as S3). At busy times the API servers run short of memory and uploads time out. Which design is the best fix?",
    options: [
      "Raise the API's memory, body-size limit and timeout so that it can hold several 2 GB files in memory at once",
      "Base64-encode each video in the browser and send it as JSON, so that the API can parse the upload faster",
      "Store each video in a database BLOB column instead, so that the API no longer needs to use object storage",
      "The API issues a short-lived pre-signed URL, and the browser uploads directly to storage, then tells the API",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "keep large file bytes off the API servers",
      "pre-signed (signed) URLs give short-lived access to one object",
      "the browser uploads directly, using multipart or resumable uploads for big files",
      "the API records metadata once the upload completes",
      "limit size and content type and check authorisation before signing",
    ],
    redFlags: ["scale API memory to fit the files", "Base64 makes files smaller"],
    rubric: {
      criteria: [
        {
          name: "Design",
          weight: 5,
          keywords: ["pre-signed", "signed url", "direct upload", "object storage", "short-lived"],
        },
        {
          name: "Safety and follow-up",
          weight: 4,
          keywords: ["expiry", "size limit", "content type", "metadata", "multipart"],
        },
      ],
    },
    modelAnswer:
      "Large files should not pass through the API at all: the API checks that the user may upload, then issues a short-lived pre-signed (signed) URL scoped to one object key, and the browser uploads directly to object storage, using multipart or resumable uploads for big files. When the upload completes, the client (or a storage event) tells the API, which records the metadata and can start processing. Bigger servers only move the limit, Base64 makes the payload about a third larger, and multi-gigabyte BLOBs bloat the database and its backups.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-23",
    track: "fullstack",
    level: "junior",
    difficulty: 5,
    type: "coding",
    tags: ["security", "owasp", "sql", "node.js"],
    prompt:
      "In these Express handlers, `email`, `name` and `file` come straight from the request. Which lines let that input be interpreted as code or query syntax (an injection flaw)? Select all that apply.",
    options: [
      "`child_process.exec(\"zip backup.zip \" + file)`",
      "`db.query(\"SELECT * FROM users WHERE email = $1\", [email])`",
      "`res.send(\"<p>Hello \" + name + \"</p>\")`",
      "`res.json({ greeting: \"Hello \" + name })`",
      "`db.query(\"SELECT * FROM users WHERE email = '\" + email + \"'\")`",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "SQL built by string concatenation allows SQL injection",
      "bind parameters keep input as data",
      "shell commands built from input allow command injection",
      "HTML built from input allows cross-site scripting",
      "JSON responses encode the value as data",
    ],
    redFlags: ["parameterised queries are still injectable", "only SQL counts as injection"],
    rubric: {
      criteria: [
        {
          name: "Identifying flaws",
          weight: 5,
          keywords: ["sql injection", "command injection", "xss", "concatenation", "shell"],
        },
        {
          name: "Safe alternatives",
          weight: 4,
          keywords: ["parameterised", "placeholder", "execfile", "escape", "json"],
        },
      ],
    },
    modelAnswer:
      "Concatenating input into a SQL string, a shell command or an HTML response lets an attacker break out of the intended value: a quote in email rewrites the query, `; cat /etc/passwd` in file runs a second command, and a `<script>` tag in name runs in the visitor's browser (OWASP groups all of these under Injection). The bind parameter keeps email as data, and res.json encodes the string inside a JSON value served as application/json, so neither is injectable. The fixes are placeholders, execFile with an argument array plus validation, and escaping or templating HTML output.",
    followUpIds: [],
  },
  {
    id: "qb-fullstack-junior-24",
    track: "fullstack",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["graphql", "caching", "cdn", "http"],
    prompt:
      "A team moves its public product catalogue from REST endpoints such as `GET /products/42` to a GraphQL API, and the CDN's cache hit rate drops to almost zero. What is the most likely reason?",
    options: [
      "Clients usually POST every query to one `/graphql` URL, and CDNs key their caches on method and URL",
      "GraphQL responses are larger than REST responses, so CDNs decline to store any of them at the edge",
      "GraphQL servers always send `Cache-Control: no-store`, which turns off caching for every response",
      "GraphQL queries run over a WebSocket connection, and CDNs are unable to cache WebSocket traffic",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "HTTP caches key responses on method and URL",
      "POST responses are not normally cached",
      "a single endpoint hides which resource is being requested",
      "persisted queries sent with GET can restore CDN caching",
      "client-side normalised caches complement HTTP caching",
    ],
    redFlags: ["GraphQL can never be cached", "GraphQL queries go over WebSockets"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["post", "single endpoint", "url", "cache key", "method"],
        },
        {
          name: "Remedies",
          weight: 3,
          keywords: ["persisted queries", "get", "cache-control", "client cache"],
        },
      ],
    },
    modelAnswer:
      "HTTP caches such as CDNs key responses on the method and URL, and they do not normally cache POST. With REST, each product is a distinct GET URL that can be cached at the edge; GraphQL clients usually send every query as a POST to the same /graphql URL with the query in the body, so the CDN has nothing it can reuse. Teams restore edge caching with persisted queries sent as GET with a query hash, alongside client-side caches. Only subscriptions typically use WebSockets; ordinary queries are plain HTTP requests.",
    followUpIds: [],
  },
];
