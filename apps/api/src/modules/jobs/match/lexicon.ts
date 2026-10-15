import {
  TECH_TAG_CATALOG,
  type TechTag,
  type TechTagCategoryKey,
} from "../../../common/tech-tags";
import { tokenize, type Token } from "./tokenize";

/*
 * Keyword lexicon for the CV ↔ job-description match: the shared tech tag
 * catalog plus common tools, practices, soft skills and role terms. Every
 * spelling of a keyword (id, label, aliases) maps to one canonical keyword,
 * so "Postgres" in a CV matches "PostgreSQL" in a job advert.
 */

/** Drives the base weight and which CV section a missing keyword belongs in. */
export type KeywordKind = "tech" | "practice" | "soft" | "role";

export interface Keyword {
  id: string;
  /** Display name, e.g. "PostgreSQL". */
  label: string;
  kind: KeywordKind;
}

interface Form {
  /** Lowercase tokens of this spelling. */
  tokens: string[];
  /** Required original casing (single-token forms only), e.g. "Go". */
  exact?: string;
  keyword: Keyword;
}

/** Spellings grouped by first token, longest first, so the longest phrase wins. */
export type Lexicon = ReadonlyMap<string, readonly Form[]>;

/**
 * Single words that are ordinary English (or too generic to be a useful
 * keyword). They never match on their own; multi-word spellings such as
 * "state management" or "rest api" still do, and some get a case-sensitive
 * spelling below ("Go", "REST").
 */
const GENERIC_WORDS: ReadonlySet<string> = new Set([
  "api", "apis", "architecture", "astro", "behavioral", "behavioural",
  "components", "consistency", "conflict", "containers", "database",
  "databases", "emotion", "express", "flux", "generic", "gin", "go", "helm",
  "hooks", "layout", "metrics", "monolith", "orchestration", "passport", "patterns",
  "performance", "quality", "queues", "rails", "remix", "rest", "scaling",
  "solid", "spring", "state", "tracing", "transactions", "types", "vault",
  "web",
]);

/** Case-sensitive spellings for tags whose plain word is ambiguous. */
const EXACT_FORMS: Readonly<Record<string, readonly string[]>> = {
  go: ["Go"],
  rest: ["REST"],
  express: ["Express"],
  "spring boot": ["Spring"],
  rails: ["Rails"],
  helm: ["Helm"],
  gin: ["Gin"],
  astro: ["Astro"],
};

/** Catalog tags that are too vague to be worth matching at all. */
const EXCLUDED_TAG_IDS: ReadonlySet<string> = new Set(["best-practices", "web"]);

const PRACTICE_CATEGORIES: ReadonlySet<TechTagCategoryKey> = new Set([
  "language-concepts",
  "frontend-concepts",
  "security",
  "reliability",
  "system-design",
  "engineering-practices",
]);

/** Kind overrides for catalog tags whose category default doesn't fit. */
const KIND_OVERRIDES: Readonly<Record<string, KeywordKind>> = {
  testing: "practice",
  "integration testing": "practice",
  "contract testing": "practice",
  "load testing": "practice",
  devops: "practice",
  gitops: "practice",
  "release strategies": "practice",
  "blue/green deploys": "practice",
  "canary releases": "practice",
  "feature flags": "practice",
  api: "practice",
  "api versioning": "practice",
  "event sourcing": "practice",
  cqrs: "practice",
  jwt: "tech",
  oauth: "tech",
  oidc: "tech",
  "passport.js": "tech",
  vault: "tech",
  iam: "tech",
};

interface ExtraKeyword {
  label: string;
  kind: KeywordKind;
  /** Lowercase spellings (the label is added automatically). */
  forms?: readonly string[];
  /** Case-sensitive single-word spellings; the same word in lowercase is then not matched. */
  exact?: readonly string[];
}

