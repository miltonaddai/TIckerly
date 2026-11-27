import { Fragment, type ReactNode } from "react";

function normalizeMarkdown(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+\*\s+(?=\*\*)/g, "$1\n* ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const segment = match[0];
    if (segment.startsWith("**")) {
      nodes.push(<strong key={index}>{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith("`")) {
      nodes.push(
        <code key={index} className="rounded bg-white/10 px-1 py-0.5 text-[0.85em]">
          {segment.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={index}>{segment.slice(1, -1)}</em>);
    }
    index += 1;
    last = match.index + segment.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isBullet(line: string) {
  return /^[-*]\s+/.test(line);
}

function isOrdered(line: string) {
  return /^\d+\.\s+/.test(line);
}

export function ChatMarkdown({ text }: { text: string }) {
  const source = normalizeMarkdown(text);
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    if (isBullet(line) || isOrdered(line)) {
      const ordered = isOrdered(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? isOrdered(lines[i]) : isBullet(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
        i += 1;
      }
      i -= 1;
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={index} className={ordered ? "list-decimal space-y-1.5 pl-4" : "list-disc space-y-1.5 pl-4"}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{parseInline(item)}</li>
          ))}
        </List>,
      );
      index += 1;
      continue;
    }

    const paragraph: string[] = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() && !isBullet(lines[i + 1]) && !isOrdered(lines[i + 1])) {
      i += 1;
      paragraph.push(lines[i]);
    }
    blocks.push(
      <p key={index}>
        {paragraph.map((chunk, chunkIndex) => (
          <Fragment key={chunkIndex}>
            {chunkIndex ? <br /> : null}
            {parseInline(chunk)}
          </Fragment>
        ))}
      </p>,
    );
    index += 1;
  }

  return <div className="space-y-2">{blocks}</div>;
}
