import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, resolveConfig } from "vite";

test("preview uses the existing build without contacting Are.na", async t => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    throw new Error("Are.na is unavailable");
  });
  await resolveConfig({ logLevel: "silent" }, "serve", "production", "production", true);
  assert.equal(requests, 0);
});

test("dev HTML requests use startup data without fetching Are.na again", async t => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return Response.json({
      data: [{ id: 1, type: "Link", title: "Example", source: { url: "https://example.com/" } }],
      meta: { current_page: 1, next_page: null, has_more_pages: false, total_count: 1 },
    });
  });
  const server = await createServer({ server: { middlewareMode: true, watch: null }, logLevel: "silent" });
  try {
    const startupRequests = requests;
    for (let reload = 0; reload < 3; reload++) {
      const html = await server.transformIndexHtml("/", '<div id="links"><!-- links --></div>');
      assert.match(html, /href="https:\/\/example.com\/"/);
    }
    assert.equal(requests, startupRequests, "page loads must not contact Are.na");
    assert.equal(startupRequests, 1, "fetch the collection once before serving pages");
  } finally {
    await server.close();
  }
});
