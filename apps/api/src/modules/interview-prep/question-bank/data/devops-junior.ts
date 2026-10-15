import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-junior-01",
    track: "devops",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["security", "devops"],
    prompt:
      "A config file on a Linux server contains a database password. After running `chmod 640 app.conf`, who can do what with the file?",
    options: [
      "The owner can read, write and execute it, its group can read it, and other users can read it",
      "The owner can read it, its group can read and write it, and other users have no access",
      "The owner can read and write it, its group can read it, and other users have no access",
      "The owner and its group can read and write it, and other users can only read it",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "the three digits are owner, group and others",
      "read = 4, write = 2, execute = 1",
      "6 is read and write, 4 is read only, 0 is no access",
      "files holding secrets should not be readable by other users",
    ],
    redFlags: ["the digits are in the order others, group, owner", "chmod 777 is a fine fix for permission errors"],
    rubric: {
      criteria: [
        {
          name: "Octal notation",
          weight: 5,
          keywords: ["owner", "group", "others", "octal", "read", "write"],
        },
        {
          name: "Least privilege",
          weight: 3,
          keywords: ["no access", "secret", "least privilege", "other users"],
        },
      ],
    },
    modelAnswer:
      "Each octal digit of a file mode sets the permissions for, in order, the owner, the file's group and all other users, by adding read (4), write (2) and execute (1). So 640 means rw- for the owner, r-- for the group and --- for everyone else, which `ls -l` shows as `-rw-r-----`. That suits a file holding a secret: the service's group can read it, but other accounts on the machine cannot. Giving other users read access would need a last digit of 4, not 0.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-02",
    track: "devops",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["kubernetes", "orchestration"],
    prompt:
      "A Kubernetes Deployment named `web` has `replicas: 3`. You run `kubectl delete pod` on one of its pods. What happens next?",
    options: [
      "The Deployment scales down to two replicas until someone edits its manifest again",
      "Its ReplicaSet sees that only two pods are left and creates a new pod to get back to three",
      "Kubernetes restores the deleted pod from a snapshot, keeping its name and IP address",
      "Kubernetes restarts the other two pods as well, so that all three pods stay identical",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "Kubernetes reconciles the actual state towards the desired state",
      "the ReplicaSet owned by the Deployment keeps the replica count",
      "the replacement pod gets a new name and IP address",
      "to run fewer pods, change replicas instead",
    ],
    redFlags: ["deleting a pod permanently reduces the replica count", "pods keep their IP address when replaced"],
    rubric: {
      criteria: [
        {
          name: "Reconciliation",
          weight: 5,
          keywords: ["desired state", "replicaset", "controller", "replacement", "reconcile"],
        },
        {
          name: "Pod identity",
          weight: 3,
          keywords: ["new name", "new ip", "ephemeral", "scale", "replicas"],
        },
      ],
    },
    modelAnswer:
      "A Deployment manages a ReplicaSet whose controller keeps comparing the number of running pods with the desired `replicas` count. When one pod is deleted it sees two instead of three and creates a new pod from the same template, with a new name and IP address. Deleting a pod therefore does not scale anything down; to run fewer pods you change `replicas`, for example with `kubectl scale`. Pods are treated as disposable, so nothing is restored from a snapshot.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-03",
    track: "devops",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["metrics", "logging", "tracing"],
    prompt:
      "You need a dashboard showing an API's request rate, error rate and p95 latency over the last 30 days. Which kind of telemetry is designed for this?",
    options: [
      "Logs, because they are cheaper to store and query over 30 days than numeric samples",
      "Traces, because every single request is always recorded in full, with no sampling",
      "Synthetic uptime checks, because they measure the latency of every real user request",
      "Metrics, because numeric time series are cheap to store and aggregate over long periods",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "metrics are numeric time series",
      "metrics are cheap to aggregate over long time ranges",
      "logs record individual events in detail",
      "traces show the path and timing of a single request",
      "traces are usually sampled",
    ],
    redFlags: ["logs are the cheapest way to chart long-term trends", "every request is traced in full"],
    rubric: {
      criteria: [
        {
          name: "Choosing the signal",
          weight: 5,
          keywords: ["metrics", "time series", "aggregate", "dashboard", "rate", "latency"],
        },
        {
          name: "Other signals",
          weight: 3,
          keywords: ["logs", "traces", "sampling", "individual request", "cost"],
        },
      ],
    },
    modelAnswer:
      "Metrics are numeric time series (counters, gauges and histograms) that are cheap to store and aggregate, so they are the natural source for rate, error and latency charts over weeks. Logs describe individual events in detail and are far more expensive to keep and scan in bulk; they are what you read when investigating a specific problem. Traces follow one request across services and are usually sampled, and synthetic checks only measure their own test requests, so neither is a complete record of real traffic.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-04",
    track: "devops",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["cost optimization", "devops"],
    prompt:
      "Your team's development and staging environments run 24 hours a day, but nobody uses them outside office hours. Which change most directly cuts their compute cost without touching production?",
    options: [
      "Stop them, or scale them to zero, automatically outside office hours and start them again each morning",
      "Move development and staging onto larger instance types, so that their work finishes sooner and costs less",
      "Turn on more detailed monitoring for development and staging to find out which services are busiest",
      "Run a second replica of every staging service, so that the load is shared across more machines",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "you pay for compute while it runs, used or not",
      "schedule non-production environments to stop out of hours",
      "scale to zero where possible",
      "tag resources so that costs can be attributed",
    ],
    redFlags: ["idle resources cost nothing", "cost cutting should start by changing production"],
    rubric: {
      criteria: [
        {
          name: "Idle resources",
          weight: 5,
          keywords: ["idle", "schedule", "stop", "scale down", "out of hours", "non-production"],
        },
        {
          name: "Cost awareness",
          weight: 3,
          keywords: ["pay per hour", "tagging", "budget", "rightsizing"],
        },
      ],
    },
    modelAnswer:
      "Cloud compute such as virtual machines is usually billed for the time it runs, whether or not anyone is using it, so environments that sit idle every night and weekend waste most of what they cost. Scheduling them to stop or scale to zero outside working hours, and to start again automatically, removes that waste without affecting production. More detailed monitoring, extra staging replicas and larger instance types all add cost, because larger instances are billed at a higher hourly rate and these machines would still sit idle all night.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-05",
    track: "devops",
    level: "junior",
    difficulty: 1,
    type: "theory",
    tags: ["dns"],
    prompt:
      "You moved a website to a new server and updated its DNS A record. An hour later, some users still reach the old server while others reach the new one. What is the most likely reason?",
    options: [
      "DNS changes are only published to the internet during a nightly update window",
      "The A record also needs a matching CNAME record before resolvers will use it",
      "Resolvers cached the old record and keep returning it until its TTL expires",
      "Browsers always reuse the IP address from the first visit and ignore DNS afterwards",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "resolvers and clients cache DNS answers",
      "the TTL says how long a cached answer may be reused",
      "lower the TTL well before a planned migration",
      "keep the old server running until old caches expire",
    ],
    redFlags: ["DNS updates are instant everywhere", "DNS changes are published in a nightly batch"],
    rubric: {
      criteria: [
        {
          name: "Caching",
          weight: 5,
          keywords: ["ttl", "cache", "resolver", "expire", "a record"],
        },
        {
          name: "Migration practice",
          weight: 3,
          keywords: ["lower ttl", "in advance", "keep old server", "cutover"],
        },
      ],
    },
    modelAnswer:
      "DNS answers are cached by recursive resolvers, operating systems and browsers for as long as the record's TTL allows, so clients that looked the name up before the change keep getting the old IP address until their cached copy expires. What people call 'DNS propagation' is mostly this caching. Before a planned move, lower the TTL well in advance and keep the old server serving until the old TTL has passed. There is no nightly publishing window, and an A record does not need a CNAME (a name with a CNAME cannot have other records at all).",
    followUpIds: [],
  },

  // ─── Difficulty 2 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-junior-06",
    track: "devops",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["blue/green deploys", "release strategies"],
    prompt:
      "A team uses blue/green deployments: the new version is deployed to the idle 'green' environment while 'blue' serves all traffic, then the router switches all traffic to green. What is the main benefit of this approach?",
    options: [
      "Only a small percentage of users get the new version at first, which limits the impact of a bug",
      "It needs no extra capacity, because blue and green run on the same servers at the same time",
      "Database schema changes no longer need to stay compatible with the previous version of the app",
      "Rollback is quick: if green misbehaves, traffic is switched back to blue, which still runs the old version",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "two identical environments",
      "all traffic is switched at once",
      "rollback by switching traffic back",
      "costs extra capacity while both environments run",
      "a shared database must stay compatible with both versions",
    ],
    redFlags: ["blue/green is the same as a canary release", "blue/green removes the need for compatible schema changes"],
    rubric: {
      criteria: [
        {
          name: "Mechanism",
          weight: 4,
          keywords: ["two environments", "switch", "router", "load balancer", "idle"],
        },
        {
          name: "Trade-offs",
          weight: 4,
          keywords: ["rollback", "switch back", "double capacity", "database", "compatible"],
        },
      ],
    },
    modelAnswer:
      "Blue/green keeps two complete environments: the new version is deployed and checked on the idle one, then the router or load balancer moves all traffic across in one step. Because the old environment is still running, rolling back is just switching the traffic back. The costs are running two environments' worth of capacity during the release and keeping database changes compatible with both versions. Sending a small share of users to the new version first describes a canary release, not blue/green.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-07",
    track: "devops",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["kubernetes"],
    prompt:
      "Requests to the `web` Service fail. The Deployment's pods are Running and Ready, but the Service has no endpoints. Given these parts of the two manifests, what is the bug?\n\n```yaml\n# Deployment: spec.template.metadata\nlabels:\n  app: web-api\n---\n# Service: spec\nselector:\n  app: web\nports:\n  - port: 80\n    targetPort: 8080\n```",
    options: [
      "`targetPort` must be the same as `port`, so it should be 80 rather than 8080",
      "The selector `app: web` does not match the pods' label `app: web-api`",
      "A Service must have exactly the same name as the Deployment whose pods it serves",
      "Services can only select pods by a `name` label, never by a label called `app`",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a Service routes to pods whose labels match its selector",
      "every key and value in the selector must appear in the pods' labels",
      "no matching pods means no endpoints",
      "port is the Service's port, targetPort the container's port",
    ],
    redFlags: ["Services find pods by the Deployment's name", "port and targetPort must be the same"],
    rubric: {
      criteria: [
        {
          name: "Diagnosis",
          weight: 5,
          keywords: ["selector", "labels", "match", "endpoints", "no pods"],
        },
        {
          name: "Service ports",
          weight: 3,
          keywords: ["port", "targetport", "container port", "8080"],
        },
      ],
    },
    modelAnswer:
      "A Service has no direct link to a Deployment: it sends traffic to whichever pods carry labels that match its selector. Here the selector asks for `app: web` but the pods are labelled `app: web-api`, so nothing matches and the Service has no endpoints. Changing the Service's selector to `app: web-api` makes the endpoints appear; changing the label on the Deployment side instead would also mean changing the Deployment's own selector, which cannot be edited once the Deployment exists. `port: 80` with `targetPort: 8080` is a normal mapping from the Service's port to the port the container listens on.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-08",
    track: "devops",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["terraform", "iac"],
    prompt:
      "Your infrastructure is managed with Terraform. During an incident, a colleague changed a VM's instance size by hand in the cloud console and did not update the code. What will the next `terraform plan` most likely show?",
    options: [
      "A change setting the instance size back to the value in the code, because the real resource has drifted from it",
      "No changes, because Terraform compares the code only with the state file and never reads the real resources",
      "An error, because Terraform refuses to manage any resource that has been edited outside of Terraform",
      "A change to the .tf files in the repository that updates them to the new instance size from the console",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "plan refreshes state from the real infrastructure",
      "differences from the configuration show up as changes",
      "Terraform makes reality match the code, not the other way round",
      "update the code if the manual change should stay",
      "avoid manual changes to Terraform-managed resources",
    ],
    redFlags: ["terraform plan ignores the real infrastructure", "Terraform updates the code to match manual changes"],
    rubric: {
      criteria: [
        {
          name: "Drift",
          weight: 5,
          keywords: ["drift", "refresh", "state", "real infrastructure", "revert"],
        },
        {
          name: "Practice",
          weight: 3,
          keywords: ["update code", "source of truth", "console", "manual change"],
        },
      ],
    },
    modelAnswer:
      "By default `terraform plan` refreshes what it knows about each managed resource from the provider's API and then compares that with the configuration. The manual resize is drift: the real instance no longer matches the code, so the plan proposes changing it back to the size in the code. If the bigger size should stay, change the code and apply it, because the configuration is the source of truth; Terraform never rewrites your .tf files for you.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-09",
    track: "devops",
    level: "junior",
    difficulty: 2,
    type: "theory",
    tags: ["iam", "aws", "secrets management"],
    prompt:
      "An application on an AWS EC2 instance needs to read objects from one S3 bucket. What is the recommended way to give it access?",
    options: [
      "Create an access key for an IAM user and put it in the application's config file in the repository",
      "Make the bucket publicly readable, so that the application does not need any credentials at all",
      "Attach an IAM role to the instance that can only read that bucket; the SDK fetches short-lived credentials",
      "Attach a role with the AdministratorAccess policy to the instance, so that later permission errors are avoided",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "use an IAM role (instance profile), not long-lived keys",
      "the credentials are temporary and rotated automatically",
      "least privilege: only the actions and the bucket needed",
      "never commit access keys to git",
    ],
    redFlags: ["access keys in config files or git are fine", "broad admin permissions are acceptable to avoid errors"],
    rubric: {
      criteria: [
        {
          name: "Credentials",
          weight: 5,
          keywords: ["iam role", "instance profile", "temporary credentials", "no access keys", "rotated"],
        },
        {
          name: "Least privilege",
          weight: 4,
          keywords: ["least privilege", "s3:getobject", "one bucket", "policy", "scope"],
        },
      ],
    },
    modelAnswer:
      "An IAM role attached to the instance through an instance profile gives the application temporary credentials that the AWS SDK fetches and refreshes automatically, so there are no long-lived keys to leak or rotate by hand. The role's policy should follow least privilege, for example `s3:GetObject` on that one bucket only. Access keys in a config file get copied and leaked, a public bucket exposes the data to everyone, and AdministratorAccess turns any compromise of the app into a compromise of the whole account.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-10",
    track: "devops",
    level: "junior",
    difficulty: 2,
    type: "debugging",
    tags: ["github actions", "devops"],
    prompt:
      "In this GitHub Actions workflow, pushes with failing tests still get deployed. What is the fix?\n\n```yaml\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n      - run: npm ci && npm test\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n      - run: ./deploy.sh\n```",
    options: [
      "Move the `deploy` job above the `test` job, because jobs run in the order they are written",
      "Add `continue-on-error: true` to the `test` job, so that its failure is passed on to `deploy`",
      "Add `if: always()` to the `deploy` job, so that it checks the result of the tests before running",
      "Add `needs: test` to the `deploy` job, because jobs run in parallel unless they declare a dependency",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "jobs run in parallel by default",
      "needs makes a job wait for another job",
      "a job is skipped when a job it needs fails",
      "steps within one job run in order",
    ],
    redFlags: ["jobs run in the order they are written", "continue-on-error makes a failure stop the pipeline"],
    rubric: {
      criteria: [
        {
          name: "Job ordering",
          weight: 5,
          keywords: ["needs", "parallel", "dependency", "wait", "skipped"],
        },
        {
          name: "Pipeline safety",
          weight: 3,
          keywords: ["gate", "failing tests", "deploy", "continue-on-error"],
        },
      ],
    },
    modelAnswer:
      "Jobs in a GitHub Actions workflow run in parallel on separate runners unless a job declares `needs`. Here `deploy` neither waits for `test` nor depends on its result, so it deploys even when the tests fail. With `needs: test`, `deploy` starts only after `test` succeeds and is skipped if it fails. Steps inside one job run in order, but the order of jobs in the file has no effect, and `continue-on-error` would hide the failure rather than stop the deployment.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-junior-12",
    track: "devops",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["slos/slas"],
    prompt:
      "A service has an availability SLO of 99.9% measured over a rolling 30-day window. Roughly how much total downtime does its error budget allow in that window?",
    options: ["About 43 minutes", "About 4 minutes", "About 7 hours", "About 9 hours"],
    correctOptionIndex: 0,
    expectedPoints: [
      "error budget = 100% minus the SLO",
      "30 days is 43,200 minutes",
      "0.1% of 43,200 minutes is about 43 minutes",
      "each extra nine cuts the budget tenfold",
    ],
    redFlags: ["confusing 99.9% with 99% or 99.99%", "using a yearly figure for a 30-day window"],
    rubric: {
      criteria: [
        {
          name: "Calculation",
          weight: 5,
          keywords: ["error budget", "0.1%", "43,200", "43 minutes", "30 days"],
        },
        {
          name: "SLO concepts",
          weight: 3,
          keywords: ["slo", "sli", "availability", "window", "nines"],
        },
      ],
    },
    modelAnswer:
      "The error budget is what the SLO leaves over: 100% − 99.9% = 0.1% of the window. Thirty days is 30 × 24 × 60 = 43,200 minutes, and 0.1% of that is about 43 minutes. About 4 minutes would be a 99.99% target, about 7 hours a 99% target, and about 9 hours is 99.9% over a whole year rather than 30 days.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-13",
    track: "devops",
    level: "junior",
    difficulty: 3,
    type: "theory",
    tags: ["docker", "containers", "security"],
    prompt: "Which of these make a production container image more secure? Select all that apply.",
    options: [
      "Install an SSH server in the image so that engineers can log in and patch running containers",
      "Use a multi-stage build so that compilers, build tools and dev dependencies stay out of the final image",
      "Add a `USER` instruction so that the application runs as a non-root user inside the container",
      "Set the API keys the app needs with `ENV` instructions in the Dockerfile so they are always available",
      "Start from a minimal base image, such as a slim or distroless one, so fewer packages can carry vulnerabilities",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [1, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "multi-stage builds ship only the runtime artefacts",
      "run the process as a non-root user",
      "minimal base images shrink the attack surface",
      "patch by rebuilding and redeploying, not by logging in",
      "secrets do not belong in ENV or image layers",
    ],
    redFlags: ["SSH into containers to patch them", "baking secrets into the image is acceptable"],
    rubric: {
      criteria: [
        {
          name: "Hardening practices",
          weight: 5,
          keywords: ["multi-stage", "non-root", "user", "minimal", "distroless", "attack surface"],
        },
        {
          name: "Anti-patterns",
          weight: 3,
          keywords: ["ssh", "immutable", "rebuild", "secrets", "env"],
        },
      ],
    },
    modelAnswer:
      "A multi-stage build compiles in one stage and copies only the runtime artefacts into the final one, so compilers and dev dependencies never ship; a `USER` instruction stops the process running as root inside the container; and a minimal base image means fewer packages that can carry vulnerabilities. An SSH server adds attack surface and encourages hand-patching, whereas containers should be treated as immutable and fixed by rebuilding and redeploying the image. Values set with `ENV` are stored in the image's configuration, where anyone who can pull the image can read them.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-14",
    track: "devops",
    level: "junior",
    difficulty: 3,
    type: "system-design",
    tags: ["aws", "load balancers", "security"],
    prompt:
      "You are placing a web app in a cloud VPC: an internet-facing load balancer, two app servers and a PostgreSQL database. Which network layout is the standard, most secure choice?",
    options: [
      "All three in public subnets with public IP addresses, relying on strong passwords on the servers and the database",
      "Load balancer and app servers in private subnets, with the database in a public subnet so developers can query it directly",
      "All three in one private subnet, with an internal-only load balancer so that nothing at all is reachable from the internet",
      "Load balancer in public subnets; app servers and database in private subnets, the database reachable only from the app servers",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "public subnets route to an internet gateway",
      "only the load balancer needs to face the internet",
      "app servers and the database in private subnets",
      "security groups admit database traffic only from the app tier",
      "a NAT gateway gives private subnets outbound access",
    ],
    redFlags: ["putting the database in a public subnet", "relying on passwords instead of network isolation"],
    rubric: {
      criteria: [
        {
          name: "Subnet layout",
          weight: 5,
          keywords: ["public subnet", "private subnet", "internet gateway", "load balancer", "nat"],
        },
        {
          name: "Access control",
          weight: 4,
          keywords: ["security group", "least privilege", "app tier", "database", "bastion"],
        },
      ],
    },
    modelAnswer:
      "Only the load balancer needs to be reachable from the internet, so it goes in public subnets, whose route tables point at an internet gateway. The app servers and the database sit in private subnets with no inbound route from the internet, the database's security group admits only the app servers, and the app servers use a NAT gateway for outbound calls such as package downloads. Public IPs plus passwords expose every machine to constant attack, a public database is a common cause of breaches, and an internal-only load balancer cannot serve internet users at all. Developers can reach the database through a VPN, a bastion or the provider's session manager instead.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-24",
    track: "devops",
    level: "junior",
    difficulty: 3,
    type: "behavioral",
    tags: ["secrets management", "security", "incident management"],
    prompt:
      "You notice that a commit you pushed an hour ago to a public GitHub repository contains a live cloud access key. What should you do first?",
    options: [
      "Rewrite the history with `git filter-repo` and force-push, so that no commit in the repository contains the key",
      "Make the repository private so the key is hidden, then check the audit logs to decide whether it needs rotating",
      "Push a new commit that deletes the key from the file, so that the latest version of the code no longer contains it",
      "Revoke or rotate the key straight away and tell your lead or security team, then check its usage and clean up",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "treat a key that has been public as compromised",
      "revoke or rotate it first",
      "automated scanners find leaked keys within minutes",
      "check audit logs for misuse",
      "report the leak rather than hide it",
      "clean the history and add secret scanning afterwards",
    ],
    redFlags: [
      "removing the commit makes the key safe",
      "rotating only if the logs show misuse",
      "hiding the mistake from the team",
    ],
    rubric: {
      criteria: [
        {
          name: "Containment",
          weight: 5,
          keywords: ["revoke", "rotate", "compromised", "immediately", "audit logs"],
        },
        {
          name: "Communication and prevention",
          weight: 4,
          keywords: ["tell", "security team", "secret scanning", "pre-commit", "history"],
        },
      ],
    },
    modelAnswer:
      "Once a key has been public it must be treated as compromised: bots scan public repositories continuously and can find and use a leaked key within minutes. The first step is to revoke or rotate it so it stops working, and to tell your lead or security team so the provider's audit logs (for example AWS CloudTrail) can be checked for misuse. Rewriting history, making the repository private or pushing a fix commit are clean-up steps that do nothing about copies already taken, and a key that has been public needs replacing whether or not the logs show misuse. Afterwards, add secret scanning and pre-commit checks so it does not happen again.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-junior-15",
    track: "devops",
    level: "junior",
    difficulty: 4,
    type: "debugging",
    tags: ["docker", "containers"],
    prompt:
      'This API works when run directly on a laptop. In a container started with `docker run -d -p 3000:3000 my-api`, `curl http://localhost:3000/health` on the host fails. What is the bug?\n\n```js\nconst express = require("express");\nconst app = express();\napp.get("/health", (req, res) => res.send("ok"));\napp.listen(3000, "127.0.0.1");\n```',
    options: [
      "`-p 3000:3000` publishes the port only to other containers; reaching it from the host needs `--network host`",
      "The Dockerfile lacks `EXPOSE 3000`, and a port cannot be published with `-p` unless it has been exposed",
      "The app listens only on the container's own loopback interface; it must listen on `0.0.0.0` instead",
      "Port 3000 is reserved by Docker inside containers, so the app has to listen on port 80 instead",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "each container has its own network namespace and loopback",
      "127.0.0.1 inside the container is not the host",
      "published ports are forwarded to the container's network interface",
      "bind to 0.0.0.0 (all interfaces)",
      "EXPOSE is documentation and does not publish ports",
    ],
    redFlags: ["EXPOSE is required for -p to work", "localhost inside a container is the host machine"],
    rubric: {
      criteria: [
        {
          name: "Network namespaces",
          weight: 5,
          keywords: ["127.0.0.1", "loopback", "0.0.0.0", "network namespace", "bind", "interface"],
        },
        {
          name: "Port publishing",
          weight: 3,
          keywords: ["-p", "publish", "expose", "port mapping", "forward"],
        },
      ],
    },
    modelAnswer:
      "A container has its own network namespace, so `127.0.0.1` inside it is the container's loopback, not the host's. Docker forwards the published host port to the container's network interface (for example its 172.17.x.x address), where nothing is listening because the app bound only to loopback. Listening on `0.0.0.0` (all interfaces) fixes it. `EXPOSE` only documents a port and is not needed for `-p` to work.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-16",
    track: "devops",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["kubernetes", "orchestration"],
    prompt:
      "A new pod stays `Pending` with the event `0/3 nodes are available: 3 Insufficient cpu`, yet monitoring shows the actual CPU usage of every node at about 20%. What explains this?",
    options: [
      "The scheduler places pods by CPU requests, and existing requests leave no node room for this pod's request",
      "The scheduler places pods by live CPU usage, and the monitoring dashboard is simply showing stale data",
      "Each node keeps 80% of its CPU in reserve for system daemons, so pods can only ever use the other 20%",
      "The scheduler waits until a node's CPU is completely idle before it places any new pod on that node",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "scheduling is based on requests, not live usage",
      "what is left is a node's allocatable CPU minus the existing requests",
      "over-sized requests waste capacity",
      "right-size requests from observed usage or add nodes",
    ],
    redFlags: ["the scheduler looks at actual CPU usage", "limits decide where a pod is scheduled"],
    rubric: {
      criteria: [
        {
          name: "Scheduling",
          weight: 5,
          keywords: ["requests", "scheduler", "allocatable", "reserved", "pending", "insufficient"],
        },
        {
          name: "Remedy",
          weight: 4,
          keywords: ["right-size", "lower requests", "add nodes", "cluster autoscaler", "usage"],
        },
      ],
    },
    modelAnswer:
      "The Kubernetes scheduler does not look at live CPU usage; it checks whether a node's allocatable CPU minus the requests of the pods already on it is enough for the new pod's request. If existing pods request far more CPU than they use, the nodes are full on paper while sitting mostly idle. The fix is to right-size requests from observed usage, or to add capacity, for example with a cluster autoscaler. Limits cap what a running container may use; they do not decide placement.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-17",
    track: "devops",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["security", "aws", "azure", "gcp"],
    prompt:
      "Your company runs an app on virtual machines (IaaS) from a major cloud provider. Under the shared responsibility model, which of these are your company's responsibility rather than the provider's? Select all that apply.",
    options: [
      "Installing security patches for the operating system running on the VMs",
      "Physical security of the data centres where the VMs are hosted",
      "Firewall rules, such as security groups, that open only the ports the app needs",
      "Patching the hypervisor that the VMs run on top of",
      "Giving cloud user accounts and roles only the permissions they need",
    ],
    correctOptionIndex: 0,
    correctOptionIndices: [0, 2, 4],
    multiSelect: true,
    expectedPoints: [
      "the provider secures the facilities, hardware and virtualisation layer",
      "the customer secures the guest OS, applications and data",
      "network rules and IAM are the customer's job",
      "managed services shift more work to the provider",
    ],
    redFlags: ["the provider patches the operating system of your VMs", "using the cloud makes security the provider's problem"],
    rubric: {
      criteria: [
        {
          name: "Customer duties",
          weight: 5,
          keywords: ["operating system", "patching", "security groups", "iam", "least privilege", "data"],
        },
        {
          name: "Provider duties",
          weight: 3,
          keywords: ["physical", "data centre", "hypervisor", "hardware", "managed service"],
        },
      ],
    },
    modelAnswer:
      "Under the shared responsibility model the provider secures the cloud itself: the data centres, the hardware, the network backbone and the virtualisation layer, including the hypervisor. With IaaS the customer is responsible for what runs on it: patching the guest operating system and applications, firewall rules such as security groups, IAM permissions and the data. With managed services such as a managed database the provider takes on more, for example patching the database engine, but access control and configuration remain the customer's job.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-18",
    track: "devops",
    level: "junior",
    difficulty: 4,
    type: "coding",
    tags: ["terraform", "iac"],
    prompt:
      '`terraform plan` fails, reporting that `module.network` has no `vpc_id`. Which change fixes it?\n\n```hcl\n# main.tf (root)\nmodule "network" {\n  source = "./modules/network"\n}\nresource "aws_security_group" "web" {\n  vpc_id = module.network.vpc_id\n}\n\n# modules/network/main.tf\nresource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n}\n```',
    options: [
      'Add `variable "vpc_id" { default = aws_vpc.main.id }` to the module',
      'Add `output "vpc_id" { value = aws_vpc.main.id }` to the module',
      "Add `locals { vpc_id = aws_vpc.main.id }` to the module",
      "Change the reference in the root to `module.network.aws_vpc.main.id`",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a module's resources are private to the module",
      "outputs are the values a module exposes to its caller",
      "variables are inputs, outputs are what callers can read",
      "outputs are referenced as module.<name>.<output>",
    ],
    redFlags: ["you can reference a module's resources directly", "variables pass values out of a module"],
    rubric: {
      criteria: [
        {
          name: "Module interface",
          weight: 5,
          keywords: ["output", "module", "variable", "input", "encapsulation"],
        },
        {
          name: "References",
          weight: 3,
          keywords: ["module.network.vpc_id", "attribute", "aws_vpc.main.id", "locals"],
        },
      ],
    },
    modelAnswer:
      'A Terraform module is encapsulated: its resources, variables and locals cannot be read from outside, and callers can only see the values it declares in `output` blocks. Adding `output "vpc_id" { value = aws_vpc.main.id }` to the module makes `module.network.vpc_id` available to the root configuration. Variables are a module\'s inputs (and their defaults cannot refer to resources), locals are private helpers, and there is no syntax for reaching into a module\'s resources such as `module.network.aws_vpc.main.id`.',
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-19",
    track: "devops",
    level: "junior",
    difficulty: 4,
    type: "theory",
    tags: ["metrics", "incident management", "slos/slas"],
    prompt:
      "The on-call engineer is paged most nights by an alert that fires when any server's CPU stays above 80% for one minute, yet users are almost never affected. What is the best change?",
    options: [
      "Keep the alert but lower its threshold to 60%, so that problems are caught earlier in the night",
      "Mute all alerts overnight and review everything that fired at the start of the next working day",
      "Page on user-facing symptoms such as error rate and latency against the SLO; send CPU to a dashboard",
      "Add a matching alert for memory above 80%, so that the on-call engineer has more context when paged",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "page only on urgent, user-impacting problems",
      "alert on symptoms (errors, latency, SLO burn rate) rather than causes",
      "every page should be actionable",
      "cause metrics such as CPU belong on dashboards or tickets",
      "alert fatigue makes real pages get ignored",
    ],
    redFlags: ["more alerts always mean better coverage", "silencing alerts at night is acceptable"],
    rubric: {
      criteria: [
        {
          name: "Alert design",
          weight: 5,
          keywords: ["symptom", "user-facing", "error rate", "latency", "slo", "actionable"],
        },
        {
          name: "Alert fatigue",
          weight: 4,
          keywords: ["alert fatigue", "noise", "page", "dashboard", "ticket", "on-call"],
        },
      ],
    },
    modelAnswer:
      "Pages should be kept for problems that are hurting users now and need a human to act, so they are best based on symptoms such as error rate, latency or SLO burn rate rather than on causes like high CPU. A CPU spike that users never notice is useful context on a dashboard or in a low-priority ticket, but paging on it every night trains the team to ignore alerts (alert fatigue). Lowering the threshold or adding similar resource alerts makes the noise worse, and muting alerts overnight would hide real incidents.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ────────────────────────────────────────────────────────
  {
    id: "qb-devops-junior-20",
    track: "devops",
    level: "junior",
    difficulty: 5,
    type: "coding",
    tags: ["devops", "best-practices"],
    prompt:
      'This CI script publishes the image even when `npm test` fails. Which change makes it stop when the tests fail, while still saving their output to `test-output.log`?\n\n```bash\n#!/usr/bin/env bash\nset -e\nnpm test 2>&1 | tee test-output.log\necho "Tests passed, publishing"\n./publish.sh\n```',
    options: [
      "Move `set -e` to the line directly before `npm test`, so that it applies to the test command",
      "Replace `2>&1` with `2>/dev/null`, so that only test failures are passed through to `tee`",
      "Append `|| exit 0` to the `tee` line, so that the script exits as soon as anything goes wrong",
      "Use `set -eo pipefail`, so that a pipeline fails when any command in it fails, not just the last",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "a pipeline's exit status is the last command's (tee)",
      "set -e only sees the pipeline's overall status",
      "pipefail makes the pipeline fail if any command in it fails",
      "set -euo pipefail is a common safe default for CI scripts",
    ],
    redFlags: ["set -e catches failures anywhere in a pipeline", "tee passes on the exit code of the command before it"],
    rubric: {
      criteria: [
        {
          name: "Exit status",
          weight: 5,
          keywords: ["exit status", "pipeline", "tee", "last command", "pipefail"],
        },
        {
          name: "Shell safety",
          weight: 3,
          keywords: ["set -e", "set -u", "errexit", "ci", "fail fast"],
        },
      ],
    },
    modelAnswer:
      "By default a pipeline's exit status is that of its last command, here `tee`, which succeeds even when `npm test` fails, so `set -e` sees success and the script goes on to publish. `set -o pipefail` makes a pipeline return the status of the rightmost command that failed, so with `set -eo pipefail` (often written `set -euo pipefail`) failing tests stop the script while `tee` still writes the log. Moving `set -e` or discarding stderr does not change the pipeline's exit status, and `|| exit 0` would report success.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-21",
    track: "devops",
    level: "junior",
    difficulty: 5,
    type: "debugging",
    tags: ["docker", "secrets management", "security"],
    prompt:
      '`.npmrc` holds a token for the company\'s private npm registry. A security scan of the pushed image still finds the token, even though the Dockerfile deletes the file. Why, and what is the fix?\n\n```dockerfile\nFROM node:24-slim\nWORKDIR /app\nCOPY package.json package-lock.json .npmrc ./\nRUN npm ci --omit=dev\nRUN rm .npmrc\nCOPY src/ ./src/\nCMD ["node", "src/server.js"]\n```',
    options: [
      "The file stays in the `COPY` layer and `rm` only hides it in a new layer; use `RUN --mount=type=secret` instead",
      "The build runs as a non-root user, so `rm` cannot delete the file; use `RUN sudo rm .npmrc` instead",
      "`npm ci` copies `.npmrc` into `node_modules`; add `node_modules/.npmrc` to `.dockerignore` instead",
      "The scanner reads the build context rather than the image; adding `.npmrc` to `.gitignore` removes the finding",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "each RUN, COPY and ADD instruction creates an image layer",
      "files deleted in a later layer remain in earlier layers",
      "anyone who can pull the image can extract its layers",
      "use a BuildKit secret mount (RUN --mount=type=secret)",
      "or keep the token in a build stage that is not shipped",
      "rotate the exposed token",
    ],
    redFlags: ["deleting a file in a later RUN removes it from the image", "secrets are safe in ARG or ENV"],
    rubric: {
      criteria: [
        {
          name: "Layers",
          weight: 5,
          keywords: ["layer", "copy", "rm", "history", "extract", "immutable"],
        },
        {
          name: "Fix",
          weight: 5,
          keywords: ["--mount=type=secret", "buildkit", "multi-stage", "rotate", "token"],
        },
      ],
    },
    modelAnswer:
      "Every `RUN`, `COPY` and `ADD` instruction adds an immutable filesystem layer, and the image ships all of them. The `COPY` layer contains `.npmrc`; the later `RUN rm` only adds a layer that hides the file, so anyone who pulls the image can extract the earlier layer and read the token. A BuildKit secret mount (`RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci --omit=dev`) makes the file available to that one command without writing it to any layer; keeping it confined to a build stage that is not shipped also works. The exposed token should be revoked and replaced as well.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-22",
    track: "devops",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["kubernetes", "high availability"],
    prompt:
      "A Java service takes up to 2 minutes to start. Its liveness probe (`initialDelaySeconds: 10`, `periodSeconds: 10`, `failureThreshold: 3`) keeps killing it before it has started, and the pod ends up in `CrashLoopBackOff`. What is the best fix?",
    options: [
      "Remove the readiness probe, because it is readiness failures that make the kubelet restart the container",
      "Set `restartPolicy: Never` on the pod, so that the kubelet stops restarting the container while it starts",
      "Add a startup probe that allows at least 2 minutes; liveness and readiness checks begin only after it succeeds",
      "Raise `replicas`, so that at least one pod finishes starting before the liveness probe kills the others",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "liveness failures restart the container",
      "slow-starting containers need a startup probe",
      "liveness and readiness checks wait until the startup probe succeeds",
      "failureThreshold × periodSeconds sets the startup allowance",
      "liveness can then stay strict to catch hangs after start-up",
    ],
    redFlags: ["readiness probe failures restart containers", "disabling restarts fixes slow start-up"],
    rubric: {
      criteria: [
        {
          name: "Probe semantics",
          weight: 5,
          keywords: ["startup probe", "liveness", "readiness", "restart", "kubelet"],
        },
        {
          name: "Configuration",
          weight: 4,
          keywords: ["failurethreshold", "periodseconds", "initialdelayseconds", "crashloopbackoff", "slow start"],
        },
      ],
    },
    modelAnswer:
      "With these settings the liveness probe starts failing about 10 seconds in, and the kubelet restarts the container after three failures, long before the service is up, so it never manages to start. A startup probe (for example `failureThreshold: 15` with `periodSeconds: 10`) gives the container up to two and a half minutes, a little more than its slowest start, and Kubernetes runs no liveness or readiness checks until it succeeds, so the liveness probe can stay strict for hangs later on. Readiness failures only stop traffic and never restart a container, a Deployment's pods must use `restartPolicy: Always`, and extra replicas would all be killed in the same way.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-23",
    track: "devops",
    level: "junior",
    difficulty: 5,
    type: "theory",
    tags: ["kubernetes", "release strategies"],
    prompt:
      "A Deployment has `replicas: 4` and a rolling update strategy with `maxSurge: 1` and `maxUnavailable: 0`. You change its container image. How does the rollout proceed?",
    options: [
      "It removes one old pod first and then starts a new one in its place, so briefly only three pods serve traffic",
      "It adds one new pod, waits until it is Ready, then removes one old pod, and repeats, never going below four Ready pods",
      "It starts four new pods at once, then removes the four old pods only when every new pod has become Ready",
      "It deletes all four old pods and then creates four new ones, because `maxUnavailable: 0` turns off rolling updates",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "maxSurge is how many pods may exist above the desired count",
      "maxUnavailable is how many may be unavailable below it",
      "with maxUnavailable 0, serving capacity never drops",
      "new pods must pass readiness before old ones are removed",
      "a new version that never becomes Ready stalls the rollout",
    ],
    redFlags: ["maxUnavailable: 0 disables rolling updates", "readiness does not affect rollout progress"],
    rubric: {
      criteria: [
        {
          name: "Rollout parameters",
          weight: 5,
          keywords: ["maxsurge", "maxunavailable", "replicas", "rolling update", "ready"],
        },
        {
          name: "Safety",
          weight: 4,
          keywords: ["readiness", "capacity", "stall", "rollback", "rollout undo"],
        },
      ],
    },
    modelAnswer:
      "`maxSurge: 1` lets the Deployment run at most one pod above the desired four, and `maxUnavailable: 0` means the number of available pods may never drop below four. So it creates one new pod, waits until it is Ready, scales the old ReplicaSet down by one, and repeats until all four pods run the new image. If a new pod never becomes Ready, the rollout simply stalls with the old pods still serving, and `kubectl rollout undo` returns to the previous revision. Removing old pods first is what `maxSurge: 0, maxUnavailable: 1` would do, and replacing everything at once is the `Recreate` strategy.",
    followUpIds: [],
  },
  {
    id: "qb-devops-junior-11",
    track: "devops",
    level: "junior",
    difficulty: 5,
    type: "debugging",
    tags: ["devops", "logging"],
    prompt:
      "A disk is full. The app is still running and writing to its log. Why did deleting the log free no space, and what would free it?\n\n```console\n$ df -h /var\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/sdb1        50G   50G     0 100% /var\n$ sudo rm /var/log/app/app.log   # a 30 GB file\n$ df -h /var\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/sdb1        50G   50G     0 100% /var\n```",
    options: [
      "`df` caches its figures and refreshes them every few hours, so the space will appear later on its own",
      "The app still has the deleted file open; its space is freed only once that handle closes, e.g. on a restart",
      "`rm` moves files to a trash directory on the same disk, so the space comes back only once the trash is emptied",
      "Deleted blocks are released only after running `sync` and then unmounting and remounting the filesystem",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "a deleted file's space is freed only when no process has it open",
      "lsof +L1 lists deleted files that are still open",
      "restart or signal the process so it reopens its log",
      "truncate the file instead of deleting it",
      "use log rotation",
    ],
    redFlags: ["df is out of date", "rm moves files to a trash folder"],
    rubric: {
      criteria: [
        {
          name: "Cause",
          weight: 5,
          keywords: ["open file", "file descriptor", "deleted", "inode", "last handle", "lsof"],
        },
        {
          name: "Fix",
          weight: 4,
          keywords: ["restart", "reopen", "truncate", "logrotate", "copytruncate"],
        },
      ],
    },
    modelAnswer:
      "On Linux, `rm` removes the file's name, but its data blocks are freed only when no process still has the file open. The running app keeps writing through its open handle to the deleted 30 GB file, so `df` reports the same usage; `lsof +L1` lists such deleted-but-open files. Restarting the app, or signalling it to reopen its log, releases the space; an already-deleted file can also be emptied through the open handle (`: > /proc/<pid>/fd/<n>`), and truncating the file (for example `truncate -s 0 app.log`) instead of deleting it frees the space straight away. Log rotation, or logging to stdout in containers, prevents the problem.",
    followUpIds: [],
  },
];
