import { blockStatus, domain, sortLinks } from "../src/model.ts";
import type { Link } from "../src/model.ts";

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export function renderLinks(links: Link[]): string {
  const positions = new Map(links.map((link, index) => [link, index]));
  return sortLinks(links, "domain-asc").map(link => {
    const label = link.url.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "");
    const state = blockStatus(link.blockType);
    const status = escapeHTML(`${state} — ${link.blockType} block on Are.na`);
    return `<a href="${escapeHTML(link.url)}" title="${escapeHTML(link.name ?? "")}" rel="nofollow noopener noreferrer" target="_blank" data-domain="${escapeHTML(domain(link.url))}" data-position="${positions.get(link)}">see also &lt;${escapeHTML(label)}&gt;<span class="status-dot status-dot--${state}" role="img" title="${status}" aria-label="${status}"></span></a>`;
  }).join("\n");
}
