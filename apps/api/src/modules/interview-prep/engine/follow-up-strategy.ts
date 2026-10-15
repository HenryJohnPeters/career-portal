/**
 * Follow-ups: after a wrong answer, a question may lead to one of its curated
 * `followUpIds`, asked straight after it. Only seed questions declare them.
 */

/** At most this many follow-ups are added to one session. */
export const MAX_FOLLOW_UPS_PER_SESSION = 5;

export function shouldFollowUp(
  isCorrect: boolean,
  followUpIds: readonly string[],
): boolean {
  return !isCorrect && followUpIds.length > 0;
}

/**
 * Picks the follow-up whose expected points best cover what was missed;
 * ties keep the declared order. `candidates` are the follow-ups that exist and
 * are not already in the session.
 */
export function pickFollowUp(
  followUpIds: readonly string[],
  pointsMissed: readonly string[],
  candidates: readonly { id: string; expectedPoints: string[] }[],
): string | null {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const missed = new Set(pointsMissed.map((p) => p.toLowerCase()));

  let bestId: string | null = null;
  let bestOverlap = -1;
  for (const id of followUpIds) {
    const candidate = byId.get(id);
    if (!candidate) continue;
    const overlap = candidate.expectedPoints.filter((p) => missed.has(p.toLowerCase())).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestId = id;
    }
  }
  return bestId;
}
