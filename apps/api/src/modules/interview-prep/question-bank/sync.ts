import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { PrismaClient } from "@prisma/client";
import { isKnownTag, normalizeTag, normalizeTags } from "../../../common/tech-tags";
import { LEVELS, TRACKS } from "../interview-options";
import { REFERENCE_QUESTIONS } from "./index";
import { BANK_QUESTION_TYPES, type BankQuestion } from "./types";

/*
 * Writes the reference bank (REFERENCE_QUESTIONS) into InterviewQuestion.
 * Runs before every API deploy (scripts/sync-question-bank.ts, from the
 * railway.api.json preDeployCommand) and from `pnpm db:seed`.
 *
 * Safe to re-run and to run while the previous deployment serves traffic:
 * - bad data throws before anything is written;
 * - rows are upserted by id, and only when a synced column differs;
 * - bank rows no longer in the bank are archived (moved out of every pool)
 *   when a session used them, deleted otherwise;
 * - AI-generated rows keep only catalog tags (see tidyAiQuestionTags);
 * - writes run in small transactions, never one long lock over the table.
 */

/** `source` of bank rows; AI-generated rows use AI_SOURCE. */
export const BANK_SOURCE = "seed";
const AI_SOURCE = "ai-generated";
/** Level given to rows taken out of every pool (the rows stay for session history). */
export const ARCHIVED_LEVEL = "archived";
/** Rows written per transaction. */
const BATCH_SIZE = 50;

/**
 * Salt for storedOptionOrder, picked so the original bank's answer keys are
 * spread evenly over A-D. Never change it: that would reorder the options
 * of every question, including ones that sessions have answered
 * (question-bank.spec.ts pins a few orders to catch that).
 */
const OPTION_ORDER_SALT = "option-order-2288";

/**
 * A fixed pseudo-random order of a question's options, derived from its id
 * (sha256-seeded Fisher–Yates): the same on every run, so a re-sync never
 * reorders the options of a question that sessions are using.
 * `order[stored] = authored index`.
 */
