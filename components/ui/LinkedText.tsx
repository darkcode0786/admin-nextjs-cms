import Link from "next/link";
import type { ReactNode } from "react";

const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

export function LinkedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(linkPattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const label = match[1];
    const href = match[2];
    const className = "font-semibold text-blue underline decoration-blue/45 underline-offset-2 hover:text-rose";
    nodes.push(
      href.startsWith("/") ? (
        <Link key={`${index}-${href}`} href={href} className={className}>
          {label}
        </Link>
      ) : (
        <a key={`${index}-${href}`} href={href} className={className}>
          {label}
        </a>
      ),
    );
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
