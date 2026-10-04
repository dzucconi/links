import { createArena } from "@aredotna/sdk";
import { CHANNEL, httpURL, isCollection } from "../src/model.ts";
import type { Collection, Link } from "../src/model.ts";

export async function fetchCollection(fetcher: typeof fetch = fetch): Promise<Collection> {
  const arena = createArena({ fetch: fetcher });
  const links: Link[] = [];
  const pages = new Set<number>();
  let received = 0;
  let total: number | undefined;
  for await (const page of arena.channels.paginateContents(
    CHANNEL, { per: 100, sort: "position_asc" }, { signal: AbortSignal.timeout(20_000) },
  )) {
    const { data, meta } = page;
    if (!Array.isArray(data) || !meta || !Number.isSafeInteger(meta.current_page) ||
        typeof meta.has_more_pages !== "boolean" || !Number.isSafeInteger(meta.total_count) ||
        meta.total_count < 0 || (total !== undefined && total !== meta.total_count)) {
      throw new Error("Invalid or changing Are.na collection");
    }
    if (pages.has(meta.current_page) || (meta.has_more_pages &&
        (!meta.next_page || meta.next_page <= meta.current_page))) {
      throw new Error("Invalid Are.na pagination");
    }
    pages.add(meta.current_page);
    total = meta.total_count;
    received += data.length;
    for (const block of data) {
      if (block.type === "Channel") continue;
      // Failed URL imports become Text blocks, with the original URL in their content.
      const value = block.type === "Text" ? block.content?.plain : block.source?.url;
      if (typeof value !== "string" || !httpURL(value.trim())) continue;
      links.push({ id: block.id, name: block.title ?? null, url: value.trim(), blockType: block.type });
    }
  }
  if (received !== total) throw new Error("Incomplete Are.na collection");
  const collection: Collection = { channel: CHANNEL, fetchedAt: new Date().toISOString(), links };
  if (!isCollection(collection)) throw new Error("Invalid Are.na links");
  return collection;
}
