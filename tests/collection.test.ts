import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchCollection } from "../build/collection.ts";
import { CHANNEL, blockStatus, isCollection, sortLinks } from "../src/model.ts";
import type { Collection, Link } from "../src/model.ts";

const entry = (id: number, url: string, type = "Link") => ({
  id, type, title: null,
  source: type === "Text" ? null : { url },
  content: type === "Text" ? { plain: url } : null,
});
const page = (data: unknown[], current: number, total: number, next: number | null = null) => ({
  data, meta: { current_page: current, next_page: next, has_more_pages: next !== null, total_count: total },
});
function pages(responses: (object | Response)[]): typeof fetch {
  let index = 0;
  return async (input, options) => {
    const request = new Request(input, options);
    const url = new URL(request.url);
    assert.equal(url.origin, "https://api.are.na");
    assert.equal(url.pathname, `/v3/channels/${CHANNEL}/contents`);
    assert.equal(url.searchParams.get("page"), String(index + 1));
    assert.equal(url.searchParams.get("per"), "100");
    assert.equal(url.searchParams.get("sort"), "position_asc");
    assert.equal(request.method, "GET");
    assert.ok(request.signal);
    const response = responses[index++];
    assert.ok(response, "Fetched beyond the final page");
    return response instanceof Response ? response : Response.json(response);
  };
}

const link = (id: number, url: string, blockType: Link["blockType"] = "Link"): Link => ({ id, url, blockType, name: null });

test("uses SDK pagination through the final page and retains failed Text URLs, source order, and duplicate URLs", async () => {
  const collection = await fetchCollection(pages([
    page([entry(1, "https://b.example/"), entry(2, " http://down.example/ \n", "Text")], 1, 4, 2),
    page([entry(3, "https://a.example/", "Embed"), entry(4, "https://b.example/")], 2, 4),
  ]));
  assert.equal(collection.channel, CHANNEL);
  assert.deepEqual(collection.links, [link(1, "https://b.example/"), link(2, "http://down.example/", "Text"),
    link(3, "https://a.example/", "Embed"), link(4, "https://b.example/")]);
  assert.deepEqual(collection.links.map(item => blockStatus(item.blockType)), ["up", "down", "unknown", "up"]);
});

test("skips nested channels, text notes and unsafe URLs without losing valid entries", async () => {
  const data = [
    { id: 1, type: "Channel" }, entry(2, "Some notes", "Text"), entry(3, "javascript:alert(1)"),
    entry(4, "https://user:password@example.com/"), entry(5, "https://good.example/"),
  ];
  const collection = await fetchCollection(pages([page(data, 1, data.length)]));
  assert.deepEqual(collection.links, [link(5, "https://good.example/")]);
});

test("supports empty channels", async () => {
  assert.deepEqual((await fetchCollection(pages([page([], 1, 0)]))).links, []);
});

test("rejects malformed, incomplete and looping pagination rather than caching a partial collection", async () => {
  for (const responses of [
    [{ data: [], meta: null }],
    [page([entry(1, "https://a.example")], 1, 2)],
    [page([entry(1, "https://a.example")], 1, 2, 1)],
    [page([entry(1, "https://a.example")], 1, 2, 2), page([], 2, 3)],
  ]) await assert.rejects(fetchCollection(pages(responses)));
});

test("surfaces API failures through the SDK", async () => {
  await assert.rejects(fetchCollection(pages([
    Response.json({ error: "Unavailable" }, { status: 503 }),
  ])));
});

test("domain sorts ignore protocol, path and www, are stable, and don't mutate collection order", () => {
  const links = ["https://www.z.example/a", "http://www.a.example/z", "https://a.example/a", "http://m.example/"].map((url, i) => link(i + 1, url));
  assert.deepEqual(sortLinks(links, "domain-asc"), [links[1], links[2], links[3], links[0]]);
  assert.deepEqual(sortLinks(links, "domain-desc"), [links[0], links[3], links[1], links[2]]);
  assert.deepEqual(sortLinks(links, "collection"), links);
});

test("validates source URLs, block IDs, and block types", () => {
  const saved: Collection = { channel: CHANNEL, fetchedAt: new Date().toISOString(), links: [link(1, "https://a.example/")] };
  assert.equal(isCollection(saved), true);
  for (const bad of [
    { ...saved.links[0], url: "javascript:alert(1)" },
    { ...saved.links[0], id: 0 },
    { ...saved.links[0], blockType: "SomethingElse" },
  ]) assert.equal(isCollection({ ...saved, links: [bad] }), false);
});
