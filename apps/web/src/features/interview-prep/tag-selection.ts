import { MAX_SELECTED_TAGS, normalizeTag } from "@careerportal/shared/types";

/*
 * Tech-stack selection shared by interview setup and technical tests. Tags are
 * canonical TECH_TAG_CATALOG ids; the API rejects more than MAX_SELECTED_TAGS.
 */

export interface TagSelectionResult {
  tags: string[];
  /** True when some requested tags were not added because the cap was reached. */
  limited: boolean;
}

/** Add or remove one tag; adding beyond `max` is refused. */
export function toggleTagSelection(
  selected: readonly string[],
  tag: string,
  max = MAX_SELECTED_TAGS,
): TagSelectionResult {
  const id = normalizeTag(tag);
  if (selected.includes(id)) {
    return { tags: selected.filter((t) => t !== id), limited: false };
  }
  if (selected.length >= max) return { tags: [...selected], limited: true };
  return { tags: [...selected, id], limited: false };
}

/** Add several tags (e.g. "Select all" in a pathway) up to `max`, keeping order. */
export function addTagsToSelection(
  selected: readonly string[],
  tags: readonly string[],
  max = MAX_SELECTED_TAGS,
): TagSelectionResult {
  const next = [...selected];
  let limited = false;
  for (const tag of tags) {
    const id = normalizeTag(tag);
    if (next.includes(id)) continue;
    if (next.length >= max) {
      limited = true;
      break;
    }
    next.push(id);
  }
  return { tags: next, limited };
}

/** Remove every tag in `tags` from the selection. */
export function removeTagsFromSelection(
  selected: readonly string[],
  tags: readonly string[],
): string[] {
  const remove = new Set(tags.map(normalizeTag));
  return selected.filter((t) => !remove.has(t));
}
