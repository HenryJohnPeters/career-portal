import {
  byDifficulty,
  defineTemplate,
  difficultyAdjective,
  extraRequirements,
  hardOnly,
  levelLabel,
} from "./helpers";

export const notificationServiceTemplate = defineTemplate({
  id: "notification-service",
  roles: ["backend"],
  levels: ["mid", "senior"],
  difficulties: ["medium", "hard"],
  slots: {
    language: ["TypeScript", "JavaScript", "C#", "Java", "Python", "Go", "Rust"],
    messaging: ["Kafka", "RabbitMQ", "SQS/SNS", "Redis Pub/Sub", "BullMQ"],
  },
  topics: [
    "Microservices",
    "Redis",
    "Scaling",
    "Distributed Systems",
    "Queues",
    "Background Jobs",
    "Fault Tolerance",
  ],
  build: ({ level, difficulty, choose, pick }) => {
    const language = choose("language", "TypeScript");
    const messaging = choose("messaging", "a message queue of your choice");
    const companyName = pick(["NotifyPro", "AlertStack", "PingHub", "SignalFlow", "BuzzLine"]);
    return {
      title: `${companyName} — Scalable Notification Service`,
      companyContext: `${companyName} is building a multi-channel notification platform. They need a ${levelLabel(level)} backend engineer to design and implement a ${difficultyAdjective(difficulty)} notification service that handles email, SMS, and push notifications at scale.`,
      brief: `Design and implement a **notification service** in **${language}** that accepts notification requests via an API, queues them using **${messaging}**, and delivers them through multiple channels (email, SMS, push). The system should be resilient, scalable, and observable.`,
      background:
        "The company currently sends notifications synchronously inside the main API — this causes timeouts, lost notifications, and makes it impossible to add new channels. Your service will decouple notification delivery from the main app.",
      requirements: [
        {
          key: "API",
          text: "Create an API endpoint that accepts notification requests: recipient, channel(s), template, and dynamic data.",
        },
        {
          key: "Queue",
          text: `Notifications should be published to ${messaging} for async processing. Implement at least two consumer workers (email + one other channel).`,
        },
        {
          key: "Templates",
          text: 'Support notification templates with variable interpolation (e.g., "Hello {{name}}, your order #{{orderId}} has shipped").',
        },
        {
          key: "Retry",
          text: "Implement retry logic with exponential backoff for failed deliveries. After max retries, move to a dead-letter queue.",
        },
        {
          key: "Status",
          text: "Track notification status (queued → processing → sent → failed) and expose a status lookup endpoint.",
        },
        ...hardOnly(difficulty, [
          {
            key: "Batching",
            text: "Implement batching — if a user receives 5 notifications within 1 minute, combine them into a single digest.",
          },
          {
            key: "Preferences",
            text: "Support user notification preferences (opt-out per channel, quiet hours, frequency limits).",
          },
        ]),
      ],
      nonFunctional: [
        "The API should respond in <100ms — all heavy work happens asynchronously.",
        "The system should handle 1,000+ notifications per second without backpressure issues.",
        "No notification should be lost — implement at-least-once delivery semantics.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "Sending a notification via the API returns 202 Accepted immediately.",
        "The notification appears in the queue and is processed by a worker within 5 seconds.",
        "Failed deliveries are retried up to 3 times with increasing delays.",
        "The status endpoint returns the current state of any notification by ID.",
        "Dead-lettered notifications can be inspected and replayed.",
      ],
      bonusChallenges: [
        "Add a WebSocket endpoint for real-time delivery status updates.",
        "Implement priority queues (urgent vs. normal vs. low-priority).",
        "Add rate limiting per recipient to prevent spam.",
        "Build a simple admin dashboard showing throughput, failure rates, and queue depth.",
        "Support rich content (HTML emails, push notification images, SMS with links).",
      ],
      evaluationCriteria: [
        {
          name: "System Design",
          weight: 30,
          description: "Architecture decisions, component separation, scalability considerations.",
        },
        {
          name: "Reliability",
          weight: 25,
          description: "Retry logic, dead-letter handling, at-least-once delivery.",
        },
        {
          name: "Code Quality",
          weight: 20,
          description: "Clean interfaces, separation of concerns, error handling.",
        },
        {
          name: "API Design",
          weight: 15,
          description: "RESTful contract, proper status codes, clear documentation.",
        },
        {
          name: "Observability",
          weight: 10,
          description: "Logging, metrics, health checks, and debugging tools.",
        },
      ],
      hints: [
        "Start with the API and a simple in-memory queue, then swap for the real message broker.",
        "Use the Strategy pattern for notification channels — each channel implements a common interface.",
        "Design your notification schema carefully — it's the contract between the API and workers.",
        "Don't implement real email/SMS — use console logging or mock adapters.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "3–4 hours",
        medium: "4–6 hours",
        hard: "6–10 hours",
      }),
      deliverables: [
        "Source code in a Git repository.",
        "An architecture diagram showing components, data flow, and failure paths.",
        "A README with design decisions, trade-offs, and instructions to run locally.",
        "A docker-compose.yml that starts the API, workers, and message broker.",
      ],
      constraints: [
        `Use ${language} as the primary language.`,
        `Use ${messaging} for async processing.`,
        "You may mock external delivery providers (no real emails/SMS needed).",
        "The system must run locally with docker-compose.",
      ],
    };
  },
});
