import { useMemo } from "react";
import { parseInline, parseRichText, type InlinePart } from "../rich-text";

const INLINE_CODE_CLASS =
  "rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-[0.9em] text-text-primary";

function InlineParts({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.code ? (
          <code key={i} className={INLINE_CODE_CLASS}>
            {part.text}
          </code>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** Question/answer text with code snippets (rendered as text nodes, never HTML). */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = useMemo(() => parseRichText(text), [text]);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, i) =>
        block.kind === "code" ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-left text-[13px] font-normal leading-relaxed text-neutral-100"
            aria-label={block.language ? `${block.language} code` : "Code"}
          >
            <code>{block.code}</code>
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-line">
            <InlineParts parts={block.parts} />
          </p>
        ),
      )}
    </div>
  );
}

/** Single-line contexts (answer options): inline `code` only. */
export function InlineRichText({ text }: { text: string }) {
  const parts = useMemo(() => parseInline(text), [text]);
  return <InlineParts parts={parts} />;
}
