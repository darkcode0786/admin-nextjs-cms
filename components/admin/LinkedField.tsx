"use client";

import { useRef } from "react";
import { LuLink } from "react-icons/lu";

const fieldClass =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose";

export default function LinkedField({
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const field = useRef<HTMLTextAreaElement>(null);

  function addLink() {
    const element = field.current;
    if (!element) return;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    if (!selected.trim()) {
      window.alert("Select the words you want to link.");
      return;
    }
    const href = window.prompt("Link address", "/");
    if (!href) return;
    onChange(`${value.slice(0, start)}[${selected}](${href})${value.slice(end)}`);
  }

  return (
    <div className="flex items-start gap-2">
      <textarea
        ref={field}
        rows={rows}
        className={`${fieldClass} min-w-0 flex-1 resize-y`}
        value={value}
        placeholder={placeholder || "Write here"}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        title="Link selected words"
        aria-label="Link selected words"
        onMouseDown={(event) => event.preventDefault()}
        onClick={addLink}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-rose/30 bg-white text-ink"
      >
        <LuLink />
      </button>
    </div>
  );
}
