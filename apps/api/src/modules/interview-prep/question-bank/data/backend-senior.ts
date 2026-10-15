import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-senior-01",
    track: "backend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["oauth", "authentication", "security"],
    prompt:
      "You are designing sign-in for a new mobile app and a browser single-page app. Both call your API and sign users in through an external identity provider. Which OAuth 2.0 flow does current security best practice recommend for these public clients?",
    options: [
      "The implicit flow, since public clients cannot hold a secret and tokens arrive directly in the redirect URL",
      "The password grant, with the app collecting the user's credentials and exchanging them for tokens itself",
      "The authorisation code flow with PKCE, exchanging a one-time code and a per-login code verifier for tokens",
      "The client credentials flow, with a client secret embedded in the app and rotated on every release",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "authorisation code flow with PKCE for all public clients",
      "public clients cannot keep a client secret",
      "PKCE binds the code to a per-login verifier, so a stolen code is useless",
      "implicit flow exposes tokens in URLs and is no longer recommended",
      "the password grant hands credentials to the app and defeats SSO and MFA",
      "client credentials is for machine-to-machine calls with no user",
    ],
    redFlags: [
      "the implicit flow is the recommended choice for SPAs",
      "a client secret embedded in a mobile app stays secret",
    ],
    rubric: {
      criteria: [
        {
          name: "Correct flow",
          weight: 5,
          keywords: ["authorization code", "pkce", "code verifier", "code challenge", "public client"],
        },
        {
          name: "Why not the alternatives",
          weight: 3,
          keywords: ["implicit", "password grant", "client secret", "token leakage", "machine-to-machine", "deprecated"],
        },
      ],
    },
    modelAnswer:
      "Mobile apps and SPAs are public clients: anything shipped to a device or browser can be extracted, so they cannot hold a client secret. The authorisation code flow with PKCE binds each one-time code to a secret code verifier generated for that login, so an intercepted code cannot be redeemed, and the OAuth 2.0 Security Best Current Practice (and OAuth 2.1) recommends it for every client. The implicit flow returned tokens in the redirect URL, where they leak through history and logs, and is no longer recommended; the password grant gives the app the user's credentials and bypasses SSO and MFA; client credentials has no user at all.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-02",
    track: "backend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["http", "rest", "api", "background jobs"],
    prompt:
      "`POST /reports` starts a report export that takes several minutes to produce. What is the most appropriate HTTP design for this endpoint?",
    options: [
      "Return 202 Accepted with a link to a job resource that clients poll for its status and, finally, the result",
      "Hold the request open and return 200 OK with the file when it is ready, raising proxy idle timeouts to ten minutes",
      "Return 201 Created at once with the final file URL, which answers 404 Not Found until the report has been written",
      "Return 503 Service Unavailable with Retry-After on each call until a background worker has produced the report",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "202 Accepted means accepted for processing but not yet completed",
      "point the client to a job or status resource",
      "the job resource exposes status, progress, errors and a link to the result",
      "clients poll or receive a webhook or notification",
      "avoid long-held connections that hit proxy and load-balancer timeouts",
    ],
    redFlags: ["hold an HTTP request open for minutes", "use 5xx status codes for work in progress"],
    rubric: {
      criteria: [
        {
          name: "Asynchronous request pattern",
          weight: 5,
          keywords: ["202", "accepted", "job", "status", "location", "poll"],
        },
        {
          name: "Why not the alternatives",
          weight: 3,
          keywords: ["timeout", "load balancer", "503", "retry", "failure", "webhook"],
        },
      ],
    },
    modelAnswer:
      "202 Accepted tells the client the request is valid and has been queued, but the work is not finished. Returning a link to a job resource such as /reports/jobs/123 (in Location and usually in the body) lets the client poll for status, progress, failure details and finally a link to the file, or be notified by webhook. Holding a connection open for minutes runs into proxy and load-balancer timeouts and ties up resources, and 503 wrongly signals that the server is failing, which triggers client retries and alerting.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-03",
    track: "backend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["node.js", "fault tolerance", "logging"],
    prompt:
      'A Node.js API registers a `process.on("uncaughtException", handler)` listener. What should that handler do in production?',
    options: [
      "Log the error and keep serving, so that one failing request cannot take down every other request in the process",
      "Log the error, allow a brief graceful shutdown, then exit non-zero so the supervisor starts a fresh process",
      "Retry the operation that threw up to three times, and exit only if the same exception keeps being raised",
      "Close and recreate the HTTP server inside the same process, keeping in-memory caches and database pools warm",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "process state may be inconsistent after an uncaught exception",
      "Node.js documents that it is not safe to resume normal operation",
      "log and flush, then exit with a non-zero code",
      "a process manager or orchestrator restarts a clean process",
      "run several instances so one restart does not cause an outage",
      "handle errors where they occur rather than relying on this hook",
    ],
    redFlags: [
      "keep the process running after an uncaught exception",
      "uncaughtException is a normal error-handling mechanism",
    ],
    rubric: {
      criteria: [
        {
          name: "Crash safely",
          weight: 5,
          keywords: ["exit", "non-zero", "restart", "inconsistent state", "supervisor", "orchestrator"],
        },
        {
          name: "Operational hygiene",
          weight: 3,
          keywords: ["log", "flush", "graceful shutdown", "in-flight", "replicas", "root cause"],
        },
      ],
    },
    modelAnswer:
      "An uncaught exception means the stack unwound at an unknown point, so locks, transactions, open handles and in-memory state may be half-updated; the Node.js documentation states it is not safe to resume normal operation afterwards. The handler should record the error (making sure logs are flushed), optionally stop taking traffic and give in-flight work a short deadline, then exit with a non-zero code so the process manager or orchestrator replaces it with a clean process. Keeping the process alive risks serving corrupt state or leaking resources indefinitely, and with several replicas behind a load balancer a restart is cheap.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-04",
    track: "backend",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["integration testing", "testing", "postgresql"],
    prompt:
      "A repository class runs hand-written PostgreSQL queries that use `ON CONFLICT` upserts, JSONB operators such as `@>` and window functions. Which testing approach gives the team the most confidence that these queries are correct?",
    options: [
      "Unit tests that mock the database driver and assert that each method sends the expected SQL text and parameters",
      "Tests that run the same queries against an in-memory SQLite database, which is fast and needs no infrastructure",
      "End-to-end browser tests through the UI, which exercise the repository indirectly along with the rest of the stack",
      "Integration tests against a real, disposable PostgreSQL instance with migrations applied and isolated data",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "test against the same database engine (and major version) as production",
      "mocks verify the SQL text, not its behaviour",
      "SQLite has a different dialect and type system and lacks PostgreSQL's JSONB operators",
      "build the schema by running the real migrations",
      "isolate tests with transactions, fresh schemas or truncation",
      "keep end-to-end tests few and focused",
    ],
    redFlags: [
      "mocking the driver proves a query is correct",
      "SQLite is a faithful stand-in for PostgreSQL",
    ],
    rubric: {
      criteria: [
        {
          name: "Real database integration tests",
          weight: 5,
          keywords: ["integration test", "real database", "container", "testcontainers", "migrations", "isolation"],
        },
        {
          name: "Limits of other approaches",
          weight: 3,
          keywords: ["mock", "sqlite", "dialect", "false confidence", "end-to-end", "slow"],
        },
      ],
    },
    modelAnswer:
      "The risk in this code lies in the SQL itself — conflict targets, JSONB containment and window frames — so only running it on the real engine tests what matters. A throwaway PostgreSQL in a container (for example via Testcontainers), with the real migrations applied and each test isolated, is fast enough for CI and catches syntax, semantic and schema-drift errors. Mocking the driver only checks that a string was sent, which still passes when the query is wrong, and SQLite has a different dialect and type system without operators such as `@>`, so it gives false confidence. Browser tests are too slow and coarse to cover query edge cases.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-05",
    track: "backend",
    level: "senior",
    difficulty: 1,
    type: "behavioral",
    tags: ["incident management", "behavioral", "release strategies"],
    prompt:
      "You are on call. Twenty minutes after a deploy, the 5xx rate on the checkout API jumps from 0.1% to 8%. The deployed change looks unrelated to checkout, and its author is confident it is not the cause. What do you do first?",
    options: [
      "Roll back the deploy (or turn off its feature flag) to restore service, then investigate with the change removed",
      "Ask the author to walk through the diff, and roll back only once the code path causing the errors has been identified",
      "Scale out the checkout service to absorb the errors, keeping the deploy in place so the problem stays reproducible",
      "Raise a ticket for the owning team and leave it for business hours, so the experts can investigate it properly",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "mitigate first, diagnose afterwards",
      "a change that correlates in time is the prime suspect regardless of confidence",
      "rollback is fast, low-risk and reversible",
      "communicate status and declare an incident",
      "blameless post-incident review once service is restored",
    ],
    redFlags: [
      "find the root cause before restoring service",
      "trust the author's certainty over the timeline",
    ],
    rubric: {
      criteria: [
        {
          name: "Mitigation first",
          weight: 5,
          keywords: ["roll back", "rollback", "mitigate", "restore service", "feature flag", "customer impact"],
        },
        {
          name: "Incident process",
          weight: 3,
          keywords: ["communicate", "incident", "status page", "timeline", "postmortem", "blameless"],
        },
      ],
    },
    modelAnswer:
      "During an incident the priority is to stop customer impact, and a deploy that lines up with the spike is the prime suspect whatever its author believes. Rolling back or disabling the flag is quick, low-risk and reversible: if errors stop you have mitigated and narrowed the cause at once, and if they do not you have ruled it out cheaply. Debugging the diff first prolongs the outage, and scaling out does nothing for errors caused by faulty code. Root-cause analysis and a blameless review follow once service is restored.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-senior-06",
    track: "backend",
    level: "senior",
    difficulty: 2,
    type: "coding",
    tags: ["postgresql", "sql", "database"],
    prompt:
      "This is the hottest query in a multi-tenant app, and `orders` has hundreds of millions of rows. Which single index serves it best in PostgreSQL?\n\n```sql\nSELECT id, status, total\nFROM orders\nWHERE tenant_id = $1 AND status = 'open'\nORDER BY created_at DESC\nLIMIT 20;\n```",
    options: [
      "`CREATE INDEX ON orders (created_at DESC, tenant_id, status);`",
      "`CREATE INDEX ON orders (tenant_id, status, created_at DESC);`",
      "`CREATE INDEX ON orders (status, created_at DESC, tenant_id);`",
      "Separate indexes on `(tenant_id)`, `(status)` and `(created_at)`, combined in a bitmap scan",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "equality-filtered columns first, then the ORDER BY column",
      "rows come out of the index already sorted, so the scan stops after LIMIT rows",
      "a leading column that is not filtered on cannot narrow the scan",
      "bitmap scans over single-column indexes lose ordering and need a sort",
      "a partial index or INCLUDE columns can refine it further",
    ],
    redFlags: [
      "column order in a composite index does not matter",
      "one index per column is always enough",
    ],
    rubric: {
      criteria: [
        {
          name: "Composite index design",
          weight: 5,
          keywords: ["composite", "leading column", "equality", "column order", "order by", "b-tree"],
        },
        {
          name: "Plan behaviour",
          weight: 3,
          keywords: ["index scan", "limit", "sort", "bitmap", "explain", "index-only"],
        },
      ],
    },
    modelAnswer:
      "A B-tree on (tenant_id, status, created_at DESC) jumps straight to one tenant's open orders, and within that range entries are already sorted by created_at, so PostgreSQL reads the first 20 entries and stops without a sort. With created_at first, the scan walks every tenant's orders in time order and discards most of them; with status first, it walks all open orders of every tenant. Single-column indexes can be combined in a bitmap scan, but that loses ordering, so every matching row is fetched and sorted before LIMIT applies. A partial index on (tenant_id, created_at) WHERE status = 'open', or INCLUDE columns for an index-only scan, refine the same idea.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-07",
    track: "backend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["kafka", "queues", "distributed systems"],
    prompt:
      "Order events (created, paid, shipped) are published to a Kafka topic with 12 partitions and read by a consumer group with several instances. Events for the same order must be processed in order, but throughput must scale across consumers. What should the producer do?",
    options: [
      "Publish without a key so events spread evenly over partitions, and have consumers reorder events by timestamp",
      "Reduce the topic to a single partition, since that is the only way Kafka can keep any of its events in order",
      "Give each event type its own topic, so created, paid and shipped events are each consumed by a dedicated group",
      "Use the order id as the message key, so all of an order's events go to one partition and are read in order",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "Kafka orders messages only within a partition",
      "messages with the same key go to the same partition",
      "each partition is read by one consumer in the group at a time",
      "parallelism comes from many keys spread across partitions",
      "adding partitions later remaps keys to partitions",
      "an idempotent producer avoids reordering on retries",
    ],
    redFlags: [
      "Kafka guarantees ordering across a whole topic",
      "consumers can reliably restore order from timestamps",
    ],
    rubric: {
      criteria: [
        {
          name: "Partitioning and ordering",
          weight: 5,
          keywords: ["partition", "message key", "ordering", "same partition", "hash"],
        },
        {
          name: "Scaling consumers",
          weight: 3,
          keywords: ["consumer group", "parallelism", "throughput", "rebalance", "partition count"],
        },
      ],
    },
    modelAnswer:
      "Kafka guarantees order only within a partition, and the default partitioner sends every message with the same key to the same partition. Keying by order id keeps each order's events in sequence, while different orders spread across the 12 partitions so up to 12 consumers in the group can work in parallel. Unkeyed messages land on different partitions and are processed concurrently, so timestamps cannot reliably restore order; a single partition would preserve order but caps throughput at one consumer. Adding partitions later changes which partition a key maps to, so the partition count should be planned up front.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-08",
    track: "backend",
    level: "senior",
    difficulty: 2,
    type: "coding",
    tags: ["sql", "security", "owasp"],
    prompt:
      "A list endpoint lets clients choose the sort column, for example `?sort=price` or `?sort=created_at`. Every other value in the query is already passed as a bind parameter. Which implementation is both safe from SQL injection and actually sorts by the chosen column?",
    options: [
      "Bind it like every other input: `ORDER BY $1`, passing `[req.query.sort]` as the query's parameter values",
      "Interpolate it after rejecting any value that contains a semicolon, a quote character or a `--` comment marker",
      "Check it against an allow-list of sortable column names, reply 400 otherwise, then interpolate the checked name",
      "Escape it with the driver's string-literal quoting and interpolate the result, so it cannot break out of the quotes",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "bind parameters carry values, not identifiers or keywords",
      "dynamic identifiers must come from an allow-list",
      "reject unknown values with 400 Bad Request",
      "character deny-lists are bypassable, for example with subqueries",
      "a quoted string literal in ORDER BY is not a column reference",
    ],
    redFlags: [
      "blocking semicolons and quotes prevents SQL injection",
      "any part of a SQL statement can be parameterised",
    ],
    rubric: {
      criteria: [
        {
          name: "Safe dynamic identifiers",
          weight: 5,
          keywords: ["allow-list", "whitelist", "identifier", "column name", "validate", "400"],
        },
        {
          name: "Why the alternatives fail",
          weight: 3,
          keywords: ["bind parameter", "value", "deny-list", "subquery", "string literal", "injection"],
        },
      ],
    },
    modelAnswer:
      "Bind parameters carry values only; they cannot stand in for identifiers or keywords, so `ORDER BY $1` treats the input as a value rather than a column name and cannot choose the sort column. The safe pattern for dynamic identifiers is an allow-list: check or map the input against the known sortable columns, return 400 for anything else, and only then build the clause. Rejecting semicolons and quotes is a deny-list that payloads such as `(SELECT pg_sleep(5))` walk straight past, and escaping the value as a string literal produces `ORDER BY 'price'`, which PostgreSQL rejects as a non-integer constant instead of sorting by the column.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-09",
    track: "backend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["metrics", "prometheus"],
    prompt:
      "You are adding a Prometheus request-latency histogram to an API that serves millions of users. Which of these would be poor choices as labels on that metric? Select all that apply.",
    options: [
      "The authenticated user's id",
      "The HTTP method",
      "The raw request path, such as `/orders/8f2c1e`",
      "The route template, such as `/orders/:id`",
      "The response status class, such as `5xx`",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2],
    multiSelect: true,
    expectedPoints: [
      "each unique combination of label values is a separate time series",
      "unbounded values such as user ids or raw paths explode cardinality",
      "a histogram multiplies the series count by its number of buckets",
      "use bounded labels: method, route template, status class",
      "keep per-user and per-request detail in logs and traces, linked by exemplars",
    ],
    redFlags: [
      "labels are free, so add as many as possible",
      "per-user breakdowns belong in Prometheus metrics",
    ],
    rubric: {
      criteria: [
        {
          name: "Cardinality",
          weight: 5,
          keywords: ["cardinality", "time series", "label", "unbounded", "user id", "memory"],
        },
        {
          name: "Good label design",
          weight: 3,
          keywords: ["route template", "method", "status class", "bounded", "exemplars", "traces"],
        },
      ],
    },
    modelAnswer:
      "In Prometheus every distinct combination of label values is its own time series, and a histogram multiplies that by its bucket count, so labels must have small, bounded sets of values. User ids and raw paths that embed ids are unbounded: they create millions of series, exhaust the server's memory and make queries slow or impossible. The HTTP method, route template and status class each have a handful of values and are exactly the dimensions you want to slice latency by; per-user or per-request detail belongs in logs and traces, linked from metrics with exemplars if needed.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-10",
    track: "backend",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["secrets management", "iam", "security", "kubernetes"],
    prompt:
      "Services in your managed cloud Kubernetes cluster read from object storage with a long-lived access key stored in a Kubernetes Secret. The security team asks you to remove the risk of that credential leaking. Which change addresses the root problem?",
    options: [
      "Encode the key twice with base64 before saving it in the Secret, so that it cannot be read at a glance",
      "Use workload identity: map each service account to a cloud IAM role, so pods get short-lived credentials",
      "Bake the key into the container image at build time, so that it never appears in the Kubernetes API at all",
      "Keep the static key but rotate it by hand once a year, and record every rotation in the team's runbook",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "long-lived static keys are the root risk",
      "workload identity federates the Kubernetes service account to a cloud IAM role",
      "credentials are short-lived and rotated automatically",
      "a least-privilege role per service",
      "base64 is an encoding, not encryption",
      "secrets baked into images spread to every registry and cache",
    ],
    redFlags: ["base64 protects a secret", "secrets inside container images are safe"],
    rubric: {
      criteria: [
        {
          name: "Eliminate static credentials",
          weight: 5,
          keywords: ["workload identity", "service account", "iam role", "short-lived", "federation", "rotation"],
        },
        {
          name: "Why the alternatives fail",
          weight: 3,
          keywords: ["base64", "encoding", "image", "registry", "least privilege", "long-lived"],
        },
      ],
    },
    modelAnswer:
      "The real risk is a long-lived static key: anyone who copies it can use it from anywhere until someone notices and rotates it. Workload identity, which the major managed Kubernetes services all offer, federates each pod's Kubernetes service account to a cloud IAM role, so the pod receives short-lived credentials scoped to that role and there is no static secret left to leak. Base64 is an encoding, not encryption, and baking a key into an image copies it to every registry, cache and machine that pulls the image; yearly manual rotation still leaves a leaked key usable for months.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-senior-11",
    track: "backend",
    level: "senior",
    difficulty: 3,
    type: "theory",
    tags: ["dynamodb", "database", "scaling"],
    prompt:
      "An events table in DynamoDB uses the event date (for example `2026-10-15`) as its partition key and a timestamp as its sort key, so that one day's events can be read with a single query. At peak, writes are throttled even though the table's total capacity is far from used. Why, and what is the usual fix?",
    options: [
      "DynamoDB throttles tables whose sort key is a timestamp; switch to a random UUID sort key so that writes spread evenly",
      "The table needs a global secondary index on the date, so that DynamoDB can spread the writes over more storage nodes",
      "Queries by date use strongly consistent reads, which reserve write capacity; eventually consistent reads lift the limit",
      "All of a day's writes share one partition key, capped at one partition's throughput; add a shard suffix to the key",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "throughput limits apply per partition, not only per table",
      "a low-cardinality partition key concentrates traffic on one hot key",
      "more table capacity does not help a single hot key",
      "write sharding: a computed or random suffix, with reads fanning out over the shards",
      "design keys from the access patterns",
    ],
    redFlags: [
      "provisioning more table capacity fixes a hot key",
      "the sort key decides how writes are spread over partitions",
    ],
    rubric: {
      criteria: [
        {
          name: "Hot partition diagnosis",
          weight: 5,
          keywords: ["partition key", "hot partition", "hot key", "throughput", "throttling", "cardinality"],
        },
        {
          name: "Key design fix",
          weight: 4,
          keywords: ["write sharding", "suffix", "shard", "fan out", "access pattern"],
        },
      ],
    },
    modelAnswer:
      "DynamoDB distributes data and throughput by partition key, and each partition has a fixed throughput ceiling. When every write in a day shares one key value they all land on the same partition and are throttled even though the table as a whole has spare capacity, and adding capacity cannot spread a single hot key. The standard fix is write sharding: use keys such as `2026-10-15#7` with a random or computed suffix, and read a day by querying each shard in parallel and merging. A GSI does not spread base-table writes (a hot GSI key can even throttle them), and read consistency has nothing to do with write throttling.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-12",
    track: "backend",
    level: "senior",
    difficulty: 3,
    type: "coding",
    tags: ["node.js", "event-loop", "async"],
    prompt:
      'In Node.js, what does this script print?\n\n```js\nconst fs = require("node:fs");\n\nfs.readFile(__filename, () => {\n  setTimeout(() => console.log("timeout"), 0);\n  setImmediate(() => console.log("immediate"));\n  Promise.resolve().then(() => console.log("promise"));\n  process.nextTick(() => console.log("tick"));\n  console.log("sync");\n});\n```',
    options: [
      "sync, promise, tick, timeout, immediate",
      "sync, tick, promise, timeout, immediate",
      "sync, tick, promise, immediate, timeout",
      "sync, promise, tick, immediate, timeout",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "synchronous code in the callback runs to completion first",
      "the process.nextTick queue drains before promise microtasks",
      "all microtasks run before the loop moves to its next phase",
      "after the poll phase, the check phase (setImmediate) runs before timers",
      "in the main module, by contrast, setTimeout(0) versus setImmediate order is not guaranteed",
    ],
    redFlags: [
      "setTimeout with 0 ms runs before anything else that is queued",
      "promise callbacks always run before process.nextTick callbacks",
    ],
    rubric: {
      criteria: [
        {
          name: "Microtask ordering",
          weight: 4,
          keywords: ["nexttick", "microtask", "promise", "queue", "drain"],
        },
        {
          name: "Event loop phases",
          weight: 4,
          keywords: ["poll", "check", "timers", "setimmediate", "settimeout", "phase"],
        },
      ],
    },
    modelAnswer:
      "The readFile callback runs in the poll phase, so 'sync' prints first. When the callback returns, Node drains the process.nextTick queue and then the promise microtask queue, giving 'tick' then 'promise'. The loop then moves from the poll phase to the check phase, where setImmediate callbacks run, and only reaches the timers phase on the next iteration, so inside an I/O callback 'immediate' always precedes 'timeout'. In the main module, by contrast, the relative order of setTimeout(0) and setImmediate is not guaranteed.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-13",
    track: "backend",
    level: "senior",
    difficulty: 3,
    type: "debugging",
    tags: ["security", "node.js", "express"],
    prompt:
      'A payment provider signs the raw body of each webhook with HMAC-SHA256 and a shared secret, and sends the hex signature in `X-Signature`. Which problems does this handler have? Select all that apply.\n\n```js\napp.post("/webhooks/payments", express.json(), (req, res) => {\n  const expected = crypto\n    .createHmac("sha256", process.env.WEBHOOK_SECRET)\n    .update(JSON.stringify(req.body))\n    .digest("hex");\n  if (req.get("X-Signature") !== expected) return res.sendStatus(401);\n  handlePayment(req.body);\n  res.sendStatus(200);\n});\n```',
    options: [
      "HMAC-SHA256 can be reversed to recover the secret from a signature, so the signature should be checked with bcrypt",
      "It computes the HMAC over a re-serialised copy of the parsed JSON, not the raw bytes the provider actually signed",
      "It compares the signatures with `!==`, which can leak timing information; `crypto.timingSafeEqual` should be used",
      "The provider should send the shared secret itself in a header, so the handler can compare it without hashing",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 2],
    multiSelect: true,
    expectedPoints: [
      "the HMAC must be computed over the exact raw bytes received",
      "JSON.stringify of the parsed body need not reproduce the original bytes",
      "use a constant-time comparison such as crypto.timingSafeEqual",
      "check buffer lengths before timingSafeEqual, which throws on a mismatch",
      "add timestamp checks against replay and handle events idempotently",
    ],
    redFlags: ["HMAC can be reversed to reveal the key", "sending the shared secret in a header is acceptable"],
    rubric: {
      criteria: [
        {
          name: "Raw body verification",
          weight: 4,
          keywords: ["raw body", "bytes", "re-serialise", "json.stringify", "express.raw", "signature"],
        },
        {
          name: "Constant-time comparison",
          weight: 4,
          keywords: ["timing attack", "timingsafeequal", "constant-time", "comparison", "length"],
        },
        {
          name: "HMAC fundamentals",
          weight: 2,
          keywords: ["hmac", "shared secret", "one-way", "replay", "timestamp"],
        },
      ],
    },
    modelAnswer:
      "The provider signed the exact bytes it sent, but express.json() parses them and JSON.stringify produces a new serialisation whose whitespace, escaping or number formatting can differ, so genuine webhooks can fail verification; capture the raw body for this route (for example with express.raw()) and compute the HMAC over that. Comparing with !== can stop at the first differing character, so response times leak how much of a forged signature is correct; crypto.timingSafeEqual on equal-length buffers avoids this. HMAC-SHA256 is a keyed one-way function that cannot be reversed to reveal the secret, and sending the secret itself in a header would expose it on every request.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-14",
    track: "backend",
    level: "senior",
    difficulty: 3,
    type: "system-design",
    tags: ["rate limiting", "redis", "system design", "api"],
    prompt:
      "Your public API runs on 20 stateless instances behind a load balancer and must enforce 100 requests per minute per API key, accurately enough that a customer can neither exceed it several times over nor be throttled well below it. What is the most appropriate design?",
    options: [
      "Each instance keeps an in-memory counter per key and allows 100 requests a minute, since traffic is spread evenly",
      "A shared Redis token bucket or counter, updated atomically per request, that returns 429 with Retry-After",
      "Each instance allows 100 ÷ 20 = 5 requests per key per minute in memory, so the fleet-wide total equals the limit",
      "A row per key in the main PostgreSQL database, read with SELECT and then incremented with UPDATE on every request",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "limit state must be shared by all instances",
      "atomic check-and-increment (Lua script, or INCR with EXPIRE) avoids races",
      "token bucket, fixed window or sliding window algorithms",
      "429 Too Many Requests with Retry-After or rate-limit headers",
      "decide whether to fail open or closed if Redis is unavailable",
      "keep the system-of-record database off the hot path",
    ],
    redFlags: [
      "per-instance counters enforce a global limit",
      "read-then-write counters are safe under concurrency",
    ],
    rubric: {
      criteria: [
        {
          name: "Shared atomic state",
          weight: 5,
          keywords: ["redis", "atomic", "lua", "incr", "token bucket", "sliding window"],
        },
        {
          name: "API behaviour",
          weight: 3,
          keywords: ["429", "retry-after", "rate limit headers", "per key", "fail open"],
        },
        {
          name: "Why local counters fail",
          weight: 2,
          keywords: ["per instance", "load balancer", "uneven", "keep-alive", "race condition"],
        },
      ],
    },
    modelAnswer:
      "A per-key limit across a fleet needs shared state, and Redis is the usual choice: one atomic operation per request (INCR with an expiry for a fixed window, or a token-bucket or sliding-window Lua script) avoids read-modify-write races and costs a single fast round trip. When a key is over its budget the API returns 429 Too Many Requests with Retry-After. Per-instance counters let a client get up to 20 times the limit, while dividing the limit by the instance count wrongly rejects clients whose keep-alive connections land on one instance. A SELECT-then-UPDATE in the main database is racy and adds a write to the system of record for every request.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-senior-15",
    track: "backend",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["caching", "redis", "consistency"],
    prompt:
      "A service uses cache-aside with Redis: reads try the cache, and on a miss load the row from PostgreSQL and `SET` it with a one-hour TTL; writes update PostgreSQL, commit, then `DEL` the key. Occasionally a product shows its old price for up to an hour after an update, even though every DEL succeeded. What is the most likely explanation?",
    options: [
      "Under memory pressure Redis can silently drop DEL commands, so the key holding the old price was never actually removed",
      "Redis TTLs are approximate, so a key set with a one-hour TTL can still be served for hours after it should expire",
      "A slow reader loaded the old row on a miss, a write then committed and deleted the key, and its late SET put it back",
      "Read Committed lets a committed update be rolled back after the DEL, so the database itself reverted to the old price",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "cache-aside has a race between a slow reader and a writer",
      "a stale value written after the invalidation lives until the TTL expires",
      "deleting after the write narrows the window but cannot close it",
      "mitigations: short TTLs, versioned values, a delayed second delete",
      "invalidate from the database change stream (CDC) where staleness matters",
    ],
    redFlags: [
      "delete-after-write makes cache-aside strongly consistent",
      "Redis silently drops or reorders a client's commands",
    ],
    rubric: {
      criteria: [
        {
          name: "Race diagnosis",
          weight: 5,
          keywords: ["race condition", "cache-aside", "stale", "miss", "invalidation", "interleaving"],
        },
        {
          name: "Mitigations",
          weight: 3,
          keywords: ["ttl", "version", "delayed delete", "cdc", "change data capture", "staleness"],
        },
      ],
    },
    modelAnswer:
      "Cache-aside has a well-known race: a reader misses, reads the old row and is then delayed (a GC pause or slow network) before its SET; meanwhile a writer commits the new price and deletes the key; the reader's SET then writes the old value back, where it stays until the TTL expires. Deleting after the write narrows the window but cannot close it, because the reader's read-then-set is not atomic with respect to the write. Mitigations include short TTLs for volatile data, version numbers stored with the value and checked before overwriting, a delayed second delete, or invalidating from the database's change stream. Redis does not drop commands or serve keys past their expiry, and committed transactions are never rolled back.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-16",
    track: "backend",
    level: "senior",
    difficulty: 4,
    type: "debugging",
    tags: ["graphql", "node.js", "caching"],
    prompt:
      "To remove N+1 queries from a GraphQL API, a developer adds a DataLoader. `batchUsersById` fetches all requested users in one query and returns them in key order. The N+1 queries are gone, but users now see profile changes only after the server restarts, and memory use grows steadily. What is the bug and the fix?\n\n```ts\n// loaders.ts: evaluated once, when the server starts\nexport const userLoader = new DataLoader(batchUsersById);\n\n// resolvers.ts\nexport const resolvers = {\n  Post: { author: (post) => userLoader.load(post.authorId) },\n};\n```",
    options: [
      "DataLoader memoises each loaded key for the instance's lifetime; create new loaders per request, e.g. in the GraphQL context",
      "DataLoader only batches keys requested in the same tick, so resolvers should await each load in turn so that the cache refreshes",
      "The batch function must return a Map keyed by id rather than an array, otherwise DataLoader keeps serving stale entries",
      "DataLoader does not work with async resolvers, so each resolver should query `db.users` directly with a LIMIT clause",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "DataLoader batches loads from one tick into one query",
      "it also memoises results in a per-instance cache",
      "a module-level loader becomes an unbounded, never-invalidated cache shared by all users",
      "create loaders per request, typically in the GraphQL context factory",
      "per-request loaders stop data loaded under one viewer's permissions reaching another",
      "the batch function returns an array in key order",
    ],
    redFlags: [
      "one global DataLoader instance is the intended usage",
      "DataLoader replaces an application-level cache",
    ],
    rubric: {
      criteria: [
        {
          name: "DataLoader semantics",
          weight: 5,
          keywords: ["dataloader", "batching", "memoisation", "per request", "context", "cache"],
        },
        {
          name: "Consequences",
          weight: 3,
          keywords: ["stale", "memory leak", "unbounded", "cross-user", "authorisation", "n+1"],
        },
      ],
    },
    modelAnswer:
      "DataLoader both batches the keys requested during one tick into a single query and memoises each key's result in the instance's cache. That cache is meant to live for one request; a module-level instance turns it into a process-wide cache with no expiry or invalidation, so updated rows are never re-read and memory grows with every distinct id. Creating fresh loaders per request (typically in the GraphQL context factory) keeps the batching benefit while scoping the cache, and also stops results fetched under one viewer's permissions being served to another. The batch function must return an array in key order, not a Map, and awaiting loads one by one would defeat batching.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-17",
    track: "backend",
    level: "senior",
    difficulty: 4,
    type: "system-design",
    tags: ["microservices", "distributed systems", "transactions", "queues"],
    prompt:
      "Placing an order spans three services, each with its own database: Orders records the order, Inventory reserves stock and Payments charges the card. If the charge is declined after stock has been reserved, the reservation must be released and the order cancelled. Which design is most appropriate?",
    options: [
      "A two-phase commit across the three databases, coordinated by the Orders service through synchronous HTTP calls",
      "A distributed Redis lock held across all three services until payment succeeds, so no partial state is ever visible",
      "Synchronous HTTP calls with automatic retries, so that every step eventually succeeds and no compensation is needed",
      "A saga of local transactions linked by events, where a failed step triggers compensations such as releasing stock",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "no ACID transaction spans databases owned by different services",
      "a saga is a sequence of local transactions with compensating actions",
      "orchestration or choreography to drive the steps",
      "publish events reliably, for example with a transactional outbox",
      "steps and compensations must be idempotent",
      "intermediate states such as PENDING are visible to others",
    ],
    redFlags: [
      "two-phase commit is the standard approach for microservices",
      "retries alone guarantee consistency",
    ],
    rubric: {
      criteria: [
        {
          name: "Saga pattern",
          weight: 5,
          keywords: ["saga", "local transaction", "compensating", "orchestration", "choreography", "event"],
        },
        {
          name: "Reliability details",
          weight: 3,
          keywords: ["outbox", "idempotent", "at-least-once", "pending", "eventual consistency"],
        },
        {
          name: "Why not 2PC",
          weight: 2,
          keywords: ["two-phase commit", "blocking", "coordinator", "availability", "coupling"],
        },
      ],
    },
    modelAnswer:
      "With a database per service there is no single ACID transaction to roll back, so the saga pattern models the flow as a series of local transactions, each publishing an event (reliably, via an outbox) that triggers the next step. When a step fails, the completed steps are undone with compensating actions — release the reservation, cancel the order — driven either by an orchestrator or by services reacting to each other's events. Steps and compensations must be idempotent because messages can be redelivered, and intermediate states such as PENDING are visible to other readers. Two-phase commit over HTTP services is blocking and fragile when the coordinator fails, a lock cannot undo committed work, and no number of retries turns a declined card into a successful charge.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-18",
    track: "backend",
    level: "senior",
    difficulty: 4,
    type: "debugging",
    tags: ["node.js", "express", "async"],
    prompt:
      'This Express handler streams a large CSV export from a database cursor. Under load, server memory climbs into gigabytes whenever clients download over slow connections. What is the bug?\n\n```js\napp.get("/export.csv", async (req, res) => {\n  res.type("text/csv");\n  for await (const row of db.cursor("SELECT * FROM orders")) {\n    res.write(toCsvLine(row));\n  }\n  res.end();\n});\n```',
    options: [
      "`for await` reads the entire cursor into memory before the first iteration, so the export should page through it with OFFSET",
      "`res.write()` blocks the event loop until each chunk is sent, so rows pile up in the cursor's internal buffer",
      "It ignores backpressure: `res.write()` returns false when the buffer is full, yet the loop never waits for `drain`",
      "Express buffers the whole response until `res.end()` is called, so the handler must set Content-Length first",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "write() returns false once the buffered data passes the highWaterMark",
      "ignoring it queues data in memory at the producer's speed",
      "await the drain event (events.once) before writing more",
      "stream.pipeline links source and response with backpressure and error clean-up",
      "close the cursor when the client disconnects",
    ],
    redFlags: ["res.write blocks until the data is sent", "streaming always means constant memory"],
    rubric: {
      criteria: [
        {
          name: "Backpressure",
          weight: 5,
          keywords: ["backpressure", "highwatermark", "drain", "write returns false", "buffer"],
        },
        {
          name: "Correct streaming",
          weight: 3,
          keywords: ["pipeline", "readable", "transform", "disconnect", "destroy", "cursor"],
        },
      ],
    },
    modelAnswer:
      "A writable stream signals backpressure by returning false from write() once its buffer passes the highWaterMark, and the caller is expected to pause until 'drain'. This loop ignores the return value, so it pulls rows from the database as fast as the database can deliver them and queues them in the response's memory while a slow client drains it slowly. Awaiting `once(res, \"drain\")` whenever write() returns false, or using `pipeline` from `node:stream/promises` with a Readable and a CSV Transform, matches the producer to the consumer's speed; pipeline also destroys the cursor stream if the client disconnects. write() does not block, and Node sends the body with chunked encoding rather than buffering it until end().",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-19",
    track: "backend",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["jwt", "oauth", "authentication", "security"],
    prompt:
      "Several internal APIs accept JWT access tokens issued by the company's single identity provider. The Billing API uses a maintained JWT library, with the accepted algorithm pinned to RS256, to verify each token's signature against the provider's published keys; it also checks expiry and issuer, but nothing else. What is the main risk?",
    options: [
      "An attacker can edit the token's claims without breaking the signature, because JWT signatures only cover the header",
      "A token issued for another API, such as a low-trust reporting service, is accepted since `aud` is never checked",
      "Expired tokens can be replayed, because `exp` is advisory and only the identity provider enforces it when refreshing",
      "Anyone who downloads the provider's public signing keys can mint new tokens that the Billing API will accept",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a valid signature proves who issued the token, not who it is for",
      "validate aud so each API accepts only tokens minted for it",
      "otherwise tokens for other services can be replayed against Billing",
      "also enforce required scopes or permissions",
      "keep the accepted signing algorithm pinned to prevent algorithm confusion",
    ],
    redFlags: [
      "a valid signature means the token is meant for this API",
      "public keys can be used to sign tokens",
    ],
    rubric: {
      criteria: [
        {
          name: "Audience validation",
          weight: 5,
          keywords: ["audience", "aud", "resource server", "replay", "token for another api"],
        },
        {
          name: "Complete token validation",
          weight: 3,
          keywords: ["signature", "issuer", "expiry", "scope", "algorithm", "public key"],
        },
      ],
    },
    modelAnswer:
      "A valid signature only proves the identity provider issued the token, not that it was issued for Billing. Without an audience check, any token from the same provider — one minted for a low-trust service or a third-party integration — can be replayed against Billing, and any compromised service that receives users' tokens can use them on every other API. Each resource server must check aud, and the scopes it requires, in addition to signature, issuer, expiry and a pinned algorithm. The signature covers both header and payload, exp is enforced by whoever verifies the token, and with the algorithm pinned to RS256 the public keys can only verify signatures, never create them.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-senior-20",
    track: "backend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["postgresql", "transactions", "consistency"],
    prompt:
      "A rota rule says at least one doctor must stay on call for each shift. Each sign-off request runs, in one transaction, `SELECT count(*) FROM on_call WHERE shift_id = $1` and, if the count is above 1, deletes the caller's own row. Two doctors on the same shift sign off at the same moment under PostgreSQL's Repeatable Read, both succeed, and nobody is left on call. Which statement is correct?",
    options: [
      "It is write skew: each saw two doctors on call and deleted a different row; Repeatable Read allows it, Serializable prevents it",
      "It is a dirty read: each transaction saw the other's uncommitted delete, which Repeatable Read is supposed to prevent",
      "It is a lost update: one delete overwrote the other, and Read Committed would make the second transaction see the first and stop",
      "It is a phantom read, which PostgreSQL's Repeatable Read permits; a unique index on `shift_id` would make the second delete fail",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "write skew: a decision based on a read that a concurrent write invalidates",
      "snapshot isolation does not detect it because the write sets do not overlap",
      "Serializable (SSI) aborts one transaction with a serialisation failure (40001)",
      "the application must retry serialisation failures",
      "alternatively lock the rows the check depends on with SELECT ... FOR UPDATE",
    ],
    redFlags: [
      "Repeatable Read prevents every anomaly",
      "Read Committed is safer than Repeatable Read here",
    ],
    rubric: {
      criteria: [
        {
          name: "Anomaly identification",
          weight: 5,
          keywords: ["write skew", "snapshot isolation", "repeatable read", "concurrent", "invariant"],
        },
        {
          name: "Prevention",
          weight: 4,
          keywords: ["serializable", "ssi", "serialization failure", "40001", "retry", "for update"],
        },
      ],
    },
    modelAnswer:
      "Each transaction reads a snapshot in which two doctors are on call and then deletes a different row, so their write sets never overlap and snapshot-based Repeatable Read has nothing to flag: this is the classic write-skew anomaly. PostgreSQL's Serializable level uses Serializable Snapshot Isolation, which tracks these read/write dependencies and aborts one transaction with a serialisation failure (SQLSTATE 40001); the application retries it, and on retry the check correctly refuses. Explicitly locking the rows the check depends on (SELECT ... FOR UPDATE) also makes the transactions conflict. It is not a dirty read, since PostgreSQL never exposes uncommitted data, and Read Committed is no better because both counts still run before either delete commits.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-21",
    track: "backend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["postgresql", "database", "high availability"],
    prompt:
      "A deploy runs `ALTER TABLE orders ADD COLUMN note text;`, which is normally a near-instant metadata change in PostgreSQL. This time every query that touches `orders` hangs for four minutes and the API times out, until a long-running analytics query on `orders` finishes. What happened, and what prevents it?",
    options: [
      "Adding a column rewrites the entire table, which takes minutes when it is large; adding it with a default avoids the rewrite",
      "The analytics query held row locks on most of `orders`, which block reads; run analytics at Serializable so it takes none",
      "The ALTER started an autovacuum, which blocks reads on the table while it runs; disable autovacuum during deploys",
      "The ALTER waited for an ACCESS EXCLUSIVE lock behind the long query, and new queries queued behind it; set lock_timeout",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "ADD COLUMN needs an ACCESS EXCLUSIVE lock, however briefly",
      "it waits behind any transaction holding even an ACCESS SHARE lock",
      "lock requests queue, so new queries wait behind the pending ALTER",
      "run migrations with a short lock_timeout and retry",
      "keep long-running queries and transactions off the primary's hot tables",
    ],
    redFlags: [
      "adding a nullable column always rewrites the table",
      "plain SELECTs never block anything",
    ],
    rubric: {
      criteria: [
        {
          name: "Lock queue diagnosis",
          weight: 5,
          keywords: ["access exclusive", "access share", "lock queue", "blocked", "long-running query"],
        },
        {
          name: "Safe migrations",
          weight: 4,
          keywords: ["lock_timeout", "statement_timeout", "retry", "read replica", "migration"],
        },
      ],
    },
    modelAnswer:
      "Even a metadata-only ALTER TABLE needs an ACCESS EXCLUSIVE lock for a moment, and it cannot get one while the analytics query holds an ACCESS SHARE lock on the table. PostgreSQL queues lock requests, so every new query on orders — even a plain SELECT — waits behind the pending ALTER, and the table is effectively offline until the long query ends. Running migrations with a short lock_timeout (a few seconds) makes the ALTER give up quickly instead of blocking everyone, after which it can be retried, and keeping long analytical queries off the primary removes the trigger. Adding a nullable column without a default does not rewrite the table, and ordinary SELECTs take no row locks.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-22",
    track: "backend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["redis", "distributed systems", "consistency"],
    prompt:
      "Workers take a lock with `SET lock:invoice:42 <token> NX PX 30000` before generating invoice 42 and writing it to storage, and release it afterwards. Rarely, two workers both write invoice 42. Logs show the first worker stalled for 40 seconds in a garbage-collection pause while it held the lock. Which change makes the write safe?",
    options: [
      "Release the lock with a Lua script that deletes the key only if it still holds this worker's own random token",
      "Raise the TTL to ten minutes, longer than any realistic pause, so the lock can no longer expire mid-task",
      "Issue an increasing fencing token with each lock grant, and have storage reject any write carrying an older token",
      "Acquire the lock on a majority of five independent Redis nodes (Redlock), so no single node can grant it twice",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a lock with a TTL is a lease that can expire while its holder is paused",
      "the paused worker cannot know its lease has expired",
      "fencing token: a monotonically increasing number per lock grant",
      "the storage rejects writes carrying a lower token than one already seen",
      "a token-checked release, longer TTLs and Redlock do not solve process pauses",
    ],
    redFlags: [
      "a long enough TTL makes a lease safe",
      "Redlock guarantees mutual exclusion despite process pauses",
    ],
    rubric: {
      criteria: [
        {
          name: "Lease failure mode",
          weight: 4,
          keywords: ["lease", "ttl", "expire", "gc pause", "process pause", "clock"],
        },
        {
          name: "Fencing",
          weight: 5,
          keywords: ["fencing token", "monotonic", "reject", "storage", "conditional write"],
        },
      ],
    },
    modelAnswer:
      "A lock with a TTL is a lease: if the holder stalls for longer than the TTL, the lock expires, a second worker acquires it, and the first resumes believing it still holds the lock — and nothing it checks beforehand can close that gap. Fencing fixes this at the resource: each lock grant comes with a monotonically increasing token (for example from an atomic INCR or a database sequence), every write carries it, and the storage rejects any write whose token is lower than the highest it has accepted. A compare-and-delete release is still good practice, but it only stops a worker deleting someone else's lock; a longer TTL merely makes the failure rarer, and Redlock's quorum does not help when the problem is a paused client rather than a failed Redis node.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-23",
    track: "backend",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["postgresql", "security", "connection pooling", "rbac"],
    prompt:
      "A multi-tenant SaaS enforces tenant isolation with PostgreSQL row-level security. Each table has a policy `USING (tenant_id = current_setting('app.tenant_id')::uuid)`, and request-handling code sets `app.tenant_id` on the connection it takes from a pool before querying. Which of these can still let one tenant read another tenant's rows? Select all that apply.",
    options: [
      "The policy is declared `FOR ALL`, so PostgreSQL also applies it to INSERT, UPDATE and DELETE statements, not only SELECT",
      "The API connects as the role that owns the tables, and the tables are not set to `FORCE ROW LEVEL SECURITY`",
      "Queries are sent as prepared statements with bind parameters, which PostgreSQL executes without checking policies",
      "The tenant is set with a session-level `SET`, and a later request or job that skips that step reuses the pooled connection",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 3],
    multiSelect: true,
    expectedPoints: [
      "table owners bypass RLS unless FORCE ROW LEVEL SECURITY is set",
      "superusers and BYPASSRLS roles always bypass it",
      "connect as a dedicated non-owner application role",
      "session-level settings survive on pooled connections between requests",
      "use SET LOCAL or set_config(..., true) inside each transaction",
      "add automated cross-tenant isolation tests",
    ],
    redFlags: [
      "RLS cannot be bypassed once it is enabled",
      "connection pools reset custom settings automatically",
    ],
    rubric: {
      criteria: [
        {
          name: "Policy bypass",
          weight: 4,
          keywords: ["row-level security", "table owner", "force row level security", "bypassrls", "superuser"],
        },
        {
          name: "Pooled session state",
          weight: 5,
          keywords: ["connection pool", "session", "set local", "set_config", "transaction", "pgbouncer"],
        },
      ],
    },
    modelAnswer:
      "Row-level security is skipped for superusers and roles with BYPASSRLS, and for the table's owner unless the table has FORCE ROW LEVEL SECURITY, so the application should connect as a dedicated non-owner role. A plain SET lasts for the whole database session, and a pooled connection's session outlives the request, so any code path that forgets to set the tenant silently inherits the previous tenant's id. Setting it with SET LOCAL, or set_config('app.tenant_id', $1, true), inside each transaction ties it to that transaction and also behaves correctly behind transaction-mode poolers. A FOR ALL policy covering writes is intended behaviour, and prepared statements are subject to the same policies as any other query.",
    followUpIds: [],
  },
  {
    id: "qb-backend-senior-24",
    track: "backend",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["system design", "scaling", "caching", "distributed systems"],
    prompt:
      "You are designing the home timeline for a social app with 300 million users. Most users follow a few hundred accounts, but a few thousand accounts have tens of millions of followers each. Timelines must load in under 200 ms. Which approach is most appropriate?",
    options: [
      "Fan-out on write for every account: each new post is pushed into every follower's precomputed timeline, celebrities included",
      "Fan-out on read for every account: each timeline is built per request by fetching and merging the recent posts of all followees",
      "One global posts table sharded by post id, indexed on author and joined with the user's follow list on every timeline read",
      "A hybrid: push ordinary accounts' posts into followers' cached timelines, and merge high-follower accounts' posts on read",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "fan-out on write gives cheap reads but huge write amplification for celebrities",
      "fan-out on read avoids amplification but is slow for users who follow many accounts",
      "hybrid: push for ordinary accounts, pull for high-follower accounts",
      "capped per-user timelines in an in-memory store such as Redis",
      "asynchronous fan-out through queues",
      "skip or defer fan-out to inactive users",
    ],
    redFlags: [
      "one fan-out strategy suits every account",
      "joining follows against posts at read time scales to hundreds of millions of users",
    ],
    rubric: {
      criteria: [
        {
          name: "Fan-out trade-offs",
          weight: 5,
          keywords: ["fan-out on write", "fan-out on read", "write amplification", "celebrity", "hybrid"],
        },
        {
          name: "Serving path",
          weight: 3,
          keywords: ["precomputed timeline", "cache", "redis", "latency", "merge", "pagination"],
        },
        {
          name: "Asynchronous processing",
          weight: 2,
          keywords: ["queue", "workers", "asynchronous", "inactive users", "backfill"],
        },
      ],
    },
    modelAnswer:
      "Precomputing timelines (fan-out on write) makes reads a single cache lookup, but one post from an account with 30 million followers becomes 30 million writes, delaying delivery and wasting work on inactive followers. Building every timeline on read avoids that amplification but means querying and merging hundreds of authors per request, which is hard to do in 200 ms at this scale. The hybrid used by large social networks fans out posts from ordinary accounts asynchronously into capped per-user timelines in an in-memory store, and merges the recent posts of the few high-follower accounts a user follows at read time. A single sharded table joined at read time is fan-out on read with a scatter-gather across every shard added.",
    followUpIds: [],
  },
];
