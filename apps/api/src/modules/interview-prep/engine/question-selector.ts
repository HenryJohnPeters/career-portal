import {
  IQuestionSelector,
  QuestionRecord,
  SessionSettings,
} from "./interfaces";

/**
 * Selects questions using a difficulty curve and adaptive progression.
 *
 * Algorithm:
 * 1. Filter pool by track, level, tag overlap, interview type, and difficulty target
 * 2. Exclude already-answered questions
 * 3. Sort by difficulty curve: start easy, ramp up, then plateau
 * 4. Adapt: if recent scores are low, keep difficulty steady; if high, ramp faster
 * 5. Diversify question types
 * 6. Adjust count based on session duration
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
    scores: number[]
  ): QuestionRecord[] {
    const answeredSet = new Set(answeredIds);

    // Step 1: Filter by track and level
    let candidates = pool.filter(
      (q) =>
        q.track === settings.track &&
        q.level === settings.level &&
        !answeredSet.has(q.id)
    );

    // Step 1b: If roleFocus narrows the track further, boost matching types
    // e.g. "platform" focus boosts ops/system-design questions
    const roleFocusTypeBoost = this.getRoleFocusBoost(settings.roleFocus);

    // Step 2: Boost questions that share tags
    const tagSet = new Set(settings.tags.map((t) => t.toLowerCase()));
    const preferredTypes = new Set(
      QuestionSelector.TYPE_AFFINITY[settings.interviewType] ?? []
    );

    const scored = candidates.map((q) => {
      const tagOverlap = q.tags.filter((t) =>
        tagSet.has(t.toLowerCase())
      ).length;
      const typeBoost = preferredTypes.has(q.type) ? 2 : 0;
      const roleBoost = roleFocusTypeBoost.has(q.type) ? 1 : 0;
      return { question: q, relevance: tagOverlap + typeBoost + roleBoost };
    });

    // Sort by relevance descending, then difficulty ascending
    scored.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return a.question.difficulty - b.question.difficulty;
    });

    candidates = scored.map((s) => s.question);

    // Step 3: Determine target difficulty based on adaptive progression + difficulty setting
    const targetDifficulty = this.computeTargetDifficulty(
      settings.level,
      settings.difficulty,
      scores
    );

    // Step 4: Apply difficulty curve
    const selected = this.applyDifficultyCurve(
      candidates,
      settings.questionCount,
      targetDifficulty
    );

    // Step 5: Diversify question types
    return this.diversifyTypes(selected, candidates, settings.questionCount);
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
    scores: number[]
  ): number {
    const baseDifficulty: Record<string, number> = {
      junior: 1,
      mid: 2,
      senior: 3,
    };
    let target = baseDifficulty[level] ?? 2;

    // Shift target based on the user-chosen difficulty
    const difficultyShift =
      (QuestionSelector.DIFFICULTY_MAP[difficultyLabel] ?? 3) - 3; // easy=-2, medium=0, hard=+2
    target = Math.max(1, Math.min(5, target + difficultyShift));

    if (scores.length > 0) {
      const recentScores = scores.slice(-3);
      const avgRecent =
        recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

      // If doing well (>70%), increase difficulty
      if (avgRecent > 0.7) {
        target = Math.min(5, target + 1);
      }
      // If struggling (<40%), decrease difficulty
      else if (avgRecent < 0.4) {
        target = Math.max(1, target - 1);
      }
    }

    return target;
  }

  private applyDifficultyCurve(
    candidates: QuestionRecord[],
    count: number,
    targetDifficulty: number
  ): QuestionRecord[] {
    // Sort by distance from target difficulty
    const sorted = [...candidates].sort(
      (a, b) =>
        Math.abs(a.difficulty - targetDifficulty) -
        Math.abs(b.difficulty - targetDifficulty)
    );

    // Build a curve: first 30% easier, middle 40% on target, last 30% harder
    const easyCount = Math.ceil(count * 0.3);
    const midCount = Math.ceil(count * 0.4);
    const hardCount = count - easyCount - midCount;

    const easy = sorted
      .filter((q) => q.difficulty <= targetDifficulty)
      .slice(0, easyCount);
    const mid = sorted
      .filter(
        (q) =>
          q.difficulty >= targetDifficulty - 1 &&
          q.difficulty <= targetDifficulty + 1
      )
      .filter((q) => !easy.includes(q))
      .slice(0, midCount);
    const hard = sorted
      .filter((q) => q.difficulty >= targetDifficulty)
      .filter((q) => !easy.includes(q) && !mid.includes(q))
      .slice(0, hardCount);

    const result = [...easy, ...mid, ...hard];

    // Fill remaining slots if curve didn't produce enough
    if (result.length < count) {
      const resultSet = new Set(result.map((q) => q.id));
      for (const q of sorted) {
        if (result.length >= count) break;
        if (!resultSet.has(q.id)) {
          result.push(q);
          resultSet.add(q.id);
        }
      }
    }

    return result.slice(0, count);
  }

  private diversifyTypes(
    selected: QuestionRecord[],
    pool: QuestionRecord[],
    count: number
  ): QuestionRecord[] {
    const typeCount = new Map<string, number>();
    for (const q of selected) {
      typeCount.set(q.type, (typeCount.get(q.type) || 0) + 1);
    }

    // If any single type is >60% of selection, try to swap some out
    const maxPerType = Math.ceil(count * 0.6);
    const selectedIds = new Set(selected.map((q) => q.id));
    const result = [...selected];

    for (const [type, cnt] of typeCount) {
      if (cnt <= maxPerType) continue;

      const excess = cnt - maxPerType;
      const toRemove = result.filter((q) => q.type === type).slice(maxPerType);

      for (let i = 0; i < Math.min(excess, toRemove.length); i++) {
        const replacement = pool.find(
          (q) => q.type !== type && !selectedIds.has(q.id)
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
