import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-senior-01",
    track: "devops",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["kubernetes", "secrets management", "encryption"],
    prompt:
      "A team keeps database passwords in Kubernetes Secrets and tells an auditor they are encrypted, because `kubectl get secret -o yaml` shows scrambled-looking values. On a self-managed cluster built with kubeadm defaults, what is actually true?",
    options: [
      "The values are encrypted with the cluster CA's private key, so only the kubelet on the node running the pod is able to decrypt them",
      "The values are only base64-encoded, so anyone who can read the Secret can decode them, and etcd holds them unencrypted by default",
      "The values are hashed with a one-way function, and the container receives the original password through a key exchange when it starts",
      "The values are encrypted with a per-namespace key, so users who can read Secrets in another namespace cannot decode these ones",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "base64 is an encoding, not encryption",
      "configure encryption at rest for etcd, ideally with a KMS provider",
      "restrict get, list and watch on Secrets with RBAC",
      "anyone who can create pods in the namespace can mount its Secrets",
      "consider an external secrets manager for rotation and audit",
    ],
    redFlags: ["base64 encoding protects the values", "encoded Secrets are safe to commit to git"],
    rubric: {
      criteria: [
        {
          name: "Encoding vs encryption",
          weight: 5,
          keywords: ["base64", "encoding", "decode", "not encrypted", "etcd"],
        },
        {
          name: "Mitigations",
          weight: 4,
          keywords: ["encryption at rest", "kms", "rbac", "least privilege", "external secrets", "audit"],
        },
      ],
    },
    modelAnswer:
      "Secret values are base64-encoded so that binary data fits in YAML; anyone who can read the object can decode them with one command. With kubeadm defaults the API server also writes them to etcd unencrypted, so etcd backups and disk access expose them too. Protect them by enabling encryption at rest (an EncryptionConfiguration, ideally with a KMS provider), restricting get, list and watch on Secrets through RBAC, and remembering that anyone who can create pods in a namespace can mount its Secrets. There is no CA-based or per-namespace encryption of Secret values.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-02",
    track: "devops",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["docker", "kubernetes", "release strategies", "immutable infrastructure"],
    prompt:
      "Production Deployments reference `image: registry.example.com/shop/api:latest`, and CI pushes every merge to main to that tag. What is the main operational problem, and what should replace it?",
    options: [
      "Kubernetes refuses to run images tagged `latest` unless `imagePullPolicy: Never` is set; set that policy explicitly on every container",
      "The `latest` tag disables layer caching on nodes, so each pod start downloads the whole image; switch to a date tag overwritten once a day",
      "Pods started at different times can run different builds and rollbacks restore nothing; deploy an immutable commit-SHA tag or the digest",
      "The registry reserves `latest` for its most recently scanned image, so unscanned builds are rejected; push to a `stable` tag instead",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "a mutable tag does not identify one build",
      "new pods pull whatever the tag points to when they start",
      "the pod template does not change, so no rollout is triggered and rollback restores nothing",
      "tag each build immutably (commit SHA) or pin the digest",
      "promote the same artifact through every environment",
    ],
    redFlags: ["latest always means the newest tested build", "rollback works the same with mutable tags"],
    rubric: {
      criteria: [
        {
          name: "Problem",
          weight: 5,
          keywords: ["mutable", "latest", "different builds", "rollback", "pod template", "imagepullpolicy"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["immutable tag", "commit sha", "digest", "promote", "same artifact"],
        },
      ],
    },
    modelAnswer:
      "A mutable tag names whatever was pushed last, so it says nothing about which build a pod runs. Because the pod template never changes, pushing a new build triggers no rollout; pods created later by scaling or rescheduling pull the new image while older ones keep the old one, and `kubectl rollout undo` restores a template that still says `latest`. Tag each build immutably (for example with the commit SHA) or reference the digest, and promote that same artifact between environments. Kubernetes does run `latest` images (it defaults their pull policy to Always), and unchanged layers are still cached.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-03",
    track: "devops",
    level: "senior",
    difficulty: 1,
    type: "theory",
    tags: ["aws", "cost optimization"],
    prompt:
      "Batch jobs on EC2 instances in private subnets read and write several terabytes a day to S3 buckets in the same region. NAT gateway data processing is now one of the largest lines on the bill. Which change removes most of that cost while the instances stay in private subnets?",
    options: [
      "Deploy a NAT gateway in every Availability Zone, so each subnet's S3 traffic no longer has to cross zones on its way out",
      "Enable S3 Transfer Acceleration on the buckets, so that transfers take the faster edge path rather than the NAT gateway",
      "Run the batch jobs overnight instead, when NAT gateway data processing is billed at a lower off-peak rate per gigabyte",
      "Add an S3 gateway VPC endpoint to the private subnets' route tables, so S3 traffic no longer goes through the NAT gateway",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "NAT gateways charge per gigabyte processed",
      "S3 gateway endpoints are added as route table entries",
      "gateway endpoints carry no hourly or data processing charge",
      "endpoint policies can restrict which buckets are reachable",
      "break down cost reports by usage type to find such traffic",
    ],
    redFlags: ["move the instances to public subnets to save money", "more NAT gateways reduce per-gigabyte charges"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 4,
          keywords: ["nat gateway", "data processing", "per gigabyte", "s3 traffic"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["gateway endpoint", "vpc endpoint", "route table", "endpoint policy", "private"],
        },
      ],
    },
    modelAnswer:
      "NAT gateways bill for every gigabyte they process, so private instances moving terabytes to S3 through one pay for all of it. An S3 gateway VPC endpoint adds a route for S3's prefix list to the subnets' route tables, keeping that traffic on the AWS network without touching the NAT gateway, and gateway endpoints have no hourly or data processing charge; an endpoint policy can also limit which buckets are reachable. A NAT gateway per zone improves resilience and avoids cross-zone transfer, but every gigabyte is still processed, Transfer Acceleration adds cost rather than removing it, and there is no off-peak NAT rate.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-04",
    track: "devops",
    level: "senior",
    difficulty: 1,
    type: "behavioral",
    tags: ["incident management", "behavioral", "communication"],
    prompt:
      "A major outage has been running for 20 minutes. Eight engineers in the incident channel are each investigating and trying fixes on their own; two have restarted the same database, and support keeps asking for an update that nobody gives. You are the most senior engineer present. What do you do first?",
    options: [
      "Take the keyboard and fix the problem yourself, since the outage ends soonest when the most experienced engineer makes every change",
      "Take or assign incident command: give each person a line of investigation, have changes announced first, and name someone to send updates",
      "Ask everyone to stop and write up what they have tried, then hold a meeting in an hour to agree on a plan with the whole team present",
      "Let everyone carry on in parallel, since more people investigating covers more hypotheses, and update support once the cause is known",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "establish an incident commander who coordinates rather than debugs",
      "assign roles: operations, communications, scribe",
      "announce and record every change before making it",
      "send stakeholder updates on a fixed cadence",
      "focus on mitigation before root cause",
    ],
    redFlags: ["the most senior engineer should debug alone", "communicate only once the cause is known"],
    rubric: {
      criteria: [
        {
          name: "Coordination",
          weight: 5,
          keywords: ["incident commander", "roles", "assign", "coordinate", "single channel", "announce changes"],
        },
        {
          name: "Communication",
          weight: 4,
          keywords: ["status update", "stakeholders", "cadence", "scribe", "timeline"],
        },
      ],
    },
    modelAnswer:
      "Uncoordinated responders duplicate work and make conflicting changes, like the two database restarts, which can prolong the outage. The best first move is to establish incident command: one person coordinates instead of debugging, assigns lines of investigation, requires changes to be announced and logged, and delegates communication so stakeholders get updates on a regular cadence. Taking the keyboard yourself leaves the chaos in place, and pausing everything for an hour-long planning meeting delays mitigation.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-05",
    track: "devops",
    level: "senior",
    difficulty: 1,
    type: "coding",
    tags: ["docker", "containers"],
    prompt:
      'What does the final image built from this Dockerfile contain?\n\n```dockerfile\nFROM golang:1.26 AS build\nWORKDIR /src\nCOPY . .\nRUN CGO_ENABLED=0 go build -o /out/api ./cmd/api\n\nFROM gcr.io/distroless/static:nonroot\nCOPY --from=build /out/api /api\nENTRYPOINT ["/api"]\n```',
    options: [
      "The Go toolchain, the source and the binary, because `COPY --from` stacks the build stage's layers underneath the final stage",
      "The distroless base and the binary, which fails at start-up because the base image has no Go runtime installed to execute it",
      "The binary and the source code, because the `COPY . .` layer is created before the build and is inherited by every later stage",
      "Only the distroless base layers and the static binary; the toolchain and source stay in the build stage, which is not shipped",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "each FROM starts a new stage with its own layers",
      "only the last stage becomes the output image",
      "COPY --from copies files, not layers or history",
      "CGO_ENABLED=0 produces a static binary that needs no runtime",
      "smaller image and attack surface, running as non-root",
    ],
    redFlags: ["multi-stage builds keep every stage in the final image", "Go binaries need a Go runtime in the image"],
    rubric: {
      criteria: [
        {
          name: "Multi-stage mechanics",
          weight: 5,
          keywords: ["stage", "copy --from", "final image", "layers", "discarded"],
        },
        {
          name: "Runtime image",
          weight: 4,
          keywords: ["static binary", "cgo_enabled", "distroless", "nonroot", "attack surface"],
        },
      ],
    },
    modelAnswer:
      "Each `FROM` starts a new stage, and only the last stage becomes the image that is tagged and pushed. `COPY --from=build` copies just the named file out of the build stage, so the Go toolchain, the source and the build cache are not in the result. With `CGO_ENABLED=0`, Go produces a statically linked binary that needs no Go runtime or libc, so it runs on the minimal distroless base as the non-root user that the `nonroot` tag sets. The result is a small image with a much smaller attack surface.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-senior-06",
    track: "devops",
    level: "senior",
    difficulty: 2,
    type: "debugging",
    tags: ["docker", "kubernetes", "containers"],
    prompt:
      "The image's `ENTRYPOINT` is `[\"/app/entrypoint.sh\"]`, and `server.js` stops accepting connections and drains in-flight requests when it receives SIGTERM. Yet on every rollout, old pods take the full 30-second grace period to stop and their in-flight requests are cut off. What is the fix?\n\n```bash\n#!/bin/bash\nset -euo pipefail\n/app/bin/render-config > /app/config.json\nnode /app/server.js\n```",
    options: [
      "Change the last line to `exec node /app/server.js`, so Node replaces the shell as PID 1 and gets SIGTERM itself",
      "Raise `terminationGracePeriodSeconds` to 120, so the server has longer to drain its requests before it is stopped",
      "Add `STOPSIGNAL SIGINT` to the Dockerfile, because shells pass SIGINT on to the command running in the foreground",
      "Remove `set -euo pipefail`, because `-e` makes the shell exit on SIGTERM before Node has a chance to react",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "the script's shell is PID 1 and Node is its child",
      "the runtime sends SIGTERM only to PID 1",
      "bash does not forward signals to its child",
      "PID 1 does not receive signals it has no handler for",
      "use exec, or an init such as tini, so the app gets the signal",
    ],
    redFlags: ["a longer grace period fixes it", "signals reach every process in the container automatically"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["pid 1", "sigterm", "shell", "child process", "not forwarded", "sigkill"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["exec", "tini", "init", "graceful shutdown", "drain"],
        },
      ],
    },
    modelAnswer:
      "The container runtime sends SIGTERM to PID 1, which here is bash running the script; bash does not forward signals to its child, and because it is PID 1 with no handler installed, the kernel does not deliver SIGTERM to it at all. Node never hears the signal, so nothing drains, and after the grace period everything is killed with SIGKILL. `exec` replaces the shell with Node, making Node PID 1 so it receives SIGTERM directly (an init such as tini is an alternative). A longer grace period only makes each pod take longer to be killed.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-07",
    track: "devops",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["logging", "opentelemetry", "tracing"],
    prompt:
      "Forty services write free-text log lines, each in its own format, to stdout. During incidents engineers cannot pull together all the log lines for one failing request across services, even though OpenTelemetry tracing is already deployed. Which change helps most?",
    options: [
      "Raise every service's log level to DEBUG in production, so that each request leaves enough lines to reconstruct its whole path later",
      "Have each service write its logs to its own file on a shared volume, so engineers can grep every service's file at the same time",
      "Emit structured JSON logs with shared field names plus the active trace and span IDs, so logs can be queried per request",
      "Prefix every line with a millisecond timestamp, so lines from different services can be lined up in time to rebuild each request",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "structured logs with a shared schema",
      "inject trace_id and span_id from the active context",
      "query logs by request and pivot between traces and logs",
      "ship stdout to a central log store",
      "timestamps alone cannot separate concurrent requests",
    ],
    redFlags: ["more DEBUG logging solves correlation", "timestamps are enough to correlate requests"],
    rubric: {
      criteria: [
        {
          name: "Structure",
          weight: 4,
          keywords: ["structured", "json", "schema", "fields", "consistent"],
        },
        {
          name: "Correlation",
          weight: 5,
          keywords: ["trace id", "span id", "correlation", "opentelemetry", "context propagation", "link"],
        },
      ],
    },
    modelAnswer:
      "Correlating logs needs a shared key that every service records, and tracing already propagates one: the trace context. Writing structured JSON logs with agreed field names and the active trace and span IDs (which OpenTelemetry logging integrations can inject automatically) lets the central log store return every line for one request and lets engineers jump between a trace and its logs. Extra DEBUG volume adds cost without adding a join key, and timestamps cannot separate thousands of concurrent requests, especially with clock skew between hosts.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-08",
    track: "devops",
    level: "senior",
    difficulty: 2,
    type: "theory",
    tags: ["aws", "iam", "security"],
    prompt:
      "In an AWS member account, a role's identity policy allows `s3:DeleteObject` on a bucket in the same account, and the bucket has no bucket policy. A service control policy attached to the account's organisational unit denies `s3:DeleteObject`. What happens when the role tries to delete an object?",
    options: [
      "The request is allowed, because identity policies are evaluated before organisation policies and the first matching statement wins",
      "The request is allowed, because service control policies apply only to IAM users and the root user, not to assumed roles",
      "The request is denied, because an SCP caps what principals in the account can do and an explicit deny overrides any allow",
      "The request is allowed if the role also has the AdministratorAccess managed policy, which is exempt from organisation-level policies",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "an explicit deny always wins",
      "SCPs set the maximum permissions for principals in member accounts",
      "SCPs grant nothing on their own; an identity or resource policy must still allow",
      "SCPs do not apply to the management account",
      "organisation-level guardrails plus least privilege inside accounts",
    ],
    redFlags: ["the first matching statement wins", "administrators bypass SCPs"],
    rubric: {
      criteria: [
        {
          name: "Evaluation logic",
          weight: 5,
          keywords: ["explicit deny", "overrides", "allow", "evaluation", "default deny"],
        },
        {
          name: "Organisation guardrails",
          weight: 4,
          keywords: ["scp", "service control policy", "maximum permissions", "member account", "guardrail"],
        },
      ],
    },
    modelAnswer:
      "AWS evaluates every applicable policy together: anything not explicitly allowed is denied by default, and an explicit deny in any policy overrides every allow. Service control policies define the maximum permissions for principals in a member account, including roles and the account's root user, so the SCP's deny wins even though the identity policy allows the action. SCPs never grant permissions themselves, and they do not apply to the organisation's management account, which is one reason workloads should not run there. There is no ordering in which a first match wins, and AdministratorAccess is not exempt.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-09",
    track: "devops",
    level: "senior",
    difficulty: 2,
    type: "debugging",
    tags: ["kubernetes", "scaling"],
    prompt:
      "An HPA never scales the `api` Deployment, and `kubectl get hpa` shows `cpu: <unknown>/70%`. metrics-server is installed, `kubectl top pods` shows CPU usage for these pods, and the namespace has no LimitRange. Given these excerpts, what is the fix?\n\n```yaml\n# Deployment, api container\nresources:\n  limits: { memory: 512Mi }\n---\n# HorizontalPodAutoscaler (autoscaling/v2)\nmetrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target: { type: Utilization, averageUtilization: 70 }\n```",
    options: [
      "Lower `averageUtilization` to 50, because the HPA reports no value until the pods have crossed the target at least once",
      "Add a memory request equal to the limit, because the HPA skips pods whose memory request and limit are different",
      "Set `minReplicas: 2`, because the HPA cannot calculate an average utilisation from a single running pod",
      "Add a CPU request to the container, because Utilization is a percentage of each pod's CPU request and it has none",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "utilisation is measured relative to the CPU request",
      "without a CPU request the HPA cannot compute a percentage",
      "set requests from observed usage",
      "requests also drive scheduling and capacity planning",
    ],
    redFlags: ["the HPA measures utilisation against node capacity", "limits alone are enough for autoscaling"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["cpu request", "utilization", "percentage", "unknown", "missing request"],
        },
        {
          name: "Fix and context",
          weight: 3,
          keywords: ["requests", "metrics-server", "scheduling", "observed usage", "averagevalue"],
        },
      ],
    },
    modelAnswer:
      "For a `Utilization` target, the HPA divides each pod's measured CPU usage by its CPU request and averages the result. Here there is no CPU request, and no LimitRange or CPU limit from which one would be defaulted, so there is nothing to divide by and the metric shows `<unknown>`. Adding a CPU request based on observed usage fixes it and also gives the scheduler accurate information. The memory settings, the threshold and the replica count have nothing to do with the missing value.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-10",
    track: "devops",
    level: "senior",
    difficulty: 2,
    type: "behavioral",
    tags: ["incident management", "behavioral", "teamwork"],
    prompt:
      "During maintenance, an engineer ran a cleanup script against production instead of staging and deleted customer data; restoring from backup took six hours. A director asks you, as incident lead, to name the engineer in the postmortem and recommend removing their production access. What is the best response?",
    options: [
      "Agree to it, since naming the person responsible and removing their access shows customers that the problem has been dealt with firmly",
      "Run a blameless postmortem into how one command could reach production unnoticed, and close those gaps in tooling and access",
      "Skip the postmortem this time, since the cause is already known and a written review would only embarrass the engineer further",
      "Write the postmortem without names but record the root cause as human error, and add a runbook step telling engineers to take care",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "blameless focus on systems, not individuals",
      "human error is a starting point, not a root cause",
      "add guardrails: confirmations, separate credentials, least privilege",
      "improve and test backup restore time",
      "blame discourages honest reporting",
      "explain the reasoning to the director",
    ],
    redFlags: ["root cause: human error", "punishment prevents recurrence"],
    rubric: {
      criteria: [
        {
          name: "Blameless culture",
          weight: 5,
          keywords: ["blameless", "systemic", "human error", "psychological safety", "learning"],
        },
        {
          name: "Concrete actions",
          weight: 4,
          keywords: ["guardrails", "least privilege", "separate credentials", "restore", "action items"],
        },
      ],
    },
    modelAnswer:
      "The engineer did what the system allowed: a script could target production with no distinct credentials, confirmation or dry run, and restoring took six hours. A blameless postmortem asks why those safeguards were missing and produces owned action items, such as separate production credentials, environment checks in tooling, least-privilege access and tested restores. Blaming one person teaches everyone to hide mistakes, which makes the next incident harder to learn from, and 'human error' or 'take more care' changes nothing in the system. Explaining this to the director, together with the action plan, is part of leading the response.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-senior-11",
    track: "devops",
    level: "senior",
    difficulty: 3,
    type: "coding",
    tags: ["terraform", "iac"],
    prompt:
      'This configuration manages three queues. You remove `"orders"` from the list. What will `terraform plan` propose, and how should the configuration have been written?\n\n```hcl\nvariable "queues" {\n  type    = list(string)\n  default = ["orders", "invoices", "emails"]\n}\n\nresource "aws_sqs_queue" "this" {\n  count = length(var.queues)\n  name  = "shop-${var.queues[count.index]}"\n}\n```',
    options: [
      "Destroy only `shop-orders`, because Terraform matches each instance to its list value; the configuration needs no change",
      "Fail with an index-out-of-range error; adding `lifecycle { ignore_changes = [name] }` would let removed entries be skipped",
      "Destroy `this[0]` and renumber the other instances in state automatically, so the `invoices` and `emails` queues are untouched",
      "Replace `this[0]` and `this[1]` with new names and destroy `this[2]`; `for_each = toset(var.queues)` keys instances by name",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "count instances are addressed by index",
      "removing an element shifts every later index",
      "a changed queue name forces replacement",
      "for_each keys instances by stable strings",
      "review plans for unexpected replacements",
    ],
    redFlags: ["Terraform tracks count instances by value", "ignore_changes fixes index shifts"],
    rubric: {
      criteria: [
        {
          name: "Plan outcome",
          weight: 5,
          keywords: ["count.index", "index shift", "replace", "destroy", "forces replacement"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["for_each", "toset", "stable keys", "moved", "state address"],
        },
      ],
    },
    modelAnswer:
      "With `count`, instances are tracked in state by position: `this[0]`, `this[1]` and `this[2]`. Removing the first element shifts the list, so `this[0]` now wants the name `shop-invoices` and `this[1]` wants `shop-emails`; a queue's name cannot be changed in place, so both are replaced (losing their messages) and `this[2]` is destroyed. With `for_each = toset(var.queues)`, instances are keyed by name, such as `this[\"orders\"]`, so removing one entry deletes only that queue. Existing count-based instances can be migrated to for_each keys with `moved` blocks.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-12",
    track: "devops",
    level: "senior",
    difficulty: 3,
    type: "theory",
    tags: ["release strategies", "database", "postgresql"],
    prompt:
      "You need to rename the PostgreSQL column `users.fullname` to `display_name`. The app is released as a rolling deployment, so old and new versions serve traffic side by side for several minutes. Which approach avoids errors during and after the release?",
    options: [
      "Run `ALTER TABLE ... RENAME COLUMN` as a pre-deploy migration, since the rename is a quick metadata change that applies instantly",
      "Deploy the new code first and run the rename once every old pod has gone, so the new code never sees the old column name",
      "Expand and contract: add `display_name`, write both and backfill, move reads to it, then drop `fullname` in a later release",
      "Switch to a blue/green deployment, since only one version is live at a time and the rename can run as the traffic switches",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "old and new versions run against the same schema at once",
      "each schema change must be compatible with both versions",
      "expand: add the new column, dual-write and backfill",
      "contract: drop the old column only after nothing reads it",
      "keeps rollback possible",
    ],
    redFlags: ["blue/green makes schema changes atomic", "a fast DDL statement cannot break running code"],
    rubric: {
      criteria: [
        {
          name: "Compatibility",
          weight: 5,
          keywords: ["backward compatible", "both versions", "rolling", "old code", "rollback"],
        },
        {
          name: "Expand and contract",
          weight: 5,
          keywords: ["expand", "contract", "dual write", "backfill", "drop later"],
        },
      ],
    },
    modelAnswer:
      "During a rolling deployment, and during any rollback, old and new code share one database, so every schema change must work with both. Renaming in place breaks whichever version expects the other name, however fast the DDL is. Expand and contract avoids this: add the new column, write to both and backfill, switch reads, and only drop the old column in a later release once no running or rollback version uses it. Blue/green does not help, because both environments still share the database, and rolling back to blue after the rename would fail.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-13",
    track: "devops",
    level: "senior",
    difficulty: 3,
    type: "system-design",
    tags: ["kubernetes", "rbac", "network policies", "security"],
    prompt:
      "You are designing a shared Kubernetes cluster for twelve product teams. Each team must deploy only its own workloads, must not exhaust the cluster's capacity, must not reach other teams' pods unless allowed, and must not run privileged containers. Which design meets all four requirements?",
    options: [
      "A namespace per team with RoleBindings scoped to it, a ResourceQuota and LimitRange, default-deny NetworkPolicies, and Pod Security admission enforcing `restricted`",
      "One shared namespace with resources labelled by team, and a ClusterRole that lets each developer edit only the objects that carry their own team label",
      "A namespace per team whose developers get `cluster-admin` through a ClusterRoleBinding, relying on namespaces to isolate traffic and capacity",
      "A namespace per team with RoleBindings and ResourceQuotas, relying on the network plugin to block cross-namespace traffic and on image scans to catch privileged pods",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "namespaces as the tenancy boundary with namespaced RBAC",
      "ResourceQuota and LimitRange cap and default resource use",
      "default-deny NetworkPolicies with explicit allows, enforced by the CNI",
      "Pod Security admission at restricted blocks privileged pods",
      "namespaces alone isolate neither network nor capacity",
      "separate clusters or nodes for hard multi-tenancy",
    ],
    redFlags: ["namespaces isolate network traffic by default", "RBAC can restrict access by labels"],
    rubric: {
      criteria: [
        {
          name: "Isolation controls",
          weight: 5,
          keywords: ["namespace", "rolebinding", "resourcequota", "limitrange", "networkpolicy", "pod security"],
        },
        {
          name: "Pitfalls",
          weight: 3,
          keywords: ["default allow", "cluster-admin", "cni", "label", "privileged"],
        },
      ],
    },
    modelAnswer:
      "Namespaces are the unit Kubernetes multi-tenancy builds on, but they isolate nothing by themselves: RoleBindings restrict each team to its namespace, ResourceQuota and LimitRange cap and default resource use, default-deny NetworkPolicies (enforced by a CNI that supports them) block cross-team traffic unless explicitly allowed, and Pod Security admission at `restricted` rejects privileged pods. RBAC cannot scope permissions by label, pod networking is allow-all by default, and privilege is set in the pod spec rather than the image, so each of the other designs leaves requirements unmet. Teams that need hard isolation from untrusted tenants need separate clusters or dedicated nodes.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-14",
    track: "devops",
    level: "senior",
    difficulty: 3,
    type: "theory",
    tags: ["connection pooling", "http", "performance"],
    prompt:
      "A Linux service calls a single upstream API (one IP address and port) for each incoming request, opening a new TCP connection and closing it as soon as the response arrives. Above roughly 450 requests per second, outbound connects fail with `EADDRNOTAVAIL` (cannot assign requested address), and `ss -tan state time-wait | wc -l` reports about 28,000. What is the best fix?",
    options: [
      "Raise the process's open-file limit with `ulimit -n`, because each closed connection keeps its file descriptor until the socket times out",
      "Increase `net.core.somaxconn`, so the kernel queues more outbound connections instead of rejecting them while the upstream is busy",
      "Reuse connections with keep-alive and a connection pool, since each closed connection holds its local port in TIME-WAIT for 60 seconds",
      "Enable `net.ipv4.tcp_tw_recycle`, which reclaims TIME-WAIT ports immediately and is safe for clients behind NAT gateways",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the side that closes first keeps the socket in TIME-WAIT",
      "Linux holds TIME-WAIT for 60 seconds",
      "the default ephemeral port range gives about 28,000 ports per destination",
      "reuse connections with keep-alive and pooling",
      "tcp_tw_recycle was removed and broke clients behind NAT",
    ],
    redFlags: ["raise ulimit to fix EADDRNOTAVAIL", "enable tcp_tw_recycle"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["time-wait", "ephemeral ports", "port exhaustion", "60 seconds", "eaddrnotavail"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["keep-alive", "connection pool", "reuse", "fewer connections", "ip_local_port_range"],
        },
      ],
    },
    modelAnswer:
      "To one destination IP and port, each outbound connection needs a unique local port, and the side that closes first keeps that port in TIME-WAIT for 60 seconds on Linux. The default ephemeral range (32768-60999) gives about 28,000 ports, so at roughly 470 new connections per second it runs out, which is exactly what `EADDRNOTAVAIL` reports. Reusing connections through keep-alive and a pool removes the churn (and the handshake latency); widening the port range only buys headroom. File-descriptor limits produce `EMFILE`, `somaxconn` governs server-side accept queues, and `tcp_tw_recycle` broke clients behind NAT and was removed in Linux 4.12.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-senior-15",
    track: "devops",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["kubernetes", "performance"],
    prompt:
      "A latency-sensitive Java service with a 200-thread request pool runs on 16-core nodes with `limits.cpu: 2`. Its dashboards show average CPU usage of about 40% of the limit, yet p99 latency spikes and `container_cpu_cfs_throttled_periods_total` keeps rising. What explains this?",
    options: [
      "The limit is a CFS quota per 100 ms period; bursts across many threads use it up early in a period, pausing the container until the next",
      "The container's usage exceeds its CPU request, so the kubelet moves its threads between cores, and the migrations add latency to requests in flight",
      "The node is short of memory, and the kernel compensates by reducing CPU time for the containers with the highest limits until the pressure ends",
      "CPU limits are enforced over one-minute windows, so once total usage in a minute passes the limit, the container is throttled for the rest of it",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "CPU limits become a CFS quota per period (100 ms by default)",
      "averages hide bursts within a period",
      "many threads can consume the quota in a few milliseconds",
      "throttling metrics, not utilisation, reveal the problem",
      "remove or raise CPU limits for latency-sensitive services; size requests and thread pools",
    ],
    redFlags: ["low average CPU means no throttling", "CPU limits cause OOM kills"],
    rubric: {
      criteria: [
        {
          name: "Mechanism",
          weight: 5,
          keywords: ["cfs", "quota", "period", "100ms", "throttled", "burst"],
        },
        {
          name: "Remedy",
          weight: 4,
          keywords: ["remove limit", "raise limit", "requests", "thread pool", "throttling metrics"],
        },
      ],
    },
    modelAnswer:
      "A CPU limit of 2 becomes a CFS quota of 200 ms of CPU time per 100 ms period. When a burst of requests wakes many threads at once, they can use the whole quota within the first few milliseconds of a period, and the container then gets no CPU until the next period, adding stalls to every request in flight even though the average is 40%. The rising throttled-periods counter is the signal. For latency-sensitive services, set accurate CPU requests and remove or raise the CPU limit, and size thread pools to the CPU actually available; using more than the request does not by itself cause throttling or thread migration.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-16",
    track: "devops",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["kubernetes", "load balancers"],
    prompt:
      "During every rolling update of a Deployment behind an ingress controller, clients see a brief burst of 502 errors. New pods pass their readiness checks, and the app closes its listener and exits as soon as it receives SIGTERM. Which changes would stop the errors? Select all that apply.",
    options: [
      "Add a `preStop` hook that sleeps a few seconds, so the pod keeps serving until its removal from endpoints reaches the ingress",
      "Lower `terminationGracePeriodSeconds` to 5 seconds, so that terminating pods are taken out of the endpoints list much sooner",
      "Make the app keep serving for a few seconds after SIGTERM, then stop accepting connections and drain the requests in flight",
      "Remove the readiness probe from the pod spec, so the endpoints controller stops waiting on probe results during the rollout",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2],
    multiSelect: true,
    expectedPoints: [
      "endpoint removal and SIGTERM happen in parallel",
      "ingress controllers and kube-proxy update asynchronously",
      "keep serving briefly after termination starts (preStop delay or delayed shutdown)",
      "then drain in-flight requests within the grace period",
      "the grace period must cover the delay plus drain time",
    ],
    redFlags: [
      "the pod is removed from load balancing before SIGTERM arrives",
      "a shorter grace period removes pods from endpoints faster",
    ],
    rubric: {
      criteria: [
        {
          name: "Race condition",
          weight: 5,
          keywords: ["endpoints", "sigterm", "parallel", "propagation", "ingress", "kube-proxy"],
        },
        {
          name: "Graceful shutdown",
          weight: 4,
          keywords: ["prestop", "sleep", "drain", "in-flight", "grace period"],
        },
      ],
    },
    modelAnswer:
      "When a pod is deleted, the kubelet starts its shutdown (preStop hook, then SIGTERM) at the same time as the control plane marks it terminating in the Service's EndpointSlices, and the ingress controller and kube-proxy only act on that change a moment later. An app that stops listening immediately therefore still receives a few requests, which fail as 502s. Delaying shutdown, either with a short preStop sleep or by having the app keep serving briefly after SIGTERM, covers that propagation gap before the app drains and exits, provided the grace period is long enough. The grace period does not change when endpoints are updated, and removing readiness probes would send traffic to pods that are not ready.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-17",
    track: "devops",
    level: "senior",
    difficulty: 4,
    type: "coding",
    tags: ["prometheus", "metrics"],
    prompt:
      "`http_request_duration_seconds` is a classic Prometheus histogram exposed by each of 30 replicas. Which query gives the 99th-percentile request latency of the whole service over the last 5 minutes?",
    options: [
      "`avg(histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])))`",
      "`histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])))`",
      "`histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`",
      "`max(rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))`",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "percentiles cannot be averaged across instances",
      "aggregate bucket rates first, then compute the quantile",
      "keep the le label when summing",
      "the sum/count ratio gives the mean, not a percentile",
      "accuracy depends on the bucket boundaries",
    ],
    redFlags: ["average the per-instance p99s", "mean latency is a substitute for p99"],
    rubric: {
      criteria: [
        {
          name: "Aggregation",
          weight: 5,
          keywords: ["histogram_quantile", "sum by le", "buckets", "rate", "aggregate first"],
        },
        {
          name: "Pitfalls",
          weight: 4,
          keywords: ["average of percentiles", "le label", "mean", "bucket boundaries"],
        },
      ],
    },
    modelAnswer:
      "Percentiles do not compose: the average (or maximum) of 30 per-replica p99s is not the service's p99. Histogram bucket counters can be added up, so you take the per-second rate of each bucket, sum across replicas while keeping the `le` label, and then call `histogram_quantile`. Summing without `by (le)` throws away the bucket boundaries, so the function has nothing to work with and returns no result, and `_sum / _count` gives mean latency, not a percentile. The estimate is only as precise as the bucket boundaries around the 99th percentile.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-18",
    track: "devops",
    level: "senior",
    difficulty: 4,
    type: "system-design",
    tags: ["disaster recovery", "high availability", "system design"],
    prompt:
      "An order service runs in one cloud region on Kubernetes, with a managed PostgreSQL database deployed across Availability Zones. The business now requires recovery from the loss of the whole region with an RPO of 5 minutes and an RTO of 1 hour, at the lowest standing cost. Which design fits best?",
    options: [
      "Keep the existing Multi-AZ database and spread nodes across every zone, since a standby in another zone already covers the loss of the region",
      "Take hourly database snapshots, copy them to a second region, and rebuild the cluster there from IaC if the primary region is lost",
      "Run full active-active stacks in two regions behind global load balancing, with every database write replicated synchronously to both",
      "Keep an async cross-region database replica and a minimal standby cluster from IaC; to fail over, promote it, scale out and switch DNS",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "RPO bounds data loss; RTO bounds downtime",
      "Multi-AZ does not survive a regional outage",
      "asynchronous cross-region replication meets a minutes-level RPO",
      "a pilot light or warm standby keeps standing cost low",
      "IaC, low DNS TTLs and rehearsed failover meet the RTO",
      "active-active costs most and synchronous cross-region writes add latency",
    ],
    redFlags: ["Multi-AZ is the same as disaster recovery", "an untested failover counts as a DR plan"],
    rubric: {
      criteria: [
        {
          name: "Requirements",
          weight: 4,
          keywords: ["rpo", "rto", "regional outage", "data loss", "downtime"],
        },
        {
          name: "Design",
          weight: 5,
          keywords: ["cross-region replica", "asynchronous replication", "pilot light", "warm standby", "promote", "failover"],
        },
        {
          name: "Operations",
          weight: 3,
          keywords: ["iac", "dns ttl", "game day", "rehearse", "runbook"],
        },
      ],
    },
    modelAnswer:
      "A 5-minute RPO needs continuous replication to another region, and asynchronous replication of a managed database typically lags by seconds; a 1-hour RTO leaves time to promote the replica, scale out a minimal standby cluster defined in IaC and repoint DNS, as long as the procedure is scripted and rehearsed. That warm-standby design keeps standing cost low. Multi-AZ only protects against losing a zone, hourly snapshots break the RPO, and active-active with synchronous cross-region writes costs far more and adds cross-region latency to every write for a requirement the business has not asked for.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-19",
    track: "devops",
    level: "senior",
    difficulty: 4,
    type: "theory",
    tags: ["terraform", "iac"],
    prompt:
      'You are refactoring a root module: `aws_db_instance.main` and `aws_security_group.db` move into a new child module, called as `module "database"`, with no other changes. `terraform plan` now proposes destroying both and creating new ones. How do you keep the existing database?',
    options: [
      "Add a `moved` block per resource, such as `aws_db_instance.main` to `module.database.aws_db_instance.main`, so the plan shows only moves",
      "Add `lifecycle { prevent_destroy = true }` to both resources in the module, so that Terraform skips the destroy and adopts the existing ones",
      "Run `terraform apply -refresh-only` first, so that Terraform matches the new module addresses to the existing resources by their cloud IDs",
      "Keep the old resource blocks in the root as well as in the new module until the next apply, so both addresses point at the same database",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "state tracks resources by address",
      "a new address looks like a new resource",
      "moved blocks record the refactor in code and are reviewable",
      "terraform state mv is the imperative alternative",
      "check that the plan shows no destroy before applying",
    ],
    redFlags: ["prevent_destroy adopts existing resources", "a refresh matches resources to new addresses"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 4,
          keywords: ["state", "resource address", "module path", "destroy", "recreate"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["moved block", "state mv", "refactor", "plan", "no changes"],
        },
      ],
    },
    modelAnswer:
      "Terraform tracks each real resource in state under its address, so `module.database.aws_db_instance.main` looks like a new resource and the old root address looks like one to delete. A `moved` block tells Terraform that the object at the old address now lives at the new one, so the plan shows a move and no changes; because it lives in code, it is reviewed and applied consistently in every workspace, unlike a manual `terraform state mv`. `prevent_destroy` only makes the plan fail, and a refresh-only apply updates the attributes of tracked resources without changing their addresses.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-senior-20",
    track: "devops",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["slos/slas", "metrics", "incident management"],
    prompt:
      "For a 99.9% availability SLO over 30 days, you page on-call when the error budget burns at 14.4 times the sustainable rate. The alert requires that burn rate over both the last hour and the last 5 minutes. What does the 5-minute window add?",
    options: [
      "It makes the page fire sooner after an outage begins, since the 1-hour window alone would wait a full hour before it can trigger",
      "It lets the alert stop firing soon after the problem ends, even though the 1-hour window still contains the earlier errors",
      "It filters out short spikes, so a burst lasting a few minutes never pages anyone however much error budget it consumes",
      "It turns slow burns into ticket-level warnings, while the 1-hour window is responsible for paging on fast burns",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "burn rate is the error rate relative to what the SLO allows",
      "14.4x over 1 hour spends 2% of a 30-day budget",
      "the long window ensures significance; the short window ensures a fast reset",
      "both conditions must hold for the alert to fire",
      "use several window pairs: fast burns page, slow burns raise tickets",
    ],
    redFlags: ["page on any error above the SLO threshold", "a short window alone is reliable for paging"],
    rubric: {
      criteria: [
        {
          name: "Burn rate",
          weight: 4,
          keywords: ["burn rate", "error budget", "14.4", "2%", "slo"],
        },
        {
          name: "Window roles",
          weight: 5,
          keywords: ["long window", "short window", "reset", "precision", "recall", "multi-window"],
        },
      ],
    },
    modelAnswer:
      "A 14.4x burn rate sustained for an hour spends 2% of a 30-day budget, which is worth waking someone for, and the 1-hour window ensures the burn is significant rather than a blip. But a 1-hour window keeps reporting a high burn rate for up to an hour after the errors stop, so on its own the alert would keep firing on a problem that is already fixed. Requiring the 5-minute window as well means the alert only fires while the burn is still happening and clears within minutes of recovery. The short window cannot make the alert fire earlier, since both conditions must hold, and a short but severe burst still pages because it pushes the 1-hour rate over the threshold too.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-21",
    track: "devops",
    level: "senior",
    difficulty: 5,
    type: "debugging",
    tags: ["dns", "kubernetes", "performance"],
    prompt:
      "Pods in the `payments` namespace call `api.partner.example.com`. Many calls show 20-100 ms of extra latency, and CoreDNS handles several times more queries than expected, most answered with NXDOMAIN. The pods use the default DNS policy, giving this `/etc/resolv.conf`. What is the cause and the fix?\n\n```text\nsearch payments.svc.cluster.local svc.cluster.local cluster.local\nnameserver 10.96.0.10\noptions ndots:5\n```",
    options: [
      "CoreDNS caches NXDOMAIN answers for too long; lowering its negative-cache TTL makes failed lookups retry against the upstream sooner",
      "The name has under five dots, so every search domain is tried first, for A and AAAA; use a trailing-dot FQDN or lower `ndots`",
      "Pods should query a public resolver directly; replacing the nameserver with the provider's resolver lets external names skip CoreDNS",
      "The search list is in the wrong order; putting `cluster.local` first lets external names match the shortest suffix on the first attempt",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "ndots:5 treats names with fewer than five dots as relative",
      "each search domain is tried first, for both A and AAAA",
      "several NXDOMAIN round trips per external lookup",
      "use a trailing dot or set ndots in the pod's dnsConfig",
      "NodeLocal DNSCache reduces CoreDNS load and latency",
    ],
    redFlags: ["point pods at a public resolver", "NXDOMAIN caching causes the extra queries"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["ndots", "search domains", "nxdomain", "resolv.conf", "a and aaaa"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["fqdn", "trailing dot", "dnsconfig", "nodelocal dns cache", "coredns"],
        },
      ],
    },
    modelAnswer:
      "With `ndots:5`, any name containing fewer than five dots is first tried with each search domain appended, so `api.partner.example.com` generates lookups such as `api.partner.example.com.payments.svc.cluster.local` that all return NXDOMAIN, for both A and AAAA records, before the real name is queried. Each miss is a round trip to CoreDNS, which adds latency and multiplies query volume. Calling the name as an FQDN with a trailing dot, or lowering `ndots` through the pod's `dnsConfig`, skips the search list, and NodeLocal DNSCache further cuts latency and load. Bypassing CoreDNS would break resolution of in-cluster Service names.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-22",
    track: "devops",
    level: "senior",
    difficulty: 5,
    type: "system-design",
    tags: ["gitops", "argocd", "kubernetes", "release strategies"],
    prompt:
      "Your platform team runs 40 Kubernetes clusters in 8 regions, and every service is deployed to all of them. Releases must be auditable and reproducible, and a bad release must be caught before it reaches every cluster. Which delivery design best meets these goals?",
    options: [
      "A CI pipeline per service that pins the image digest and runs `helm upgrade --atomic` on all 40 clusters in parallel, rolling back any cluster whose checks fail",
      "In-cluster GitOps agents syncing manifests that use a `stable` tag, which a release job re-points in each region's registry mirror, one region at a time after SLO checks",
      "Desired state in Git, reconciled by in-cluster GitOps agents, with every cluster tracking one release branch to which each approved image digest is merged",
      "Desired state in Git, reconciled by in-cluster GitOps agents, promoting one image digest in waves (canary cluster, a region, the rest) gated on SLOs",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "Git as the single source of truth for desired state",
      "pull-based agents reconcile drift; CI needs no cluster-admin credentials",
      "promote an immutable digest, not a mutable tag",
      "progressive waves limit the blast radius",
      "automated gates on SLO metrics and rollback by reverting the commit",
    ],
    redFlags: ["deploy to every cluster at once", "mutable tags are fine with GitOps"],
    rubric: {
      criteria: [
        {
          name: "GitOps",
          weight: 4,
          keywords: ["git", "source of truth", "reconcile", "pull-based", "drift", "audit"],
        },
        {
          name: "Progressive delivery",
          weight: 5,
          keywords: ["waves", "canary cluster", "blast radius", "promotion", "slo gate", "rollback"],
        },
        {
          name: "Reproducibility",
          weight: 3,
          keywords: ["digest", "immutable", "revert", "pinned"],
        },
      ],
    },
    modelAnswer:
      "Keeping each cluster's desired state in Git, reconciled by an agent such as Argo CD or Flux, gives an audit trail of who changed what, detects and corrects drift, and avoids handing CI admin credentials for 40 clusters. Promoting one immutable image digest through waves, from a canary cluster to one region and then the rest, with automated gates on SLO metrics between waves, limits the blast radius of a bad release, and reverting the commit rolls it back. A CI push to all 40 clusters in parallel, or one release branch that every cluster tracks, lets a bad release reach every cluster at once; an automatic rollback only reacts after the damage, and readiness checks miss SLO regressions. Re-pointing a mutable `stable` tag means Git never records which build runs, so releases are neither reproducible nor auditable, and because the manifests do not change, the agents have nothing to roll out.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-23",
    track: "devops",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["github actions", "security", "oidc"],
    prompt:
      "A GitHub Actions workflow deploys to production with a long-lived cloud access key stored as a repository secret, and it uses several third-party actions referenced by tags such as `@v3`. Which changes harden it against supply-chain and credential attacks? Select all that apply.",
    options: [
      "Move the access key to an organisation-level secret, so every repository shares one key that the platform team can rotate centrally",
      "Pin each third-party action to a full-length commit SHA, so a moved or compromised tag cannot change the code that runs",
      "Build pull requests from forks with `pull_request_target`, so the workflow has the secrets it needs to run the full test suite",
      "Replace the key with OIDC federation to a cloud role that trusts only this repository's protected branch, issuing short-lived credentials",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 3],
    multiSelect: true,
    expectedPoints: [
      "tags are mutable; commit SHAs are not",
      "OIDC federation removes long-lived cloud keys",
      "scope the role's trust to repository, branch or environment",
      "never run untrusted fork code with secrets via pull_request_target",
      "least-privilege GITHUB_TOKEN permissions",
    ],
    redFlags: ["sharing one key across repositories is safer", "pull_request_target is safe for building fork code"],
    rubric: {
      criteria: [
        {
          name: "Supply chain",
          weight: 5,
          keywords: ["pin", "commit sha", "mutable tag", "third-party action", "compromised"],
        },
        {
          name: "Credentials",
          weight: 5,
          keywords: ["oidc", "short-lived", "federation", "trust policy", "least privilege", "secrets"],
        },
      ],
    },
    modelAnswer:
      "Git tags can be moved, so an action referenced as `@v3` runs whatever its maintainer, or an attacker who compromises them, points the tag at next; a full commit SHA is immutable, which is why pinning is the recommended practice. OIDC federation lets each run exchange a signed token for short-lived cloud credentials from a role whose trust policy names this repository and branch, so there is no long-lived key to leak. An organisation-wide secret widens the blast radius of a leak, and `pull_request_target` runs in the base repository's context with access to secrets, so building fork code there hands those secrets to anyone who opens a pull request.",
    followUpIds: [],
  },
  {
    id: "qb-devops-senior-24",
    track: "devops",
    level: "senior",
    difficulty: 5,
    type: "theory",
    tags: ["secrets management", "vault", "postgresql"],
    prompt:
      "Sixty pods across three services connect to PostgreSQL as one database user, reading its password from a secrets manager at start-up. The password must be rotated without a single failed connection. Which approach is safest?",
    options: [
      "Alternate between two database users: set a new password on the idle one, roll services onto it, then disable the old one once unused",
      "Run `ALTER ROLE` with the new password, then update the secret and roll the pods, since sessions that are already open stay authenticated",
      "Update the secret in the secrets manager first and let pods pick it up as they restart, changing the database password a week later",
      "Keep the password and restrict PostgreSQL connections to the pods' IP ranges, since network controls make credential rotation unnecessary",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "old and new credentials must both be valid during the transition",
      "two users (or dynamic credentials) allow that overlap",
      "roll workloads gradually and verify the old credential is unused",
      "revoke the old credential only afterwards",
      "dynamic short-lived credentials, such as Vault's database secrets engine, make rotation routine",
    ],
    redFlags: [
      "change the password in place because open sessions stay connected",
      "change both sides at once and restart everything",
      "network controls replace rotation",
    ],
    rubric: {
      criteria: [
        {
          name: "Overlap",
          weight: 5,
          keywords: ["two users", "dual credentials", "overlap", "alternate", "both valid"],
        },
        {
          name: "Safe rollout",
          weight: 4,
          keywords: ["rolling restart", "verify", "pg_stat_activity", "revoke", "dynamic secrets", "vault"],
        },
      ],
    },
    modelAnswer:
      "Changing the password of the one user everything shares leaves a window in which new connections fail. PostgreSQL checks the password only when a connection opens, so existing sessions survive `ALTER ROLE`, but pools keep opening new connections and pods restart at different times, so every pod still holding the old password has its new connections rejected until it restarts. Alternating between two users removes that window: the new password goes on the user nobody is using, services roll onto it gradually, you confirm (for example in `pg_stat_activity`) that nothing still connects as the old user, and only then disable it. Updating the secret before the database fails every pod that restarts in between, and network restrictions do not replace rotation. Dynamic short-lived credentials from a tool such as Vault's database secrets engine apply the same overlap automatically.",
    followUpIds: [],
  },
];
