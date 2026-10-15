import {
  BarChart3,
  Box,
  Cloud,
  Database,
  FileCode,
  FileText,
  FlaskConical,
  Globe,
  Layers,
  Layout,
  Lightbulb,
  Link,
  Lock,
  Mail,
  Package,
  Paintbrush,
  RefreshCw,
  Repeat,
  Rocket,
  Shield,
  ShieldCheck,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { InterviewRoleFocus, InterviewTrack } from "@careerportal/shared/types";

/**
 * Role-aware groupings ("pathways") of TECH_TAG_CATALOG ids for the tech-stack
 * picker. Presentation only: tags are the catalog's canonical ids (labels come
 * from getTechTagLabel) and tech-pathways.spec.ts fails on unknown ids.
 */
export interface TechPathway {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Canonical TECH_TAG_CATALOG ids. */
  tags: readonly string[];
}

export const ROLE_TECH_PATHWAYS: Readonly<Record<InterviewRoleFocus, readonly TechPathway[]>> = {
  frontend: [
    {
      key: "fe-language",
      label: "Language",
      icon: FileCode,
      description: "Pick your primary language",
      tags: ["typescript", "javascript"],
    },
    {
      key: "fe-framework",
      label: "UI Framework",
      icon: Layout,
      description: "Which framework are you interviewing for?",
      tags: ["react", "angular", "vue", "svelte", "solid"],
    },
    {
      key: "fe-meta-framework",
      label: "Meta-Framework",
      icon: Package,
      description: "Full-stack or SSR framework",
      tags: ["next.js", "nuxt", "remix", "astro", "sveltekit"],
    },
    {
      key: "fe-state",
      label: "State Management",
      icon: RefreshCw,
      description: "How you manage application state",
      tags: ["redux", "zustand", "mobx", "jotai", "recoil", "pinia", "ngrx", "context api", "tanstack query"],
    },
    {
      key: "fe-styling",
      label: "Styling & UI",
      icon: Paintbrush,
      description: "CSS approach and component libraries",
      tags: [
        "tailwind css",
        "css modules",
        "styled components",
        "sass/scss",
        "emotion",
        "chakra ui",
        "material ui",
        "radix ui",
        "shadcn",
        "ant design",
      ],
    },
    {
      key: "fe-testing",
      label: "Testing",
      icon: FlaskConical,
      description: "Testing tools and approaches",
      tags: ["jest", "vitest", "react testing library", "cypress", "playwright", "storybook"],
    },
    {
      key: "fe-tooling",
      label: "Build & Tooling",
      icon: Wrench,
      description: "Bundlers, linters, and dev tools",
      tags: ["vite", "webpack", "esbuild", "turbopack", "eslint", "prettier", "monorepos", "nx"],
    },
    {
      key: "fe-concepts",
      label: "Core Concepts",
      icon: Lightbulb,
      description: "Key frontend interview topics",
      tags: [
        "performance",
        "accessibility",
        "seo",
        "web vitals",
        "pwa",
        "responsive design",
        "browser apis",
        "websockets",
        "graphql",
        "rest",
      ],
    },
  ],

  backend: [
    {
      key: "be-language",
      label: "Language",
      icon: FileCode,
      description: "Pick your primary backend language",
      tags: ["typescript", "javascript", "node.js", "c#", "java", "python", "go", "rust", "php", "ruby", "kotlin"],
    },
    {
      key: "be-framework",
      label: "Framework",
      icon: Layers,
      description: "Which backend framework are you interviewing for?",
      tags: [
        "nestjs",
        "express",
        "fastify",
        ".net",
        "spring boot",
        "django",
        "fastapi",
        "flask",
        "rails",
        "gin",
        "actix",
        "laravel",
        "hono",
      ],
    },
    {
      key: "be-database",
      label: "Database",
      icon: Database,
      description: "Primary database technology",
      tags: [
        "postgresql",
        "mysql",
        "sql server",
        "mongodb",
        "redis",
        "dynamodb",
        "cassandra",
        "elasticsearch",
        "sqlite",
        "neo4j",
      ],
    },
    {
      key: "be-orm",
      label: "ORM / Data Access",
      icon: Link,
      description: "How you interact with your database",
      tags: [
        "prisma",
        "typeorm",
        "drizzle",
        "sequelize",
        "ef core",
        "dapper",
        "hibernate",
        "sqlalchemy",
        "mongoose",
        "knex",
      ],
    },
    {
      key: "be-api",
      label: "API Design",
      icon: Globe,
      description: "API patterns and protocols",
      tags: ["rest", "graphql", "grpc", "websockets", "trpc", "openapi/swagger", "api versioning"],
    },
    {
      key: "be-messaging",
      label: "Messaging & Events",
      icon: Mail,
      description: "Async communication patterns",
      tags: ["rabbitmq", "kafka", "sqs/sns", "redis pub/sub", "event sourcing", "cqrs", "bullmq"],
    },
    {
      key: "be-auth",
      label: "Auth & Security",
      icon: Lock,
      description: "Authentication and security patterns",
      tags: ["jwt", "oauth", "oidc", "passport.js", "rbac", "owasp", "encryption", "rate limiting", "cors"],
    },
    {
      key: "be-testing",
      label: "Testing",
      icon: FlaskConical,
      description: "Backend testing strategies",
      tags: [
        "jest",
        "vitest",
        "supertest",
        "xunit",
        "pytest",
        "integration testing",
        "contract testing",
        "load testing",
      ],
    },
    {
      key: "be-concepts",
      label: "Core Concepts",
      icon: Lightbulb,
      description: "Key backend interview topics",
      tags: [
        "scaling",
        "caching",
        "queues",
        "microservices",
        "monolith",
        "distributed systems",
        "consistency",
        "transactions",
        "connection pooling",
        "background jobs",
      ],
    },
  ],

  fullstack: [
    {
      key: "fs-language",
      label: "Language",
      icon: FileCode,
      description: "Your primary development language",
      tags: ["typescript", "javascript", "node.js", "c#", "java", "python", "go", "rust", "php"],
    },
    {
      key: "fs-frontend",
      label: "Frontend Framework",
      icon: Layout,
      description: "UI framework you'll be tested on",
      tags: ["react", "angular", "vue", "svelte", "next.js", "nuxt", "remix"],
    },
    {
      key: "fs-backend",
      label: "Backend Framework",
      icon: Layers,
      description: "Server-side framework",
      tags: ["nestjs", "express", "fastify", ".net", "spring boot", "django", "fastapi", "rails", "hono"],
    },
    {
      key: "fs-database",
      label: "Database",
      icon: Database,
      description: "Database technologies",
      tags: ["postgresql", "mysql", "sql server", "mongodb", "redis", "dynamodb", "sqlite"],
    },
    {
      key: "fs-orm",
      label: "ORM / Data Access",
      icon: Link,
      description: "Data layer tooling",
      tags: ["prisma", "typeorm", "drizzle", "ef core", "mongoose", "sqlalchemy"],
    },
    {
      key: "fs-api",
      label: "API & Communication",
      icon: Globe,
      description: "How frontend and backend talk",
      tags: ["rest", "graphql", "trpc", "websockets", "server-sent events"],
    },
    {
      key: "fs-state",
      label: "State & Data Fetching",
      icon: RefreshCw,
      description: "Client-side state and data",
      tags: ["redux", "zustand", "tanstack query", "swr", "pinia", "ngrx", "context api"],
    },
    {
      key: "fs-testing",
      label: "Testing",
      icon: FlaskConical,
      description: "Full-stack testing approach",
      tags: ["jest", "vitest", "cypress", "playwright", "react testing library", "supertest"],
    },
    {
      key: "fs-deploy",
      label: "Deployment",
      icon: Rocket,
      description: "How you ship to production",
      tags: ["vercel", "netlify", "docker", "aws", "azure", "gcp", "railway", "fly.io"],
    },
    {
      key: "fs-concepts",
      label: "Core Concepts",
      icon: Lightbulb,
      description: "Key fullstack interview topics",
      tags: [
        "ssr vs csr",
        "authentication",
        "caching",
        "performance",
        "seo",
        "accessibility",
        "monorepos",
        "microservices",
        "system design",
      ],
    },
  ],

  platform: [
    {
      key: "pl-cloud",
      label: "Cloud Provider",
      icon: Cloud,
      description: "Which cloud platform?",
      tags: ["aws", "azure", "gcp", "digitalocean", "cloudflare", "hetzner"],
    },
    {
      key: "pl-containers",
      label: "Containers & Orchestration",
      icon: Box,
      description: "Container runtime and management",
      tags: ["docker", "kubernetes", "ecs", "helm", "podman", "docker compose", "k3s"],
    },
    {
      key: "pl-iac",
      label: "Infrastructure as Code",
      icon: FileText,
      description: "How you define infrastructure",
      tags: ["terraform", "pulumi", "cloudformation", "bicep", "ansible", "cdk", "crossplane"],
    },
    {
      key: "pl-cicd",
      label: "CI/CD",
      icon: Repeat,
      description: "Build and deployment pipelines",
      tags: [
        "github actions",
        "gitlab ci",
        "azure devops",
        "jenkins",
        "circleci",
        "argocd",
        "flux",
        "tekton",
      ],
    },
    {
      key: "pl-observability",
      label: "Observability",
      icon: BarChart3,
      description: "Monitoring, logging, and tracing",
      tags: [
        "prometheus",
        "grafana",
        "opentelemetry",
        "datadog",
        "cloudwatch",
        "sentry",
        "elk stack",
        "loki",
        "jaeger",
      ],
    },
    {
      key: "pl-networking",
      label: "Networking",
      icon: Wifi,
      description: "Network and traffic management",
      tags: [
        "dns",
        "load balancers",
        "cdn",
        "service mesh",
        "istio",
        "nginx",
        "traefik",
        "api gateway",
      ],
    },
    {
      key: "pl-security",
      label: "Security",
      icon: Shield,
      description: "Platform security practices",
      tags: [
        "secrets management",
        "vault",
        "iam",
        "network policies",
        "rbac",
        "encryption",
        "compliance",
        "threat modeling",
      ],
    },
    {
      key: "pl-sre",
      label: "SRE & Reliability",
      icon: ShieldCheck,
      description: "Reliability engineering concepts",
      tags: [
        "slos/slas",
        "incident management",
        "chaos engineering",
        "runbooks",
        "disaster recovery",
        "blue/green deploys",
        "canary releases",
        "feature flags",
      ],
    },
    {
      key: "pl-concepts",
      label: "Core Concepts",
      icon: Lightbulb,
      description: "Key platform interview topics",
      tags: [
        "scaling",
        "high availability",
        "fault tolerance",
        "cost optimization",
        "gitops",
        "immutable infrastructure",
        "12-factor app",
      ],
    },
  ],
};

/** Interview track → the role focus (and pathway set) it maps to. */
export const TRACK_TO_ROLE_FOCUS: Readonly<Record<InterviewTrack, InterviewRoleFocus>> = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  devops: "platform",
};

const ROLE_FOCUS_TO_TRACK: Readonly<Record<InterviewRoleFocus, InterviewTrack>> = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  platform: "devops",
};

export function getRoleTags(role: InterviewRoleFocus): Set<string> {
  const tags = new Set<string>();
  for (const pathway of ROLE_TECH_PATHWAYS[role]) {
    for (const tag of pathway.tags) tags.add(tag);
  }
  return tags;
}

/**
 * The interview track whose pathways list `tag`, preferring `current` so a
 * "practise this topic" shortcut keeps the user's track when it fits.
 */
export function findTrackForTag(tag: string, current: InterviewTrack): InterviewTrack {
  if (getRoleTags(TRACK_TO_ROLE_FOCUS[current]).has(tag)) return current;
  for (const role of Object.keys(ROLE_TECH_PATHWAYS) as InterviewRoleFocus[]) {
    if (getRoleTags(role).has(tag)) return ROLE_FOCUS_TO_TRACK[role];
  }
  return current;
}
