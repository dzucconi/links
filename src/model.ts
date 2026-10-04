import type { Block } from "@aredotna/sdk";

export const CHANNEL = "links-83ngww2lwwe";
export type Link = { id: number; name: string | null; url: string; blockType: Block["type"] };
export type Collection = { channel: typeof CHANNEL; fetchedAt: string; links: Link[] };
export type Sort = "domain-asc" | "domain-desc" | "collection";

export function blockStatus(type: Link["blockType"]): "up" | "down" | "unknown" {
  return type === "Link" ? "up" : type === "Text" ? "down" : "unknown";
}

export function httpURL(value: string): URL | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url : null;
  } catch {
    return null;
  }
}

export function domain(url: string): string {
  return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
}

export function sortLinks(links: Link[], sort: Sort): Link[] {
  if (sort === "collection") return [...links];
  const direction = sort === "domain-desc" ? -1 : 1;
  return [...links].sort((a, b) => direction * domain(a.url).localeCompare(domain(b.url), "en"));
}

export function isSort(value: unknown): value is Sort {
  return value === "domain-asc" || value === "domain-desc" || value === "collection";
}

// Validate source data before including it in the generated page.
export function isCollection(value: unknown): value is Collection {
  if (!value || typeof value !== "object") return false;
  const data = value as Collection;
  return data.channel === CHANNEL && Number.isFinite(Date.parse(data.fetchedAt)) &&
    Array.isArray(data.links) && data.links.every(link => link &&
      Number.isSafeInteger(link.id) && link.id > 0 &&
      ["Link", "Text", "Image", "Embed", "Attachment", "PendingBlock"].includes(link.blockType) &&
      (link.name === null || typeof link.name === "string") &&
      typeof link.url === "string" && httpURL(link.url) !== null);
}
