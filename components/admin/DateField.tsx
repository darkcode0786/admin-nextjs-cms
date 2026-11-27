"use client";

import { useState } from "react";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toIso(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

function fromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (displayDate: string) => void;
}) {
  const iso = toIso(value);
  const selected = iso ? new Date(`${iso}T00:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => 0),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-rose/25 bg-white px-3 py-2 text-left text-sm text-ink"
      >
        <span>{value || "Choose a date"}</span>
        <span aria-hidden className="text-rose">▾</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-72 rounded-2xl border border-rose/20 bg-white p-3 shadow-[0_12px_30px_rgba(232,62,116,0.12)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-rose" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              ‹
            </button>
            <p className="text-sm font-semibold text-ink">
              {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-rose" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink/60">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const cellIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const active = cellIso === iso;
              return (
                <button
                  key={cellIso}
                  type="button"
                  onClick={() => {
                    onChange(fromIso(cellIso));
                    setOpen(false);
                  }}
                  className="rounded-lg py-1.5 text-sm"
                  style={{
                    background: active ? "var(--rose)" : "#ffffff",
                    color: active ? "#ffffff" : "var(--ink)",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
