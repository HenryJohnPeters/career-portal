import { useState, useCallback, useEffect } from "react";
import { PIPELINE_COLUMNS } from "../constants";
import type { PipelineStatus, PipelineColumn } from "../constants";

const STORAGE_KEY = "tracker-column-config";

interface ColumnConfig {
  /** Ordered list of visible column IDs */
  visibleIds: PipelineStatus[];
}

function loadConfig(): ColumnConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ColumnConfig;
      // Validate: keep only IDs that still exist in PIPELINE_COLUMNS
      const validIds = new Set(PIPELINE_COLUMNS.map((c) => c.id));
      const visibleIds = parsed.visibleIds.filter((id) => validIds.has(id));
      if (visibleIds.length > 0) return { visibleIds };
    }
  } catch {
    // ignore
  }
  // Default: all columns in original order
  return { visibleIds: PIPELINE_COLUMNS.map((c) => c.id) };
}

function saveConfig(config: ColumnConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useColumnConfig() {
  const [config, setConfig] = useState<ColumnConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  /** The currently visible columns in order */
  const visibleColumns: PipelineColumn[] = config.visibleIds
    .map((id) => PIPELINE_COLUMNS.find((c) => c.id === id)!)
    .filter(Boolean);

  /** Columns that have been hidden */
  const hiddenColumns: PipelineColumn[] = PIPELINE_COLUMNS.filter(
    (c) => !config.visibleIds.includes(c.id)
  );

  /** Remove a column from the board */
  const removeColumn = useCallback((id: PipelineStatus) => {
    setConfig((prev) => ({
      visibleIds: prev.visibleIds.filter((v) => v !== id),
    }));
  }, []);

  /** Add a column back (appended at end by default, or at a specific index) */
  const addColumn = useCallback((id: PipelineStatus, atIndex?: number) => {
    setConfig((prev) => {
      if (prev.visibleIds.includes(id)) return prev;
      const next = [...prev.visibleIds];
      if (atIndex !== undefined) {
        next.splice(atIndex, 0, id);
      } else {
        next.push(id);
      }
      return { visibleIds: next };
    });
  }, []);

  /** Move a column from one index to another */
  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const next = [...prev.visibleIds];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { visibleIds: next };
    });
  }, []);

  /** Reset to default (all columns, original order) */
  const resetColumns = useCallback(() => {
    setConfig({ visibleIds: PIPELINE_COLUMNS.map((c) => c.id) });
  }, []);

  return {
    visibleColumns,
    hiddenColumns,
    visibleIds: config.visibleIds,
    removeColumn,
    addColumn,
    moveColumn,
    resetColumns,
  };
}
