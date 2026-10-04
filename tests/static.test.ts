import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLinks } from "../build/render.ts";
import { triggerBuild } from "../scripts/trigger-build.ts";

test("builds sorted, complete anchors with block-type dots and preserves source positions", () => {
  const html = renderLinks([
    { id: 1, name: null, url: "https://z.example/", blockType: "Link" },
    { id: 2, name: null, url: "https://a.example/", blockType: "Text" },
    { id: 3, name: null, url: "https://m.example/", blockType: "Embed" },
  ]);
  assert.equal((html.match(/<a /g) ?? []).length, 3);
  assert.ok(html.indexOf('href="https://a.example/"') < html.indexOf('href="https://z.example/"'));
  assert.match(html, /data-position="1">see also &lt;a.example&gt;/);
  assert.match(html, /data-position="0">see also &lt;z.example&gt;/);
  for (const state of ["up", "down", "unknown"]) assert.match(html, new RegExp(`class="status-dot status-dot--${state}" role="img"`));
});

test("escapes source strings before including them in HTML", () => {
  const html = renderLinks([{ id: 1, name: '\"><script>alert(1)</script>&', url: 'https://example.com/?q="test"&a=1', blockType: "Link" }]);
  assert.ok(!html.includes("<script>"));
  assert.match(html, /title="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;"/);
  assert.match(html, /href="https:\/\/example.com\/\?q=&quot;test&quot;&amp;a=1"/);
});

test("manual and scheduled rebuilds POST to the private Netlify hook", async () => {
  let calls = 0;
  await triggerBuild("https://api.netlify.com/build_hooks/test-hook", async (input, init) => {
    calls++;
    assert.equal(String(input), "https://api.netlify.com/build_hooks/test-hook");
    assert.equal(init?.method, "POST");
    assert.equal(init?.body, "{}");
    assert.equal(init?.redirect, "error");
    return new Response(null, { status: 200 });
  });
  assert.equal(calls, 1);
});

test("rejects missing/invalid hooks and failed requests without leaking the hook URL", async () => {
  for (const hook of [undefined, "invalid-hook", "https://example.com/build_hooks/private", "https://api.netlify.com/other/private"]) {
    await assert.rejects(triggerBuild(hook, async () => { throw new Error("must not fetch"); }), /NETLIFY_BUILD_HOOK_URL/);
  }
  await assert.rejects(triggerBuild("https://api.netlify.com/build_hooks/private", async () => new Response(null, { status: 500 })), /HTTP 500/);
  await assert.rejects(triggerBuild("https://api.netlify.com/build_hooks/private", async () => { throw new Error("https://api.netlify.com/build_hooks/private"); }), error => {
    assert.equal((error as Error).message, "Couldn't reach the Netlify build hook.");
    return true;
  });
});
