import { defineConfig } from "vite";
import { fetchCollection } from "./build/collection.ts";
import { renderLinks } from "./build/render.ts";

export default defineConfig(async ({ isPreview }) => {
  // Preview serves the existing build, even when Are.na is unavailable.
  if (isPreview === true) return {};

  // Fetch and render before startup, never while serving an HTML request.
  const collection = await fetchCollection();
  const links = renderLinks(collection.links);

  return {
    plugins: [{
      name: "arena-static-links",
      transformIndexHtml(html: string) {
        return html.replace("<!-- links -->", () => links);
      },
    }],
  };
});
