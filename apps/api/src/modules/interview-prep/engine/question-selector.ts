import {
  IQuestionSelector,
  QuestionRecord,
  SessionSettings,
} from "./interfaces";

/**
 * Selects questions using weighted random sampling with anti-repeat protection.
 *
 * Algorithm:
 * 1. Filter pool by track, level, tag overlap, interview type, and difficulty target
 * 2. Assign a relevance weight to each candidate (tag overlap + type affinity + role boost)
 * 3. Apply a strong anti-repeat penalty for questions seen in recent sessions
 * 4. Apply a difficulty-curve weight so the distribution matches the target level
 * 5. Weighted-random sample without replacement for high entropy across sessions
 * 6. Diversify question types as a post-pass
 */
export class QuestionSelector implements IQuestionSelector {
  /** Maps difficulty label → numeric range centre */
  private static readonly DIFFICULTY_MAP: Record<string, number> = {
    easy: 1,
    medium: 3,
    hard: 5,
  };

  /** Maps interview-type to the question types it should prefer */
  private static readonly TYPE_AFFINITY: Record<string, string[]> = {
    coding: ["coding", "debugging"],
    "system-design": ["system-design", "theory"],
    behavioral: ["behavioral"],
  };

  select(
    pool: QuestionRecord[],
    settings: SessionSettings,
    answeredIds: string[],
    scores: number[],
  ): QuestionRecord[] {
    const recentSet = new Set(answeredIds);

    // Step 1: Filter by track and level
    const candidates = pool.filter(
      (q) => q.track === settings.track && q.level === settings.level,
    );

    if (candidates.length === 0) return [];

    const roleFocusTypeBoost = this.getRoleFocusBoost(settings.roleFocus);
    const tagSet = new Set(settings.tags.map((t) => t.toLowerCase()));
    const preferredTypes = new Set(
      QuestionSelector.TYPE_AFFINITY[settings.interviewType] ?? [],
    );

    const targetDifficulty = this.computeTargetDifficulty(
      settings.level,
      settings.difficulty,
      scores,
    );

    // Step 2: Assign composite weights
    const weighted = candidates.map((q) => {
      const tagOverlap =
        tagSet.size > 0
          ? q.tags.filter((t) => tagSet.has(t.toLowerCase())).length
          : 1; // no tags selected → treat all as equally relevant
      const typeBoost = preferredTypes.has(q.type) ? 2 : 0;
      const roleBoost = roleFocusTypeBoost.has(q.type) ? 1 : 0;
      const diffDistance = Math.abs(q.difficulty - targetDifficulty);
      const diffScore = Math.max(0, 5 - diffDistance * 1.5);
      // Heavy anti-repeat: reduce weight to near-zero if recently answered
      const repeatPenalty = recentSet.has(q.id) ? 0.05 : 1;
      const weight =
        (tagOverlap + typeBoost + roleBoost + diffScore + 1) * repeatPenalty;
      return { question: q, weight };
    });

    // Step 3: Weighted-random sample without replacement
    const selected = this.weightedSampleWithoutReplacement(
      weighted,
      settings.questionCount,
    );

    // Step 4: Diversify question types
    return this.diversifyTypes(selected, candidates, settings.questionCount);
  }

  /**
   * Weighted random sample without replacement using the alias / linear scan method.
   * O(n * k) — fine for pool sizes < 500.
   */
  private weightedSampleWithoutReplacement(
    items: { question: QuestionRecord; weight: number }[],
    k: number,
  ): QuestionRecord[] {
    const result: QuestionRecord[] = [];
    const pool = [...items];

    while (result.length < k && pool.length > 0) {
      const totalWeight = pool.reduce((s, i) => s + i.weight, 0);
      if (totalWeight === 0) break;

      let r = Math.random() * totalWeight;
      let pickedIdx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= pool[i].weight;
        if (r <= 0) {
          pickedIdx = i;
          break;
        }
      }
      result.push(pool[pickedIdx].question);
      pool.splice(pickedIdx, 1);
    }

    return result;
  }

  /** Returns question types to boost for a given role focus */
  private getRoleFocusBoost(roleFocus: string): Set<string> {
    switch (roleFocus) {
      case "frontend":
        return new Set(["coding", "debugging"]);
      case "backend":
        return new Set(["coding", "system-design", "debugging"]);
      case "platform":
        return new Set(["ops", "system-design"]);
      case "fullstack":
      default:
        return new Set();
    }
  }

  private computeTargetDifficulty(
    level: string,
    difficultyLabel: string,
    scores: number[],
  ): number {
    const baseDifficulty: Record<string, number> = {
      junior: 1,
      mid: 2,
      senior: 3,
    };
    let target = baseDifficulty[level] ?? 2;

    const difficultyShift =
      (QuestionSelector.DIFFICULTY_MAP[difficultyLabel] ?? 3) - 3;
    target = Math.max(1, Math.min(5, target + difficultyShift));

    if (scores.length > 0) {
      const recentScores = scores.slice(-3);
      const avgRecent =
        recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      if (avgRecent > 0.7) target = Math.min(5, target + 1);
      else if (avgRecent < 0.4) target = Math.max(1, target - 1);
    }

    return target;
  }

  private diversifyTypes(
    selected: QuestionRecord[],
    pool: QuestionRecord[],
    count: number,
  ): QuestionRecord[] {
    const typeCount = new Map<string, number>();
    for (const q of selected) {
      typeCount.set(q.type, (typeCount.get(q.type) || 0) + 1);
    }

    const maxPerType = Math.ceil(count * 0.6);
    const selectedIds = new Set(selected.map((q) => q.id));
    const result = [...selected];

    for (const [type, cnt] of typeCount) {
      if (cnt <= maxPerType) continue;
      const excess = cnt - maxPerType;
      const toRemove = result.filter((q) => q.type === type).slice(maxPerType);
      for (let i = 0; i < Math.min(excess, toRemove.length); i++) {
        const replacement = pool.find(
          (q) => q.type !== type && !selectedIds.has(q.id),
        );
        if (replacement) {
          const idx = result.indexOf(toRemove[i]);
          result[idx] = replacement;
          selectedIds.delete(toRemove[i].id);
          selectedIds.add(replacement.id);
        }
      }
    }

    return result;
  }
}
