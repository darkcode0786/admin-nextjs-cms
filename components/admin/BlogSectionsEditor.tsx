"use client";

import type { ArticleBlock, BlogSectionData, InlineTextSegment } from "@/data/blogTypes";
import ImageField from "./ImageField";

const input =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose";

export function textOf(segments?: InlineTextSegment[]) {
  if (!segments) return "";
  return segments
    .map((segment) => (typeof segment === "string" ? segment : "bold" in segment ? segment.bold : segment.text))
    .join("");
}

function asText(previous: InlineTextSegment[] | undefined, value: string): InlineTextSegment[] {
  if (textOf(previous) === value) return previous ?? [];
  return value ? [value] : [];
}

function blankBlock(kind: string): ArticleBlock {
  if (kind === "subheading") return { type: "subheading", content: [""] };
  if (kind === "list") return { type: "list", items: [[""]] };
  if (kind === "image") return { type: "image", src: "", alt: "" };
  if (kind === "faqs") return { type: "faqs", items: [{ question: [""], answer: [""] }] };
  if (kind === "table") return { type: "table", headers: ["", ""], rows: [["", ""]] };
  return { type: "paragraph", content: [""] };
}

function BlockFields({
  block,
  onChange,
}: {
  block: ArticleBlock;
  onChange: (block: ArticleBlock) => void;
}) {
  if (block.type === "paragraph") {
    return (
      <label className="block text-sm font-semibold">
        Paragraph
        <textarea className={`${input} mt-1 min-h-24`} value={textOf(block.content)} onChange={(e) => onChange({ ...block, content: asText(block.content, e.target.value) })} />
      </label>
    );
  }
  if (block.type === "lead") {
    return (
      <label className="block text-sm font-semibold">
        Intro text
        <textarea className={`${input} mt-1 min-h-24`} value={textOf(block.text)} onChange={(e) => onChange({ ...block, text: asText(block.text, e.target.value) })} />
      </label>
    );
  }
  if (block.type === "paragraphs") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Paragraphs</p>
        {block.items.map((item, index) => (
          <textarea
            key={index}
            className={`${input} min-h-20`}
            value={textOf(item)}
            onChange={(e) =>
              onChange({
                ...block,
                items: block.items.map((row, rowIndex) => (rowIndex === index ? asText(row, e.target.value) : row)),
              })
            }
          />
        ))}
        <button type="button" className="text-sm font-semibold text-rose" onClick={() => onChange({ ...block, items: [...block.items, [""]] })}>
          Add paragraph
        </button>
      </div>
    );
  }
  if (block.type === "subheading") {
    return (
      <label className="block text-sm font-semibold">
        Subheading
        <input className={`${input} mt-1`} value={textOf(block.content)} onChange={(e) => onChange({ ...block, content: asText(block.content, e.target.value) })} />
      </label>
    );
  }
  if (block.type === "list") {
    return (
      <label className="block text-sm font-semibold">
        {block.ordered ? "Numbered list" : "Bullet list"}
        <textarea
          className={`${input} mt-1 min-h-24`}
          value={block.items.map((item) => textOf(item)).join("\n")}
          onChange={(e) =>
            onChange({
              ...block,
              items: e.target.value.split("\n").map((line, index) => asText(block.items[index], line)),
            })
          }
        />
        <span className="mt-1 block text-xs font-medium text-ink/60">One point per line</span>
      </label>
    );
  }
  if (block.type === "image") {
    return (
      <div className="space-y-2">
        <ImageField label="Image" folder="blogs" value={block.src} onChange={(src) => onChange({ ...block, src })} />
        <label className="block text-sm font-semibold">
          Image description
          <input className={`${input} mt-1`} value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
        </label>
      </div>
    );
  }
  if (block.type === "faqs") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Questions</p>
        {block.items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-xl bg-white p-3">
            <input
              className={input}
              placeholder="Question"
              value={textOf(item.question)}
              onChange={(e) =>
                onChange({
                  ...block,
                  items: block.items.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, question: asText(row.question, e.target.value) } : row,
                  ),
                })
              }
            />
            <textarea
              className={`${input} min-h-20`}
              placeholder="Answer"
              value={textOf(item.answer)}
              onChange={(e) =>
                onChange({
                  ...block,
                  items: block.items.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, answer: asText(row.answer, e.target.value) } : row,
                  ),
                })
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-semibold text-rose"
          onClick={() => onChange({ ...block, items: [...block.items, { question: [""], answer: [""] }] })}
        >
          Add question
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Table</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.headers.length}, minmax(0, 1fr))` }}>
        {block.headers.map((header, index) => (
          <input
            key={index}
            className={input}
            value={header}
            placeholder="Column"
            onChange={(e) =>
              onChange({
                ...block,
                headers: block.headers.map((cell, cellIndex) => (cellIndex === index ? e.target.value : cell)),
              })
            }
          />
        ))}
      </div>
      {block.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.headers.length}, minmax(0, 1fr))` }}>
          {row.map((cell, cellIndex) => (
            <input
              key={cellIndex}
              className={input}
              value={cell}
              onChange={(e) =>
                onChange({
                  ...block,
                  rows: block.rows.map((current, currentIndex) =>
                    currentIndex === rowIndex
                      ? current.map((value, valueIndex) => (valueIndex === cellIndex ? e.target.value : value))
                      : current,
                  ),
                })
              }
            />
          ))}
        </div>
      ))}
      <button type="button" className="text-sm font-semibold text-rose" onClick={() => onChange({ ...block, rows: [...block.rows, block.headers.map(() => "")] })}>
        Add row
      </button>
    </div>
  );
}

