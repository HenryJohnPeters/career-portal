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

const DATASETS = [
  {
    company: "LedgerLite",
    records: "expense records",
    naturalKey: "transaction reference",
    desc: "expense tracking for small businesses",
    aggregate: "total spend per category per month",
  },
  {
    company: "StockRoom",
    records: "inventory items",
    naturalKey: "SKU",
    desc: "inventory management for independent retailers",
    aggregate: "stock value per warehouse and category",
  },
  {
    company: "Fleetly",
    records: "vehicle service records",
    naturalKey: "vehicle registration and service date",
    desc: "maintenance tracking for delivery fleets",
    aggregate: "maintenance cost per vehicle per quarter",
  },
  {
    company: "ShopMetrics",
    records: "order lines",
    naturalKey: "order number and line number",
    desc: "sales analytics for online shops",
    aggregate: "revenue per product per week",
  },
] as const;

export const dataImportTemplate = defineTemplate({
  id: "data-import",
  roles: ["backend", "fullstack"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    framework: [
      "NestJS",
      "Express",
      "Fastify",
      ".NET",
      "Spring Boot",
      "Django",
      "FastAPI",
      "Laravel",
      "Rails",
      "Flask",
      "Gin",
    ],
    database: ["PostgreSQL", "MySQL", "SQL Server", "SQLite", "MongoDB"],
    queue: ["BullMQ", "RabbitMQ", "SQS/SNS", "Kafka"],
  },
  topics: ["Background Jobs", "Database", "SQL", "Transactions", "API", "Queues"],
  build: ({ level, difficulty, choose, chooseOptional, pick }) => {
    const framework = choose("framework", "a framework of your choice");
    const db = choose("database", "PostgreSQL");
    const queue = chooseOptional("queue");
    const data = pick(DATASETS);
    return {
      title: `${data.company} — CSV Import & Reporting Service`,
      companyContext: `${data.company} provides ${data.desc}. Customers move over from spreadsheets, so the backend team needs a ${levelLabel(level)} engineer to build a ${difficultyAdjective(difficulty)} import service that turns messy CSV files into clean, queryable data.`,
      brief: `Build a service with **${framework}** and **${db}** that imports CSV files of **${data.records}**, validates every row, stores the valid ones, and reports exactly what was rejected and why.${queue ? ` Use **${queue}** to run imports in the background.` : ""}`,
      background:
        "Today customers email spreadsheets to support, who paste them in by hand. Files are inconsistent: missing columns, mixed date formats, duplicates and stray formatting. A failed import currently means starting again from scratch.",
      requirements: [
        {
          key: "Upload",
          text: `Expose an endpoint that accepts a CSV upload of ${data.records} (up to 10 MB) and returns an import id.`,
        },
        {
          key: "Validation",
          text: "Parse and validate every row (required fields, types, ranges, duplicates). Collect row-level errors with line numbers instead of failing the whole file.",
        },
        {
          key: "Idempotency",
          text: `Insert valid rows in batches. Re-importing the same file must not create duplicates — upsert on a natural key (${data.naturalKey}).`,
        },
        {
          key: "Status",
          text: "Expose GET /imports/:id with the import status (pending → processing → completed/failed), counts (total, imported, rejected) and the first 100 row errors.",
        },
        ...beyondJunior(level, [
          {
            key: "Background",
            text: `Process imports in the background${queue ? ` with ${queue}` : " (a worker or job queue)"} so the upload request never waits for parsing; the status endpoint shows progress.`,
          },
          {
            key: "Reporting",
            text: `Add a reporting endpoint (e.g. ${data.aggregate}) backed by appropriate indexes.`,
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Streaming",
            text: "Stream the file instead of loading it into memory, so a 1 GB file imports in constant memory.",
          },
          {
            key: "Resumable",
            text: "Make imports resumable: if the worker crashes mid-file, restarting it continues without duplicating or losing rows.",
          },
        ]),
      ],
      nonFunctional: [
        "A bad row never aborts the import of the good rows.",
        "Database writes are batched and transactional per batch.",
        "Configuration (DB URL, limits) comes from environment variables.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "Uploading a valid file imports every row and reports 0 rejections.",
        "Uploading a file with invalid rows imports the valid ones and lists each rejected row with its line number and reason.",
        "Importing the same file twice leaves the data unchanged.",
        "Uploading a non-CSV or oversized file returns a clear 4xx error.",
        ...beyondJunior(level, ["The upload request returns quickly even for large files."]),
      ],
      bonusChallenges: [
        "Accept column-name variations (e.g. 'Date', 'date', 'Transaction Date') via a mapping step.",
        "Let users download a CSV of rejected rows with an extra 'error' column.",
        "Add an import preview that validates the first 20 rows before committing.",
        "Add metrics for rows per second and rejection rate.",
      ],
      evaluationCriteria: [
        {
          name: "Correctness & Validation",
          weight: 25,
          description: "Rows are parsed and validated correctly; edge cases like quoting, encodings and dates are handled.",
        },
        {
          name: "Data Modeling",
          weight: 20,
          description: "Schema, natural keys, constraints and indexes support idempotent imports and reporting.",
        },
        {
          name: "Code Architecture",
          weight: 20,
          description: "Parsing, validation, persistence and reporting are separated and testable.",
        },
        {
          name: "Performance",
          weight: 15,
          description: "Batched writes, bounded memory use and efficient queries.",
        },
        {
          name: "Error Reporting",
          weight: 10,
          description: "Clear row-level errors and an accurate import status.",
        },
        {
          name: "Testing & Docs",
          weight: 10,
          description: "Tests with good and bad fixture files, and a README with setup and design notes.",
        },
      ],
      hints: [
        "Write the row validator as a pure function first — it's the easiest part to test thoroughly.",
        "Prepare a handful of fixture files: clean, messy, duplicated and very large.",
        "Use a well-tested CSV parser rather than splitting on commas.",
        "Decide early what makes two rows 'the same' — your natural key drives the upsert.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "2–3 hours",
        medium: "3–5 hours",
        hard: "5–8 hours",
      }),
      deliverables: [
        "Source code in a Git repository.",
        "Database migrations and sample CSV files (valid and invalid).",
        "A README with setup instructions, API documentation, and design decisions.",
      ],
      constraints: [
        `Use ${framework} for the service.`,
        `Use ${db} as the database.`,
        ...(queue ? [`Use ${queue} for background processing.`] : []),
        "Do not load the whole table into memory to detect duplicates.",
      ],
    };
  },
});
