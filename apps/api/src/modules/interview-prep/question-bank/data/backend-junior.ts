import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-junior-01",
    track: "backend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["http", "rest", "api"],
    prompt:
      "A `POST /users` request succeeds and the server has saved the new user. Which response is the most appropriate?",
    options: [
      "202 Accepted, because the server has accepted the user and saved it to the database",
      "204 No Content, with the JSON of the newly created user in the response body",
      "201 Created, with a Location header pointing at the URL of the new user",
      "301 Moved Permanently, with a Location header pointing at the new user's URL",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "201 Created signals that a new resource was created",
      "the Location header gives the new resource's URL",
      "the body often contains the created resource",
      "202 is for work accepted but not finished yet",
      "a 204 response cannot have a body",
    ],
    redFlags: ["202 means the resource was created", "204 can carry a response body", "use a redirect to report creation"],
    rubric: {
      criteria: [
        {
          name: "Creation response",
          weight: 5,
          keywords: ["201", "created", "location", "new resource", "post"],
        },
        {
          name: "Other status codes",
          weight: 3,
          keywords: ["202", "accepted", "asynchronous", "204", "no body", "redirect"],
        },
      ],
    },
    modelAnswer:
      "201 Created tells the client that the request created a new resource; the Location header gives its URL, and APIs commonly return the created representation in the body as well. 202 Accepted means the request was queued for processing that has not finished yet, so it is wrong once the user is already saved. A 204 response cannot contain a body, and 301 means the requested URL itself has moved permanently, which has nothing to do with creating a resource.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-02",
    track: "backend",
    level: "junior",
    difficulty: 1,
    type: "coding",
    tags: ["sql", "database"],
    prompt:
      "Given the tables `users(id, name)` and `orders(id, user_id, total)`, which query lists every user, including users who have never placed an order (with NULL order columns for them)?",
    options: [
      "SELECT u.name, o.total FROM users u INNER JOIN orders o ON o.user_id = u.id",
      "SELECT u.name, o.total FROM orders o LEFT JOIN users u ON u.id = o.user_id",
      "SELECT u.name, o.total FROM users u LEFT JOIN orders o ON o.user_id = u.id",
      "SELECT u.name, o.total FROM users u CROSS JOIN orders o WHERE o.user_id = u.id",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "LEFT JOIN keeps every row from the left table",
      "unmatched right-hand columns are filled with NULL",
      "INNER JOIN keeps only rows that match",
      "the table order matters for a LEFT JOIN",
    ],
    redFlags: ["INNER JOIN returns users without orders", "the direction of a LEFT JOIN does not matter"],
    rubric: {
      criteria: [
        {
          name: "Join semantics",
          weight: 5,
          keywords: ["left join", "inner join", "unmatched", "null", "all rows"],
        },
        {
          name: "Join direction",
          weight: 3,
          keywords: ["left table", "right table", "order", "users first"],
        },
      ],
    },
    modelAnswer:
      "A LEFT JOIN returns every row of the left table and fills the right table's columns with NULL where nothing matches, so users must be on the left: users LEFT JOIN orders. An INNER JOIN, or a CROSS JOIN filtered on the same condition, keeps only users with at least one order. Swapping the tables (orders LEFT JOIN users) keeps every order instead, so users without orders disappear.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-03",
    track: "backend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["transactions", "sql", "database"],
    prompt:
      "A money-transfer endpoint runs two statements: subtract 50 from account A, then add 50 to account B. Why should both run inside one database transaction?",
    options: [
      "So the two statements run in parallel on the server and the transfer completes faster",
      "So that if either statement fails, both changes are undone and no money is lost or created",
      "So the database automatically writes an encrypted audit record of both of the statements",
      "So the database retries each statement by itself until both of them have succeeded",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "atomicity: all or nothing",
      "a crash or error between the statements rolls the first one back",
      "COMMIT makes both changes durable together",
      "keeps the balances consistent",
    ],
    redFlags: ["transactions make queries faster", "the database retries failed statements automatically"],
    rubric: {
      criteria: [
        {
          name: "Atomicity",
          weight: 5,
          keywords: ["atomic", "all or nothing", "rollback", "commit", "both"],
        },
        {
          name: "Consistency",
          weight: 3,
          keywords: ["consistent", "balance", "crash", "partial update"],
        },
      ],
    },
    modelAnswer:
      "A transaction is atomic: either every statement in it takes effect at COMMIT or none of them does. If the second UPDATE fails after the first has run, the application issues ROLLBACK (and after a crash the database discards the uncommitted change itself), so the first change is undone and 50 is never taken from A without being added to B. Transactions do not run statements in parallel or retry them; deciding whether to retry a failed transaction is up to the application.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-04",
    track: "backend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["node.js", "event-loop", "performance"],
    prompt:
      "An Express route in a single Node.js process runs a CPU-heavy loop that takes two seconds. What happens to other requests that reach the same process during those two seconds?",
    options: [
      "They wait, since JavaScript runs on one main thread and the busy loop blocks the event loop",
      "They run normally, because Node.js starts a separate thread for each incoming HTTP request",
      "They are rejected straight away with 503 Service Unavailable by the built-in http module",
      "Only requests to the same route wait, because Node.js gives each route its own event loop",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "JavaScript runs on a single main thread",
      "CPU-bound work blocks the event loop",
      "every request in the process is delayed",
      "move heavy work to worker threads or a background job",
    ],
    redFlags: ["Node.js creates a thread per request", "marking the function async makes CPU work non-blocking"],
    rubric: {
      criteria: [
        {
          name: "Blocking",
          weight: 5,
          keywords: ["single thread", "event loop", "blocked", "cpu-bound", "wait"],
        },
        {
          name: "Remedy",
          weight: 3,
          keywords: ["worker threads", "background job", "queue", "offload", "more processes"],
        },
      ],
    },
    modelAnswer:
      "Node.js runs your JavaScript on a single main thread, and the event loop can only pick up the next callback once the current one returns. A two-second synchronous loop therefore delays every other request handled by that process, not just requests to the same route. Making the function async does not help, because the loop itself is still synchronous; offload CPU-heavy work to worker_threads or a background job queue, or run more processes.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-05",
    track: "backend",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["authentication", "security"],
    prompt:
      "With classic server-side sessions, what does the session cookie that the server sets after login normally contain?",
    options: [
      "The user's username and password, so the server can check them again on every request",
      "The user's database id in plain text, which the server trusts as the logged-in user",
      "A copy of the server's signing secret, so the browser can sign each request it sends",
      "A long random session id that the server uses to look up the session data it stores",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "an opaque, unguessable session id",
      "the session data lives on the server (memory, Redis or a database)",
      "the server looks the id up on each request",
      "logging out deletes the server-side session",
      "mark the cookie HttpOnly, Secure and SameSite",
    ],
    redFlags: ["store credentials in a cookie", "trust a plain user id sent by the client"],
    rubric: {
      criteria: [
        {
          name: "Mechanism",
          weight: 5,
          keywords: ["session id", "random", "server-side", "store", "look up", "redis"],
        },
        {
          name: "Security",
          weight: 3,
          keywords: ["httponly", "secure", "samesite", "unguessable", "revoke", "logout"],
        },
      ],
    },
    modelAnswer:
      "After login the server creates a session record (in memory, Redis or a database) and sends the browser a cookie holding only a long, random, unguessable session id. The browser sends the cookie back on each request and the server looks the id up to find the user, so logging out or revoking access just deletes that record. Credentials or a plain user id in a cookie can be read or forged by the client, and the server's secret must never leave the server.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-junior-06",
    track: "backend",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["http", "rest", "api"],
    prompt: "Which HTTP methods are idempotent according to the HTTP specification? Select all that apply.",
    options: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    correctOptionIndex: 2,
    correctOptionIndices: [1, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "idempotent: repeating a request has the same effect as sending it once",
      "GET, PUT and DELETE are idempotent",
      "POST is not idempotent",
      "PATCH is not guaranteed to be idempotent",
      "idempotency makes retries safe",
    ],
    redFlags: ["idempotent means the response is always identical", "DELETE is not idempotent because a repeat returns 404"],
    rubric: {
      criteria: [
        {
          name: "Definition",
          weight: 5,
          keywords: ["same effect", "repeat", "retry", "server state", "once"],
        },
        {
          name: "Methods",
          weight: 4,
          keywords: ["get", "put", "delete", "post", "patch"],
        },
      ],
    },
    modelAnswer:
      "A method is idempotent when sending the same request several times has the same effect on the server as sending it once, which is what makes automatic retries safe. GET, PUT (replace the resource with this representation) and DELETE are idempotent: a repeated DELETE may return 404, but the resource is still gone, and idempotency is about the effect, not the response. POST creates or triggers something each time, and PATCH is not guaranteed to be idempotent, because a patch such as 'append an item' changes the state again on every repeat.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-07",
    track: "backend",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["node.js", "async", "javascript"],
    prompt:
      "`db.insert` returns a promise. When the insert fails, the catch block never runs and Node.js reports an unhandled promise rejection. What is the bug?\n\n```js\nasync function saveUser(user) {\n  try {\n    db.insert(user);\n    return { ok: true };\n  } catch (err) {\n    logger.error(err);\n    return { ok: false };\n  }\n}\n```",
    options: [
      "try/catch never works inside an async function, so the code has to use .catch() instead",
      "db.insert is not awaited, so its rejection never reaches the try block as a thrown error",
      "logger.error throws inside the catch block, which then hides the original database error",
      "The function also needs a finally block, without which rejected promises are never caught",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "the call to db.insert is missing await",
      "try/catch only catches rejections of awaited promises",
      "the function returns { ok: true } before the insert finishes",
      "unhandled rejections crash current Node.js versions by default",
      "fix: await db.insert(user)",
    ],
    redFlags: ["try/catch does not work with async code", "a finally block catches errors"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["await", "missing await", "promise", "rejection", "returns early"],
        },
        {
          name: "Consequence and fix",
          weight: 4,
          keywords: ["unhandled rejection", "crash", "await db.insert", "floating promise", "lint"],
        },
      ],
    },
    modelAnswer:
      "Without await, db.insert(user) starts the insert and the function immediately returns { ok: true }; when the promise rejects later, the try block has already finished, so the catch never runs and the rejection is unhandled, which crashes current Node.js versions by default. Writing `await db.insert(user);` makes the function wait, so the rejection is thrown inside the try and caught. try/catch works well with await, and a finally block does not catch anything; lint rules such as no-floating-promises flag this mistake.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-08",
    track: "backend",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["jwt", "authentication", "security"],
    prompt: "An API issues signed JWTs (for example HS256 or RS256) as access tokens. Which statement about them is true?",
    options: [
      "The payload is encrypted with the signing key, so it is safe to put a user's password in it",
      "The server must store every token it issues in a database before it can verify a signature",
      "Anyone holding the token can decode its payload; the signature prevents tampering, not reading",
      "Deleting the token from the browser's storage immediately invalidates it on every server",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the header and payload are base64url-encoded, not encrypted",
      "the signature lets the server detect tampering",
      "never put secrets or sensitive data in the payload",
      "verification needs only the key, not a token store",
      "a token stays valid until it expires unless revocation is added",
    ],
    redFlags: ["JWT payloads are encrypted", "deleting the token logs the user out everywhere"],
    rubric: {
      criteria: [
        {
          name: "Encoding vs signing",
          weight: 5,
          keywords: ["base64url", "decode", "readable", "signature", "tamper", "not encrypted"],
        },
        {
          name: "Practical consequences",
          weight: 4,
          keywords: ["no secrets", "stateless", "expiry", "revocation", "short-lived"],
        },
      ],
    },
    modelAnswer:
      "A signed JWT is header.payload.signature, where the header and payload are just base64url-encoded JSON, so anyone with the token can read its claims and sensitive data does not belong there. The signature lets the server detect any change, and it is checked with the secret or public key alone, without looking the token up. Because verification is stateless, removing the token from one browser does not revoke it: it stays valid until it expires, which is why access tokens are kept short-lived. Encrypted JWTs (JWE) exist, but a signed token is not encrypted.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-09",
    track: "backend",
    level: "junior",
    difficulty: 2,
    type: "behavioral",
    tags: ["secrets management", "security", "behavioral"],
    prompt:
      "You notice that a commit you pushed an hour ago to a public GitHub repository contains a live API key for the payment provider. What should you do first?",
    options: [
      "Push a new commit that deletes the key, since it then no longer appears in the code",
      "Force-push a rewritten history without the key, then carry on without telling anyone",
      "Revoke and rotate the key straight away and tell your lead, then clean up the history",
      "Make the repository private, since nobody outside the team can then see the commit",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "treat the key as compromised",
      "revoke and rotate it immediately",
      "tell the lead or security team",
      "check the provider's logs for misuse",
      "then remove it from history and enable secret scanning",
    ],
    redFlags: ["deleting the key in a new commit is enough", "hide the mistake", "making the repository private undoes the leak"],
    rubric: {
      criteria: [
        {
          name: "Containment",
          weight: 5,
          keywords: ["revoke", "rotate", "compromised", "immediately", "new key"],
        },
        {
          name: "Communication and follow-up",
          weight: 4,
          keywords: ["tell", "security team", "logs", "history", "secret scanning", "post-mortem"],
        },
      ],
    },
    modelAnswer:
      "A secret that has been in a public repository must be treated as compromised: automated scrapers find keys within minutes, and forks, clones and caches keep copies after the commit is removed. The first step is to revoke the key and issue a new one through the provider, then tell your lead or security team so the provider's logs can be checked for misuse. Rewriting history and enabling secret scanning are good follow-ups, but on their own they do not make the leaked key safe, and hiding the mistake only makes the impact worse.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-10",
    track: "backend",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["metrics", "performance", "slos/slas"],
    prompt:
      "A dashboard shows an API's average response time as 120 ms, yet users complain that some requests are very slow. Why do teams track p95 or p99 latency instead of only the average?",
    options: [
      "Percentiles show how slow the slowest share of requests is, which an average of mostly fast ones hides",
      "Percentiles leave out failed requests, so they only measure the requests that users actually care about",
      "An average cannot be computed over a stream of requests, so monitoring tools only offer percentiles",
      "p99 is the average of the 99 slowest requests in each minute, which smooths out short traffic spikes",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "p99 is the latency that 99% of requests are faster than",
      "an average hides a long tail of slow requests",
      "tail latency is what real users notice",
      "SLOs are usually set on percentiles",
      "percentiles are computed from latency histograms",
    ],
    redFlags: ["the average is enough", "percentiles ignore errors"],
    rubric: {
      criteria: [
        {
          name: "Percentiles",
          weight: 5,
          keywords: ["p95", "p99", "percentile", "tail latency", "slowest", "distribution"],
        },
        {
          name: "Why not the average",
          weight: 4,
          keywords: ["average", "mean", "hides", "outliers", "slo", "histogram"],
        },
      ],
    },
    modelAnswer:
      "p99 latency is the value that 99% of requests are faster than, so it describes the slow tail that real users hit. An average is dominated by the many fast requests, so a few multi-second responses barely move it. A user who triggers many API calls is likely to meet at least one tail-latency request, which is why SLOs are usually set on percentiles computed from latency histograms. Percentiles do not exclude errors, and p99 is not an average of the slowest requests.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-junior-11",
    track: "backend",
    level: "junior",
    difficulty: 3,
    type: "coding",
    tags: ["node.js", "event-loop", "async"],
    prompt:
      'What does this Node.js script print?\n\n```js\nasync function handle() {\n  console.log("A");\n  await Promise.resolve();\n  console.log("B");\n}\nsetTimeout(() => console.log("C"), 0);\nhandle();\nconsole.log("D");\n```',
    options: ["A B D C", "A D C B", "D A B C", "A D B C"],
    correctOptionIndex: 3,
    expectedPoints: [
      "an async function runs synchronously until its first await",
      "await always pauses the function, even on an already-resolved promise",
      "the code after await resumes as a microtask",
      "the microtask queue is drained before timer callbacks run",
      "setTimeout(fn, 0) runs later, in the timers phase",
    ],
    redFlags: [
      "awaiting a resolved promise continues synchronously",
      "an async function does not start until later",
      "setTimeout with 0 ms runs immediately",
    ],
    rubric: {
      criteria: [
        {
          name: "Ordering",
          weight: 5,
          keywords: ["synchronous", "first await", "microtask", "resumes", "settimeout", "queue"],
        },
        {
          name: "Event loop",
          weight: 4,
          keywords: ["event loop", "call stack", "timers phase", "drained", "macrotask"],
        },
      ],
    },
    modelAnswer:
      "Calling handle() runs its body synchronously up to the first await, so A prints straight away. The await pauses handle and schedules the rest of it as a microtask, even though the promise is already resolved, so the script carries on and prints D. Once the script finishes, Node.js drains the microtask queue, resuming handle to print B, and only then does the event loop reach the timers phase and run the 0 ms timeout, printing C: the output is A D B C. A 0 ms timeout means 'after the current work and its microtasks', not immediately.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-12",
    track: "backend",
    level: "junior",
    difficulty: 3,
    type: "debugging",
    tags: ["prisma", "database", "performance"],
    prompt:
      "This endpoint returns 50 posts with their authors, and it gets slower as traffic grows. What is the problem?\n\n```ts\nconst posts = await prisma.post.findMany({ take: 50 });\nconst result = [];\nfor (const post of posts) {\n  const author = await prisma.user.findUnique({\n    where: { id: post.authorId },\n  });\n  result.push({ ...post, author });\n}\nreturn result;\n```",
    options: [
      "findMany without orderBy returns rows in random order, which forces Prisma to rescan the table",
      "It runs one query per post (the N+1 pattern); load the authors together with include or an IN query",
      "findUnique bypasses Prisma's connection pool, so each call opens a brand-new database connection",
      "The await inside the loop blocks the Node.js event loop until each of the queries has finished",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "N+1 queries: one for the posts plus one per post",
      "each query costs a database round trip",
      "load related rows in one query with include, a join or WHERE id IN (...)",
      "await in a loop is sequential but does not block the event loop",
    ],
    redFlags: ["a bigger connection pool fixes it", "await blocks the event loop"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["n+1", "query per", "round trip", "loop", "51 queries"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["include", "join", "where id in", "batch", "dataloader", "single query"],
        },
      ],
    },
    modelAnswer:
      "The code makes one query for the posts and then one more for each post's author, 51 round trips in total: the N+1 query problem, whose cost grows with the page size and the traffic. Load the related data in one go instead, with `include: { author: true }`, a join, or a single `WHERE id IN (...)` query whose results are matched up in memory. Awaiting inside the loop makes the queries run one after another, but it does not block the event loop, and a bigger connection pool does not help because only one query is in flight at a time.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-13",
    track: "backend",
    level: "junior",
    difficulty: 3,
    type: "coding",
    tags: ["node.js", "http", "performance"],
    prompt:
      "An Express endpoint lets users download log archives that can be several gigabytes in size. Which implementation keeps the server's memory use roughly constant, whatever the file size?",
    options: [
      "Read it with fs.promises.readFile, then send the resulting Buffer with res.send",
      "Read it with fs.readFileSync, since a synchronous read keeps less of the file in memory",
      "Convert the file to a base64 string and return it inside a JSON response body",
      "Pipe fs.createReadStream(path) into res with stream.pipeline, which handles backpressure",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "readFile and readFileSync load the whole file into memory",
      "a read stream processes the file in small chunks",
      "pipeline handles backpressure and cleans up on errors",
      "readFileSync also blocks the event loop",
    ],
    redFlags: ["synchronous reads use less memory", "base64 makes files smaller"],
    rubric: {
      criteria: [
        {
          name: "Streaming",
          weight: 5,
          keywords: ["stream", "createreadstream", "chunks", "pipe", "pipeline", "memory"],
        },
        {
          name: "Backpressure and errors",
          weight: 4,
          keywords: ["backpressure", "slow client", "highwatermark", "error", "cleanup", "destroy"],
        },
      ],
    },
    modelAnswer:
      "fs.createReadStream reads the file in small chunks, and stream.pipeline writes them to the response, pausing the file stream whenever the client reads slowly (backpressure) and destroying both streams if either side fails. Memory use therefore stays roughly constant however large the file is. readFile and readFileSync load the whole file into one Buffer, which a few concurrent downloads can turn into an out-of-memory crash; readFileSync also blocks the event loop, and base64 makes the payload about a third larger.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-14",
    track: "backend",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["api versioning", "rest", "api"],
    prompt:
      "Mobile apps that you cannot force users to update read the `fullName` field from your public REST API. The team wants to rename it to `displayName`. What is the safest approach?",
    options: [
      "Rename the field in place and announce the change in the API's release notes on the same day",
      "Add displayName next to fullName, deprecate fullName, and remove it once clients have moved",
      "Rename the field and return 400 Bad Request to older app versions that still expect fullName",
      "Rename the field and bump only the API's patch version, since nothing but a name has changed",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "renaming or removing a field is a breaking change",
      "adding a field is backwards compatible",
      "deprecate before removing",
      "remove only after clients migrate or in a new major version",
      "monitor usage of the old field",
    ],
    redFlags: ["release notes make a breaking change safe", "a rename is a patch-level change"],
    rubric: {
      criteria: [
        {
          name: "Compatibility",
          weight: 5,
          keywords: ["breaking change", "backwards compatible", "additive", "old clients", "contract"],
        },
        {
          name: "Migration",
          weight: 4,
          keywords: ["deprecate", "sunset", "new version", "v2", "migrate", "monitor usage"],
        },
      ],
    },
    modelAnswer:
      "Renaming a field is a breaking change: installed app versions keep reading fullName and break as soon as it disappears, whatever the release notes say. Adding displayName is additive and backwards compatible, so both fields can be returned while fullName is marked as deprecated in the documentation or OpenAPI schema. Once usage of the old field has dropped off, or in a new major version such as /v2, it can be removed. Labelling the rename a patch release or rejecting old clients still breaks them.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-junior-15",
    track: "backend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["caching", "redis"],
    prompt:
      "Product data is cached in Redis using the cache-aside pattern with a 10-minute TTL. After an admin changes a price, customers keep seeing the old price for up to 10 minutes. What is the usual fix?",
    options: [
      "Delete the product's cache key right after the database update commits, so the next read reloads it",
      "Write the new price into the cache first, then update the database a few seconds afterwards",
      "Set Redis's maxmemory-policy to allkeys-lru, so that outdated product entries are evicted first",
      "Switch Redis persistence to append-only (AOF) mode, so cached values always match the database",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "cache-aside: read the cache, fall back to the database, then fill the cache",
      "a TTL alone leaves stale data until it expires",
      "invalidate (delete) the key after the write commits",
      "deleting is safer than writing the new value into the cache",
      "keep the TTL as a safety net",
    ],
    redFlags: [
      "an eviction policy removes stale entries",
      "a longer TTL reduces staleness",
      "Redis persistence keeps the cache in sync with the database",
    ],
    rubric: {
      criteria: [
        {
          name: "Invalidation",
          weight: 5,
          keywords: ["invalidate", "delete", "del", "key", "after commit", "write"],
        },
        {
          name: "Cache-aside",
          weight: 4,
          keywords: ["cache-aside", "ttl", "stale", "miss", "reload", "database"],
        },
      ],
    },
    modelAnswer:
      "With cache-aside the application reads from Redis, falls back to the database on a miss and stores the result with a TTL, so without invalidation an update stays invisible until the key expires. Deleting the product's key after the database transaction commits makes the next read miss and load the new price; deleting is usually safer than writing the new value, which can race with other writers. Writing the cache before the database risks caching a price that is never saved. An LRU eviction policy only frees memory by evicting the least recently used keys, so it knows nothing about stale data, and Redis persistence only protects Redis's own data across restarts.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-16",
    track: "backend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["queues", "background jobs"],
    prompt:
      "A queue worker sends order-confirmation emails. The queue guarantees at-least-once delivery, and the worker crashes after sending an email but before acknowledging the message. What happens, and how should the worker be designed?",
    options: [
      "The message is lost for good, so the worker should acknowledge each message before processing it",
      "The queue sees the crash and discards the message, as it cannot tell whether the email was sent",
      "The message comes back once, but the queue removes duplicate deliveries, so no extra logic is needed",
      "The queue delivers it again, so the handler must be idempotent, e.g. skip orders already emailed",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "an unacknowledged message is delivered again",
      "at-least-once delivery means duplicates are possible",
      "make the handler idempotent",
      "record processed order ids, e.g. with a unique constraint",
      "acknowledging before processing risks losing messages",
    ],
    redFlags: ["the queue guarantees exactly-once processing", "acknowledge first to avoid duplicates"],
    rubric: {
      criteria: [
        {
          name: "Delivery semantics",
          weight: 5,
          keywords: ["at-least-once", "redeliver", "acknowledge", "ack", "duplicate", "visibility timeout"],
        },
        {
          name: "Idempotent consumer",
          weight: 5,
          keywords: ["idempotent", "dedupe", "unique", "processed", "order id", "skip"],
        },
      ],
    },
    modelAnswer:
      "With at-least-once delivery, a message that is never acknowledged (or whose visibility timeout runs out) is delivered again, so after the crash a worker will send the email a second time unless the handler is idempotent. A common approach is to record each processed order id in a table with a unique constraint, or pass an idempotency key to the email provider, and skip messages that were already handled. Acknowledging before processing only swaps duplicates for lost messages, and the queue does not deduplicate processing for you.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-17",
    track: "backend",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["postgresql", "sql", "database"],
    prompt:
      "The `users` table has a B-tree index on `email`, yet this login query scans millions of rows sequentially in PostgreSQL. Why?\n\n```sql\nSELECT id, password_hash\nFROM users\nWHERE lower(email) = lower($1);\n```",
    options: [
      "An index on email can't serve a filter on lower(email); create an index on lower(email) instead",
      "PostgreSQL cannot use any index when the query has a $1 parameter in place of a literal value",
      "B-tree indexes only work on numeric columns, so the email index has to be a hash index instead",
      "The index has to be rebuilt with REINDEX after every insert before it can find the new emails",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the index stores email values, not lower(email)",
      "wrapping an indexed column in a function stops the index being used",
      "create an expression index on lower(email)",
      "or store normalised emails or use citext",
      "confirm with EXPLAIN",
    ],
    redFlags: ["query parameters stop indexes being used", "indexes must be rebuilt after inserts"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["function", "expression", "lower", "sequential scan", "index not used"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["expression index", "create index", "citext", "normalise", "explain"],
        },
      ],
    },
    modelAnswer:
      "A B-tree index on email stores the raw email values, so PostgreSQL cannot use it for a condition on lower(email); it would have to compute the function for every row, hence the sequential scan. Creating an index on the expression, `CREATE INDEX ON users (lower(email));`, lets the query use it, as does storing emails already lower-cased or using the citext type. EXPLAIN shows whether the index is used; query parameters do not prevent index use, and PostgreSQL keeps indexes up to date on every insert.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-18",
    track: "backend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["mongodb", "postgresql", "database"],
    prompt:
      "For which workload is a document database such as MongoDB usually a better fit than a relational database such as PostgreSQL?",
    options: [
      "Accounting data that many ad hoc reports join across tables, where every write must respect foreign keys",
      "A product catalogue where each item is read and written as one unit and its attributes vary by category",
      "An order system that needs multi-table transactions with strict constraints checked on every request",
      "Any workload with more than a few million rows, since relational databases cannot scale beyond that",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "document databases store self-contained aggregates",
      "a flexible schema suits attributes that vary",
      "data that is read together is stored together",
      "relational databases suit joins, foreign keys and constraints",
      "both kinds scale to very large datasets",
    ],
    redFlags: ["relational databases cannot scale", "document databases need no data modelling"],
    rubric: {
      criteria: [
        {
          name: "Document model fit",
          weight: 5,
          keywords: ["document", "aggregate", "flexible schema", "embedded", "read together", "varying attributes"],
        },
        {
          name: "Relational strengths",
          weight: 4,
          keywords: ["joins", "foreign keys", "constraints", "transactions", "ad hoc queries", "normalised"],
        },
      ],
    },
    modelAnswer:
      "A document database fits best when data is naturally a self-contained aggregate that is read and written as a unit and whose shape varies, like catalogue items whose attributes differ by category: each item lives in one document with no joins. Relational databases are the better fit for highly connected data queried in ad hoc ways, enforced foreign keys and constraints, and multi-table transactions, even though MongoDB supports multi-document transactions and PostgreSQL has JSONB. Both handle very large datasets, so row count alone does not decide it.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-19",
    track: "backend",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["testing", "integration testing"],
    prompt:
      "Which of these commonly make backend tests flaky, passing on some runs and failing on others with no code change? Select all that apply.",
    options: [
      "A test that relies on rows created by a different test that happens to run before it",
      "A test that calls a real third-party API over the network and checks its response",
      "A test that uses a fake clock fixed to a known date and time instead of the real one",
      "A test whose expected value depends on the real current time, read with Date.now()",
      "A test that creates its own data inside a transaction that is rolled back afterwards",
    ],
    correctOptionIndex: 3,
    correctOptionIndices: [0, 1, 3],
    multiSelect: true,
    expectedPoints: [
      "shared state and dependence on test order",
      "real network calls to external services",
      "dependence on the real clock or time zone",
      "isolate tests with their own data, rolled back or reset",
      "use fake timers or an injected clock",
    ],
    redFlags: ["retry flaky tests until they pass", "fake clocks make tests flaky"],
    rubric: {
      criteria: [
        {
          name: "Causes",
          weight: 5,
          keywords: ["shared state", "order", "network", "external api", "real clock", "time"],
        },
        {
          name: "Remedies",
          weight: 4,
          keywords: ["isolate", "rollback", "fake timers", "inject clock", "mock", "stub"],
        },
      ],
    },
    modelAnswer:
      "Tests become flaky when they depend on something outside their control: data left behind by another test, so the result changes with test order or parallel runs; a real third-party service that can be slow, rate-limited or down; or the real current time, which changes between runs and around midnight or time-zone boundaries. A fake clock fixed to a known instant, and per-test data rolled back in a transaction, remove those sources of variation, so they make tests more deterministic. External calls are better stubbed in most tests and covered separately by contract tests.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-backend-junior-20",
    track: "backend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["api", "sql", "postgresql"],
    prompt:
      "An endpoint lists events newest first with `ORDER BY created_at DESC LIMIT 20 OFFSET 100000`. Deep pages are slow, and rows inserted or deleted while a user pages through cause items to repeat or be skipped. What is the better design?",
    options: [
      "Keyset pagination: return the last row's (created_at, id) as a cursor and fetch the rows after it",
      "Keep OFFSET and add an index on created_at, which removes the cost of skipping all the earlier rows",
      "Return every event in a single response and let the client split it into pages in memory instead",
      "Raise the page size to 1,000 rows, so that far fewer deep pages are ever requested by the clients",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "OFFSET still reads and discards every skipped row",
      "offsets shift when rows are inserted or deleted",
      "keyset (cursor) pagination continues from the last sort key seen",
      "add a unique tie-breaker such as id",
      "an index on (created_at, id) makes each page a short range scan",
      "trade-off: no jumping to an arbitrary page number",
    ],
    redFlags: ["an index makes OFFSET free", "load everything and page on the client"],
    rubric: {
      criteria: [
        {
          name: "Offset problems",
          weight: 5,
          keywords: ["offset", "skipped rows", "scan", "shift", "duplicates", "missing"],
        },
        {
          name: "Keyset pagination",
          weight: 5,
          keywords: ["keyset", "cursor", "seek", "tie-breaker", "id", "index"],
        },
      ],
    },
    modelAnswer:
      "With OFFSET the database still has to produce and throw away the first 100,000 rows, even when an index provides the order, so deep pages get slower, and every insert or delete shifts the offsets, so items repeat or are skipped. Keyset (cursor) pagination gives the client an opaque cursor holding the last row's (created_at, id) and then queries `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`. With an index on (created_at, id) each page is a short index range scan, and new rows at the top do not disturb later pages; the id breaks ties between equal timestamps. The trade-off is that clients cannot jump straight to an arbitrary page number.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-21",
    track: "backend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["postgresql", "transactions", "consistency"],
    prompt: "In PostgreSQL's default isolation level, Read Committed, which statement is true?",
    options: [
      "A transaction can read rows that another transaction has changed but has not yet committed",
      "All transactions behave as if they ran one after another, so race conditions cannot occur",
      "Each transaction works on one snapshot taken at its first query and never sees later commits",
      "Two identical SELECTs in one transaction can return different rows if others commit in between",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "Read Committed is PostgreSQL's default",
      "each statement sees data committed before it started",
      "non-repeatable reads and phantoms are possible",
      "PostgreSQL never allows dirty reads",
      "Repeatable Read uses one snapshot per transaction; Serializable prevents anomalies",
    ],
    redFlags: ["the default level prevents race conditions", "PostgreSQL allows dirty reads"],
    rubric: {
      criteria: [
        {
          name: "Read Committed",
          weight: 5,
          keywords: ["read committed", "per statement", "snapshot", "non-repeatable read", "committed"],
        },
        {
          name: "Other levels",
          weight: 4,
          keywords: ["dirty read", "repeatable read", "serializable", "phantom", "lost update"],
        },
      ],
    },
    modelAnswer:
      "Under Read Committed each statement sees a snapshot of the data committed before that statement began, so two identical SELECTs in one transaction can differ when another transaction commits in between (non-repeatable reads and phantoms). PostgreSQL never exposes uncommitted changes; even Read Uncommitted behaves as Read Committed. One snapshot for the whole transaction is Repeatable Read, and behaving as if transactions ran one at a time is Serializable, so the default does not prevent races such as lost updates.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-22",
    track: "backend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["security", "owasp"],
    prompt:
      "A link-preview endpoint takes a URL from the user, fetches it from the server and returns the page title. Which vulnerability is this feature most exposed to, and what is the main defence?",
    options: [
      "Cross-site request forgery; add a CSRF token to the form in which the users enter the URL",
      "Server-side request forgery; block requests to internal, loopback and cloud metadata addresses",
      "SQL injection; pass the URL to the database as a bound parameter rather than as a plain string",
      "Clickjacking; send X-Frame-Options: DENY with the response that contains the fetched page title",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "SSRF: the server is made to request URLs chosen by the attacker",
      "targets include cloud metadata (169.254.169.254), localhost and internal services",
      "allow only expected schemes and, where possible, hosts",
      "resolve the hostname and block private, loopback and link-local ranges",
      "re-check after redirects and restrict outbound traffic",
    ],
    redFlags: ["CSRF tokens prevent this", "checking the hostname text is enough"],
    rubric: {
      criteria: [
        {
          name: "Vulnerability",
          weight: 5,
          keywords: ["ssrf", "server-side request forgery", "internal", "metadata", "localhost"],
        },
        {
          name: "Defence",
          weight: 5,
          keywords: ["allow-list", "private ranges", "dns resolution", "redirects", "egress", "validate"],
        },
      ],
    },
    modelAnswer:
      "Because the server fetches a URL the user controls, an attacker can point it at addresses only the server can reach, such as the cloud metadata service at 169.254.169.254 (which can hand out credentials), localhost admin ports or internal services: server-side request forgery, a risk the OWASP Top 10 calls out. The defences are to allow only http(s), resolve the hostname and refuse private, loopback and link-local addresses (checking again after every redirect), use an allow-list of hosts where possible, and restrict outbound traffic at the network level. A CSRF token protects a user's browser session and does nothing against the server's own requests.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-23",
    track: "backend",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["oauth", "oidc", "authentication"],
    prompt:
      "Your app adds 'Sign in with Google', which uses OpenID Connect. What does OpenID Connect add on top of plain OAuth 2.0 for this kind of login?",
    options: [
      "An ID token: a signed JWT for your app that states which user the provider authenticated",
      "An access token your app can decode to learn who the user is, which OAuth 2.0 does not issue",
      "A way for your app to receive the user's Google password and check it against its own users",
      "Encryption of the redirects between Google and your app, which OAuth 2.0 sends without TLS",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "OAuth 2.0 is for delegated authorisation (access tokens)",
      "OIDC adds authentication: who the user is",
      "the ID token is a signed JWT with iss, sub, aud and exp claims",
      "validate the signature, issuer, audience, expiry and nonce",
      "identify users by issuer plus sub, not by email",
    ],
    redFlags: ["use the access token as proof of identity", "the app handles the user's provider password"],
    rubric: {
      criteria: [
        {
          name: "OAuth vs OIDC",
          weight: 5,
          keywords: ["authorisation", "authentication", "access token", "id token", "identity layer"],
        },
        {
          name: "ID token handling",
          weight: 4,
          keywords: ["jwt", "sub", "issuer", "audience", "nonce", "validate"],
        },
      ],
    },
    modelAnswer:
      "OAuth 2.0 is a delegated authorisation framework: it gives a client an access token for calling an API, and that token is meant for the API, not as proof to the client of who the user is. OpenID Connect is an identity layer on top that adds the ID token, a signed JWT whose claims (iss, sub, aud, exp, nonce) tell your app which user the provider authenticated. Your app validates the signature, issuer, audience, expiry and nonce, then identifies the user by issuer plus sub. The password is only ever entered at the provider, and both protocols rely on TLS.",
    followUpIds: [],
  },
  {
    id: "qb-backend-junior-24",
    track: "backend",
    level: "junior",
    difficulty: 5,
    type: "debugging",
    tags: ["postgresql", "sql", "consistency"],
    prompt:
      'Two customers buy the last item at the same moment. Both orders succeed and stock ends at 0, so two items were sold. What is the bug, and what is a correct fix?\n\n```ts\nconst { rows } = await db.query(\n  "SELECT stock FROM products WHERE id = $1", [id]);\nif (rows[0].stock < 1) throw new Error("Sold out");\nawait db.query(\n  "UPDATE products SET stock = $1 WHERE id = $2",\n  [rows[0].stock - 1, id]);\nawait createOrder(id);\n```',
    options: [
      "The two queries may use different pooled connections; run both on one connection so they see each other's writes",
      "The check is off by one; it should be rows[0].stock <= 1 so that the very last item can only ever be sold once",
      "Both read 1 before either writes; use UPDATE ... SET stock = stock - 1 WHERE id = $1 AND stock > 0, check rowCount",
      "PostgreSQL answered the second SELECT from its query result cache; add ORDER BY to the query to bypass the cache",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "check-then-act race: both requests read stock 1",
      "the second UPDATE overwrites the first (lost update)",
      "make the check and the decrement one atomic statement",
      "check the affected row count to detect sold out",
      "alternatively lock the row with SELECT ... FOR UPDATE in a transaction",
      "put the decrement and the order insert in one transaction",
    ],
    redFlags: ["Node.js is single-threaded, so races cannot happen", "PostgreSQL caches query results"],
    rubric: {
      criteria: [
        {
          name: "Race diagnosis",
          weight: 5,
          keywords: ["race condition", "concurrent", "check-then-act", "lost update", "both read"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["atomic", "stock - 1", "stock > 0", "rowcount", "for update", "transaction"],
        },
      ],
    },
    modelAnswer:
      "This is a check-then-act race: both requests run the SELECT and see stock 1 before either UPDATE runs, and Node.js being single-threaded does not prevent it, because each await lets the requests interleave. Both then write stock = 0 (a lost update) and two orders are created. Doing the check and the change in one statement, `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`, lets PostgreSQL's row lock serialise the two requests, and a rowCount of 0 means the item is sold out. Locking the row with SELECT ... FOR UPDATE inside a transaction also works, and the order insert belongs in the same transaction as the decrement.",
    followUpIds: [],
  },
];
