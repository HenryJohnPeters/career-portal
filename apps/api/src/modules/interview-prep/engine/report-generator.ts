import { computeGrade } from "../../../common/grade.util";

// Define the report interface locally to avoid importing from outside rootDir
interface InterviewReport {
  overallScore: number;
  maxPossibleScore: number;
  percentage: number;
  grade: string;
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

interface ScoredQuestion {
  questionId: string;
  prompt: string;
  type: string;
  score: number;
  maxScore: number;
  pointsMissed: string[];
  tags: string[];
}

/**
 * Generates a deterministic final interview report from session data.
 * Analyses strengths, weaknesses, missed topics, and suggests study areas.
 */
export class ReportGenerator {
  generate(
    track: string,
    level: string,
    scoredQuestions: ScoredQuestion[]
  ): InterviewReport {
    const overallScore = scoredQuestions.reduce((s, q) => s + q.score, 0);
    const maxPossibleScore = scoredQuestions.reduce(
      (s, q) => s + q.maxScore,
      0
    );
    const percentage =
      maxPossibleScore > 0
        ? Math.round((overallScore / maxPossibleScore) * 1000) / 10
        : 0;

    const grade = this.computeGrade(percentage);
    const strengths = this.findStrengths(scoredQuestions);
    const weaknesses = this.findWeaknesses(scoredQuestions);
    const missedTopics = this.findMissedTopics(scoredQuestions);
    const suggestedStudyAreas = this.suggestStudyAreas(scoredQuestions);

    const questionBreakdown = scoredQuestions.map((q) => ({
      questionId: q.questionId,
      prompt: q.prompt,
      type: q.type,
      score: q.score,
      maxScore: q.maxScore,
    }));

    const trackSummary = this.buildTrackSummary(
      track,
      level,
      percentage,
      grade,
      strengths.length,
      weaknesses.length
    );

    return {
      overallScore,
      maxPossibleScore,
      percentage,
      grade,
      strengths,
      weaknesses,
      missedTopics,
      suggestedStudyAreas,
      questionBreakdown,
      trackSummary,
    };
  }

  private computeGrade(percentage: number): string {
    return computeGrade(percentage);
  }

  private findStrengths(questions: ScoredQuestion[]): string[] {
    const strengths: string[] = [];
    const typeScores = new Map<string, { total: number; max: number }>();

    for (const q of questions) {
      const existing = typeScores.get(q.type) || { total: 0, max: 0 };
      existing.total += q.score;
      existing.max += q.maxScore;
      typeScores.set(q.type, existing);
    }

    for (const [type, { total, max }] of typeScores) {
      if (max > 0 && total / max >= 0.7) {
        strengths.push(`Strong in ${type} questions`);
      }
    }

    // Tag-level strengths
    const tagScores = new Map<string, { total: number; max: number }>();
    for (const q of questions) {
      const ratio = q.maxScore > 0 ? q.score / q.maxScore : 0;
      if (ratio >= 0.7) {
        for (const tag of q.tags) {
          const existing = tagScores.get(tag) || { total: 0, max: 0 };
          existing.total += q.score;
          existing.max += q.maxScore;
          tagScores.set(tag, existing);
        }
      }
    }

    for (const [tag, { total, max }] of tagScores) {
      if (max > 0 && total / max >= 0.7) {
        strengths.push(`Good knowledge of ${tag}`);
      }
    }

    return strengths.slice(0, 5);
  }

  private findWeaknesses(questions: ScoredQuestion[]): string[] {
    const weaknesses: string[] = [];
    const typeScores = new Map<string, { total: number; max: number }>();

    for (const q of questions) {
      const existing = typeScores.get(q.type) || { total: 0, max: 0 };
      existing.total += q.score;
      existing.max += q.maxScore;
      typeScores.set(q.type, existing);
    }

    for (const [type, { total, max }] of typeScores) {
      if (max > 0 && total / max < 0.5) {
        weaknesses.push(`Needs improvement in ${type} questions`);
      }
    }

    return weaknesses.slice(0, 5);
  }

  private findMissedTopics(questions: ScoredQuestion[]): string[] {
    const allMissed = new Set<string>();
    for (const q of questions) {
      for (const point of q.pointsMissed) {
        allMissed.add(point);
      }
    }
    return Array.from(allMissed).slice(0, 10);
  }

  private suggestStudyAreas(questions: ScoredQuestion[]): string[] {
    const weakTags = new Map<string, number>();

    for (const q of questions) {
      const ratio = q.maxScore > 0 ? q.score / q.maxScore : 0;
      if (ratio < 0.5) {
        for (const tag of q.tags) {
          weakTags.set(tag, (weakTags.get(tag) || 0) + 1);
        }
      }
    }

    // Sort by frequency of weakness
    const sorted = Array.from(weakTags.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const suggestions: string[] = [];
    if (sorted.length > 0) {
      suggestions.push(`Deep-dive into: ${sorted.slice(0, 3).join(", ")}`);
    }

    // Suggest by question type weakness
    const typeScores = new Map<string, { total: number; max: number }>();
    for (const q of questions) {
      const existing = typeScores.get(q.type) || { total: 0, max: 0 };
      existing.total += q.score;
      existing.max += q.maxScore;
      typeScores.set(q.type, existing);
    }

    for (const [type, { total, max }] of typeScores) {
      if (max > 0 && total / max < 0.5) {
        suggestions.push(`Practice more ${type} problems`);
      }
    }

    return suggestions.slice(0, 5);
  }

  private buildTrackSummary(
    track: string,
    level: string,
    percentage: number,
    grade: string,
    strengthCount: number,
    weaknessCount: number
  ): string {
    const trackLabel = track.charAt(0).toUpperCase() + track.slice(1);
    const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

    if (percentage >= 80) {
      return `Strong ${levelLabel} ${trackLabel} candidate. Scored ${percentage}% (${grade}). Demonstrated ${strengthCount} key strengths with minimal weaknesses.`;
    }
    if (percentage >= 60) {
      return `Competent ${levelLabel} ${trackLabel} candidate with room for growth. Scored ${percentage}% (${grade}). ${weaknessCount} area(s) need attention.`;
    }
    return `${levelLabel} ${trackLabel} candidate needs significant preparation. Scored ${percentage}% (${grade}). Focus on the ${weaknessCount} identified weakness area(s).`;
  }
}
