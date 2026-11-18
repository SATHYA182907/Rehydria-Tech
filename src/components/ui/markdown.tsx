import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Minimal, safe Markdown renderer for admin-authored text (course descriptions, policies,
 * announcements). It produces React elements only (no HTML injection), supporting:
 * headings (##, ###), paragraphs, bullet and numbered lists, **bold**, *italic*, `code` and
 * [links](https://…). Links are restricted to http(s), mailto, tel and site-relative paths.
 */

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;
    if (match[2]) out.push(<strong key={key}>{match[2]}</strong>);
    else if (match[3]) out.push(<em key={key}>{match[3]}</em>);
    else if (match[4]) out.push(<code key={key} className="rounded-xs bg-canvas-2 px-1 py-0.5 font-mono text-[0.9em]">{match[4]}</code>);
    else if (match[5] && match[6]) {
      const href = match[6];
      out.push(
        SAFE_HREF.test(href) ? (
          <a key={key} href={href} className="text-moss-text underline underline-offset-4" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {match[5]}
          </a>
        ) : (
          match[5]
        ),
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={cn("flex flex-col gap-5 leading-relaxed text-ink-soft [&_strong]:text-ink", className)}>
      {blocks.map((block, b) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;
        const first = lines[0]!;
        if (first.startsWith("### ")) return <h3 key={b} className="mt-2 text-xl font-medium text-ink">{inline(first.slice(4), `h${b}`)}</h3>;
        if (first.startsWith("## ")) return <h2 key={b} className="mt-4 text-2xl font-medium tracking-tight text-ink">{inline(first.slice(3), `h${b}`)}</h2>;
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={b} className="flex list-disc flex-col gap-2 pl-5 marker:text-moss">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-*] /, ""), `u${b}-${i}`)}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)] /.test(l))) {
          return (
            <ol key={b} className="flex list-decimal flex-col gap-2 pl-5 marker:text-moss">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+[.)] /, ""), `o${b}-${i}`)}</li>)}
            </ol>
          );
        }
        return (
          <p key={b}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, `p${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
