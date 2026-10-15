import { clampScore, computeGrade, toPercentage } from "../../../common/grade.util";
import { getTechTagLabel } from "../../../common/tech-tags";

/** Stored on InterviewSession.report (shape of the shared InterviewReport). */
export interface InterviewReport {
  overallScore: number;
  maxPossibleScore: number;
  /** Whole number in [0, 100]. */
  percentage: number;
  grade: string;
  /** Questions the report covers (the answered ones) and the session's total. */
  answeredCount: number;
  questionCount: number;
  strengths: string[];
  weaknesses: string[];
  missedTopics: string[];
  suggestedStudyAreas: string[];
  questionBreakdown: {
    questionId: string;
    prompt: string;
    type: string;
    score: number;
    maxScore: number;
  }[];
  trackSummary: string;
}

export interface ScoredQuestion {
  questionId: string;
  prompt: string;
  type: string;
  score: number;
  maxScore: number;
  pointsMissed: string[];
  tags: string[];
}

interface Tally {
  total: number;
  max: number;
}

/**
 * Deterministic end-of-session report over the answered questions. Scores are
 * clamped to [0, maxScore] and the percentage to [0, 100], so legacy rows
 * stored on another scale cannot produce impossible results.
 */
export function generateReport(
  track: string,
  level: string,
  answered: readonly ScoredQuestion[],
  questionCount: number,
): InterviewReport {
  const questions = answered.map((q) => ({ ...q, score: clampScore(q.score, q.maxScore) }));
  const overallScore = round1(questions.reduce((s, q) => s + q.score, 0));
  const maxPossibleScore = round1(questions.reduce((s, q) => s + Math.max(0, q.maxScore), 0));
  const percentage = toPercentage(overallScore, maxPossibleScore);
  const grade = computeGrade(percentage);

  const byType = tallyBy(questions, (q) => [q.type]);
  const strengths = [
    ...[...byType]
      .filter(([, t]) => ratio(t) >= 0.7)
      .map(([type]) => `Strong in ${typeLabel(type)} questions`),
    ...[...tallyBy(questions, (q) => q.tags)]
      .filter(([, t]) => ratio(t) >= 0.7)
      .map(([tag]) => `Good knowledge of ${getTechTagLabel(tag)}`),
  ].slice(0, 5);
  const weakTypes = [...byType].filter(([, t]) => ratio(t) < 0.5).map(([type]) => type);
  const weaknesses = weakTypes.map((type) => `Needs improvement in ${typeLabel(type)} questions`).slice(0, 5);

  const missedTopics = [...new Set(questions.flatMap((q) => q.pointsMissed))].slice(0, 10);

  const weakTagCounts = new Map<string, number>();
  for (const q of questions) {
    if (q.maxScore > 0 && q.score / q.maxScore < 0.5) {
      for (const tag of q.tags) weakTagCounts.set(tag, (weakTagCounts.get(tag) ?? 0) + 1);
    }
  }
  const weakTags = [...weakTagCounts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => getTechTagLabel(tag));
  const suggestedStudyAreas = [
    ...(weakTags.length > 0 ? [`Deep-dive into: ${weakTags.join(", ")}`] : []),
    ...weakTypes.map((type) => `Practice more ${typeLabel(type)} problems`),
  ].slice(0, 5);

  return {
    overallScore,
    maxPossibleScore,
    percentage,
    grade,
    answeredCount: questions.length,
    questionCount: Math.max(questionCount, questions.length),
    strengths,
    weaknesses,
    missedTopics,
    suggestedStudyAreas,
    questionBreakdown: questions.map((q) => ({
      questionId: q.questionId,
      prompt: q.prompt,
      type: q.type,
      score: q.score,
      maxScore: q.maxScore,
    })),
    trackSummary: trackSummary(track, level, percentage, grade, strengths.length, weaknesses.length, questions.length, questionCount),
  };
}

function tallyBy(
  questions: readonly ScoredQuestion[],
  keys: (q: ScoredQuestion) => readonly string[],
): Map<string, Tally> {
  const tallies = new Map<string, Tally>();
  for (const q of questions) {
    for (const key of new Set(keys(q))) {
      const t = tallies.get(key) ?? { total: 0, max: 0 };
      t.total += q.score;
      t.max += q.maxScore;
      tallies.set(key, t);
    }
  }
  return tallies;
}

function ratio(t: Tally): number {
  return t.max > 0 ? t.total / t.max : 0;
}

function typeLabel(type: string): string {
  return type.replace(/-/g, " ");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function trackSummary(
  track: string,
  level: string,
  percentage: number,
  grade: string,
  strengthCount: number,
  weaknessCount: number,
  answeredCount: number,
  questionCount: number,
): string {
  const who = `${capitalise(level)} ${capitalise(track)}`;
  const coverage =
    answeredCount < questionCount
      ? ` Based on the ${answeredCount} of ${questionCount} questions you answered.`
      : "";
  if (percentage >= 80) {
    return `Strong ${who} candidate. Scored ${percentage}% (${grade}). Demonstrated ${strengthCount} key strength(s) with minimal weaknesses.${coverage}`;
  }
  if (percentage >= 60) {
    return `Competent ${who} candidate with room for growth. Scored ${percentage}% (${grade}). ${weaknessCount} area(s) need attention.${coverage}`;
  }
  return `${who} candidate who needs more preparation. Scored ${percentage}% (${grade}). Focus on the ${weaknessCount} identified weakness area(s).${coverage}`;
}
