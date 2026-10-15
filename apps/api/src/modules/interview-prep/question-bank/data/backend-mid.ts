import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ───────────────────────────────────────────────────────
  {
    id: "qb-backend-mid-01",
    track: "backend",
    level: "mid",
    difficulty: 1,
    type: "debugging",
    tags: ["express", "node.js"],
    prompt:
      "Errors in this route reach next(err), yet clients get Express's default HTML error page instead of the JSON body. Why?\n\n    app.get(\"/users/:id\", async (req, res, next) => {\n      try {\n        res.json(await users.get(req.params.id));\n      } catch (err) {\n        next(err);\n      }\n    });\n\n    app.use((err, req, res) => {\n      res.status(500).json({ error: \"Internal error\" });\n    });",
    options: [
      "The error handler must be registered before the routes, because Express runs error middleware in reverse order",
      "Express only calls middleware declaring four parameters (err, req, res, next) for errors, so it skips this one",
      "next(err) only works in synchronous handlers; an async handler has to rethrow the error for Express to see it",
      "Calling res.status(500) inside middleware is silently ignored, so the handler has to call res.sendStatus(500) first",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "Express recognises error handlers by their arity (four parameters)",
      "a three-parameter function is treated as ordinary middleware",
      "next(err) skips ordinary middleware and goes to error handlers",
      "error handlers are registered after the routes",
      "keep the unused next parameter",
    ],
    redFlags: ["middleware order does not matter", "async handlers cannot pass errors to next"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["four parameters", "arity", "error-handling middleware", "err, req, res, next", "skipped"] },
        { name: "Express flow", weight: 3, keywords: ["next(err)", "default handler", "after the routes", "middleware order"] },
      ],
    },
    modelAnswer:
      "Express decides whether a middleware function is an error handler by its number of declared parameters: only functions with four, `(err, req, res, next)`, are called with errors. With three, Express treats it as ordinary `(req, res, next)` middleware, which `next(err)` skips, so the error falls through to the built-in handler and its HTML page. Declaring the fourth parameter, even if it is unused, fixes it. Error handlers also have to be registered after the routes, not before them.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-02",
    track: "backend",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["http", "caching", "cdn", "security"],
    prompt:
      "GET /me returns the signed-in user's profile with `Cache-Control: public, max-age=300`. After a CDN is placed in front of the API, some users see another user's profile. What is the right fix?",
    options: [
      "Add Vary: User-Agent, so that the CDN keeps a separate copy of the response for each browser",
      "Lower max-age to 5 seconds, so that a wrongly cached profile is only served for a short time",
      "Add an ETag header, so that the CDN checks with the API whether the profile has changed",
      "Send Cache-Control: private (or no-store), so shared caches such as the CDN never store it",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "public allows shared caches (CDNs, proxies) to store the response",
      "user-specific responses must not be stored by shared caches",
      "private allows only the user's own browser to cache it",
      "no-store for sensitive data",
      "a shorter TTL or an ETag still leaks data",
    ],
    redFlags: ["CDNs automatically keep a copy per user", "a short max-age makes it safe"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["public", "shared cache", "cdn", "user-specific", "cache key"] },
        { name: "Fix", weight: 4, keywords: ["private", "no-store", "cache-control", "browser cache"] },
      ],
    },
    modelAnswer:
      "`public` tells every cache, including shared ones such as CDNs and proxies, that it may store the response and serve it to anyone who requests the same URL. For a URL like /me, whose content depends on who is asking, that hands one user's data to another. `Cache-Control: private` lets only the user's own browser cache it, and `no-store` forbids caching entirely, which suits sensitive data. A shorter max-age only shortens the leak, an ETag does not stop the CDN serving its still-fresh copy, and Vary: User-Agent keys the cache by browser rather than by user.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-03",
    track: "backend",
    level: "mid",
    difficulty: 1,
    type: "system-design",
    tags: ["queues", "background jobs", "fault tolerance"],
    prompt:
      "Sign-up calls an email provider's API to send a welcome email before it responds. Whenever the provider is slow or down, sign-ups become slow or fail. What is the best design?",
    options: [
      "Create the user, enqueue a welcome-email job and respond; a worker sends it with retries, backoff and a dead-letter queue",
      "Call the email API without awaiting its promise, so that the response goes out while the email request is still in flight",
      "Retry the email call in a loop inside the request handler until the provider responds, so that no welcome email is ever lost",
      "Send the email from the browser once sign-up succeeds, using the provider's API key bundled into the frontend code",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "keep slow or unreliable third-party calls out of the request path",
      "enqueue a background job and respond straight away",
      "retries with exponential backoff",
      "dead-letter queue for jobs that keep failing",
      "idempotent job handler",
      "an outbox if the job must commit together with the user",
    ],
    redFlags: ["fire-and-forget promises are reliable", "provider API keys can live in the frontend"],
    rubric: {
      criteria: [
        { name: "Decoupling", weight: 5, keywords: ["queue", "background job", "worker", "asynchronous", "request path"] },
        { name: "Reliability", weight: 4, keywords: ["retry", "backoff", "dead-letter", "idempotent", "outbox"] },
      ],
    },
    modelAnswer:
      "The welcome email does not need to be sent before the user gets a response, so it should not sit in the request path. Enqueue a job after creating the user and respond; a worker sends the email, retries with exponential backoff while the provider is down, and moves jobs that keep failing to a dead-letter queue for inspection. Calling the API without awaiting it looks similar but loses the email on any error or crash and never retries. If the job must never be lost once the user exists, write it in the same transaction as the user (an outbox table).",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-04",
    track: "backend",
    level: "mid",
    difficulty: 1,
    type: "debugging",
    tags: ["security", "owasp", "api", "prisma"],
    prompt:
      "What is the security problem in this profile-update handler?\n\n    app.patch(\"/me\", requireAuth, async (req, res) => {\n      await prisma.user.update({\n        where: { id: req.user.id },\n        data: req.body,\n      });\n      res.sendStatus(204);\n    });",
    options: [
      "SQL injection: Prisma concatenates the values in req.body into the UPDATE statement that it generates",
      "IDOR: a caller can update another user's profile by sending a different id inside the request body",
      "Mass assignment: a caller can also set fields such as role or emailVerified; copy only allowlisted fields",
      "Race condition: two concurrent PATCH requests can corrupt the row, so it needs SELECT ... FOR UPDATE first",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "mass assignment",
      "the client controls which columns are written",
      "privilege escalation through role or verification flags",
      "validate with a schema and allowlist the editable fields",
      "OWASP API Security: broken object property level authorisation",
    ],
    redFlags: ["the ORM's parameterisation makes this safe", "client-side validation prevents it"],
    rubric: {
      criteria: [
        { name: "Vulnerability", weight: 5, keywords: ["mass assignment", "role", "privilege escalation", "req.body", "any field"] },
        { name: "Fix", weight: 4, keywords: ["allowlist", "schema", "validation", "dto", "pick"] },
      ],
    },
    modelAnswer:
      "Passing `req.body` straight into `data` lets the caller write any column on their own user row, so a body such as `{ \"role\": \"admin\" }` or `{ \"emailVerified\": true }` escalates privileges. This is mass assignment, which the OWASP API Security Top 10 groups under broken object property level authorisation. Validate the body against a schema and copy only the fields users may edit, such as name and avatarUrl. Prisma sends values as parameters, so this is not SQL injection, and the where clause already limits the update to the caller's own row.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-05",
    track: "backend",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["logging", "security", "secrets management"],
    prompt:
      "To debug failed payments, a developer adds `logger.info({ headers: req.headers, body: req.body })` for every request. What is the main problem with this, and the fix?",
    options: [
      "Logs would then hold secrets and personal data (Authorization headers, cookies, card details); redact or allowlist fields",
      "Log tools cannot search structured objects, so each request should be written out as one formatted string instead of an object",
      "Reading req.body for logging consumes the request stream, so the route handler can no longer parse the body itself",
      "Info level is reserved for errors in production, so the call has to use logger.error or the pipeline drops the line",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "logs are copied widely, kept for a long time and readable by many people",
      "Authorization headers, cookies, passwords and card data must not be logged",
      "redact sensitive paths or log an allowlist of fields",
      "structured JSON logging is still good practice",
      "compliance obligations such as PCI DSS and GDPR",
    ],
    redFlags: ["logs are internal, so secrets in them are safe", "structured logs are harder to search"],
    rubric: {
      criteria: [
        { name: "Risk", weight: 5, keywords: ["secrets", "authorization header", "cookies", "personal data", "card", "tokens"] },
        { name: "Fix", weight: 4, keywords: ["redact", "allowlist", "mask", "structured logging"] },
      ],
    },
    modelAnswer:
      "Logs are shipped to many systems, kept for a long time and readable by far more people than the database, so logging raw headers and bodies leaks bearer tokens, session cookies, passwords and card details; card data in logs also breaks PCI DSS. Log an allowlist of useful fields (request id, route, status, duration) or configure the logger to redact paths such as req.headers.authorization and req.headers.cookie. Structured JSON logging is itself good practice, and with a body parser such as express.json() the body has already been parsed, so reading req.body consumes nothing.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ───────────────────────────────────────────────────────
  {
    id: "qb-backend-mid-06",
    track: "backend",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["sql", "postgresql"],
    prompt:
      "This query should list every customer with their number of orders in 2025, including customers with none, but customers without 2025 orders are missing from the result. What is the fix?\n\n    SELECT c.id, c.name, COUNT(o.id) AS orders_2025\n    FROM customers c\n    LEFT JOIN orders o ON o.customer_id = c.id\n    WHERE o.created_at >= '2025-01-01'\n      AND o.created_at < '2026-01-01'\n    GROUP BY c.id, c.name;",
    options: [
      "Change COUNT(o.id) to COUNT(*) so that customers without any orders are counted as zero",
      "Replace the LEFT JOIN with a RIGHT JOIN so that every row from customers is kept",
      "Move the two created_at conditions from the WHERE clause into the LEFT JOIN's ON clause",
      "Add HAVING COUNT(o.id) >= 0 so that groups with no matching orders are not filtered out",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "WHERE is applied after the join",
      "for unmatched customers the order columns are NULL, so the WHERE condition fails",
      "the LEFT JOIN effectively becomes an INNER JOIN",
      "filter the right-hand table in the ON clause",
      "COUNT(column) ignores NULLs, so it returns 0",
    ],
    redFlags: ["COUNT(*) returns 0 for unmatched rows", "HAVING can bring back rows removed by WHERE"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 5, keywords: ["where", "null", "left join", "inner join", "filtered out"] },
        { name: "Fix", weight: 4, keywords: ["on clause", "join condition", "count(o.id)", "zero"] },
      ],
    },
    modelAnswer:
      "The WHERE clause runs after the join, and for customers with no 2025 orders `o.created_at` is NULL, so the condition is not true and those rows are removed; the LEFT JOIN behaves like an inner join. Putting the date conditions in the ON clause restricts which orders are joined while keeping every customer, and `COUNT(o.id)` then returns 0 for them because it ignores NULLs. `COUNT(*)` would wrongly count the NULL-filled row as 1, and HAVING runs after WHERE, so it cannot bring the rows back.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-07",
    track: "backend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["api versioning", "api", "rest"],
    prompt:
      "A public JSON API is used by mobile apps that you cannot force to update; their JSON parsers ignore response fields they do not recognise. Which of these changes are breaking for existing clients, so they need a new version or a deprecation period? Select all that apply.",
    options: [
      "Adding a new optional field to a response object",
      "Making the previously optional request field currency required",
      "Adding an optional ?status= query parameter that filters a list",
      "Changing the type of the id field from a number to a string",
      "Removing the response field legacyTotal, which few clients read",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 3, 4],
    multiSelect: true,
    expectedPoints: [
      "rejecting requests that used to be valid is breaking",
      "changing a field's type is breaking",
      "removing a field breaks any client that still reads it",
      "additive, optional changes are backwards compatible",
      "tolerant reader: clients ignore unknown fields",
      "deprecate, monitor usage, then remove",
    ],
    redFlags: ["a field few clients use can be removed without notice", "every change needs a new major version"],
    rubric: {
      criteria: [
        { name: "Breaking changes", weight: 5, keywords: ["required", "type change", "remove", "breaking", "old clients"] },
        { name: "Compatible evolution", weight: 4, keywords: ["additive", "optional", "tolerant reader", "deprecation", "version"] },
      ],
    },
    modelAnswer:
      "A change is breaking when a request that used to work now fails, or a response no longer has the shape a client relies on. Making an optional request field required rejects requests that old clients still send, changing a field's type breaks clients that parse it as a number, and removing a field breaks whichever clients still read it, because few is not none. Adding an optional response field or an optional query parameter is additive and backwards compatible, because these clients ignore fields they do not recognise (the tolerant-reader principle); a client whose parser rejects unknown fields, as some strict deserialisers do by default, would break even on additive changes, which is why tolerant parsing belongs in the API's compatibility contract. Breaking changes need a new version, or a deprecation period in which old and new forms coexist while usage of the old one is monitored.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-08",
    track: "backend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["authentication", "security"],
    prompt:
      "An Express app with server-side sessions logs a user in by setting `req.session.userId = user.id`, keeping the session id that the browser already had before login. Which attack does this allow, and what is the fix?",
    options: [
      "Session fixation: a session id planted by an attacker becomes authenticated; regenerate the id at login",
      "Cross-site scripting: page scripts can read the reused id; set the HttpOnly flag on the cookie only after login",
      "Credential stuffing: a reused id helps attackers try leaked passwords; add a CAPTCHA to the login form instead",
      "Clickjacking: another site can frame the login page and capture clicks; send X-Frame-Options: DENY on login",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "session fixation",
      "the attacker knows or sets the victim's pre-login session id",
      "issue a new session id at login and on privilege changes",
      "req.session.regenerate() in express-session",
      "cookie flags (HttpOnly, Secure, SameSite) are defence in depth",
    ],
    redFlags: ["session ids only need changing at logout", "HttpOnly alone prevents fixation"],
    rubric: {
      criteria: [
        { name: "Attack", weight: 5, keywords: ["session fixation", "known session id", "pre-login", "attacker", "victim"] },
        { name: "Fix", weight: 4, keywords: ["regenerate", "new session id", "login", "privilege change", "invalidate"] },
      ],
    },
    modelAnswer:
      "If the session id survives login, an attacker who can make the victim's browser use an id the attacker knows (for example through a cookie set from a compromised subdomain, or an app that accepts session ids in URLs) only has to wait for the victim to log in, then use that same id as an authenticated session. Issuing a fresh session id at login, and on any privilege change, defeats this; in express-session that is `req.session.regenerate()` before setting userId. HttpOnly, Secure and SameSite flags protect against other attacks but do not stop a fixed id from becoming authenticated.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-09",
    track: "backend",
    level: "mid",
    difficulty: 2,
    type: "behavioral",
    tags: ["incident management", "release strategies", "behavioral"],
    prompt:
      "Ten minutes after you deploy a change to the checkout service, its error rate rises from 0.1% to 4%. You suspect your change but are not certain. What should you do first?",
    options: [
      "Debug it in production and ship a hotfix forward, because rolling back would throw away the rest of the release",
      "Wait half an hour to see whether the error rate settles by itself before treating the situation as an incident",
      "Roll back the deploy (or switch off its feature flag), post in the incident channel, then investigate",
      "Ask in the team channel whether anyone else deployed recently, and take no action until somebody has replied",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "mitigate first: restore service before finding the root cause",
      "rolling back a suspected change is fast and reversible",
      "communicate early in the incident channel",
      "investigate with logs, metrics and traces once stable",
      "blameless post-incident review",
    ],
    redFlags: ["hotfix forward under pressure without mitigating", "wait and see while customers are failing"],
    rubric: {
      criteria: [
        { name: "Mitigation", weight: 5, keywords: ["roll back", "feature flag", "mitigate", "restore service", "first"] },
        { name: "Communication and follow-up", weight: 4, keywords: ["incident channel", "communicate", "investigate", "post-incident review", "blameless"] },
      ],
    },
    modelAnswer:
      "While customers are failing, the priority is to restore service, not to prove the cause. A deploy ten minutes earlier is the most likely trigger, and rolling it back (or switching off its feature flag) is fast and reversible, so you do it before you are certain. Say what you are doing in the incident channel so others do not act in parallel, confirm the error rate recovers, then investigate from a stable state with logs and traces. A rushed hotfix risks a second bad deploy, and waiting or asking around only prolongs the outage.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-10",
    track: "backend",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["http", "rest", "consistency"],
    prompt:
      "Two admins open the same product, edit it and save. The API sends an ETag with GET /products/7, and clients send it back in an If-Match header with PUT. How should the API answer the second save, whose If-Match no longer matches the product's current ETag?",
    options: [
      "Apply it with 200 OK, because the last write to arrive should always be the one that wins",
      "Reject it with 412 Precondition Failed, so the client re-fetches, merges and retries",
      "Reject it with 304 Not Modified, because the client's copy of the product is stale",
      "Reject it with 401 Unauthorized, because the admin's earlier read has now expired",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "optimistic concurrency control",
      "the ETag identifies the version the client edited",
      "If-Match makes the write conditional",
      "412 Precondition Failed when the condition fails",
      "the client re-fetches, merges and retries",
      "the server-side check and update must be atomic",
    ],
    redFlags: ["last write wins is always acceptable", "304 is the response to a failed write"],
    rubric: {
      criteria: [
        { name: "Mechanism", weight: 4, keywords: ["etag", "if-match", "conditional request", "optimistic", "version"] },
        { name: "Response", weight: 5, keywords: ["412", "precondition failed", "lost update", "re-fetch", "retry"] },
      ],
    },
    modelAnswer:
      "ETag with If-Match is optimistic concurrency control over HTTP: the client says 'apply this only if the product is still the version I read'. When the condition fails, the server must not apply the write and answers 412 Precondition Failed; the client re-fetches, merges or asks the user, and retries with the new ETag, so the first admin's changes are not silently overwritten (a lost update). 304 Not Modified answers conditional GETs that use If-None-Match, not failed writes. On the server the check and the write must be atomic, for example `UPDATE ... WHERE id = $1 AND version = $2`.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ───────────────────────────────────────────────────────
  {
    id: "qb-backend-mid-11",
    track: "backend",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["postgresql", "sql", "performance"],
    prompt:
      "The orders table in PostgreSQL has 50 million rows, and this query is slow. Which index design serves it best?\n\n    SELECT id, total FROM orders\n    WHERE status = 'pending'\n      AND created_at >= now() - interval '1 day'\n    ORDER BY created_at DESC\n    LIMIT 50;",
    options: [
      "A B-tree index on (created_at, status), so that the one-day date range is narrowed down first",
      "Two separate B-tree indexes, one on status and another on created_at, combined by the planner",
      "A hash index on status, because the query compares the status column by equality",
      "A B-tree index on (status, created_at), equality column first, then the range and sort column",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "composite B-tree index",
      "equality columns before range columns",
      "index order satisfies ORDER BY, so no sort is needed",
      "LIMIT lets the scan stop early",
      "INCLUDE columns can enable an index-only scan",
      "confirm with EXPLAIN ANALYZE",
    ],
    redFlags: ["column order in a composite index does not matter", "hash indexes support range queries"],
    rubric: {
      criteria: [
        { name: "Index design", weight: 5, keywords: ["composite", "column order", "equality first", "range", "b-tree"] },
        { name: "Execution", weight: 3, keywords: ["order by", "sort", "limit", "explain", "index-only scan"] },
      ],
    },
    modelAnswer:
      "With (status, created_at), PostgreSQL seeks straight to the 'pending' entries, which are stored in created_at order, so it reads the newest ones backwards and stops after 50 rows without sorting. With (created_at, status) the equality column comes second, so the scan walks the time range in date order and steps over every non-pending order until it has found 50. Separate single-column indexes cannot give both the filter and the order in one scan, and a hash index supports only equality, so it helps with neither the range nor the ORDER BY. The rule of thumb is equality columns first, then the range or sort column; confirm the plan with EXPLAIN ANALYZE.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-12",
    track: "backend",
    level: "mid",
    difficulty: 3,
    type: "debugging",
    tags: ["mongodb", "security", "owasp"],
    prompt:
      "What is the vulnerability in this password-reset handler (MongoDB, with express.json() parsing the body)?\n\n    app.post(\"/reset-password\", async (req, res) => {\n      const user = await users.findOne({\n        email: req.body.email,\n        resetToken: req.body.token,\n      });\n      if (!user) return res.sendStatus(400);\n      await setPassword(user._id, req.body.newPassword);\n      res.sendStatus(204);\n    });",
    options: [
      "Operator injection: token can arrive as {\"$ne\": null}, which matches any stored token; require both fields to be strings",
      "SQL injection: the email is concatenated into the query text, so it has to be passed to the driver as a bound parameter",
      "Mass assignment: the newPassword field lets the caller overwrite every other field on the user document as well",
      "Account enumeration: answering 400 for an unknown email reveals which accounts exist, so it should always send 204",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "JSON bodies can contain objects, not only strings",
      "MongoDB treats $-prefixed keys as query operators",
      "{ $ne: null } matches any non-null token",
      "validate types with a schema",
      "sanitise filters, for example Mongoose's sanitizeFilter",
      "store reset tokens hashed, short-lived and single-use",
    ],
    redFlags: ["NoSQL databases cannot be injected", "only SQL queries need input validation"],
    rubric: {
      criteria: [
        { name: "Vulnerability", weight: 5, keywords: ["operator injection", "nosql injection", "$ne", "object", "query operator"] },
        { name: "Fix", weight: 4, keywords: ["validate", "schema", "string", "sanitize", "sanitizefilter"] },
      ],
    },
    modelAnswer:
      "express.json() accepts any JSON, so token can be an object rather than a string. A body of `{\"email\": \"victim@example.com\", \"token\": {\"$ne\": null}}` turns the filter into 'the user with this email whose resetToken is not null', so an attacker who triggers a reset email for the victim can set the victim's password without ever seeing the token. Validate the body with a schema that requires strings (or reject $-prefixed keys, for example with Mongoose's sanitizeFilter), and store reset tokens hashed, short-lived and single-use. The handler returns 400 for an unknown email and for a wrong token alike, so it does not reveal which accounts exist.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-13",
    track: "backend",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["mongodb", "database"],
    prompt:
      "In MongoDB, each blog post document embeds all of its comments in an array. Popular posts now have tens of thousands of comments, and writes to them keep getting slower. What is the better model?",
    options: [
      "Keep embedding the comments, but add a multikey index on the array so that pushing new comments is fast",
      "Store each comment as its own document in a comments collection, with an indexed postId field for paging",
      "Create a separate collection for each post, so that every post's comments are stored on their own",
      "Store the comments array as a single JSON string field, so MongoDB treats the whole list as one value",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "embed data that is bounded and read together with its parent",
      "unbounded arrays grow toward the 16 MB document limit",
      "large documents mean write amplification on every change",
      "reference instead: a comments collection with postId",
      "compound index such as { postId: 1, createdAt: -1 }",
      "optionally embed the latest few comments (subset pattern)",
    ],
    redFlags: ["documents can grow without limit", "an index reduces document size"],
    rubric: {
      criteria: [
        { name: "Modelling", weight: 5, keywords: ["embed", "reference", "unbounded", "separate collection", "postid"] },
        { name: "Limits and performance", weight: 3, keywords: ["16 mb", "document size", "write amplification", "index", "subset pattern"] },
      ],
    },
    modelAnswer:
      "Embedding suits data that is bounded and read together with its parent. An unbounded array keeps growing toward MongoDB's 16 MB document limit, every new comment makes the storage engine write a new version of an ever-larger document, and every read of the post pulls the whole array into memory. Comments that grow without bound belong in their own collection, each referencing its post, with an index such as { postId: 1, createdAt: -1 } so that a page of comments is a cheap indexed query; many designs also embed the latest few comments in the post (the subset pattern) for a fast first render. A multikey index speeds up queries on array elements but does nothing about document size, and a collection per post does not scale to many posts.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-14",
    track: "backend",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["contract testing", "testing", "microservices"],
    prompt:
      "The orders service's tests stub the users service's HTTP responses, and they all pass. The users team then renames a response field, and orders breaks in production even though both teams' test suites were green. Which practice would have caught this before the deploy?",
    options: [
      "Adding more unit tests to the orders service, each stubbing the users service's HTTP responses in much more detail",
      "Raising the line-coverage target for both services and enforcing it as a required merge check in each repository",
      "Adding snapshot tests that record the stubbed users responses and fail the build whenever one of those stubs changes",
      "Consumer-driven contract tests: orders publishes what it relies on, and the users CI verifies each change against it",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "stubs encode the consumer's assumptions, which can drift from reality",
      "contract tests make those assumptions explicit and shared",
      "the provider verifies the contracts in its own CI before deploying",
      "tools such as Pact with a contract broker",
      "cheaper and faster than full end-to-end environments",
    ],
    redFlags: ["more mocks catch integration bugs", "coverage measures correctness across services"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 4, keywords: ["stub", "mock", "assumption", "drift", "integration"] },
        { name: "Contract testing", weight: 5, keywords: ["consumer-driven", "contract", "provider verification", "pact", "ci"] },
      ],
    },
    modelAnswer:
      "The orders tests only check orders against its own stubs, which encode what that team believed the users API returns, and nothing told the users team that anyone depended on the field. With consumer-driven contract testing (for example Pact), the consumer records the requests and fields it relies on as a contract, and the provider's CI replays them against the real users service on every change, so the rename fails the users build before it ships. More detailed stubs, snapshots of stubs or higher coverage all keep testing against the same stale assumption.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ───────────────────────────────────────────────────────
  {
    id: "qb-backend-mid-15",
    track: "backend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["node.js", "event-loop", "performance"],
    prompt:
      "A Node.js API hashes passwords with the asynchronous `crypto.scrypt` on every login. During a login spike, unrelated endpoints that read files with `fs.promises.readFile` also slow down sharply, although event-loop delay stays low. What is the most likely cause?",
    options: [
      "The async scrypt call still runs on the main thread between awaits, so it blocks the event loop for every request",
      "fs.promises.readFile reads files synchronously under the hood, so each read waits for the disk on the main thread",
      "scrypt and async fs calls share libuv's thread pool (4 threads by default), so file reads queue behind the hashes",
      "V8's garbage collector suspends all I/O callbacks while scrypt allocates the memory for each password hash it computes",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "libuv's thread pool runs async fs, dns.lookup, zlib and crypto such as scrypt and pbkdf2",
      "the pool has 4 threads by default",
      "CPU-heavy jobs saturate it and unrelated work queues behind them",
      "event-loop delay can stay low while the pool is saturated",
      "UV_THREADPOOL_SIZE, a dedicated worker pool or service, and login rate limiting",
    ],
    redFlags: ["async functions each get their own thread", "Node.js uses no threads at all"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 5, keywords: ["thread pool", "libuv", "four threads", "saturated", "queue"] },
        { name: "Remedies", weight: 3, keywords: ["uv_threadpool_size", "worker threads", "rate limit", "separate service", "event-loop delay"] },
      ],
    },
    modelAnswer:
      "Async fs operations, dns.lookup, zlib and CPU-heavy crypto such as scrypt and pbkdf2 run on libuv's worker thread pool, which has only 4 threads by default. A burst of logins fills those threads with slow hashing jobs, so file reads wait in the same queue even though the main thread is idle, which is why event-loop delay looks healthy. Raising UV_THREADPOOL_SIZE (set before the pool is first used) to suit the available cores helps, and moving hashing to a dedicated worker pool or service and rate-limiting login attempts isolates it. The async scrypt does not run on the main thread, and fs.promises does not read synchronously.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-16",
    track: "backend",
    level: "mid",
    difficulty: 4,
    type: "coding",
    tags: ["node.js", "express", "performance"],
    prompt:
      "With `res.write(toCsvLine(row));` as the loop body, memory climbs into gigabytes whenever slow clients download this export. Which loop body fixes it?\n\n    import { once } from \"node:events\";\n\n    app.get(\"/export.csv\", async (req, res) => {\n      res.type(\"text/csv\");\n      for await (const row of db.cursor(\"SELECT * FROM events\")) {\n        // loop body\n      }\n      res.end();\n    });",
    options: [
      "`await res.write(toCsvLine(row));`",
      "`if (!res.write(toCsvLine(row))) await once(res, \"drain\");`",
      "`res.write(toCsvLine(row)); res.flushHeaders();`",
      "`res.cork(); res.write(toCsvLine(row)); process.nextTick(() => res.uncork());`",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "res.write() returns false once the buffer passes highWaterMark",
      "writing on regardless buffers the data in memory",
      "wait for the 'drain' event before writing more",
      "awaiting write() does not wait, because it returns a boolean",
      "stream.pipeline also handles errors and client disconnects",
    ],
    redFlags: ["res.write waits until the client has received the data", "streaming always keeps memory constant"],
    rubric: {
      criteria: [
        { name: "Backpressure", weight: 5, keywords: ["backpressure", "write returns false", "drain", "highwatermark", "buffer"] },
        { name: "Robust streaming", weight: 3, keywords: ["pipeline", "disconnect", "error", "cursor", "memory"] },
      ],
    },
    modelAnswer:
      "`res.write()` never blocks: it queues the chunk in memory and returns false once the buffered data passes the stream's highWaterMark, telling the producer to stop until 'drain'. The original loop ignores that signal, so with a slow client the whole result set ends up buffered in the process. Checking the return value and awaiting `once(res, \"drain\")` pauses the cursor until the socket catches up. `await res.write(...)` awaits a boolean and so does not wait at all, while cork/uncork and flushHeaders only change when bytes are sent; in production code, stream.pipeline() with a transform also handles errors and client disconnects.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-17",
    track: "backend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["jwt", "oidc", "authentication"],
    prompt:
      "Your API receives JWT access tokens issued by your company's OpenID Connect provider. Which checks must the API make before trusting a token? Select all that apply.",
    options: [
      "Verify the signature with a key from the issuer's JWKS, accepting only an allowlisted algorithm such as RS256",
      "Verify with whichever algorithm the token's alg header names, so that tokens in any supported format work",
      "Check that the aud claim identifies this API and that iss is the expected issuer",
      "Check that exp is still in the future, allowing at most a small clock skew",
      "Also accept the user's ID token as a bearer token, since the same provider signs it and it names the user",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2, 3],
    multiSelect: true,
    expectedPoints: [
      "verify the signature against the issuer's JWKS",
      "fix the accepted algorithms in configuration; never trust the alg header",
      "check iss and aud",
      "check exp (and nbf) with a small clock skew",
      "accept access tokens, not ID tokens",
      "then authorise using scopes or roles",
    ],
    redFlags: ["decoding a JWT is the same as verifying it", "an ID token is a valid credential for any API"],
    rubric: {
      criteria: [
        { name: "Signature", weight: 5, keywords: ["signature", "jwks", "algorithm", "rs256", "alg none"] },
        { name: "Claims", weight: 4, keywords: ["aud", "iss", "exp", "audience", "issuer", "expiry"] },
        { name: "Token types", weight: 2, keywords: ["access token", "id token", "client", "resource server"] },
      ],
    },
    modelAnswer:
      "A JWT is only trustworthy after the API verifies its signature against the issuer's published keys (JWKS) with an algorithm fixed in configuration; letting the token's own alg header decide enables 'alg: none' and key-confusion attacks. The API must then check the claims: iss is the expected provider, aud is this API, so a token minted for another service cannot be replayed here, and exp has not passed. ID tokens are meant for the client application to learn who signed in, and their audience is that client rather than your API, so APIs should accept access tokens only.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-18",
    track: "backend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["metrics", "prometheus"],
    prompt:
      "A developer adds user_id and the raw request path (such as /orders/8231) as labels on an HTTP request-duration histogram. Prometheus memory use then climbs until it crashes. What went wrong?",
    options: [
      "Histograms keep every observed duration in memory until scraped, so durations should be recorded with a counter instead",
      "Prometheus scrapes too often for that much traffic; raising the scrape interval to five minutes would solve it",
      "Label values have to be numeric, so string labels such as paths are copied in full into every stored sample",
      "Every label combination is its own time series, so unbounded values like user ids and raw paths create millions",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "every label combination is a separate time series",
      "a histogram multiplies series by its bucket count",
      "unbounded label values cause a cardinality explosion",
      "use route templates, methods and status classes as labels",
      "put per-user and per-request detail into logs and traces",
    ],
    redFlags: ["labels are free", "a longer scrape interval reduces the number of series"],
    rubric: {
      criteria: [
        { name: "Cardinality", weight: 5, keywords: ["cardinality", "time series", "label", "unbounded", "user_id"] },
        { name: "Better labelling", weight: 4, keywords: ["route template", "low cardinality", "logs", "traces", "status"] },
      ],
    },
    modelAnswer:
      "In Prometheus every distinct combination of metric name and label values is a separate time series, and a histogram multiplies that by its number of buckets. Labels with unbounded values, such as user ids or raw URLs containing ids, create a cardinality explosion that exhausts memory. A histogram stores only a counter per bucket plus a sum and a count, not the individual observations, so switching to a counter would not help while the labels stay unbounded. Keep labels low-cardinality (method, route template such as /orders/:id, status class) and put per-user or per-request detail into logs and traces, which are built for high-cardinality data. Changing the scrape interval does not reduce the number of series either.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-19",
    track: "backend",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["node.js", "kubernetes", "high availability"],
    prompt:
      "On every rolling deploy to Kubernetes, a few requests to a Node.js API fail with connection resets or 502 errors. The process exits as soon as it receives SIGTERM. What fixes this?",
    options: [
      "Ignore SIGTERM, so that Kubernetes cannot stop a pod while it is still in the middle of serving requests",
      "Call process.exit(0) at once on SIGTERM, since a clean exit code tells Kubernetes that requests finished",
      "Raise the liveness probe's failure threshold, so that Kubernetes waits longer before stopping the pod",
      "On SIGTERM, stop taking new connections, let in-flight requests finish, close the database pool, then exit",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "Kubernetes sends SIGTERM, then SIGKILL after the grace period",
      "endpoint removal happens in parallel, so traffic can still arrive briefly",
      "server.close() stops new connections and waits for in-flight requests",
      "close idle keep-alive connections, database pools and queue consumers",
      "a short preStop delay and an adequate terminationGracePeriodSeconds",
    ],
    redFlags: ["SIGTERM can safely be ignored", "liveness probes control shutdown during a deploy"],
    rubric: {
      criteria: [
        { name: "Shutdown sequence", weight: 5, keywords: ["sigterm", "server.close", "in-flight", "drain", "close pool"] },
        { name: "Kubernetes", weight: 3, keywords: ["grace period", "sigkill", "endpoints", "prestop", "readiness"] },
      ],
    },
    modelAnswer:
      "During a rolling update Kubernetes sends SIGTERM, removes the pod from the Service's endpoints in parallel, and sends SIGKILL if the container has not exited when terminationGracePeriodSeconds (30 seconds by default) runs out. Exiting immediately cuts off requests in progress and any that arrive before the load balancers notice the pod has gone. A graceful handler keeps serving for a moment (often through a short preStop delay), calls server.close() so no new connections are accepted, closes idle keep-alive connections, waits for in-flight requests, closes the database pool and exits within the grace period. Ignoring SIGTERM only postpones the SIGKILL, and liveness probes do not govern shutdown.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ───────────────────────────────────────────────────────
  {
    id: "qb-backend-mid-20",
    track: "backend",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["transactions", "postgresql", "consistency"],
    prompt:
      "Each request runs a transaction that counts the doctors on call for a shift and, if there are at least two, sets the requesting doctor off call. Two doctors send the request at the same moment against PostgreSQL at REPEATABLE READ; both transactions commit, and nobody is left on call. What prevents this?",
    options: [
      "Switch to READ COMMITTED, so each statement sees the latest data committed by other transactions",
      "Add a unique index on (shift_id, doctor_id), so that the two concurrent updates conflict",
      "Run these transactions at SERIALIZABLE and retry any that fail with a serialization error",
      "Nothing: REPEATABLE READ already rejects concurrent writes to one table, so the bug is elsewhere",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "write skew",
      "snapshot isolation only detects write-write conflicts on the same row",
      "SERIALIZABLE (SSI) tracks read-write dependencies",
      "retry on serialization failure (SQLSTATE 40001)",
      "alternative: lock the rows the check reads with SELECT ... FOR UPDATE",
    ],
    redFlags: ["REPEATABLE READ prevents every anomaly", "READ COMMITTED is safer because it sees newer data"],
    rubric: {
      criteria: [
        { name: "Anomaly", weight: 5, keywords: ["write skew", "snapshot", "different rows", "read-write", "anomaly"] },
        { name: "Prevention", weight: 5, keywords: ["serializable", "retry", "serialization failure", "40001", "for update"] },
      ],
    },
    modelAnswer:
      "This is write skew: both transactions read the same rows, each sees two doctors on call, and each updates a different row, so there is no write-write conflict for REPEATABLE READ (snapshot isolation) to detect. PostgreSQL's SERIALIZABLE level tracks these read-write dependencies and aborts one transaction with a serialization failure (SQLSTATE 40001), which the application must retry. Locking the rows the check reads with SELECT ... FOR UPDATE is an alternative. READ COMMITTED is weaker still, and a unique index does not help because the two updates touch different rows.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-21",
    track: "backend",
    level: "mid",
    difficulty: 5,
    type: "debugging",
    tags: ["security", "express", "api"],
    prompt:
      "Signature checks on a payment provider's webhooks fail for some events even though the secret is correct. The provider signs the raw request body with HMAC-SHA256. What is the bug?\n\n    app.post(\"/webhooks/pay\", express.json(), (req, res) => {\n      const expected = crypto\n        .createHmac(\"sha256\", process.env.WEBHOOK_SECRET)\n        .update(JSON.stringify(req.body))\n        .digest(\"hex\");\n      if (expected !== req.get(\"X-Signature\")) {\n        return res.sendStatus(401);\n      }\n      handleEvent(req.body);\n      res.sendStatus(200);\n    });",
    options: [
      "It signs re-serialised JSON, not the bytes received; verify the raw body (express.raw) and compare using timingSafeEqual",
      "HMAC-SHA256 mixes a random salt into every digest, so two digests of the very same request body only rarely match exactly",
      "express.json() strips custom headers such as X-Signature, so req.get() returns undefined for some of the events",
      "The secret must be base64-decoded before createHmac is called, otherwise only the smaller request bodies verify",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the signature covers the exact raw bytes",
      "a JSON.parse / JSON.stringify round trip can change the bytes",
      "use express.raw on this route or keep the raw buffer",
      "constant-time comparison with crypto.timingSafeEqual",
      "check the signed timestamp to reject replays",
    ],
    redFlags: ["HMAC is non-deterministic", "comparing secrets with !== is fine"],
    rubric: {
      criteria: [
        { name: "Raw body", weight: 5, keywords: ["raw body", "bytes", "re-serialise", "json.stringify", "express.raw"] },
        { name: "Safe comparison", weight: 3, keywords: ["timingsafeequal", "constant-time", "timing attack", "replay", "timestamp"] },
      ],
    },
    modelAnswer:
      "The provider signed the exact bytes it sent, but this code signs `JSON.stringify(req.body)`, a re-serialisation that can differ in whitespace, Unicode escaping, number formatting (1.0 becomes 1) or the order of integer-like keys, so events containing those fail. Compute the HMAC over the raw body, for example with `express.raw({ type: \"application/json\" })` on this route, and compare digests with crypto.timingSafeEqual on equal-length buffers instead of !==, which can leak timing information. HMAC is deterministic: the same secret and bytes always produce the same digest. Most providers also sign a timestamp, which should be checked to reject replayed events.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-22",
    track: "backend",
    level: "mid",
    difficulty: 5,
    type: "system-design",
    tags: ["connection pooling", "postgresql", "scaling"],
    prompt:
      "An API runs on 8 Kubernetes pods, each with a database pool of 20 connections, against PostgreSQL with max_connections = 200. In a traffic spike the autoscaler grows the deployment to 25 pods, and requests start failing with \"sorry, too many clients already\". What is the best fix?",
    options: [
      "Raise max_connections to 2,000, so that every pod can always open its full pool of connections",
      "Open a new connection for each query and close it straight away, so that no idle connections are held",
      "Remove the autoscaler's upper limit, so load spreads over more pods and each pod needs fewer connections",
      "Add a pooler such as PgBouncer in transaction mode, and size pod pools so their total fits the database",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "total demand is pods multiplied by pool size",
      "autoscaling multiplies connection demand",
      "each PostgreSQL connection is a backend process with its own memory",
      "an external pooler such as PgBouncer in transaction mode",
      "size pools to what the database can actually serve",
      "transaction pooling does not keep session state",
    ],
    redFlags: ["more connections always means more throughput", "open a new connection per query"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 4, keywords: ["max_connections", "pool size", "pods", "autoscaler", "too many clients"] },
        { name: "Fix", weight: 5, keywords: ["pgbouncer", "transaction mode", "pooler", "multiplex", "pool sizing"] },
      ],
    },
    modelAnswer:
      "Every pod's pool counts against max_connections, so demand is pods times pool size (25 x 20 = 500) and it grows with every pod the autoscaler adds. A pooler such as PgBouncer in transaction mode multiplexes many client connections onto a small, fixed set of server connections, and pod pools should be sized so their total fits what PostgreSQL can serve, which is usually far fewer active connections than people expect. Raising max_connections is the tempting option, but each PostgreSQL connection is a separate backend process with its own memory, and thousands of active ones add contention rather than throughput. Transaction pooling does not keep session state such as SET, session-level advisory locks or LISTEN between transactions, so the app must not rely on it.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-23",
    track: "backend",
    level: "mid",
    difficulty: 5,
    type: "debugging",
    tags: ["redis", "distributed systems", "consistency"],
    prompt:
      "Invoice 42 is occasionally generated twice at the same time, although every worker takes this Redis lock first. What is the bug?\n\n    const ok = await redis.set(\"lock:invoice:42\", \"1\", \"PX\", 10000, \"NX\");\n    if (!ok) return;\n    try {\n      await generateInvoice(42); // usually 2 s, sometimes 15 s\n    } finally {\n      await redis.del(\"lock:invoice:42\");\n    }",
    options: [
      "SET with NX and PX is not atomic, so two workers can both see the key as missing and then both acquire the same lock",
      "The lock can expire mid-run, and DEL then frees another worker's lock; store a unique token and delete only if it matches",
      "The finally block is skipped when generateInvoice throws, so a run that fails never releases the lock that it is holding",
      "Redis runs commands from different clients in parallel threads, so two NX checks on the same key can interleave",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the lock TTL (10 s) is shorter than the slowest job (15 s)",
      "after expiry, another worker acquires the lock",
      "an unconditional DEL removes someone else's lock",
      "unique token per holder, released by an atomic compare-and-delete Lua script",
      "extend the lease while working, and make the write idempotent or use fencing tokens",
    ],
    redFlags: ["SET NX is not atomic", "an expiring Redis lock alone guarantees mutual exclusion"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 5, keywords: ["ttl", "expire", "lock released", "another worker", "del"] },
        { name: "Fix", weight: 4, keywords: ["unique token", "lua", "compare and delete", "fencing token", "idempotent", "extend"] },
      ],
    },
    modelAnswer:
      "The lock expires after 10 seconds but a slow run takes 15, so a second worker acquires it while the first is still working; when the first finishes, its unconditional DEL removes the second worker's lock and lets a third in. Each holder should store a unique random value and release the lock with a Lua script that deletes the key only if it still holds that value, and should extend the TTL while it works (or choose one safely above the worst case). Because an expiring lock can still be lost during a long pause, the protected write should also be idempotent (for example a unique constraint on the invoice number) or guarded by a fencing token that storage checks. SET with NX and PX is a single atomic command, and Redis executes commands one at a time.",
    followUpIds: [],
  },
  {
    id: "qb-backend-mid-24",
    track: "backend",
    level: "mid",
    difficulty: 5,
    type: "system-design",
    tags: ["transactions", "postgresql", "distributed systems"],
    prompt:
      "A checkout handler opens a database transaction, locks the order row with SELECT ... FOR UPDATE, calls the payment provider's API (1-10 seconds), records the result and commits. Under load, requests time out waiting for a database connection and lock waits pile up. What is the best redesign?",
    options: [
      "Increase the connection pool size and lock_timeout, so that waiting requests eventually get a connection and the lock",
      "Run the transaction at SERIALIZABLE isolation, so that PostgreSQL can schedule the competing payments more efficiently",
      "Commit 'payment pending', call the provider outside any transaction with an idempotency key, then record the result",
      "Start the payment call inside the transaction without awaiting it, so that the commit no longer waits for the provider",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "never hold a transaction or row lock across a slow network call",
      "each in-flight call pins a pooled connection",
      "explicit states: pending, then paid or failed",
      "idempotency key so that retries cannot charge twice",
      "short transactions before and after the call",
      "reconcile stuck pending orders with a background job or the provider's webhook",
    ],
    redFlags: ["a bigger pool fixes lock contention", "a database rollback can undo the provider's charge"],
    rubric: {
      criteria: [
        { name: "Diagnosis", weight: 4, keywords: ["long transaction", "lock", "connection held", "network call", "pool exhausted"] },
        { name: "Redesign", weight: 5, keywords: ["pending state", "idempotency key", "short transactions", "reconcile", "webhook"] },
      ],
    },
    modelAnswer:
      "Holding a transaction open across a 1-10 second network call pins a pooled connection and keeps the row lock for the whole call, so throughput is capped by the provider's latency, and rolling back the database cannot undo the provider's charge anyway. Instead, mark the order 'payment pending' in a short transaction, call the provider outside any transaction with an idempotency key derived from the order, then record success or failure in a second short transaction that checks the order is still pending. A background job (or the provider's webhook) reconciles orders left pending by crashes, and the idempotency key makes those retries safe. A bigger pool or longer lock timeout only lets more requests queue, and SERIALIZABLE adds aborts without shortening the lock.",
    followUpIds: [],
  },
];
