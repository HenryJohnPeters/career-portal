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

/** Provision / tear-down commands per IaC tool, for the acceptance criteria. */
const IAC_COMMANDS: Record<string, { up: string; down: string }> = {
  Terraform: { up: "terraform apply", down: "terraform destroy" },
  Pulumi: { up: "pulumi up", down: "pulumi destroy" },
  CloudFormation: {
    up: "aws cloudformation deploy",
    down: "aws cloudformation delete-stack",
  },
  CDK: { up: "cdk deploy", down: "cdk destroy" },
  Bicep: { up: "az deployment group create", down: "az group delete" },
};

const CONTAINER_RUNTIMES: Record<string, string> = {
  AWS: "ECS/EKS",
  Azure: "Container Apps/AKS",
  GCP: "Cloud Run/GKE",
};

export const deliveryPipelineTemplate = defineTemplate({
  id: "delivery-pipeline",
  roles: ["platform"],
  levels: ALL_LEVELS,
  difficulties: ALL_DIFFICULTIES,
  slots: {
    cloud: ["AWS", "Azure", "GCP"],
    iac: ["Terraform", "Pulumi", "CloudFormation", "CDK", "Bicep"],
    ci: ["GitHub Actions", "GitLab CI", "Azure DevOps", "Jenkins"],
  },
  topics: ["Docker", "Containers", "DevOps", "IaC", "Secrets Management", "Release Strategies"],
  build: ({ level, difficulty, choose, pick }) => {
    const cloud = choose("cloud", "AWS");
    const iac = choose("iac", "Terraform");
    const ci = choose("ci", "GitHub Actions");
    const commands = IAC_COMMANDS[iac] ?? IAC_COMMANDS.Terraform;
    const companyName = pick(["InfraCore", "DeployStack", "CloudPilot", "PlatformOps", "ShipFast"]);
    return {
      title: `${companyName} — Production Deployment Pipeline & Infrastructure`,
      companyContext: `${companyName} is migrating from a manual deployment process to a fully automated, infrastructure-as-code approach. They need a ${levelLabel(level)} platform engineer to design a ${difficultyAdjective(difficulty)} CI/CD pipeline and cloud infrastructure setup.`,
      brief: `Design and implement a deployment pipeline using **${ci}** and infrastructure definitions using **${iac}** targeting **${cloud}**. The pipeline should take a simple web application from code push to production deployment with proper staging, testing, and rollback capabilities.`,
      background:
        "Currently, deployments are done manually via SSH. The team deploys roughly 5 times per week, and each deployment takes 30+ minutes with frequent human errors. Your solution should reduce deployment time to under 5 minutes with zero manual steps after code merge.",
      requirements: [
        {
          key: "CI Pipeline",
          text: `Create a CI pipeline in ${ci} that runs linting, unit tests, builds a Docker image, and pushes it to a container registry.`,
        },
        {
          key: "IaC",
          text: `Define the cloud infrastructure using ${iac} — at minimum: a container runtime (${CONTAINER_RUNTIMES[cloud] ?? "a managed container service"}), a database, a load balancer, and networking.`,
        },
        {
          key: "CD Pipeline",
          text: "Implement automated deployment to a staging environment on PR merge, and production deployment on release/tag.",
        },
        {
          key: "Secrets",
          text: `Manage secrets and environment variables securely (not hardcoded) — use ${cloud}'s secrets manager or similar.`,
        },
        ...beyondJunior(level, [
          {
            key: "Monitoring",
            text: "Set up basic health checks, alerting, and log aggregation for the deployed application.",
          },
          {
            key: "Rollback",
            text: "Implement a rollback mechanism — either blue/green deploys or easy one-click revert to previous version.",
          },
        ]),
        ...hardOnly(difficulty, [
          {
            key: "Multi-env",
            text: `Support multiple environments (dev, staging, production) with environment-specific configuration managed via ${iac}.`,
          },
          {
            key: "Security",
            text: "Implement network security (VPC, security groups, IAM roles with least privilege), and run a basic security scan in the pipeline.",
          },
        ]),
      ],
      nonFunctional: [
        `All infrastructure must be defined as code — no manual ${cloud} console changes.`,
        "Pipeline should complete in under 10 minutes for a typical change.",
        "Secrets must never appear in logs, code, or version control.",
        ...extraRequirements(level, difficulty),
      ],
      acceptanceCriteria: [
        "A code push to main triggers the CI pipeline automatically.",
        "The Docker image is built and pushed to a registry on successful CI.",
        "The staging environment is updated automatically after CI passes.",
        "Production deployment requires an explicit trigger (tag/release/approval).",
        `Running \`${commands.up}\` from scratch provisions the entire infrastructure.`,
        `Running \`${commands.down}\` tears everything down cleanly.`,
      ],
      bonusChallenges: [
        "Add canary or blue/green deployment strategy.",
        "Set up a CDN for static assets.",
        "Implement database migration automation in the pipeline.",
        "Add cost estimation to PRs (e.g., Infracost for Terraform).",
        "Create a Grafana dashboard or CloudWatch dashboard for key metrics.",
      ],
      evaluationCriteria: [
        {
          name: "Pipeline Design",
          weight: 25,
          description: "Logical stages, proper gating, fast feedback loops.",
        },
        {
          name: "Infrastructure as Code",
          weight: 25,
          description: "Clean, modular IaC with proper state management and naming.",
        },
        {
          name: "Security",
          weight: 20,
          description: "Secrets management, IAM, network isolation, no hardcoded credentials.",
        },
        {
          name: "Reliability",
          weight: 15,
          description: "Health checks, rollback capability, failure handling.",
        },
        {
          name: "Documentation",
          weight: 15,
          description: "Architecture diagram, README, and runbook for common operations.",
        },
      ],
      hints: [
        "Start with the CI pipeline — get a Docker build working before touching infrastructure.",
        `Use ${iac} modules to keep your infrastructure DRY and composable.`,
        'Test your pipeline with a simple "Hello World" app first, then add complexity.',
        "Draw an architecture diagram before writing any code — it clarifies your thinking.",
      ],
      estimatedTime: byDifficulty(difficulty, {
        easy: "2–3 hours",
        medium: "3–5 hours",
        hard: "6–8 hours",
      }),
      deliverables: [
        "CI/CD pipeline configuration files.",
        `${iac} infrastructure definitions.`,
        "A Dockerfile for the sample application.",
        "A README with architecture diagram, setup instructions, and operational runbook.",
      ],
      constraints: [
        `Use ${ci} for CI/CD.`,
        `Use ${iac} for infrastructure definitions.`,
        `Target ${cloud} as the cloud provider.`,
        "Use Docker for containerization.",
      ],
    };
  },
});
