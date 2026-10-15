import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getErrorMessage,
  queryKeys,
  useUpdateCvVersion,
} from "@careerportal/web/data-access";
import type {
  ApiResponse,
  CvVersion,
  TemplateId,
  ThemeConfig,
} from "@careerportal/shared/types";
import { DEFAULT_THEME_CONFIG } from "@careerportal/shared/types/cv-templates";
import { showToast } from "../../../lib/toast";
import { PatchBuffer } from "../lib/patch-buffer";
import type { ContactKey } from "../lib/contact";
import { useLatestRef, useStoreSelector } from "./useStoreSelector";

export type ContactPatch = Partial<Record<ContactKey, string>> & { headerLayout?: string };
export type ContactBuffer = PatchBuffer<ContactPatch>;

function resolveTheme(version: CvVersion | undefined): ThemeConfig {
  return {
    ...DEFAULT_THEME_CONFIG,
    ...((version?.themeConfig ?? {}) as Partial<ThemeConfig>),
  };
}

/** The theme as cached now — includes optimistic updates from earlier PATCHes. */
function cachedTheme(qc: QueryClient, versionId: string): ThemeConfig {
  const versions = qc.getQueryData<ApiResponse<CvVersion[]>>(queryKeys.cvVersions);
  return resolveTheme(versions?.data.find((v) => v.id === versionId));
}

/**
 * Contact details, theme and template of one CV version. Contact and theme
 * edits are buffered (600ms / 400ms) into single PATCHes — one request after
 * the user stops typing or dragging — and flushed on unmount and before export.
 */
export function useCvDesign(version: CvVersion) {
  const qc = useQueryClient();
  const versionId = version.id;
  // Contact errors show inline in the panel; theme/template errors (incl. the
  // premium-template upgrade prompt) go through the global handler.
  const contactUpdate = useUpdateCvVersion({ silent: true });
  const versionUpdate = useUpdateCvVersion();
  const sendContact = useLatestRef(contactUpdate.mutateAsync);
  const sendVersion = useLatestRef(versionUpdate.mutateAsync);

  const [contact] = useState<ContactBuffer>(
    () =>
      new PatchBuffer<ContactPatch>({
        delayMs: 600,
        send: (patch) => sendContact.current({ id: versionId, ...patch }),
        describeError: (err) => getErrorMessage(err, "Couldn't save your contact details."),
        onBackgroundError: (message) =>
          showToast("error", `Your contact details couldn't be saved: ${message}`),
      }),
  );
  const [theme] = useState(
    () =>
      new PatchBuffer<Partial<ThemeConfig>>({
        delayMs: 400,
        // Merge at send time so the PATCH carries every earlier change too.
        send: (patch) =>
          sendVersion.current({
            id: versionId,
            themeConfig: { ...cachedTheme(qc, versionId), ...patch },
          }),
        describeError: (err) => getErrorMessage(err, "Couldn't save the theme."),
      }),
  );

  useEffect(
    () => () => {
      contact.dispose();
      theme.dispose();
    },
    [contact, theme],
  );

  const unsavedTheme = useStoreSelector(theme, (s) => s.unsaved);
  const resolvedTheme = useMemo(
    () => ({ ...resolveTheme(version), ...unsavedTheme }),
    [version, unsavedTheme],
  );

  const updateTheme = useCallback((patch: Partial<ThemeConfig>) => theme.add(patch), [theme]);

  const setTemplate = useCallback(
    (templateId: TemplateId) => {
      if (templateId === version.templateId) return;
      versionUpdate.mutate({ id: versionId, templateId });
    },
    [version.templateId, versionId, versionUpdate],
  );

  const flush = useCallback(async () => {
    const results = await Promise.all([contact.flush(), theme.flush()]);
    return results.every(Boolean);
  }, [contact, theme]);

  const hasUnsavedChanges = useCallback(
    () => contact.hasUnsavedChanges() || theme.hasUnsavedChanges(),
    [contact, theme],
  );

  return {
    contact,
    resolvedTheme,
    updateTheme,
    setTemplate,
    flush,
    hasUnsavedChanges,
  };
}
