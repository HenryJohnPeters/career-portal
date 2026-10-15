import {
  byDifficulty,
  defineTemplate,
  difficultyAdjective,
  extraRequirements,
  hardOnly,
  levelLabel,
} from "./helpers";

export const kubernetesPlatformTemplate = defineTemplate({
  id: "kubernetes-platform",
  roles: ["platform"],
  levels: ["mid", "senior"],
  difficulties: ["medium", "hard"],
  slots: {
    cloud: ["AWS", "Azure", "GCP"],
    monitoring: ["Prometheus", "Datadog", "OpenTelemetry", "Grafana"],
    delivery: ["ArgoCD", "Flux", "GitHub Actions", "GitLab CI"],
  },
  topics: [
    "Kubernetes",
    "Helm",
    "Docker",
    "Containers",
    "Orchestration",
    "Metrics",
    "Logging",
    "Tracing",
    "SLOs/SLAs",
    "Runbooks",
    "High Availability",
  ],
  build: ({ level, difficulty, choose, pick }) => {
    const cloud = choose("cloud", "a managed Kubernetes service (or a local kind/k3d cluster)");
    const monitoring = choose("monitoring", "Prometheus and Grafana");
    const delivery = choose("delivery", "a CI/CD tool of your choice");
    const companyName = pick(["Orbitly", "KubeCart", "Meshwork", "HarborLine", "Nodeflow"]);
    return {
      title: `${companyName} — Kubernetes Platform with Autoscaling & Observability`,
      companyContext: `${companyName} has outgrown a single VM: deploys cause downtime and incidents are found by customers first. They need a ${levelLabel(level)} platform engineer to build a ${difficultyAdjective(difficulty)} Kubernetes setup that scales with load and tells the team when something is wrong.`,
      brief: `Deploy a small multi-service application (an HTTP API, a background worker and a database) to **Kubernetes** on **${cloud}**, delivered with **${delivery}**, with metrics, dashboards and alerts built on **${monitoring}**.`,
      background:
        "Traffic doubles during sales events. Last month a bad deploy took the site down for 40 minutes and nobody was alerted. The team wants zero-downtime releases, automatic scaling and actionable alerts before the next peak.",
      requirements: [
        {
          key: "Manifests",
          text: "Package the services (Helm, Kustomize or plain manifests): Deployments, Services, ConfigMaps/Secrets, resource requests/limits, and liveness/readiness probes.",
        },
        {
          key: "Autoscaling",
          text: "Configure horizontal autoscaling for the API based on CPU or a custom metric, and demonstrate it with a simple load test.",
        },
        {
          key: "Metrics",
          text: `Expose request rate, error rate and latency from the API and collect them with ${monitoring}; build a dashboard for these golden signals.`,
        },
        {
          key: "Alerts",
          text: "Define at least two actionable alerts (e.g. error-rate SLO burn, pods crash-looping) with a short runbook for each.",
        },
        {
          key: "Rollouts",
          text: "Configure zero-downtime rolling updates (maxUnavailable/maxSurge, PodDisruptionBudget) and show how to roll back a bad release.",
        },
        ...hardOnly(difficulty, [
          {
            key: "Tracing",
            text: "Add distributed tracing across the API and worker, and correlate traces with logs.",
          },
          {
            key: "Hardening",
            text: "Apply NetworkPolicies, non-root security contexts and least-privilege service accounts.",
          },
        ]),
      ],
      nonFunctional: [
        "Everything is reproducible from the repository — no manual kubectl edits.",
        "Secrets never appear in plain text in the repository.",
        "Dashboards and alerts are defined as code.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "A fresh cluster can be brought up with documented commands.",
        "Deploying a new version causes no failed requests during a load test.",
        "Under load, the API scales out and back in again.",
        "Killing a pod or the worker triggers recovery, and the relevant alert fires.",
        "The dashboard shows request rate, error rate and latency per service.",
      ],
      bonusChallenges: [
        "Add canary releases with automatic rollback on error-rate regression.",
        "Add cost visibility (requests vs. actual usage) and right-size the workloads.",
        "Back up the database and document a tested restore procedure.",
        "Set up GitOps so the cluster state is reconciled from the repository.",
      ],
      evaluationCriteria: [
        {
          name: "Kubernetes Configuration",
          weight: 25,
          description: "Sound workloads, resources, probes and configuration management.",
        },
        {
          name: "Reliability",
          weight: 25,
          description: "Zero-downtime rollouts, autoscaling, disruption budgets and recovery.",
        },
        {
          name: "Observability",
          weight: 20,
          description: "Useful metrics, dashboards and actionable alerts with runbooks.",
        },
        {
          name: "Security",
          weight: 15,
          description: "Secrets handling, least privilege and network isolation.",
        },
        {
          name: "Documentation",
          weight: 15,
          description: "Architecture overview, setup steps and operational runbooks.",
        },
      ],
      hints: [
        "Get the app running in a local cluster first, then add autoscaling and monitoring.",
        "Readiness probes and resource requests are what make rollouts and autoscaling behave.",
        "Alert on symptoms users feel (errors, latency), not on every CPU spike.",
        "Write each runbook as if a teammate will follow it at 3am.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "3–4 hours",
        medium: "4–6 hours",
        hard: "6–10 hours",
      }),
      deliverables: [
        "Manifests or charts, pipeline configuration, and dashboard/alert definitions in a Git repository.",
        "A load-test script and its results (screenshots are fine).",
        "A README with an architecture diagram, setup steps and runbooks.",
      ],
      constraints: [
        `Target ${cloud}.`,
        `Use ${monitoring} for metrics and alerting.`,
        `Use ${delivery} to deploy.`,
        "The sample application can be minimal — the platform is what's being assessed.",
      ],
    };
  },
});
