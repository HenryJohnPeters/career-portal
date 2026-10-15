import { MAX_SELECTED_TAGS, findTechTag, type TechTag } from "../../common/tech-tags";

/**
 * Catalog tags only: canonical, de-duplicated, capped. Free-text tags never
 * reach a prompt or the shared question bank.
 */
export function catalogTags(
  raw: readonly unknown[] | null | undefined,
  max: number = MAX_SELECTED_TAGS,
): TechTag[] {
  const out: TechTag[] = [];
  const seen = new Set<string>();
  for (const value of raw ?? []) {
    if (typeof value !== "string") continue;
    const tag = findTechTag(value);
    if (!tag || seen.has(tag.id)) continue;
    seen.add(tag.id);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SPELLING_PATTERNS = new Map<string, RegExp[]>();

function spellingPatterns(tag: TechTag): RegExp[] {
  let patterns = SPELLING_PATTERNS.get(tag.id);
  if (!patterns) {
    const spellings = new Set(
      [tag.id, tag.label, ...(tag.aliases ?? [])].map((s) =>
        s.trim().replace(/\s+/g, " ").toLowerCase(),
      ),
    );
    // Whole-word match that also works for "c#", ".net" and "node.js".
    patterns = [...spellings].map(
      (s) => new RegExp(`(?<![a-z0-9])${escapeRegExp(s)}(?![a-z0-9])`),
    );
    SPELLING_PATTERNS.set(tag.id, patterns);
  }
  return patterns;
}

/** Does `text` mention the tag (id, label or alias) as a whole word, case-insensitively? */
export function mentionsTag(text: string, tag: TechTag): boolean {
  const haystack = text.toLowerCase().replace(/\s+/g, " ");
  return spellingPatterns(tag).some((pattern) => pattern.test(haystack));
}
