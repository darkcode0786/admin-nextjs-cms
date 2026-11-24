"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  LuBold,
  LuChevronDown,
  LuChevronRight,
  LuHeading2,
  LuHeading3,
  LuImage,
  LuItalic,
  LuLink,
  LuList,
  LuListChecks,
  LuListOrdered,
  LuRedo2,
  LuUndo2,
} from "react-icons/lu";
import { Extension } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextSelection } from "@tiptap/pm/state";

function blockDepth(editor: Editor, names: string[]) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if (names.includes($from.node(depth).type.name)) return depth;
  }
  return null;
}

const PlainLineAfter = Extension.create({
  name: "plainLineAfter",
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parentOffset !== $from.parent.content.size) return false;

        const headingDepth = editor.isActive("heading") ? blockDepth(editor, ["heading"]) : null;
        const itemDepth = blockDepth(editor, ["taskItem", "listItem"]);
        const depth = headingDepth || itemDepth;
        if (!depth) return false;

        if (itemDepth && !$from.parent.textContent) {
          const name = $from.node(itemDepth).type.name as "taskItem" | "listItem";
          return editor.commands.liftListItem(name);
        }

        const after = $from.after(depth);
        return editor
          .chain()
          .command(({ tr, state }) => {
            const paragraph = state.schema.nodes.paragraph.create();
            tr.insert(after, paragraph);
            tr.setSelection(TextSelection.create(tr.doc, after + 1));
            return true;
          })
          .run();
      },
    };
  },
});

const ArticleHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
      },
      tocLabel: {
        default: null,
        parseHTML: (element) => (element.hasAttribute("data-toc") ? element.getAttribute("data-toc") || "" : null),
        renderHTML: (attributes) =>
          attributes.tocLabel === null || attributes.tocLabel === undefined
            ? {}
            : { "data-toc": attributes.tocLabel },
      },
    };
  },
});

type TocRow = {
  pos: number;
  level: number;
  text: string;
  id: string;
  tocLabel: string;
};

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "section";
}

function readToc(editor: Editor): TocRow[] {
  const used = new Set<string>();
  const rows: TocRow[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return;
    const text = node.textContent.trim();
    let id = (node.attrs.id as string | null) || "";
    if (!id) {
      const base = slugify(text);
      id = base;
      let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
    }
    used.add(id);
    rows.push({
      pos,
      level: node.attrs.level as number,
      text,
      id,
      tocLabel: node.attrs.tocLabel === "" ? "" : ((node.attrs.tocLabel as string | null) || text),
    });
  });
  return rows;
}

function ToolButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border text-base"
      style={{
        borderColor: "var(--rose)",
        background: active ? "var(--rose)" : "#ffffff",
        color: active ? "#ffffff" : "var(--ink)",
      }}
    >
      {children}
    </button>
  );
}

