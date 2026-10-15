import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JobStatus } from "@careerportal/shared/types";
import { readStorage, writeStorage } from "../../../lib/storage";
import { PIPELINE_COLUMNS, type PipelineColumn } from "../constants";

const STORAGE_KEY = "tracker-column-config";
const DEFAULT_IDS: readonly JobStatus[] = PIPELINE_COLUMNS.map((c) => c.id);
const KNOWN_IDS: ReadonlySet<string> = new Set(DEFAULT_IDS);

/** Visible column ids from storage: known ids only, no duplicates; defaults otherwise. */
export function parseColumnConfig(raw: string | null): JobStatus[] {
  if (!raw) return [...DEFAULT_IDS];
  try {
    const parsed: unknown = JSON.parse(raw);
    const ids = (parsed as { visibleIds?: unknown } | null)?.visibleIds;
    if (!Array.isArray(ids)) return [...DEFAULT_IDS];
    const valid = [...new Set(ids.filter((id): id is JobStatus => typeof id === "string" && KNOWN_IDS.has(id)))];
    return valid.length > 0 ? valid : [...DEFAULT_IDS];
  } catch {
    return [...DEFAULT_IDS];
  }
}

/** Which board columns are shown and in what order; remembered on this device. */
export function useColumnConfig() {
  const [visibleIds, setVisibleIds] = useState<JobStatus[]>(() => parseColumnConfig(readStorage(STORAGE_KEY)));

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    writeStorage(STORAGE_KEY, JSON.stringify({ visibleIds }));
  }, [visibleIds]);

  const visibleColumns = useMemo(
    () =>
      visibleIds
        .map((id) => PIPELINE_COLUMNS.find((c) => c.id === id))
        .filter((c): c is PipelineColumn => c !== undefined),
    [visibleIds],
  );
  const hiddenColumns = useMemo(
    () => PIPELINE_COLUMNS.filter((c) => !visibleIds.includes(c.id)),
    [visibleIds],
  );

  /** Hide a column (the last visible one cannot be hidden). */
  const removeColumn = useCallback((id: JobStatus) => {
    setVisibleIds((prev) => (prev.length <= 1 ? prev : prev.filter((v) => v !== id)));
  }, []);

  /** Show a column again (appended, or at `atIndex`). */
  const addColumn = useCallback((id: JobStatus, atIndex?: number) => {
    setVisibleIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev];
      next.splice(atIndex ?? next.length, 0, id);
      return next;
    });
  }, []);

  /** Show several columns at once (e.g. those holding matching applications). */
  const showColumns = useCallback((ids: readonly JobStatus[]) => {
    setVisibleIds((prev) => {
      const missing = ids.filter((id) => !prev.includes(id));
      if (missing.length === 0) return prev;
      // Restored columns are appended in pipeline order.
      return [...prev, ...DEFAULT_IDS.filter((id) => missing.includes(id))];
    });
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setVisibleIds((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => setVisibleIds([...DEFAULT_IDS]), []);

  return {
    visibleColumns,
    hiddenColumns,
    visibleIds,
    removeColumn,
    addColumn,
    showColumns,
    moveColumn,
    resetColumns,
  };
}