export default function BlogSectionsEditor({
  sections,
  onChange,
}: {
  sections: BlogSectionData[];
  onChange: (sections: BlogSectionData[]) => void;
}) {
  function updateSection(index: number, section: BlogSectionData) {
    onChange(sections.map((item, itemIndex) => (itemIndex === index ? section : item)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Article sections</h3>
        <button
          type="button"
          className="text-sm font-semibold text-rose"
          onClick={() => onChange([...sections, { heading: ["New section"], blocks: [{ type: "paragraph", content: [""] }] }])}
        >
          Add section
        </button>
      </div>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3 rounded-xl border border-rose/15 bg-pink p-4">
          <label className="block text-sm font-semibold">
            Section heading
            <input
              className={`${input} mt-1`}
              value={textOf(section.heading)}
              onChange={(e) => {
                const value = e.target.value;
                updateSection(sectionIndex, {
                  ...section,
                  heading: textOf(section.heading) === value ? section.heading : value ? [value] : undefined,
                });
              }}
            />
          </label>
          {section.blocks.map((block, blockIndex) => (
            <div key={blockIndex} className="rounded-xl border border-rose/10 bg-pink p-3">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-rose"
                  onClick={() =>
                    updateSection(sectionIndex, {
                      ...section,
                      blocks: section.blocks.filter((_, index) => index !== blockIndex),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <BlockFields
                block={block}
                onChange={(next) =>
                  updateSection(sectionIndex, {
                    ...section,
                    blocks: section.blocks.map((item, index) => (index === blockIndex ? next : item)),
                  })
                }
              />
            </div>
          ))}
          <label className="block text-sm font-semibold">
            Add to this section
            <select
              className={`${input} mt-1`}
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                updateSection(sectionIndex, { ...section, blocks: [...section.blocks, blankBlock(e.target.value)] });
              }}
            >
              <option value="">Choose a content type</option>
              <option value="paragraph">Paragraph</option>
              <option value="subheading">Subheading</option>
              <option value="list">Bullet list</option>
              <option value="image">Image</option>
              <option value="faqs">Questions and answers</option>
              <option value="table">Table</option>
            </select>
          </label>
          <button type="button" className="text-xs font-semibold text-rose" onClick={() => onChange(sections.filter((_, index) => index !== sectionIndex))}>
            Remove section
          </button>
        </div>
      ))}
    </div>
  );
}