export default function ArticleEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const [tocOpen, setTocOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, link: false }),
      PlainLineAfter,
      TaskList,
      TaskItem.configure({ nested: true }),
      ArticleHeading.configure({ levels: [2, 3] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: html || "<p></p>",
    editorProps: {
      attributes: { class: "cms-article-body" },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (html && html !== current && !editor.isFocused) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [editor, html]);

  async function insertImage(file: File) {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "blogs");
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    if (!response.ok || !editor) return;
    editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
  }

  function markHeading(level: 2 | 3) {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (!empty) {
      const text = editor.state.doc.textBetween(from, to, " ").replace(/\s+/g, " ").trim();
      if (!text) return;
      const taken = new Set(readToc(editor).map((row) => row.id));
      const base = slugify(text) || "section";
      let id = base;
      let n = 2;
      while (taken.has(id)) id = `${base}-${n++}`;
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, {
          type: "heading",
          attrs: { level, id, tocLabel: text },
          content: [{ type: "text", text }],
        })
        .run();
      return;
    }

    const parent = editor.state.selection.$from.parent;
    const alreadyHeading = parent.type.name === "heading";
    const hasText = parent.textContent.trim().length > 0;

    if (!alreadyHeading && hasText) {
      const taken = new Set(readToc(editor).map((row) => row.id));
      let id = "section";
      let n = 2;
      while (taken.has(id)) id = `section-${n++}`;
      const pos = editor.state.selection.$from.before();
      editor
        .chain()
        .focus()
        .insertContentAt(pos, {
          type: "heading",
          attrs: { level, id, tocLabel: "New heading" },
          content: [{ type: "text", text: "New heading" }],
        })
        .run();
      return;
    }

    editor.chain().focus().toggleHeading({ level }).run();
    const next = editor.state.selection.$from.parent;
    if (next.type.name !== "heading" || next.attrs.id) return;
    const text = next.textContent.trim() || "Section";
    const taken = new Set(readToc(editor).map((row) => row.id));
    let id = slugify(text);
    let n = 2;
    while (taken.has(id)) id = `${slugify(text)}-${n++}`;
    const pos = editor.state.selection.$from.before();
    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { ...next.attrs, level, id, tocLabel: text });
      return true;
    });
  }

  function updateToc(row: TocRow, next: { included: boolean; label: string }) {
    if (!editor) return;
    editor.commands.command(({ tr }) => {
      const node = tr.doc.nodeAt(row.pos);
      if (!node) return false;
      tr.setNodeMarkup(row.pos, undefined, {
        ...node.attrs,
        id: row.id,
        tocLabel: next.included ? next.label || row.text : "",
      });
      return true;
    });
  }

  if (!editor) {
    return <div className="min-h-[420px] rounded-2xl border border-rose/20 bg-white" />;
  }

  const toc = readToc(editor);

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-2xl border border-rose/20 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-rose/15 bg-pink p-3">
          <ToolButton active={editor.isActive("heading", { level: 2 })} label="Heading" onClick={() => markHeading(2)}><LuHeading2 /></ToolButton>
          <ToolButton active={editor.isActive("heading", { level: 3 })} label="Subheading" onClick={() => markHeading(3)}><LuHeading3 /></ToolButton>
          <ToolButton active={editor.isActive("bold")} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><LuBold /></ToolButton>
          <ToolButton active={editor.isActive("italic")} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><LuItalic /></ToolButton>
          <ToolButton active={editor.isActive("bulletList")} label="Bullets" onClick={() => editor.chain().focus().toggleBulletList().run()}><LuList /></ToolButton>
          <ToolButton
            active={editor.isActive("taskList")}
            label="Checklist"
            onClick={() => {
              const chain = editor.chain().focus();
              if (editor.isActive("taskList")) {
                chain.toggleTaskList().run();
                return;
              }
              if (editor.isActive("bulletList")) chain.toggleBulletList();
              if (editor.isActive("orderedList")) chain.toggleOrderedList();
              chain.toggleTaskList().run();
            }}
          >
            <LuListChecks />
          </ToolButton>
          <ToolButton active={editor.isActive("orderedList")} label="Numbers" onClick={() => editor.chain().focus().toggleOrderedList().run()}><LuListOrdered /></ToolButton>
          <ToolButton
            active={editor.isActive("link")}
            label="Link"
            onClick={() => {
              const previous = editor.getAttributes("link").href as string | undefined;
              const href = window.prompt("Link address", previous || "https://");
              if (href === null) return;
              if (!href) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }}
          >
            <LuLink />
          </ToolButton>
          <label
            title="Image"
            aria-label="Image"
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border text-base"
            style={{ borderColor: "var(--rose)", background: "#ffffff", color: "var(--ink)" }}
          >
            <LuImage />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void insertImage(file);
                event.target.value = "";
              }}
            />
          </label>
          <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()}><LuUndo2 /></ToolButton>
          <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()}><LuRedo2 /></ToolButton>
        </div>
        <div className="cms-article max-h-[32rem] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rose/20 bg-white">
        <button
          type="button"
          onClick={() => setTocOpen((open) => !open)}
          className="flex w-full items-center justify-between bg-pink px-4 py-2 text-left text-xs font-semibold tracking-wide text-ink"
          aria-expanded={tocOpen}
        >
          Table of contents
          {tocOpen ? <LuChevronDown className="size-4 text-rose" /> : <LuChevronRight className="size-4 text-rose" />}
        </button>
        {!tocOpen ? null : toc.length === 0 ? (
          <p className="px-4 py-3 text-sm text-ink">Add a heading and it will appear here.</p>
        ) : (
          <ul className="grid gap-3 px-4 py-3">
            {toc.map((row) => (
              <li key={`${row.pos}-${row.id}`} className={row.level === 3 ? "pl-5" : ""}>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(row.tocLabel)}
                    onChange={(event) =>
                      updateToc(row, { included: event.target.checked, label: row.tocLabel || row.text })
                    }
                  />
                  <span className="w-24 shrink-0 text-xs font-semibold text-rose">
                    {row.level === 2 ? "Heading" : "Subheading"}
                  </span>
                  <input
                    value={row.tocLabel || row.text}
                    disabled={!row.tocLabel}
                    onChange={(event) => updateToc(row, { included: true, label: event.target.value })}
                    className="w-full rounded-lg border border-rose/25 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-rose disabled:bg-pink"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
