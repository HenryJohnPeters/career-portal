import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { getErrorMessage, useCoverLetters } from "@careerportal/web/data-access";
import { ErrorState, Spinner } from "@careerportal/web/ui";
import { PageHero } from "../shared";
import { CoverLetterEditor } from "./CoverLetterEditor";
import { CoverLetterList } from "./CoverLetterList";

/**
 * Cover letters. The open letter lives in the URL (`?letter=<id>`) so links
 * (e.g. from the tracker or the Tailor kit) and Back work; `?new=1` opens the
 * create form.
 */
export function CoverLettersPage() {
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isFetching, isError, error, refetch } = useCoverLetters();
  const letters = data?.data ?? [];
  const selectedId = params.get("letter");
  const selected = selectedId ? letters.find((l) => l.id === selectedId) ?? null : null;
  const resolving = !!selectedId && !selected && isFetching;
  const refetchedFor = useRef<string | null>(null);

  // A link can point at a letter created since the list was cached (e.g. by
  // the Tailor kit): refetch once before treating the id as unknown. A deleted
  // or unknown letter then falls back to the list.
  useEffect(() => {
    if (!data || !selectedId || selected || isFetching) return;
    if (refetchedFor.current !== selectedId) {
      refetchedFor.current = selectedId;
      void refetch();
      return;
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("letter");
        return next;
      },
      { replace: true },
    );
  }, [data, selectedId, selected, isFetching, refetch, setParams]);

  const open = useCallback((id: string) => setParams({ letter: id }), [setParams]);
  const back = useCallback(() => setParams({}), [setParams]);

  if (isLoading || resolving) return <Spinner label="Loading your cover letters" />;
  // A failed background refetch keeps the cached list (and any open editor).
  if (isError && !data) {
    return (
      <ErrorState
        message={getErrorMessage(error, "Your cover letters couldn't be loaded.")}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Mail}
        title="Cover Letters"
        subtitle="Write letters that autosave, improve them with AI, and export them as PDF or text."
        stats={[{ value: letters.length, label: `Letter${letters.length !== 1 ? "s" : ""}` }]}
      />

      {selected ? (
        <CoverLetterEditor key={selected.id} letter={selected} onClose={back} />
      ) : (
        <CoverLetterList
          letters={letters}
          initialShowCreate={params.get("new") === "1"}
          onOpen={open}
        />
      )}
    </div>
  );
}
