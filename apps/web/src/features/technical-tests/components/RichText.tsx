import { parseInlineMarkdown } from "../inline-markdown";

/** Scenario text with **bold** and `code` rendered as elements (never as HTML). */
export function RichText({ text }: { text: string | null | undefined }) {
  return (
    <>
      {parseInlineMarkdown(text ?? "").map((segment, i) => {
        if (segment.type === "strong") {
          return (
            <strong key={i} className="font-semibold text-text-primary">
              {segment.text}
            </strong>
          );
        }
        if (segment.type === "code") {
          return (
            <code key={i} className="rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-[0.85em] text-text-primary">
              {segment.text}
            </code>
          );
        }
        return <span key={i}>{segment.text}</span>;
      })}
    </>
  );
}