/** Keywords common in developer job adverts that the tag catalog lacks. */
const EXTRA_KEYWORDS: readonly ExtraKeyword[] = [
  // Languages, platforms and tools
  { label: "HTML", kind: "tech", forms: ["html5"] },
  { label: "C++", kind: "tech", forms: ["cpp"] },
  { label: "Scala", kind: "tech" },
  { label: "Elixir", kind: "tech" },
  { label: "Swift", kind: "tech", exact: ["Swift"] },
  { label: "Objective-C", kind: "tech" },
  { label: "Dart", kind: "tech", exact: ["Dart"] },
  { label: "React Native", kind: "tech" },
  { label: "Flutter", kind: "tech" },
  { label: "iOS", kind: "tech" },
  { label: "Android", kind: "tech" },
  { label: "Linux", kind: "tech", forms: ["unix"] },
  { label: "Bash", kind: "tech", forms: ["shell scripting"] },
  { label: "PowerShell", kind: "tech" },
  { label: "Git", kind: "tech" },
  { label: "GitHub", kind: "tech" },
  { label: "GitLab", kind: "tech" },
  { label: "Bitbucket", kind: "tech" },
  { label: "Jira", kind: "tech" },
  { label: "Confluence", kind: "tech" },
  { label: "Figma", kind: "tech" },
  { label: "jQuery", kind: "tech" },
  { label: "Bootstrap", kind: "tech", exact: ["Bootstrap"] },
  { label: "RxJS", kind: "tech" },
  { label: "Three.js", kind: "tech", forms: ["threejs"] },
  { label: "D3.js", kind: "tech", forms: ["d3"] },
  { label: "WebRTC", kind: "tech" },
  { label: "Socket.IO", kind: "tech" },
  { label: "Apollo", kind: "tech", exact: ["Apollo"] },
  { label: "Firebase", kind: "tech" },
  { label: "Supabase", kind: "tech" },
  { label: "AWS Lambda", kind: "tech", forms: ["lambda functions"], exact: ["Lambda"] },
  { label: "S3", kind: "tech", forms: ["amazon s3"] },
  { label: "EC2", kind: "tech" },
  { label: "RDS", kind: "tech" },
  { label: "CloudFront", kind: "tech" },
  { label: "EKS", kind: "tech" },
  { label: "AKS", kind: "tech" },
  { label: "GKE", kind: "tech" },
  { label: "OpenShift", kind: "tech" },
  { label: "Azure Functions", kind: "tech" },
  { label: "MariaDB", kind: "tech" },
  { label: "Oracle", kind: "tech", exact: ["Oracle"] },
  { label: "Selenium", kind: "tech" },
  { label: "Postman", kind: "tech" },
  { label: "Apache Spark", kind: "tech", exact: ["Spark"] },
  { label: "Airflow", kind: "tech" },
  { label: "Snowflake", kind: "tech", exact: ["Snowflake"] },
  { label: "BigQuery", kind: "tech" },
  { label: "Pandas", kind: "tech" },
  { label: "NumPy", kind: "tech" },
  { label: "TensorFlow", kind: "tech" },
  { label: "PyTorch", kind: "tech" },
  { label: "scikit-learn", kind: "tech", forms: ["sklearn"] },
  { label: "Tableau", kind: "tech" },
  { label: "Power BI", kind: "tech", forms: ["powerbi"] },
  { label: "Salesforce", kind: "tech" },
  { label: "WordPress", kind: "tech" },
  { label: "Shopify", kind: "tech" },
  { label: "LLMs", kind: "tech", forms: ["llm", "large language models"] },
  { label: "OpenAI", kind: "tech" },

  // Practices and methods
  { label: "CI/CD", kind: "practice", forms: ["cicd", "continuous integration", "continuous delivery", "continuous deployment"] },
  { label: "Agile", kind: "practice" },
  { label: "Scrum", kind: "practice" },
  { label: "Kanban", kind: "practice" },
  { label: "TDD", kind: "practice", forms: ["test-driven development", "test driven development"] },
  { label: "BDD", kind: "practice", forms: ["behaviour-driven development", "behavior-driven development"] },
  { label: "Unit testing", kind: "practice", forms: ["unit tests", "unit test"] },
  { label: "End-to-end testing", kind: "practice", forms: ["e2e", "e2e testing", "end-to-end tests"] },
  { label: "Automated testing", kind: "practice", forms: ["test automation", "automated tests"] },
  { label: "Code review", kind: "practice" },
  { label: "Pair programming", kind: "practice" },
  { label: "Domain-driven design", kind: "practice", forms: ["ddd"] },
  { label: "Object-oriented programming", kind: "practice", forms: ["oop", "object-oriented", "object oriented"] },
  { label: "Functional programming", kind: "practice" },
  { label: "Data structures", kind: "practice" },
  { label: "Algorithms", kind: "practice" },
  { label: "Design systems", kind: "practice" },
  { label: "Micro-frontends", kind: "practice", forms: ["microfrontends"] },
  { label: "Event-driven architecture", kind: "practice", forms: ["event-driven", "event driven"] },
  { label: "ETL", kind: "practice", forms: ["data pipelines", "elt"] },
  { label: "Machine learning", kind: "practice", forms: ["ml"] },
  { label: "Monitoring", kind: "practice" },
  { label: "Observability", kind: "practice" },
  { label: "Debugging", kind: "practice", forms: ["troubleshooting"] },
  { label: "Documentation", kind: "practice", forms: ["technical writing"] },
  { label: "On-call", kind: "practice", forms: ["on call", "incident response"] },
  { label: "A/B testing", kind: "practice" },
  { label: "Cross-browser", kind: "practice", forms: ["cross browser"] },
  { label: "UX", kind: "practice", forms: ["user experience", "ui/ux"], exact: ["UX"] },
  { label: "Product thinking", kind: "practice", forms: ["product mindset", "product-minded"] },

  // Soft skills
  { label: "Collaboration", kind: "soft", forms: ["collaborative", "collaborate"] },
  { label: "Leadership", kind: "soft", forms: ["technical leadership"] },
  { label: "Mentoring", kind: "soft", forms: ["mentor", "mentorship"] },
  { label: "Problem solving", kind: "soft", forms: ["problem-solving", "problem solver"] },
  { label: "Stakeholder management", kind: "soft", forms: ["stakeholders"] },
  { label: "Ownership", kind: "soft" },
  { label: "Attention to detail", kind: "soft", forms: ["detail-oriented", "detail oriented"] },
  { label: "Time management", kind: "soft", forms: ["prioritisation", "prioritization"] },
  { label: "Cross-functional", kind: "soft", forms: ["cross functional"] },
  { label: "Critical thinking", kind: "soft" },

  // Role terms
  { label: "Full stack", kind: "role", forms: ["full-stack", "fullstack"] },
  { label: "Frontend", kind: "role", forms: ["front-end", "front end"] },
  { label: "Backend", kind: "role", forms: ["back-end", "back end"] },
  { label: "Mobile", kind: "role", forms: ["mobile development"] },
  { label: "SRE", kind: "role", forms: ["site reliability", "site reliability engineering"] },
];

