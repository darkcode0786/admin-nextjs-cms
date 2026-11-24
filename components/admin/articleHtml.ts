import type { ArticleBlock, BlogSectionData, InlineTextSegment } from "@/data/blogTypes";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function segmentsToHtml(segments?: InlineTextSegment[]) {
  if (!segments) return "";
  return segments
    .map((segment) => {
      if (typeof segment === "string") return escapeHtml(segment);
      if ("bold" in segment) return `<strong>${escapeHtml(segment.bold)}</strong>`;
      return `<a href="${escapeHtml(segment.href)}">${escapeHtml(segment.text)}</a>`;
    })
    .join("");
}

function headingAttrs(id?: string, tocLabel?: string) {
  const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
  const tocAttr = ` data-toc="${escapeHtml(tocLabel || "")}"`;
  return `${idAttr}${tocAttr}`;
}

function plainText(segments?: InlineTextSegment[]) {
  return (segments || [])
    .map((segment) => {
      if (typeof segment === "string") return segment;
      if ("bold" in segment) return segment.bold;
      return segment.text;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "section";
}

function uniqueId(label: string, used: Set<string>) {
  const base = slugify(label);
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function applyToc(sections: BlogSectionData[]) {
  const used = new Set<string>();
  sections.forEach((section) => {
    if (section.id) used.add(section.id);
    section.blocks.forEach((block) => {
      if (block.type === "subheading" && block.id) used.add(block.id);
    });
  });
  return sections.map((section) => {
    const next = { ...section, blocks: section.blocks.map((block) => ({ ...block })) };
    if (next.heading?.length && next.tocLabel !== "") {
      const label = next.tocLabel || plainText(next.heading);
      if (!next.id) next.id = uniqueId(label, used);
      if (!next.tocLabel && label) next.tocLabel = label;
    }
    next.blocks = next.blocks.map((block) => {
      if (block.type !== "subheading" || block.tocLabel === "") return block;
      const label = block.tocLabel || plainText(block.content);
      return {
        ...block,
        id: block.id || uniqueId(label, used),
        ...(label ? { tocLabel: block.tocLabel || label } : {}),
      };
    });
    return next;
  });
}

function blockToHtml(block: ArticleBlock) {
  if (block.type === "paragraph") return `<p>${segmentsToHtml(block.content)}</p>`;
  if (block.type === "lead") return `<p>${segmentsToHtml(block.text)}</p>`;
  if (block.type === "paragraphs") return block.items.map((item) => `<p>${segmentsToHtml(item)}</p>`).join("");
  if (block.type === "subheading") {
    return `<h3${headingAttrs(block.id, block.tocLabel)}>${segmentsToHtml(block.content)}</h3>`;
  }
  if (block.type === "list") {
    if (block.checks) {
      return `<ul data-type="taskList">${block.items
        .map((item) => `<li data-type="taskItem" data-checked="false"><div><p>${segmentsToHtml(item)}</p></div></li>`)
        .join("")}</ul>`;
    }
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${segmentsToHtml(item)}</li>`).join("")}</${tag}>`;
  }
  if (block.type === "image") {
    return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" />`;
  }
  if (block.type === "faqs") {
    return block.items
      .map((item) => `<h3>${segmentsToHtml(item.question)}</h3><p>${segmentsToHtml(item.answer)}</p>`)
      .join("");
  }
  const head = block.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("");
  const rows = block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function sectionsToHtml(sections: BlogSectionData[]) {
  return sections
    .map((section) => {
      const heading = section.heading?.length
        ? `<h2${headingAttrs(section.id, section.tocLabel)}>${segmentsToHtml(section.heading)}</h2>`
        : "";
      return `${heading}${section.blocks.map(blockToHtml).join("")}`;
    })
    .join("");
}

function inlineFrom(element: Element, variant?: "heading" | "subheading"): InlineTextSegment[] {
  const segments: InlineTextSegment[] = [];
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) segments.push(text);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "STRONG" || node.tagName === "B") {
      const bold = node.textContent ?? "";
      if (bold) segments.push({ bold });
      return;
    }
    if (node.tagName === "A") {
      const text = node.textContent ?? "";
      if (text) {
        segments.push({
          text,
          href: node.getAttribute("href") || "#",
          ...(variant ? { variant } : {}),
        });
      }
      return;
    }
    const text = node.textContent ?? "";
    if (text) segments.push(text);
  });
  return segments.length ? segments : [""];
}

export function htmlToSections(html: string): BlogSectionData[] {
  const document = new DOMParser().parseFromString(`<div id="article-root">${html}</div>`, "text/html");
  const root = document.getElementById("article-root");
  const sections: BlogSectionData[] = [];
  let current: BlogSectionData = { blocks: [] };

  const push = () => {
    if (current.heading || current.blocks.length) sections.push(current);
    current = { blocks: [] };
  };

  root?.childNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      const text = node.textContent?.trim();
      if (text) current.blocks.push({ type: "paragraph", content: [text] });
      return;
    }
    const tag = node.tagName;
    if (tag === "H1" || tag === "H2") {
      push();
      current.heading = inlineFrom(node, "heading");
      const id = node.getAttribute("id");
      if (id) current.id = id;
      if (node.hasAttribute("data-toc")) {
        const tocLabel = node.getAttribute("data-toc") || "";
        if (tocLabel) current.tocLabel = tocLabel;
        else current.tocLabel = "";
      }
      return;
    }
    if (tag === "H3") {
      const id = node.getAttribute("id");
      const block: ArticleBlock = { type: "subheading", content: inlineFrom(node, "subheading") };
      if (id) block.id = id;
      if (node.hasAttribute("data-toc")) {
        block.tocLabel = node.getAttribute("data-toc") || "";
      }
      current.blocks.push(block);
      return;
    }
    if (tag === "UL" || tag === "OL") {
      const checks = node.getAttribute("data-type") === "taskList" || node.getAttribute("data-list") === "check";
      const items = [...node.querySelectorAll(":scope > li")].map((item) => {
        const body = item.querySelector(":scope > div") ?? item;
        return inlineFrom(body);
      });
      current.blocks.push({
        type: "list",
        ordered: tag === "OL",
        ...(checks ? { checks: true } : {}),
        items: items.length ? items : [[""]],
      });
      return;
    }
    if (tag === "IMG") {
      current.blocks.push({
        type: "image",
        src: node.getAttribute("src") || "",
        alt: node.getAttribute("alt") || "",
      });
      return;
    }
    if (tag === "TABLE") {
      const headers = [...node.querySelectorAll("th")].map((cell) => cell.textContent?.trim() || "");
      const rows = [...node.querySelectorAll("tbody tr")].map((row) =>
        [...row.querySelectorAll("td")].map((cell) => cell.textContent?.trim() || ""),
      );
      current.blocks.push({
        type: "table",
        headers: headers.length ? headers : ["", ""],
        rows: rows.length ? rows : [["", ""]],
      });
      return;
    }
    const text = node.textContent?.trim();
    if (text) current.blocks.push({ type: "paragraph", content: inlineFrom(node) });
  });
  push();
  if (!sections.length) {
    return [{ heading: ["Overview"], blocks: [{ type: "paragraph", content: [""] }] }];
  }
  return applyToc(sections);
}
