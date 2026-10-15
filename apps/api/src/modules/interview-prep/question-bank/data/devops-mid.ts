import type { BankQuestion } from "../types";

export const QUESTIONS: BankQuestion[] = [
  // ─── Difficulty 1 ───────────────────────────────────────────────────────
  {
    id: "qb-devops-mid-01",
    track: "devops",
    level: "mid",
    difficulty: 1,
    type: "debugging",
    tags: ["kubernetes", "orchestration"],
    prompt:
      "Pods created by the `web` Deployment are Running and Ready, but the `web` Service has no endpoints and requests to it fail. Based on these excerpts, what is wrong?\n\n```yaml\n# Service \"web\"\nspec:\n  selector:\n    app: web\n  ports:\n    - port: 80\n      targetPort: 8080\n# Pod template in the Deployment\nmetadata:\n  labels:\n    app: web-frontend\n    tier: frontend\n```",
    options: [
      "targetPort must be the same as port, so both should be set to 8080 for traffic to reach the pods",
      "A selector must list every label on the pod, so the Service also needs `tier: frontend` in its selector",
      "The selector matches no pods: its `app: web` is not equal to the pods' `app: web-frontend` label",
      "A Service finds pods through their Deployment, so it needs the Deployment's name instead of a selector",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "Services pick pods with a label selector",
      "every selector label must be on the pod with exactly the same value",
      "extra labels on the pod do not matter",
      "an empty EndpointSlice means no Ready pod matches",
      "confirm with kubectl get pods -l app=web",
      "port and targetPort may differ",
    ],
    redFlags: ["a selector must list every pod label", "port and targetPort must be equal"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["selector", "labels", "match", "endpoints", "endpointslice"] },
        { name: "Debugging", weight: 3, keywords: ["kubectl get pods -l", "describe service", "targetport", "ready"] },
      ],
    },
    modelAnswer:
      "A Service sends traffic to the Ready pods whose labels match its selector, and a pod matches only if it carries every selector label with exactly the same value; extra labels such as `tier: frontend` do not matter. Here `app: web` is not equal to `app: web-frontend`, so no pod matches and the Service's EndpointSlice stays empty. `kubectl get pods -l app=web` returning nothing confirms it; fix the selector or the pod labels so they agree. Port and targetPort may differ: port is what clients connect to, targetPort is the container's port.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-02",
    track: "devops",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["devops", "network policies"],
    prompt:
      "From an application server you test two ports on a host in the same private network. A connection to 10.0.2.15:5432 hangs and eventually fails with \"Connection timed out\", while one to 10.0.2.15:6379 fails at once with \"Connection refused\". What do these results most likely mean?",
    options: [
      "6379 is blocked by a security group that drops its packets, while 5432 is open but the database is slow to answer",
      "Packets to 5432 are silently dropped (e.g. by a firewall); 6379 reached the host, but nothing is listening on it",
      "Both are DNS failures: the client's resolver has cached a different address for each of the two ports",
      "Both ports require TLS, so each failure is the same TLS handshake error, reported in two different ways",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "refused means a TCP reset came back: host reachable, no listener (or a reject rule)",
      "a timeout means no reply: packets dropped or no route",
      "security groups and most firewalls drop silently",
      "check firewall or security group rules for 5432",
      "check the listener on the host with ss -ltnp",
    ],
    redFlags: ["a timeout means the service is slow", "a refusal means a firewall dropped the packet"],
    rubric: {
      criteria: [
        { name: "Refused", weight: 4, keywords: ["reset", "rst", "no listener", "reachable", "port closed"] },
        { name: "Timeout", weight: 4, keywords: ["dropped", "firewall", "security group", "no reply", "route"] },
        { name: "Next steps", weight: 2, keywords: ["ss -ltnp", "bind address", "rules", "nc", "tcpdump"] },
      ],
    },
    modelAnswer:
      "\"Connection refused\" means a TCP reset came back: the host was reachable, but no process is listening on that port (or a firewall rule actively rejects it). A timeout means no reply arrived at all, which usually means a firewall, security group or network ACL is silently dropping the packets, or there is no route. So check the security group or firewall rules for 5432, and on the host check with `ss -ltnp` whether the service for 6379 is running and bound to the right address. A security group that drops packets produces a timeout, never an immediate refusal.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-03",
    track: "devops",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["tracing", "opentelemetry", "microservices"],
    prompt:
      "You add OpenTelemetry to two services. Checkout calls Payments over HTTP, but the tracing backend shows every checkout as two separate traces, one per service, instead of one trace with the Payments spans nested under Checkout's. What is the most likely cause?",
    options: [
      "Sampling is set to 100%, so the backend stores the spans of each service as a separate trace of its own",
      "The services' clocks differ slightly, so the backend cannot place their spans in the same trace",
      "Spans can only be joined into one trace when both services are written with the same language and SDK",
      "Checkout's HTTP call does not send the trace context (`traceparent` header), so Payments starts a new trace",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "spans join a trace through a shared trace id",
      "context propagation on outgoing calls",
      "W3C traceparent header is the default propagator",
      "instrument the HTTP client as well as the server",
      "both sides must use compatible propagators",
    ],
    redFlags: ["clock skew splits traces", "services must use the same language"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["propagation", "traceparent", "trace id", "context", "header"] },
        { name: "Fix", weight: 3, keywords: ["http client", "instrumentation", "inject", "extract", "propagator"] },
      ],
    },
    modelAnswer:
      "Spans belong to the same trace when they share a trace id, and that id travels between services only through context propagation, by default as the W3C `traceparent` HTTP header. If Checkout's HTTP client is not instrumented (or the context is not injected manually), Payments receives no parent context and starts a new trace. Instrument the outgoing client, or inject and extract the context explicitly, with the same propagator on both sides. Clock skew only distorts how spans are drawn on the timeline; it does not split traces, and OpenTelemetry works across languages.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-04",
    track: "devops",
    level: "mid",
    difficulty: 1,
    type: "theory",
    tags: ["metrics", "slos/slas", "incident management"],
    prompt:
      "The on-call engineer is paged several nights a week by an alert on \"CPU above 80% for 5 minutes\" on the API hosts. Each time, error rates and latency are normal and nobody needs to do anything. What is the best change?",
    options: [
      "Page on user-facing symptoms such as errors and latency against the SLO; keep CPU on dashboards or as a ticket",
      "Raise the threshold to 95% for 15 minutes, so that the page only fires when the hosts are close to saturation",
      "Keep the alert but send it to a shared channel, so whoever is awake can decide whether it needs any action",
      "Add a matching alert on memory usage, so that the on-call engineer has more context whenever CPU pages",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "every page should be actionable and urgent",
      "alert on symptoms users feel: errors and latency",
      "tie paging alerts to SLOs",
      "causes such as CPU belong on dashboards or tickets",
      "alert fatigue makes real pages get ignored",
    ],
    redFlags: ["more alerts are safer", "tune the threshold until it stops firing"],
    rubric: {
      criteria: [
        { name: "Symptom-based paging", weight: 5, keywords: ["symptom", "error rate", "latency", "slo", "user-facing"] },
        { name: "Alert hygiene", weight: 3, keywords: ["actionable", "alert fatigue", "dashboard", "ticket", "noise"] },
      ],
    },
    modelAnswer:
      "A page should mean that users are affected, or soon will be, and that someone must act now. High CPU on its own is a cause, not a symptom: the hosts here run hot without harming anyone, so paging on it only trains the on-call engineer to ignore alerts. Page on what users feel, such as error rate and latency measured against the SLO, and keep CPU on dashboards or as a low-urgency ticket for capacity planning. Raising the threshold still pages on a cause, and may fire too late or still for nothing.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-05",
    track: "devops",
    level: "mid",
    difficulty: 1,
    type: "coding",
    tags: ["docker", "containers", "go"],
    prompt:
      "Which statement about the image built from this Dockerfile is correct?\n\n```dockerfile\nFROM golang:1.26 AS build\nWORKDIR /src\nCOPY . .\nRUN CGO_ENABLED=0 go build -o /out/api ./cmd/api\n\nFROM gcr.io/distroless/static-debian12\nCOPY --from=build /out/api /api\nUSER nonroot\nENTRYPOINT [\"/api\"]\n```",
    options: [
      "It contains the layers of both stages, but the files from the build stage are hidden from the running container",
      "It also contains the source code, because `COPY . .` ran in an earlier instruction of the same Dockerfile",
      "It contains only the distroless base layers and the compiled binary; the Go toolchain and source stay behind",
      "It cannot start, because a binary built in the golang image needs the Go toolchain installed to run",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "only the last stage becomes the image",
      "COPY --from copies selected files out of an earlier stage",
      "compiler, source and build cache are left behind",
      "smaller image and smaller attack surface",
      "a static binary (CGO_ENABLED=0) runs on a distroless static base",
    ],
    redFlags: ["the final image includes every stage", "Go binaries need the Go toolchain at runtime"],
    rubric: {
      criteria: [
        { name: "Multi-stage builds", weight: 5, keywords: ["stage", "final stage", "copy --from", "build stage", "layers"] },
        { name: "Benefits", weight: 3, keywords: ["smaller", "attack surface", "distroless", "static binary", "non-root"] },
      ],
    },
    modelAnswer:
      "In a multi-stage build only the last stage becomes the image; earlier stages are just build environments that later stages can copy from. `COPY --from=build` takes only the compiled binary, so the final image holds the distroless base layers plus that one file, without the Go toolchain, source code or build cache, which makes it much smaller and leaves an attacker few tools to use. With CGO_ENABLED=0 the Go binary is statically linked native code, so it needs no Go installation or C library at runtime. The build stage's layers are not hidden inside the final image; they are simply not part of it.",
    followUpIds: [],
  },

  // ─── Difficulty 2 ───────────────────────────────────────────────────────
  {
    id: "qb-devops-mid-06",
    track: "devops",
    level: "mid",
    difficulty: 2,
    type: "debugging",
    tags: ["devops", "logging"],
    prompt:
      "The /var volume on a VM is full and the app can no longer write. Yesterday someone ran `rm` on a 38 GB log file that the still-running app was writing to. What explains this output, and what frees the space?\n\n```\n$ df -h /var\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/nvme1n1     50G   50G     0 100% /var\n$ sudo du -sh /var\n12G     /var\n```",
    options: [
      "du skips files it cannot read, so run it with --apparent-size to count the space other users' files take",
      "The filesystem has run out of inodes rather than blocks, so deleting many small files will free the space",
      "df caches usage until the volume is remounted, so remount /var or run fsck to make it show the real figure",
      "The app still holds the deleted file open, so its blocks stay in use; find it with `lsof +L1` and restart it",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "rm removes the directory entry; blocks are freed when the last open handle closes",
      "du walks directory entries, df reports filesystem blocks",
      "lsof +L1 lists deleted files that are still open",
      "restart or signal the process, or truncate the file through /proc/<pid>/fd",
      "use logrotate instead of deleting live log files",
    ],
    redFlags: ["df is wrong or cached", "reboot the server first"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["open file", "file descriptor", "deleted", "unlink", "still held"] },
        { name: "Fix", weight: 4, keywords: ["lsof", "+l1", "restart", "truncate", "/proc", "logrotate"] },
      ],
    },
    modelAnswer:
      "`rm` only removes the file's directory entry; the data blocks are freed when the last process with the file open closes it, so the app that is still writing keeps the 38 GB allocated. `du` adds up the files it can reach through directories and no longer sees the deleted one, while `df` reports the blocks actually in use, hence the gap. `lsof +L1` (or `lsof | grep deleted`) shows the process; restarting it, or telling it to reopen its logs, releases the space, and `: > /proc/<pid>/fd/<n>` can truncate the file without a restart. Rotate logs with logrotate rather than deleting live files; inode exhaustion would show in `df -i`, not as 100% block usage.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-07",
    track: "devops",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["dns", "load balancers"],
    prompt:
      "On Thursday you will move api.example.com to a new load balancer. Its DNS record currently has a TTL of 86,400 seconds (one day). How do you keep the time that clients still reach the old load balancer after the switch as short as possible?",
    options: [
      "On Thursday, switch the record and lower its TTL to 60 seconds in the same change, so caches update within a minute",
      "On Thursday, switch the record, having cut its TTL to 60 seconds a day or more earlier; keep the old load balancer up a while",
      "On Thursday, switch the record and flush the DNS cache on your own machines and servers, so every client sees it at once",
      "On Thursday, switch the record; recursive resolvers are notified of the change and drop their cached copy straight away",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "resolvers cache an answer for the TTL it had when they fetched it",
      "lower the TTL at least one old TTL period before the switch",
      "keep the old endpoint serving until cached answers expire",
      "raise the TTL again afterwards",
      "some clients cache longer than the TTL, so watch traffic on the old endpoint",
    ],
    redFlags: ["a new TTL applies to answers already cached", "resolvers are told when a record changes"],
    rubric: {
      criteria: [
        { name: "Caching", weight: 5, keywords: ["ttl", "cache", "resolver", "expire", "in advance"] },
        { name: "Cut-over plan", weight: 4, keywords: ["lower ttl", "old endpoint", "keep serving", "raise ttl", "monitor"] },
      ],
    },
    modelAnswer:
      "Recursive resolvers cache an answer for the TTL it carried when they fetched it, so a resolver that looked the name up on Wednesday may keep the old answer until Thursday whatever you change later. Lower the TTL to about a minute at least one old TTL (a day) before the move, so that by Thursday every cached copy is short-lived, then switch the record and keep the old load balancer serving until its traffic dies away. Afterwards, raise the TTL again to cut lookup load. Resolvers are not notified of changes (DNS NOTIFY is only for secondary authoritative servers), and flushing your own caches does nothing for anyone else.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-08",
    track: "devops",
    level: "mid",
    difficulty: 2,
    type: "behavioral",
    tags: ["secrets management", "incident management", "security", "behavioral"],
    prompt:
      "While reviewing recent changes, you notice that a commit merged to main an hour ago contains a long-lived cloud access key with write access to production storage. The repository is private. What do you do first?",
    options: [
      "Rewrite the history to remove the commit and force-push main, so the key no longer exists in the repository",
      "Revoke or rotate the key now, check the audit logs for any use of it and alert the team; clean the history later",
      "Leave it for now, as the repository is private, and raise a ticket to move the key into a secrets manager next sprint",
      "Message the author privately and ask them to remove the key in a follow-up pull request when they have time",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "treat a pushed secret as compromised",
      "revoke or rotate the credential first",
      "check audit logs for any use of the key",
      "follow the incident process and tell the team",
      "prevent a repeat: secret scanning, pre-commit hooks, short-lived credentials",
    ],
    redFlags: ["a private repository makes it safe", "rewriting history is enough"],
    rubric: {
      criteria: [
        { name: "Containment", weight: 5, keywords: ["revoke", "rotate", "compromised", "immediately", "disable"] },
        { name: "Investigation", weight: 3, keywords: ["audit log", "cloudtrail", "access", "incident", "notify"] },
        { name: "Prevention", weight: 2, keywords: ["secret scanning", "pre-commit", "secrets manager", "short-lived"] },
      ],
    },
    modelAnswer:
      "Once a secret has been pushed, assume it is compromised: it already sits in clones, CI caches and possibly logs, and anyone with read access to the repository can use it. Revoking or rotating the key is the only step that removes the risk, so do it first, then check the cloud audit logs for any use of the key in the past hour and raise it through the incident process. Cleaning the history, moving the credential to a secrets manager (ideally short-lived credentials) and turning on secret scanning come afterwards. Force-pushing first leaves a valid key in every existing copy.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-09",
    track: "devops",
    level: "mid",
    difficulty: 2,
    type: "theory",
    tags: ["aws", "iam"],
    prompt:
      "An IAM role's identity policy allows `s3:GetObject` on `arn:aws:s3:::reports/*`. The `reports` bucket's policy denies `s3:GetObject` to every principal when the request does not come through a specific VPC endpoint. A job using the role from outside that endpoint gets AccessDenied. Why?",
    options: [
      "An explicit Deny in any policy that applies to the request overrides every Allow, so the bucket policy's Deny wins",
      "Bucket policies always take precedence over identity policies, so only the bucket policy is evaluated for S3",
      "The role also needs `s3:ListBucket`, because S3 only evaluates GetObject after a ListBucket check succeeds",
      "The most specific policy wins, and the bucket policy names the bucket while the identity policy uses a wildcard",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "requests are denied unless a policy allows them",
      "an explicit Deny overrides any Allow",
      "identity and resource policies are evaluated together",
      "the VPC endpoint condition limits the network path",
      "SCPs and permission boundaries can also deny",
    ],
    redFlags: ["the most specific policy wins", "resource policies simply take precedence"],
    rubric: {
      criteria: [
        { name: "Evaluation logic", weight: 5, keywords: ["explicit deny", "overrides", "allow", "implicit deny", "evaluated together"] },
        { name: "Policy types", weight: 3, keywords: ["identity policy", "bucket policy", "resource policy", "vpc endpoint", "condition"] },
      ],
    },
    modelAnswer:
      "AWS evaluates every policy that applies to a request together: anything not allowed is implicitly denied, and an explicit Deny in any of them overrides any number of Allows. The role's policy does allow GetObject, but the bucket policy's Deny matches because the request did not come through the required VPC endpoint, so the result is AccessDenied. Policies are not ranked by specificity or by type; a bucket policy can also grant access on its own. Missing `s3:ListBucket` only turns a request for a non-existent key into 403 instead of 404.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-10",
    track: "devops",
    level: "mid",
    difficulty: 2,
    type: "system-design",
    tags: ["logging", "kubernetes"],
    prompt:
      "Your company runs about 150 services on Kubernetes. Engineers debug with `kubectl logs`, and logs disappear when pods are rescheduled or nodes are replaced. Which design for centralised logging is most appropriate?",
    options: [
      "Each service writes log files to a shared NFS volume mounted into every pod, and engineers search it with grep",
      "Raise the kubelet's log rotation limits so each node keeps a week of container logs, and keep using kubectl logs",
      "Log JSON to stdout; a node agent (DaemonSet) ships it, with pod metadata, to a central store with retention rules",
      "Every service logs each request at DEBUG and sends it synchronously to the log store, so that no line is ever lost",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "log to stdout and stderr as structured JSON",
      "a DaemonSet agent such as Fluent Bit or the OpenTelemetry Collector tails container logs",
      "enrich with namespace, pod and label metadata",
      "central, indexed store (e.g. Loki or Elasticsearch) with retention tiers",
      "request or trace ids to correlate logs across services",
    ],
    redFlags: ["read logs by exec-ing into pods", "keep every DEBUG line forever"],
    rubric: {
      criteria: [
        { name: "Collection", weight: 5, keywords: ["stdout", "daemonset", "agent", "fluent bit", "node"] },
        { name: "Storage and search", weight: 3, keywords: ["central", "index", "retention", "loki", "elasticsearch"] },
        { name: "Usefulness", weight: 2, keywords: ["structured", "json", "metadata", "correlation id", "trace id"] },
      ],
    },
    modelAnswer:
      "Containers should write structured (JSON) logs to stdout and stderr, which the container runtime stores on the node; one agent per node, run as a DaemonSet (for example Fluent Bit or the OpenTelemetry Collector), tails those files, adds namespace and pod metadata and ships them to a central store such as Loki or Elasticsearch. Logs then outlive pods and nodes, can be searched across services and are kept according to retention policies, and request or trace ids let you follow one request between services. Node-local logs vanish with the node, a shared NFS volume becomes a bottleneck with no indexing, and synchronous DEBUG logging couples every request to the log store and multiplies cost.",
    followUpIds: [],
  },

  // ─── Difficulty 3 ───────────────────────────────────────────────────────
  {
    id: "qb-devops-mid-11",
    track: "devops",
    level: "mid",
    difficulty: 3,
    type: "debugging",
    tags: ["terraform", "iac", "aws"],
    prompt:
      "You remove \"orders\" from the list below. Instead of only deleting the orders queue, `terraform plan` wants to replace `this[0]` and `this[1]` and destroy `this[2]`. Why, and what is the fix?\n\n```hcl\nvariable \"queues\" {\n  type    = list(string)\n  default = [\"orders\", \"emails\", \"reports\"]\n}\n\nresource \"aws_sqs_queue\" \"this\" {\n  count = length(var.queues)\n  name  = \"app-${var.queues[count.index]}\"\n}\n```",
    options: [
      "The plan only looks alarming: when applied, Terraform works out that just the orders queue needs to be deleted",
      "The state still holds the old list, so run `terraform refresh` first and the plan will shrink to a single delete",
      "Add `lifecycle { create_before_destroy = true }`, so the new queues exist before the old ones are destroyed",
      "count tracks instances by position, so later queues shift index; use `for_each = toset(var.queues)` instead",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "count addresses instances by list index",
      "removing an element shifts every later index and changes its arguments",
      "a changed queue name forces replacement",
      "for_each addresses instances by a stable key",
      "move existing state entries with moved blocks or terraform state mv",
    ],
    redFlags: ["plan output is cosmetic", "create_before_destroy prevents data loss"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["count", "index", "shift", "position", "replace"] },
        { name: "Fix", weight: 4, keywords: ["for_each", "toset", "stable key", "moved", "state mv"] },
      ],
    },
    modelAnswer:
      "With count, instances are addressed by list position: after removing \"orders\", index 0 becomes emails and index 1 becomes reports, so their names change (which forces replacement and loses queued messages) and index 2 no longer exists. Using `for_each = toset(var.queues)` with `name = \"app-${each.key}\"` addresses each queue by its name, so removing one only destroys that one. Move the existing instances to their new addresses first, with `moved` blocks or `terraform state mv`, so the switch itself does not recreate anything. create_before_destroy only changes the order of the replacements, and a refresh does not change how instances are addressed.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-12",
    track: "devops",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["kubernetes", "release strategies"],
    prompt:
      "A Deployment has 4 replicas and a rolling update strategy with `maxSurge: 1` and `maxUnavailable: 0`. You roll out a new image whose readiness probe never passes. What happens?",
    options: [
      "Kubernetes rolls back to the previous ReplicaSet automatically once progressDeadlineSeconds has passed",
      "After progressDeadlineSeconds the old pods are replaced anyway, leaving the Deployment with 4 unready pods",
      "One new pod starts but never becomes Ready, the 4 old pods keep serving, and the rollout stalls at that point",
      "All 4 old pods are terminated at once and replaced, because maxUnavailable: 0 turns off the rolling strategy",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "maxUnavailable 0 keeps full ready capacity during the rollout",
      "maxSurge 1 allows one extra pod",
      "old pods are only removed once new ones are available",
      "progressDeadlineSeconds marks the rollout as failed but does not roll back",
      "kubectl rollout undo or the CD tool performs the rollback",
    ],
    redFlags: ["Deployments roll back automatically", "readiness probes do not affect rollouts"],
    rubric: {
      criteria: [
        { name: "Rollout mechanics", weight: 5, keywords: ["maxsurge", "maxunavailable", "readiness", "available", "replicaset"] },
        { name: "Failure handling", weight: 4, keywords: ["progressdeadlineseconds", "progressdeadlineexceeded", "stall", "rollout undo", "no automatic rollback"] },
      ],
    },
    modelAnswer:
      "With maxSurge 1 the controller creates one new pod beyond the 4 replicas, and with maxUnavailable 0 it may only scale the old ReplicaSet down once a new pod is Ready and available. The new pod never becomes Ready, so the rollout stops there while the 4 old pods keep serving traffic. After progressDeadlineSeconds the Deployment reports Progressing=False with reason ProgressDeadlineExceeded, which `kubectl rollout status` and CD tools can act on, but Kubernetes itself does not roll back; you run `kubectl rollout undo` or fix the image.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-13",
    track: "devops",
    level: "mid",
    difficulty: 3,
    type: "theory",
    tags: ["cost optimization", "fault tolerance", "scaling"],
    prompt:
      "Spot (preemptible) VMs cost much less than on-demand ones, but the cloud provider can reclaim them at short notice. Which of these workloads are good candidates for spot capacity? Select all that apply.",
    options: [
      "CI build runners, where a job that is interrupted can simply be retried",
      "The single primary node of a self-managed PostgreSQL database",
      "Extra stateless web replicas behind a load balancer, above an on-demand baseline",
      "Batch jobs that checkpoint their progress and can resume on another node",
      "A six-hour nightly job without checkpoints that must finish before morning",
    ],
    correctOptionIndex: 2,
    correctOptionIndices: [0, 2, 3],
    multiSelect: true,
    expectedPoints: [
      "spot suits interruptible, stateless or checkpointed work",
      "keep an on-demand baseline for the capacity you must have",
      "handle the interruption notice: drain and shut down gracefully",
      "spread across instance types and zones",
      "never put a single stateful primary on spot",
    ],
    redFlags: ["spot is fine for anything that has backups", "spot capacity is guaranteed"],
    rubric: {
      criteria: [
        { name: "Suitability", weight: 5, keywords: ["interruptible", "stateless", "checkpoint", "retry", "baseline"] },
        { name: "Risk handling", weight: 3, keywords: ["interruption notice", "drain", "graceful", "diversify", "on-demand"] },
      ],
    },
    modelAnswer:
      "Spot capacity fits work that tolerates losing a machine at short notice: CI runners whose jobs can be retried, stateless replicas behind a load balancer where an on-demand baseline still covers normal traffic, and batch jobs that checkpoint and resume elsewhere. A single database primary is the opposite, because reclaiming it means an outage and possibly lost writes. A long job without checkpoints that has a deadline can lose hours of work with each interruption and miss the deadline. Handle the interruption notice by draining nodes gracefully, and spread across instance types and zones so that one reclaim wave does not take everything.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-14",
    track: "devops",
    level: "mid",
    difficulty: 3,
    type: "system-design",
    tags: ["high availability", "load balancers", "fault tolerance"],
    prompt:
      "A customer-facing web app runs on one VM, with its PostgreSQL database on the same machine. It must survive the loss of a whole availability zone with at most a few minutes of disruption. Which design meets this most directly?",
    options: [
      "Move to a larger VM with faster disks and take hourly snapshots, so it can be restored in another zone if needed",
      "Run two app VMs behind a load balancer in one zone, with the database on a third VM with nightly backups in that zone",
      "Point a round-robin DNS record at two VMs in different zones, each running the app and its own database copy",
      "Stateless instances in 2+ zones behind a health-checked load balancer, and a managed database with a cross-zone standby",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "spread instances over at least two availability zones",
      "load balancer health checks stop traffic to failed instances",
      "stateless app tier, with sessions in a shared store",
      "managed database with a synchronous standby and automatic failover",
      "test the failover regularly",
    ],
    redFlags: ["backups are the same as high availability", "redundancy within one zone survives a zone outage"],
    rubric: {
      criteria: [
        { name: "App tier", weight: 4, keywords: ["availability zone", "multi-az", "autoscaling", "health check", "stateless"] },
        { name: "Data tier", weight: 4, keywords: ["standby", "failover", "synchronous", "replication", "managed database"] },
        { name: "Trade-offs", weight: 2, keywords: ["rto", "rpo", "restore", "test failover"] },
      ],
    },
    modelAnswer:
      "Surviving a zone failure needs every tier running in at least two zones: stateless app instances (sessions in a shared store) in an autoscaling group across zones behind a load balancer whose health checks stop sending traffic to dead instances, and a managed database with a synchronous standby in another zone that fails over automatically within a minute or two. Snapshots are backups, not availability: restoring takes far longer than a few minutes and loses up to an hour of data. Redundancy inside one zone fails with that zone, and round-robin DNS has no health checks and leaves two diverging databases.",
    followUpIds: [],
  },

  // ─── Difficulty 4 ───────────────────────────────────────────────────────
  {
    id: "qb-devops-mid-15",
    track: "devops",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["terraform", "iac", "devops"],
    prompt:
      "Your pipeline runs `terraform plan` on each pull request for review, then `terraform apply -auto-approve` on main after the merge. A reviewed plan showed a single change, yet the apply also deleted a security group rule. How should the pipeline change?",
    options: [
      "Add `-refresh=false` to the apply, so Terraform stops looking for differences outside the reviewed change",
      "Run `terraform validate` before the apply, so that it rejects any change that was not part of the reviewed plan",
      "Commit the provider lock file, because a provider upgrade is the only way an apply can differ from its plan",
      "Save the plan on main with `plan -out`, approve it, and apply that file; Terraform rejects it if the state changed",
    ],
    correctOptionIndex: 3,
    expectedPoints: [
      "apply without a plan file plans again against the current state",
      "state and real infrastructure can change between review and merge (other merges, drift)",
      "terraform plan -out and apply the saved plan file",
      "approval of the saved plan on the target branch",
      "serialise runs; a stale saved plan is rejected",
    ],
    redFlags: ["the PR plan is what gets applied", "-refresh=false prevents surprises"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 4, keywords: ["re-plan", "drift", "other merges", "state changed", "auto-approve"] },
        { name: "Fix", weight: 5, keywords: ["plan -out", "saved plan", "apply the plan file", "approval", "stale"] },
      ],
    },
    modelAnswer:
      "`terraform apply` without a plan file makes a fresh plan against whatever the state and the real infrastructure are at that moment, so other merged changes or manual drift since the pull request was reviewed get applied without anyone seeing them. Run the plan on main with `-out`, have someone approve that saved plan, and run `terraform apply` with that file, which performs exactly the planned actions and refuses with a stale-plan error if the state has changed since. `validate` only checks syntax and internal consistency, and `-refresh=false` hides drift rather than preventing it.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-16",
    track: "devops",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["kubernetes", "security", "containers"],
    prompt:
      "You are hardening the pod of a stateless web API on Kubernetes. Which container `securityContext` settings reduce what an attacker can do after compromising the app? Select all that apply.",
    options: [
      "`runAsNonRoot: true`, with the image's USER set to an unprivileged user id",
      "`allowPrivilegeEscalation: false`, so setuid binaries cannot gain more privileges",
      "`privileged: true`, so that host security tooling can inspect the container",
      "`readOnlyRootFilesystem: true`, with an emptyDir volume for temporary files",
      "`capabilities.add: [\"SYS_ADMIN\"]`, so the app can mount its own config volumes",
    ],
    correctOptionIndex: 1,
    correctOptionIndices: [0, 1, 3],
    multiSelect: true,
    expectedPoints: [
      "run as a non-root user",
      "block privilege escalation (no_new_privs)",
      "read-only root filesystem with explicit writable volumes",
      "drop all capabilities and add back only what is needed",
      "enforce with the Pod Security Admission restricted profile",
    ],
    redFlags: ["privileged mode helps monitoring", "containers are a strong security boundary by default"],
    rubric: {
      criteria: [
        { name: "Hardening settings", weight: 5, keywords: ["runasnonroot", "allowprivilegeescalation", "readonlyrootfilesystem", "drop all", "capabilities"] },
        { name: "Enforcement", weight: 3, keywords: ["pod security admission", "restricted", "policy", "least privilege"] },
      ],
    },
    modelAnswer:
      "Running as a non-root user, setting allowPrivilegeEscalation to false (which stops setuid binaries and similar tricks gaining privileges) and making the root filesystem read-only, with an emptyDir for scratch space, all shrink what an attacker can do from inside the container. `privileged: true` does the opposite: it gives the container every capability and access to host devices, making escape to the node easy. SYS_ADMIN is likewise one of the broadest capabilities; the hardened pattern is to drop ALL capabilities and add back only what the app needs, and to enforce this with the Pod Security Admission restricted profile.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-17",
    track: "devops",
    level: "mid",
    difficulty: 4,
    type: "theory",
    tags: ["aws", "cost optimization"],
    prompt:
      "Workloads in the private subnets of an AWS VPC move several terabytes a day to and from S3 in the same region. Cost reports show that most of the network bill is NAT gateway data processing for this traffic. Which change removes that cost without exposing the instances to the internet?",
    options: [
      "Add an S3 gateway VPC endpoint to the private route tables, so S3 traffic no longer goes through the NAT gateway",
      "Move the instances into public subnets with public IPs, so that they reach S3 through the internet gateway instead",
      "Add a second NAT gateway in another availability zone, so that the S3 traffic is split between the two gateways",
      "Enable S3 Transfer Acceleration on the buckets, so uploads go through edge locations instead of the NAT gateway",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "find the traffic source from cost allocation or VPC flow logs",
      "gateway VPC endpoints for S3 keep traffic on the AWS network",
      "endpoints are added as routes in the private subnets' route tables",
      "endpoint and bucket policies can restrict which buckets are reachable",
      "instances stay private",
    ],
    redFlags: ["give instances public IPs to save money", "more NAT gateways reduce cost"],
    rubric: {
      criteria: [
        { name: "Fix", weight: 5, keywords: ["vpc endpoint", "gateway endpoint", "route table", "s3", "bypass nat"] },
        { name: "Cost awareness", weight: 3, keywords: ["nat gateway", "data processing", "flow logs", "cost allocation"] },
        { name: "Security", weight: 2, keywords: ["private subnet", "endpoint policy", "no public ip"] },
      ],
    },
    modelAnswer:
      "A gateway VPC endpoint for S3 adds a route for S3's address ranges to the private subnets' route tables, so traffic to S3 in that region goes straight to S3 over the AWS network instead of through the NAT gateway, and the instances stay private. An endpoint policy, or a bucket policy that requires the endpoint, can also limit which buckets are reachable. Public subnets would expose the instances, a second NAT gateway still processes the same data, and Transfer Acceleration uses public endpoints, so the traffic would still leave through NAT.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-18",
    track: "devops",
    level: "mid",
    difficulty: 4,
    type: "system-design",
    tags: ["terraform", "iac"],
    prompt:
      "Your team manages dev, staging and production infrastructure with Terraform. Changes must be proven in dev and staging before production, and a mistake while changing one environment must not be able to damage another. Which layout fits best?",
    options: [
      "One root configuration and one state file for all three environments, with `count` toggles for each environment",
      "Versioned shared modules; a thin root config per environment with its own state and credentials; promote by version",
      "One git branch per environment holding a full copy of the code, with changes cherry-picked from dev to staging to production",
      "One root configuration applied to each environment from engineers' laptops, with local state files kept on a shared drive",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "reusable modules with pinned versions",
      "separate state per environment limits the blast radius",
      "separate credentials or roles per environment",
      "promote the same module version through the environments",
      "plan and apply from CI with remote state and locking",
    ],
    redFlags: ["one state file for everything", "one long-lived branch per environment"],
    rubric: {
      criteria: [
        { name: "Isolation", weight: 5, keywords: ["separate state", "blast radius", "credentials", "per environment", "backend"] },
        { name: "Reuse and promotion", weight: 4, keywords: ["module", "version", "pin", "promote", "same code"] },
        { name: "Operation", weight: 2, keywords: ["ci", "locking", "remote state", "plan", "review"] },
      ],
    },
    modelAnswer:
      "Put the infrastructure logic in shared modules with pinned versions, and give each environment a thin root configuration with its own remote state, its own locking and credentials that can only touch that environment. A change is released as a new module version, applied to dev, then staging, then production by bumping the version in each root, so production runs exactly what was tested and a bad apply cannot reach the other states. A single state makes every apply risk all three environments, branches per environment drift apart, and local state on a shared drive has no locking.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-19",
    track: "devops",
    level: "mid",
    difficulty: 4,
    type: "coding",
    tags: ["prometheus", "metrics"],
    prompt:
      "`http_requests_total` is a Prometheus counter with `code` (200, 404, 503 and so on) and `pod` labels, exported by every API pod. Which query returns one number: the fraction of all the service's requests that failed with a 5xx status over the last 5 minutes?",
    options: [
      "`sum(http_requests_total{code=~\"5..\"}) / sum(http_requests_total)`",
      "`avg(rate(http_requests_total{code=~\"5..\"}[5m]) / rate(http_requests_total[5m]))`",
      "`sum(rate(http_requests_total{code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))`",
      "`sum by (pod) (rate(http_requests_total{code=~\"5..\"}[5m])) / sum by (pod) (rate(http_requests_total[5m]))`",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "counters only go up and reset when a process restarts",
      "rate() over a range gives the per-second increase and handles resets",
      "sum the rates first, then divide",
      "the regex matcher code=~\"5..\" selects 5xx codes",
      "dividing before summing matches each 5xx series only with itself",
    ],
    redFlags: ["divide raw counter values", "average or keep per-pod ratios"],
    rubric: {
      criteria: [
        { name: "Counters", weight: 4, keywords: ["counter", "rate", "reset", "per-second", "range"] },
        { name: "Aggregation", weight: 4, keywords: ["sum", "ratio", "label matching", "divide", "5xx"] },
      ],
    },
    modelAnswer:
      "A counter's raw value is a running total since the process started, so dividing raw totals gives a lifetime ratio that barely moves and jumps when pods restart; `rate(...[5m])` turns each counter into a per-second rate over the window and copes with resets. Summing the 5xx rates and the total rates across all pods, then dividing, gives one fleet-wide error fraction. `sum by (pod)` keeps a separate ratio for each pod rather than one answer for the whole service. Dividing per series before aggregating matches each 5xx series only with the identical series in the denominator, so every ratio is 1 (or NaN where that series had no requests), and averaging ratios would ignore how much traffic each pod handles anyway.",
    followUpIds: [],
  },

  // ─── Difficulty 5 ───────────────────────────────────────────────────────
  {
    id: "qb-devops-mid-20",
    track: "devops",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["slos/slas", "metrics", "incident management"],
    prompt:
      "A service has a 99.9% availability SLO measured over 30 days. Its fast-burn alert fires when the error-budget burn rate over the last hour exceeds 14.4. What does that alert condition mean?",
    options: [
      "About 1.44% of requests fail; an hour at that rate uses 2% of the 30-day budget, which would be gone in about two days",
      "14.4% of requests have failed in the last hour, which is 14.4 times more than the whole 30-day error budget allows",
      "14.4% of the 30-day error budget was spent in the last hour, so at this rate it would be gone in about seven hours",
      "The service was completely unavailable for 14.4 minutes of the last hour, which is more than the SLO allows for the month",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "burn rate = observed error rate / (1 − SLO)",
      "a burn rate of 1 spends the budget exactly over the 30 days",
      "14.4 × 0.1% = 1.44% of requests failing",
      "one hour at 14.4 uses 14.4 / 720 = 2% of the budget",
      "combine a long and a short window to avoid false alarms",
    ],
    redFlags: ["burn rate is a percentage of requests", "page on raw error counts"],
    rubric: {
      criteria: [
        { name: "Definition", weight: 4, keywords: ["burn rate", "error budget", "error rate", "1 - slo", "0.1%"] },
        { name: "Arithmetic", weight: 4, keywords: ["1.44%", "2%", "720 hours", "50 hours", "two days"] },
        { name: "Alert design", weight: 2, keywords: ["multiwindow", "short window", "long window", "page"] },
      ],
    },
    modelAnswer:
      "Burn rate is the observed error rate divided by the rate the SLO allows: 99.9% allows 0.1% errors, so a burn rate of 1 would spend exactly the whole budget over the 30 days, and 14.4 means about 1.44% of requests are failing. The 30-day window has 720 hours, so one hour at 14.4 spends 14.4 / 720 = 2% of the budget, and the whole budget would be gone in 720 / 14.4 = 50 hours, about two days. That is serious enough to page, which is why 14.4 over one hour (usually confirmed by a short window such as five minutes) is the standard fast-burn threshold.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-21",
    track: "devops",
    level: "mid",
    difficulty: 5,
    type: "theory",
    tags: ["kubernetes", "performance", "metrics"],
    prompt:
      "A latency-sensitive, multi-threaded API on Kubernetes has `requests.cpu: 500m` and `limits.cpu: 1`. Dashboards show average CPU use of about 0.4 cores, yet p99 latency has regular spikes of up to about 100 ms, and `container_cpu_cfs_throttled_periods_total` keeps rising. What is the most likely cause?",
    options: [
      "The node is overcommitted, so the kernel gives the container less CPU than its request whenever neighbours are busy",
      "Averages hide bursts: in each 100 ms CFS period, several threads use up the 1-core quota early and the container waits",
      "The request is lower than the limit, so the scheduler keeps moving the pod between nodes and its caches stay cold",
      "CPU limits are enforced by briefly stopping and restarting the container whenever its usage goes above one core",
    ],
    correctOptionIndex: 1,
    expectedPoints: [
      "CPU limits are enforced as a CFS quota per 100 ms period",
      "several busy threads can use a period's quota in a few milliseconds",
      "the container is then throttled until the next period",
      "throttling shows in container_cpu_cfs_throttled_periods_total and _seconds_total",
      "raise or remove the CPU limit, keep an accurate request, size thread pools to the CPU available",
    ],
    redFlags: ["low average usage means no throttling", "CPU limits kill the container"],
    rubric: {
      criteria: [
        { name: "Mechanism", weight: 5, keywords: ["cfs", "quota", "period", "throttled", "100ms"] },
        { name: "Diagnosis", weight: 3, keywords: ["average", "burst", "p99", "throttled_periods", "threads"] },
        { name: "Fix", weight: 2, keywords: ["raise limit", "remove limit", "request", "thread pool"] },
      ],
    },
    modelAnswer:
      "A CPU limit is enforced as a CFS quota: with `limits.cpu: 1` the container may use 100 ms of CPU time in every 100 ms period. A burst on eight threads uses that quota in about 12.5 ms of wall time, after which every thread is paused until the next period, adding up to roughly 90 ms of latency even though the average over a minute is only 0.4 cores; the rising throttled-periods counter confirms it. Raise or remove the CPU limit while keeping an accurate request, which still guarantees the pod its share under contention, and size thread pools to the CPU actually available. Exceeding a CPU limit never kills or restarts a container, and the scheduler does not move running pods.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-22",
    track: "devops",
    level: "mid",
    difficulty: 5,
    type: "system-design",
    tags: ["canary releases", "release strategies", "kubernetes"],
    prompt:
      "You are designing the release process for a payments API on Kubernetes that ships several times a day. A bad release must reach as few users as possible and be undone within minutes, without anyone having to watch dashboards. Which design achieves this?",
    options: [
      "Build once, deploy by digest; canary a small traffic share, auto-compare its errors and latency with stable, then promote or roll back",
      "Run the full regression suite in staging, then cut all production traffic over in one blue/green switch and switch back if customers complain",
      "Rebuild the image for each environment so it picks up patched base images, then use a rolling update with a manual rollback runbook",
      "Release once a week after a manual sign-off, so every release gets a full day of exploratory testing before reaching production",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "one immutable artefact promoted by digest",
      "canary to a small share of traffic first",
      "automated analysis of error rate and latency against the stable version or SLO",
      "automatic promotion or rollback (e.g. Argo Rollouts, Flagger)",
      "backward-compatible database migrations so rollback is safe",
      "feature flags to separate deploy from release",
    ],
    redFlags: ["rely on customers to report problems", "rebuild the image for each environment"],
    rubric: {
      criteria: [
        { name: "Limiting exposure", weight: 4, keywords: ["canary", "small share", "progressive", "traffic split", "feature flag"] },
        { name: "Automated rollback", weight: 4, keywords: ["automated analysis", "metrics", "slo", "rollback", "argo rollouts"] },
        { name: "Artefact integrity", weight: 2, keywords: ["build once", "digest", "immutable", "backward compatible"] },
      ],
    },
    modelAnswer:
      "Build each commit once and deploy that exact image by digest, so what reaches production is what was tested. A progressive delivery controller (for example Argo Rollouts or Flagger) sends a small share of traffic to the canary, compares its error rate and latency with the stable version or the SLO automatically at each step, and promotes it or rolls back on its own. Schema changes must stay backward compatible (expand, then contract) so rolling back is always safe. A blue/green switch moves all users at once and here relies on complaints to trigger rollback, rebuilding per environment ships untested artefacts, and weekly releases make each change bigger and riskier.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-23",
    track: "devops",
    level: "mid",
    difficulty: 5,
    type: "debugging",
    tags: ["github actions", "security", "secrets management"],
    prompt:
      "This workflow runs the tests on pull requests to a public repository, including pull requests from forks. What is the most serious problem?\n\n```yaml\non: pull_request_target\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n      - run: npm ci && npm test\n        env:\n          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}\n```",
    options: [
      "Secrets passed through `env` are printed to the job log in plain text, because masking only covers `with` inputs",
      "`pull_request_target` never runs for pull requests opened from forks, so outside contributions are never tested at all",
      "It runs the fork's code (install scripts, tests) with the base repository's secrets, so a pull request can steal NPM_TOKEN",
      "`npm ci` ignores environment variables in CI, so the token is never used and installs of private packages fail",
    ],
    correctOptionIndex: 2,
    expectedPoints: [
      "pull_request_target runs in the base repository's context with secrets and a write-capable token",
      "checking out the PR head and running it executes untrusted code",
      "npm install scripts and test files are attacker-controlled",
      "use pull_request, which gets no secrets for forks, to run untrusted code",
      "keep privileged steps in a separate workflow that never runs PR code; least-privilege permissions",
    ],
    redFlags: ["masking makes secrets safe", "pinning action versions fixes this"],
    rubric: {
      criteria: [
        { name: "Vulnerability", weight: 5, keywords: ["pull_request_target", "untrusted code", "fork", "secrets", "exfiltrate"] },
        { name: "Fix", weight: 4, keywords: ["pull_request", "workflow_run", "permissions", "least privilege", "no secrets"] },
      ],
    },
    modelAnswer:
      "`pull_request_target` exists so that workflows triggered by forks can, for example, label pull requests: it runs in the context of the base repository, with its secrets and a token that can write to it. Checking out the pull request's head commit and running `npm ci` and `npm test` executes code the fork author controls (install scripts, test files), which can simply read NPM_TOKEN and send it anywhere; masking only hides values in logs. Run untrusted code under `pull_request`, which gives forks no secrets and a read-only token, and keep any step that needs secrets in a separate workflow that never executes pull request code, with minimal `permissions`.",
    followUpIds: [],
  },
  {
    id: "qb-devops-mid-24",
    track: "devops",
    level: "mid",
    difficulty: 5,
    type: "debugging",
    tags: ["docker", "secrets management", "security"],
    prompt:
      "`.npmrc` holds a token for the company's private npm registry. The team deletes it in the same RUN instruction as the install, so they believe the published image does not contain the token. What is wrong, and what is the fix?\n\n```dockerfile\nFROM node:24-alpine\nWORKDIR /app\nCOPY .npmrc package.json package-lock.json ./\nRUN npm ci --omit=dev && rm .npmrc\nCOPY src ./src\nUSER node\nCMD [\"node\", \"src/server.js\"]\n```",
    options: [
      "The COPY layer still contains .npmrc and anyone who pulls the image can extract it; use `RUN --mount=type=secret` and rotate the token",
      "Nothing is wrong: because the file is removed in the same RUN instruction as the install, no layer of the image ever contains it",
      "The token shows up in `docker history` because RUN reads it; pass it with `ARG NPM_TOKEN` instead, as build args are never stored",
      "The token only leaks if `USER node` is removed, because a non-root user cannot read files that were deleted in earlier layers",
    ],
    correctOptionIndex: 0,
    expectedPoints: [
      "each instruction creates an immutable layer",
      "deleting a file later only hides it in the final filesystem",
      "layers can be extracted from the registry or with docker save",
      "BuildKit secret mounts never write the secret to a layer",
      "build args are recorded in the image history",
      "rotate the exposed token",
    ],
    redFlags: ["deleting a file in a later step removes it from the image", "ARG is safe for secrets"],
    rubric: {
      criteria: [
        { name: "Cause", weight: 5, keywords: ["layer", "copy", "immutable", "extract", "docker save"] },
        { name: "Fix", weight: 4, keywords: ["--mount=type=secret", "buildkit", "secret mount", "rotate", "multi-stage"] },
      ],
    },
    modelAnswer:
      "Every instruction adds an immutable layer, and `COPY .npmrc ...` creates a layer that contains the file; the later `rm` only hides it in the final filesystem view, so anyone who can pull the image can extract the token from that layer (for example with `docker save`). Doing the delete in the same RUN as the install only helps when the file was created in that same RUN. Use a BuildKit secret mount, such as `RUN --mount=type=secret,id=npmrc,target=/app/.npmrc npm ci --omit=dev` built with `--secret id=npmrc,src=.npmrc`, which exposes the file only while that command runs, and rotate the leaked token. Build args are recorded in the image's history, so ARG is not a safe way to pass secrets.",
    followUpIds: [],
  },
];