function kindForTag(tag: TechTag): KeywordKind {
  const override = KIND_OVERRIDES[tag.id];
  if (override) return override;
  if (tag.category === "behavioral") return "soft";
  return PRACTICE_CATEGORIES.has(tag.category) ? "practice" : "tech";
}

const tokensOf = (spelling: string): string[] =>
  tokenize(spelling).map((t: Token) => t.norm);

/**
 * Spellings to register for one keyword: drops generic single words and adds
 * plural/singular variants where they read naturally ("code reviews",
 * "microservice", "data pipeline").
 */
function expandSpellings(spellings: Iterable<string>, kind: KeywordKind): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  const add = (tokens: string[]) => {
    const key = tokens.join(" ");
    if (tokens.length === 0 || seen.has(key)) return;
    // Also stops a variant re-adding a generic word ("Generics" → "generic").
    if (tokens.length === 1 && GENERIC_WORDS.has(tokens[0])) return;
    seen.add(key);
    out.push(tokens);
  };
  for (const spelling of spellings) {
    const tokens = tokensOf(spelling);
    if (tokens.length === 1 && GENERIC_WORDS.has(tokens[0])) continue;
    add(tokens);
    if (tokens.length > 1 || kind !== "tech") {
      const last = tokens[tokens.length - 1];
      const head = tokens.slice(0, -1);
      if (!last.endsWith("s")) add([...head, `${last}s`]);
      else if (last.length > 4 && !last.endsWith("ss")) add([...head, last.slice(0, -1)]);
    }
  }
  return out;
}

