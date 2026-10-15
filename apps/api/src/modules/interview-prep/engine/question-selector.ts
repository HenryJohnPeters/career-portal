import { DIFFICULTY_MAP } from "../../../common/constants";
import type { CandidateQuestion, SelectionSettings } from "./interfaces";

/** Question types each interview type prefers. */
const TYPE_AFFINITY: Readonly<Record<string, readonly string[]>> = {
  coding: ["coding", "debugging"],
  "system-design": ["system-design", "theory"],
  behavioral: ["behavioral"],
};

/** Question types boosted for each role focus. */
const ROLE_FOCUS_BOOST: Readonly<Record<string, readonly string[]>> = {
  frontend: ["coding", "debugging"],
  backend: ["coding", "system-design", "debugging"],
  platform: ["ops", "system-design"],
};

const LEVEL_BASE_DIFFICULTY: Readonly<Record<string, number>> = {
  junior: 1,
  mid: 2,
  senior: 3,
};

/** Weight multiplier for questions the user saw recently. */
const RECENT_PENALTY = 0.05;
/** No single question type may fill more than this share of a session. */
const MAX_TYPE_SHARE = 0.6;

/**
 * Picks up to `settings.questionCount` questions by weighted random sampling
 * without replacement. Weights favour tag overlap, the interview type, the
 * role focus and the target difficulty, and heavily penalise recently seen
 * questions. A final pass keeps any one question type to at most 60%.
 */
export function selectQuestions<T extends CandidateQuestion>(
  candidates: readonly T[],
  settings: SelectionSettings,
  recentIds: ReadonlySet<string>,
  random: () => number = Math.random,
): T[] {
  const count = Math.max(0, Math.floor(settings.questionCount));
  if (count === 0 || candidates.length === 0) return [];

  const tagSet = new Set(settings.tags.map((t) => t.toLowerCase()));
  const preferredTypes = new Set(TYPE_AFFINITY[settings.interviewType] ?? []);
  const roleTypes = new Set(ROLE_FOCUS_BOOST[settings.roleFocus] ?? []);
  const target = targetDifficulty(settings.level, settings.difficulty);

  const weighted = candidates.map((question) => {
    const tagOverlap =
      tagSet.size > 0
        ? question.tags.filter((t) => tagSet.has(t.toLowerCase())).length
        : 1;
    const typeBoost = preferredTypes.has(question.type) ? 2 : 0;
    const roleBoost = roleTypes.has(question.type) ? 1 : 0;
    const diffScore = Math.max(0, 5 - Math.abs(question.difficulty - target) * 1.5);
    const penalty = recentIds.has(question.id) ? RECENT_PENALTY : 1;
    return { question, weight: (tagOverlap + typeBoost + roleBoost + diffScore + 1) * penalty };
  });

  const sampled = weightedSample(weighted, count, random);
  return diversifyTypes(sampled, candidates, count);
}

/**
 * Weighted sampling without replacement (Efraimidis–Spirakis): each item gets
 * the key `log(u) / weight` and the k largest keys win. O(n log n).
 */
function weightedSample<T>(
  items: readonly { question: T; weight: number }[],
  k: number,
  random: () => number,
): T[] {
  return items
    .filter((item) => item.weight > 0)
    .map((item) => ({
      question: item.question,
      key: Math.log(Math.max(random(), Number.MIN_VALUE)) / item.weight,
    }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map((item) => item.question);
}

function targetDifficulty(level: string, difficulty: string): number {
  const base = LEVEL_BASE_DIFFICULTY[level] ?? 2;
  const shift = (DIFFICULTY_MAP[difficulty] ?? 3) - 3;
  return Math.max(1, Math.min(5, base + shift));
}

/** Swaps over-represented types for unused candidates of other types. */
function diversifyTypes<T extends CandidateQuestion>(
  selected: T[],
  candidates: readonly T[],
  count: number,
): T[] {
  const maxPerType = Math.ceil(count * MAX_TYPE_SHARE);
  const result = [...selected];
  const used = new Set(result.map((q) => q.id));
  const typeCount = new Map<string, number>();
  for (const q of result) typeCount.set(q.type, (typeCount.get(q.type) ?? 0) + 1);

  for (let i = result.length - 1; i >= 0; i--) {
    const type = result[i].type;
    if ((typeCount.get(type) ?? 0) <= maxPerType) continue;
    const replacement = candidates.find(
      (c) => !used.has(c.id) && c.type !== type && (typeCount.get(c.type) ?? 0) < maxPerType,
    );
    if (!replacement) continue;
    used.add(replacement.id);
    typeCount.set(type, (typeCount.get(type) ?? 0) - 1);
    typeCount.set(replacement.type, (typeCount.get(replacement.type) ?? 0) + 1);
    result[i] = replacement;
  }
  return result;
}
