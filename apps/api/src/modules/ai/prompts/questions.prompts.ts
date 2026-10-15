import { z } from "zod";
import { DIFFICULTY_MAP } from "../../../common/constants";
import type { TechTag } from "../../../common/tech-tags";
import { DATA_BLOCK_RULE, cleanStringList, dataBlock } from "../ai-json";
import { catalogTags, mentionsTag } from "../ai-tags";
import type { QuestionGenerationFilters } from "../ai.types";
import type { BuiltPrompt } from "./cv.prompts";

export const QUESTION_TRACKS = ["frontend", "backend", "fullstack", "devops"] as const;
const QUESTION_LEVELS = new Set(["junior", "mid", "senior"]);
const QUESTION_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/** Filters after validation: whitelisted values and catalog tags only. */
export interface NormalisedQuestionFilters {
  track: string;
  level: string;
  difficulty: string;
  tags: TechTag[];
}

/** null when track/level/difficulty is not a known value. Unknown tags are dropped. */
export function normaliseQuestionFilters(
  filters: QuestionGenerationFilters,
): NormalisedQuestionFilters | null {
  if (
    !(QUESTION_TRACKS as readonly string[]).includes(filters.track) ||
    !QUESTION_LEVELS.has(filters.level) ||
    !QUESTION_DIFFICULTIES.has(filters.difficulty)
  ) {
    return null;
  }
  return {
    track: filters.track,
    level: filters.level,
    difficulty: filters.difficulty,
    tags: catalogTags(filters.tags),
  };
}

/** Tagged batches must test the technology itself, so generic types are excluded. */
export function allowedQuestionTypes(hasTags: boolean): readonly string[] {
  return hasTags
    ? ["theory", "coding", "debugging"]
    : ["theory", "coding", "debugging", "system-design", "behavioral", "ops"];
}

/** Rough output tokens per generated question (prompt, options, rubric, answer). */
const TOKENS_PER_QUESTION = 550;

export function buildQuestionBatchPrompt(
  filters: NormalisedQuestionFilters,
  count: number,
): BuiltPrompt {
  const hasTags = filters.tags.length > 0;
  const types = allowedQuestionTypes(hasTags)
    .map((type) => `"${type}"`)
    .join(", ");
  const topicRule = hasTags
    ? "Every question must directly test one or more of the technologies in <topics> and name it explicitly in the prompt. No generic software-engineering questions that would fit any stack. <topics> contains technology names only."
    : `Cover a broad mix of general ${filters.track} topics.`;

  const system = `You write multiple-choice interview questions for software developers, like those asked at strong tech companies.
Each question has exactly 4 plausible options and exactly one correct option. Avoid obviously wrong options and near-duplicate questions.
Question object: {"prompt": "", "options": ["", "", "", ""], "correctOptionIndex": 0, "type": one of ${types}, "expectedPoints": ["3-5 key points a good answer covers"], "redFlags": ["2-3 common misconceptions"], "rubric": {"criteria": [{"name": "", "weight": 1, "keywords": [""]}]}, "modelAnswer": "2-4 sentences explaining the correct answer"}
Rubric: 2-4 criteria with weights from 1 to 5.
Levels: junior = fundamentals; mid = applied knowledge and trade-offs; senior = architecture and deep expertise.
${topicRule}
${DATA_BLOCK_RULE}
Respond with a JSON object: {"questions": [ … ]}.`;

  const difficulty = DIFFICULTY_MAP[filters.difficulty] ?? 3;
  const lines = [
    `Write exactly ${count} ${filters.level}-level ${filters.track} questions at difficulty ${difficulty}/5.`,
  ];
  if (hasTags) {
    lines.push(dataBlock("topics", filters.tags.map((tag) => tag.label).join(", ")));
  }

  return {
    system,
    user: lines.join("\n\n"),
    maxTokens: Math.min(5_000, count * TOKENS_PER_QUESTION + 300),
    truncated: false,
  };
}

export const questionBatchSchema = z
  .object({ questions: z.array(z.unknown()) })
  .transform(({ questions }) => questions);