export function buildLexicon(): Lexicon {
  const byFirst = new Map<string, Form[]>();
  const register = (keyword: Keyword, spellings: Iterable<string>, exact: readonly string[] = []) => {
    for (const tokens of expandSpellings(spellings, keyword.kind)) {
      const list = byFirst.get(tokens[0]) ?? [];
      list.push({ tokens, keyword });
      byFirst.set(tokens[0], list);
    }
    for (const spelling of exact) {
      const norm = spelling.toLowerCase();
      const list = byFirst.get(norm) ?? [];
      list.push({ tokens: [norm], exact: spelling, keyword });
      byFirst.set(norm, list);
    }
  };

  for (const tag of TECH_TAG_CATALOG) {
    if (EXCLUDED_TAG_IDS.has(tag.id)) continue;
    const keyword: Keyword = { id: tag.id, label: tag.label, kind: kindForTag(tag) };
    register(keyword, [tag.id, tag.label, ...(tag.aliases ?? [])], EXACT_FORMS[tag.id]);
  }
  for (const extra of EXTRA_KEYWORDS) {
    const keyword: Keyword = {
      id: `x:${extra.label.toLowerCase()}`,
      label: extra.label,
      kind: extra.kind,
    };
    // A word with a case-sensitive spelling ("Swift") is ambiguous in lowercase.
    const exact = new Set((extra.exact ?? []).map((s) => s.toLowerCase()));
    const spellings = [extra.label, ...(extra.forms ?? [])].filter((spelling) => {
      const tokens = tokensOf(spelling);
      return !(tokens.length === 1 && exact.has(tokens[0]));
    });
    register(keyword, spellings, extra.exact);
  }

  for (const forms of byFirst.values()) {
    forms.sort((a, b) => b.tokens.length - a.tokens.length);
  }
  return byFirst;
}

/** Built once: the catalog is static. */
export const LEXICON: Lexicon = buildLexicon();

function matchesAt(form: Form, tokens: readonly Token[], index: number): boolean {
  if (index + form.tokens.length > tokens.length) return false;
  if (form.exact !== undefined) {
    const token = tokens[index];
    if (token.raw !== form.exact) return false;
    // "Go above and beyond": a capitalised first word followed by a
    // lowercase word is grammar, not the name.
    const next = tokens[index + 1];
    if (token.sentenceStart && next && /^[a-z]/.test(next.raw)) return false;
  }
  for (let k = 1; k < form.tokens.length; k++) {
    if (tokens[index + k].norm !== form.tokens[k]) return false;
  }
  return true;
}

/**
 * Calls `onMatch` for every keyword occurrence, left to right, taking the
 * longest phrase at each position ("React Native" is not also "React").
 * Linear in the number of tokens (phrases are at most a few tokens long).
 */
export function scanKeywords(
  tokens: readonly Token[],
  onMatch: (keyword: Keyword) => void,
  lexicon: Lexicon = LEXICON,
): void {
  let index = 0;
  while (index < tokens.length) {
    const form = lexicon
      .get(tokens[index].norm)
      ?.find((candidate) => matchesAt(candidate, tokens, index));
    if (form) {
      onMatch(form.keyword);
      index += form.tokens.length;
    } else {
      index++;
    }
  }
}