export function storedOptionOrder(id: string, count: number): number[] {
  const seed = createHash("sha256").update(`${OPTION_ORDER_SALT}:${id}`).digest();
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = seed.readUInt16BE((i * 2) % (seed.length - 1)) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The options in stored order, with the answer key remapped to match. */
export function storedOptions(q: BankQuestion): {
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices: number[];
} {
  const order = storedOptionOrder(q.id, q.options.length);
  const storedIndexOf = (authored: number) => order.indexOf(authored);
  const correct = q.multiSelect ? (q.correctOptionIndices ?? []) : [q.correctOptionIndex];
  return {
    options: order.map((authored) => q.options[authored]),
    correctOptionIndex: storedIndexOf(q.correctOptionIndex),
    correctOptionIndices: [...new Set(correct.map(storedIndexOf))].sort((a, b) => a - b),
  };
}

/** The InterviewQuestion columns the sync owns, exactly as they are stored. */
export function toStoredFields(q: BankQuestion) {
  return {
    track: q.track as string,
    tags: q.tags,
    difficulty: q.difficulty as number,
    type: q.type as string,
    level: q.level as string,
    prompt: q.prompt,
    ...storedOptions(q),
    multiSelect: q.multiSelect ?? false,
    expectedPoints: q.expectedPoints,
    redFlags: q.redFlags,
    rubric: q.rubric,
    modelAnswer: q.modelAnswer,
    followUpIds: q.followUpIds,
    source: BANK_SOURCE,
    generatedForHash: null as string | null,
  };
}

type StoredFields = ReturnType<typeof toStoredFields>;

/** The id plus every column toStoredFields writes (the compiler keeps the two in step). */
const SYNCED_SELECT = {
  id: true,
  track: true,
  tags: true,
  difficulty: true,
  type: true,
  level: true,
  prompt: true,
  options: true,
  correctOptionIndex: true,
  correctOptionIndices: true,
  multiSelect: true,
  expectedPoints: true,
  redFlags: true,
  rubric: true,
  modelAnswer: true,
  followUpIds: true,
  source: true,
  generatedForHash: true,
} as const satisfies Record<"id" | keyof StoredFields, true>;

const SYNCED_COLUMNS = (Object.keys(SYNCED_SELECT) as (keyof typeof SYNCED_SELECT)[]).filter(
  (column): column is keyof StoredFields => column !== "id",
);

/**
 * True when the stored row is missing or differs from `fields` in any synced
 * column. JSON columns compare structurally (jsonb does not keep key order).
 */
export function needsWrite(row: Record<string, unknown> | undefined, fields: StoredFields): boolean {
  if (!row) return true;
  return SYNCED_COLUMNS.some((column) => !isDeepStrictEqual(row[column], fields[column]));
}

/** Everything wrong with one question; `ids` is every id in the bank (for follow-ups). */
export function questionProblems(q: BankQuestion, ids: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id)) {
    problems.push("id must be lowercase letters, digits and single hyphens");
  }
  if (!TRACKS.includes(q.track)) problems.push(`unknown track "${q.track}"`);
  if (!LEVELS.includes(q.level)) problems.push(`unknown level "${q.level}"`);
  if (!(BANK_QUESTION_TYPES as readonly string[]).includes(q.type)) {
    problems.push(`unknown type "${q.type}"`);
  }
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) {
    problems.push("difficulty must be 1-5");
  }
  if (q.tags.length === 0) problems.push("needs at least one tag");
  if (new Set(q.tags).size !== q.tags.length) problems.push("tags must be unique");
  for (const tag of q.tags) {
    if (!isKnownTag(tag) || normalizeTag(tag) !== tag) {
      problems.push(`tag "${tag}" is not a catalog id (use "${normalizeTag(tag)}")`);
    }
  }
  if (!q.prompt.trim()) problems.push("prompt is empty");
  if (!q.modelAnswer.trim()) problems.push("modelAnswer is empty");
  if (q.options.length < 2) problems.push("needs at least 2 options");
  if (q.options.some((option) => !option.trim())) problems.push("options must not be empty");
  if (new Set(q.options).size !== q.options.length) problems.push("options must be unique");
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < q.options.length;
  if (!inRange(q.correctOptionIndex)) problems.push("correctOptionIndex out of range");
  if (q.multiSelect) {
    const indices = q.correctOptionIndices ?? [];
    if (indices.length < 2 || !indices.every(inRange)) {
      problems.push("multi-select questions need 2+ valid correctOptionIndices");
    }
    if (new Set(indices).size !== indices.length) problems.push("correctOptionIndices must be unique");
    if (indices.length >= q.options.length) problems.push("at least one option must be wrong");
    if (!indices.includes(q.correctOptionIndex)) {
      problems.push("correctOptionIndex must be one of correctOptionIndices");
    }
  } else if (q.correctOptionIndices !== undefined) {
    problems.push("correctOptionIndices is only for multiSelect questions");
  }
  if (q.expectedPoints.length === 0) problems.push("needs expectedPoints");
  const criteria = q.rubric.criteria;
  if (criteria.length === 0) problems.push("rubric needs criteria");
  if (criteria.some((c) => !c.name.trim() || !(c.weight > 0) || c.keywords.length === 0)) {
    problems.push("each rubric criterion needs a name, a positive weight and keywords");
  }
  for (const id of q.followUpIds) {
    if (id === q.id || !ids.has(id)) problems.push(`follow-up "${id}" is not another bank question`);
  }
  return problems;
}

