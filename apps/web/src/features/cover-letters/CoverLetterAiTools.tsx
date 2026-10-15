import { useState } from "react";
import { ArrowRight, CheckCircle2, Lightbulb, Loader2, RefreshCw, Sparkles, Wand2, X } from "lucide-react";
import type { CoverLetterTone } from "@careerportal/shared/types";
import { useRewriteCoverLetter, useSuggestCoverLetter } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import {
  AiLimitReachedCard,
  AiUsesLeft,
  EMPTY_AI_RESULT,
  aiErrorMessage,
  usePlanStatus,
} from "../ai-assist";
import { cvChoiceToRequest, type CvChoice } from "./cv-choice";

const TOOL_BUTTON =
  "relative flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent-muted/50 p-3.5 text-left hover:shadow-md hover:shadow-accent/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

/**
 * Suggest improvements / rewrite in a tone. Works on the editor text and is
 * available to free users while they have AI actions left (the API counts it
 * against the same monthly allowance).
 */
export function CoverLetterAiTools({
  letterId,
  body,
  cvChoice,
  onApplyRewrite,
}: {
  letterId: string;
  body: string;
  cvChoice: CvChoice;
  onApplyRewrite: (text: string) => void;
}) {
  const plan = usePlanStatus();
  const suggest = useSuggestCoverLetter({ silent: true });
  const rewrite = useRewriteCoverLetter({ silent: true });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = suggest.isPending || rewrite.isPending;
  const hasBody = body.trim().length > 0;
  const { useCv } = cvChoiceToRequest(cvChoice);

  const handleSuggest = async () => {
    setError(null);
    setSuggestions([]);
    try {
      const res = await suggest.mutateAsync({ id: letterId, currentBody: body, useCv });
      const items = (Array.isArray(res.data) ? res.data : []).filter(
        (s): s is string => typeof s === "string" && s.trim().length > 0,
      );
      if (items.length === 0) setError(EMPTY_AI_RESULT);
      setSuggestions(items);
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  const handleRewrite = async (tone: CoverLetterTone) => {
    setError(null);
    setRewriteResult(null);
    try {
      const res = await rewrite.mutateAsync({ id: letterId, tone, currentBody: body, useCv });
      const text = typeof res.data === "string" ? res.data.trim() : "";
      if (text) setRewriteResult(text);
      else setError(EMPTY_AI_RESULT);
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  return (
    <section
      aria-labelledby="cover-letter-ai-tools"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h3 id="cover-letter-ai-tools" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Improve what you've written
          </h3>
        </div>
        <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} />
      </div>

      {!plan.hasAiUsesLeft ? (
        <AiLimitReachedCard meter={plan.aiMeter} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" className={TOOL_BUTTON} onClick={() => void handleSuggest()} disabled={busy || !hasBody}>
            {suggest.isPending ? (
              <Loader2 className="h-5 w-5 text-accent shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Lightbulb className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
            )}
            <span>
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Suggest</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400">Get improvements</span>
            </span>
          </button>
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => void handleRewrite("professional")}
            disabled={busy || !hasBody}
          >
            <Wand2 className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
            <span>
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Professional</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400">Formal rewrite</span>
            </span>
          </button>
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => void handleRewrite("friendly")}
            disabled={busy || !hasBody}
          >
            <RefreshCw className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
            <span>
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Friendly</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400">Warmer rewrite</span>
            </span>
          </button>
        </div>
      )}
      {!hasBody && plan.hasAiUsesLeft && (
        <p className="text-[11px] text-text-tertiary">Write or paste your letter first, or generate one below.</p>
      )}
      {rewrite.isPending && (
        <p role="status" className="flex items-center gap-2 text-xs text-accent-dark dark:text-accent">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Rewriting your letter…
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              Suggestions
            </h4>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              aria-label="Dismiss suggestions"
              className="rounded-md p-1 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rewriteResult && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              Rewritten version
            </h4>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={() => {
                  onApplyRewrite(rewriteResult);
                  setRewriteResult(null);
                }}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                Apply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRewriteResult(null)}>
                Discard
              </Button>
            </div>
          </div>
          <pre className="max-h-72 overflow-y-auto text-xs text-text-secondary whitespace-pre-wrap leading-relaxed bg-bg-tertiary rounded-lg p-4 border border-border font-sans">
            {rewriteResult}
          </pre>
        </div>
      )}
    </section>
  );
}