export interface ValidatedQuestion {
  /** Canonical catalog ids of the requested tags this question mentions ([] for untagged batches). */
  tags: string[];
  type: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  expectedPoints: string[];
  redFlags: string[];
  rubric: { criteria: { name: string; weight: number; keywords: string[] }[] };
  modelAnswer: string;
}

export interface QuestionValidationContext {
  tags: readonly TechTag[];
  allowedTypes: readonly string[];
  /** Injected for tests; defaults to Math.random. */
  random?: () => number;
}

/** Normalised prompt text used to spot duplicates. */
export function promptKey(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Reject (never repair) questions with a doubtful answer key or shape; tag
 * each kept question only with the requested tags it actually mentions;
 * shuffle options (models favour some answer positions) and remap the key.
 */
export function validateGeneratedQuestions(
  raw: readonly unknown[],
  ctx: QuestionValidationContext,
): ValidatedQuestion[] {
  const out: ValidatedQuestion[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const question = validateQuestion(item, ctx);
    if (!question) continue;
    const key = promptKey(question.prompt);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(question);
  }
  return out;
}

function validateQuestion(
  raw: unknown,
  ctx: QuestionValidationContext,
): ValidatedQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;

  const prompt = typeof q.prompt === "string" ? q.prompt.trim() : "";
  if (prompt.length < 15 || prompt.length > 1_000) return null;

  if (!Array.isArray(q.options) || q.options.length !== 4) return null;
  const options = q.options.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.some((o) => !o || o.length > 300)) return null;
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return null;

  const correct = q.correctOptionIndex;
  if (typeof correct !== "number" || !Number.isInteger(correct) || correct < 0 || correct > 3) {
    return null;
  }
  // Single-select only; a disagreeing answer list means the key is ambiguous.
  if (q.multiSelect === true) return null;
  if (
    Array.isArray(q.correctOptionIndices) &&
    q.correctOptionIndices.length > 0 &&
    !(q.correctOptionIndices.length === 1 && q.correctOptionIndices[0] === correct)
  ) {
    return null;
  }

  const type = typeof q.type === "string" ? q.type.trim().toLowerCase() : "";
  if (!ctx.allowedTypes.includes(type)) return null;

  const modelAnswer = typeof q.modelAnswer === "string" ? q.modelAnswer.trim() : "";
  if (!modelAnswer || modelAnswer.length > 2_000) return null;

  let tags: string[] = [];
  if (ctx.tags.length > 0) {
    const text = `${prompt}\n${options.join("\n")}\n${modelAnswer}`;
    tags = ctx.tags.filter((tag) => mentionsTag(text, tag)).map((tag) => tag.id);
    if (tags.length === 0) return null;
  }

  const shuffled = shuffleOptions(options, correct, ctx.random ?? Math.random);
  return {
    tags,
    type,
    prompt,
    options: shuffled.options,
    correctOptionIndex: shuffled.correctIndex,
    expectedPoints: cleanStringList(q.expectedPoints, 6, 300),
    redFlags: cleanStringList(q.redFlags, 5, 300),
    rubric: { criteria: normaliseRubric(q.rubric) },
    modelAnswer,
  };
}

/** Fisher-Yates shuffle of the options, returning where the correct one ended up. */
export function shuffleOptions(
  options: readonly string[],
  correctIndex: number,
  random: () => number,
): { options: string[]; correctIndex: number } {
  const order = options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    options: order.map((index) => options[index]),
    correctIndex: order.indexOf(correctIndex),
  };
}

function normaliseRubric(
  rubric: unknown,
): { name: string; weight: number; keywords: string[] }[] {
  const criteria = (rubric as { criteria?: unknown } | null)?.criteria;
  if (!Array.isArray(criteria)) return [];
  const out: { name: string; weight: number; keywords: string[] }[] = [];
  for (const item of criteria) {
    if (!item || typeof item !== "object") continue;
    const { name, weight, keywords } = item as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim()) continue;
    if (typeof weight !== "number" || !Number.isFinite(weight)) continue;
    out.push({
      name: name.trim().slice(0, 80),
      weight: Math.min(5, Math.max(1, Math.round(weight))),
      keywords: cleanStringList(keywords, 10, 60),
    });
    if (out.length >= 5) break;
  }
  return out;
}