/** Throws, listing every problem, when any question is unusable or two share an id. */
export function validateQuestionBank(questions: readonly BankQuestion[]): void {
  const ids = new Set<string>();
  const errors: string[] = [];
  for (const q of questions) {
    if (ids.has(q.id)) errors.push(`${q.id}: duplicate id`);
    ids.add(q.id);
  }
  for (const q of questions) {
    const problems = questionProblems(q, ids);
    if (problems.length > 0) errors.push(`${q.id}: ${problems.join("; ")}`);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid question bank (${errors.length}):\n  ${errors.join("\n  ")}`);
  }
}

export interface QuestionBankSyncResult {
  questions: number;
  created: number;
  updated: number;
  unchanged: number;
  /** Bank rows no longer in the bank: archived (a session used them) or removed. */
  archived: number;
  removed: number;
  /** AI-generated rows: non-catalog tags dropped, or the row removed/archived. */
  aiRetagged: number;
  aiRemoved: number;
  aiArchived: number;
}

/** Validates the bank and brings InterviewQuestion in line with it. See the top of this file. */
export async function syncQuestionBank(
  prisma: PrismaClient,
  log: (line: string) => void = console.log,
  questions: readonly BankQuestion[] = REFERENCE_QUESTIONS,
): Promise<QuestionBankSyncResult> {
  validateQuestionBank(questions);

  const { created, updated, unchanged } = await upsertQuestions(prisma, questions);
  const { archived, removed } = await retireRemovedQuestions(
    prisma,
    questions.map((q) => q.id),
  );
  const ai = await tidyAiQuestionTags(prisma);

  const result: QuestionBankSyncResult = {
    questions: questions.length,
    created,
    updated,
    unchanged,
    archived,
    removed,
    aiRetagged: ai.retagged,
    aiRemoved: ai.removed,
    aiArchived: ai.archived,
  };
  log(
    `Question bank: ${result.questions} questions (${created} created, ${updated} updated, ${unchanged} unchanged); ` +
      `old bank rows: ${archived} archived, ${removed} removed; ` +
      `AI rows with non-catalog tags: ${ai.retagged} retagged, ${ai.removed} removed, ${ai.archived} archived`,
  );
  return result;
}

/** Upserts the questions whose stored row is missing or differs. */
async function upsertQuestions(
  prisma: PrismaClient,
  questions: readonly BankQuestion[],
): Promise<{ created: number; updated: number; unchanged: number }> {
  const existing = new Map<string, Record<string, unknown>>();
  for (const batch of chunks(questions.map((q) => q.id), 500)) {
    const rows = await prisma.interviewQuestion.findMany({
      where: { id: { in: batch } },
      select: SYNCED_SELECT,
    });
    for (const row of rows) existing.set(row.id, row);
  }

  const writes = questions
    .map((q) => ({ id: q.id, fields: toStoredFields(q), isNew: !existing.has(q.id) }))
    .filter(({ id, fields }) => needsWrite(existing.get(id), fields));
  for (const batch of chunks(writes, BATCH_SIZE)) {
    await prisma.$transaction(
      batch.map(({ id, fields }) =>
        prisma.interviewQuestion.upsert({
          where: { id },
          create: { id, ...fields },
          update: fields,
        }),
      ),
    );
  }
  const created = writes.filter((w) => w.isNew).length;
  return {
    created,
    updated: writes.length - created,
    unchanged: questions.length - writes.length,
  };
}

/**
 * Bank rows whose id is no longer in the bank (replaced by a new version):
 * archived when a session used them, so its history still shows what was
 * asked; deleted otherwise. The delete skips any row a session references,
 * even one picked while the sync runs, and the archive step then covers it.
 */
async function retireRemovedQuestions(
  prisma: PrismaClient,
  currentIds: readonly string[],
): Promise<{ archived: number; removed: number }> {
  const stale = await prisma.interviewQuestion.findMany({
    where: { source: BANK_SOURCE, id: { notIn: [...currentIds] }, level: { not: ARCHIVED_LEVEL } },
    select: { id: true },
  });
  let archived = 0;
  let removed = 0;
  for (const batch of chunks(stale.map((row) => row.id), BATCH_SIZE)) {
    const [deleted, moved] = await prisma.$transaction([
      prisma.interviewQuestion.deleteMany({
        where: { id: { in: batch }, sessionQuestions: { none: {} } },
      }),
      prisma.interviewQuestion.updateMany({
        where: { id: { in: batch } },
        data: { level: ARCHIVED_LEVEL, followUpIds: [] },
      }),
    ]);
    removed += deleted.count;
    archived += moved.count;
  }
  return { archived, removed };
}

/**
 * AI questions generated before tags were validated may carry free-text tags.
 * Keep only catalog tags; a question whose tags were all outside the catalog
 * is deleted, or archived (moved out of every pool) when sessions reference it.
 */
async function tidyAiQuestionTags(
  prisma: PrismaClient,
): Promise<{ retagged: number; removed: number; archived: number }> {
  const rows = await prisma.interviewQuestion.findMany({
    where: { source: AI_SOURCE, level: { not: ARCHIVED_LEVEL } },
    select: { id: true, tags: true },
  });
  const retag: { id: string; tags: string[] }[] = [];
  const offCatalog: string[] = [];
  for (const row of rows) {
    const { tags } = normalizeTags(row.tags);
    if (row.tags.length > 0 && tags.length === 0) offCatalog.push(row.id);
    else if (!isDeepStrictEqual(tags, row.tags)) retag.push({ id: row.id, tags });
  }

  let retagged = 0;
  for (const batch of chunks(retag, BATCH_SIZE)) {
    const results = await prisma.$transaction(
      batch.map(({ id, tags }) =>
        prisma.interviewQuestion.updateMany({ where: { id }, data: { tags } }),
      ),
    );
    retagged += results.reduce((sum, r) => sum + r.count, 0);
  }
  let removed = 0;
  let archived = 0;
  for (const batch of chunks(offCatalog, BATCH_SIZE)) {
    const [deleted, moved] = await prisma.$transaction([
      prisma.interviewQuestion.deleteMany({
        where: { id: { in: batch }, sessionQuestions: { none: {} } },
      }),
      prisma.interviewQuestion.updateMany({
        where: { id: { in: batch } },
        data: { tags: [], level: ARCHIVED_LEVEL },
      }),
    ]);
    removed += deleted.count;
    archived += moved.count;
  }
  return { retagged, removed, archived };
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
