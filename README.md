# links.damonzucconi.com

A static link collection generated from [this Are.na channel](https://www.are.na/damon-zucconi/links-83ngww2lwwe)
using the official [Are.na SDK](https://github.com/aredotna/sdk/tree/main/packages/sdk).

## Meta

- **State**: production
- **Production**:
  - **URL**: https://links.damonzucconi.com/
  - **URL**: https://damonzucconi-links.netlify.app/
- **Host**: https://app.netlify.com/sites/damonzucconi-links/overview
- **Deploys**: Merged PRs to `dzucconi/links#master` are automatically deployed to production. [Manually trigger a deploy](https://app.netlify.com/sites/damonzucconi-links/deploys)

## Development

Use Node 24 (`.nvmrc`) and Yarn 1:

```sh
yarn install
yarn dev
yarn verify # tests, type checking, and a production build using live Are.na data
yarn preview # serve the built static site
```

Vite fetches and renders the complete channel once before the build or development server
starts. The build writes every link and status dot into `dist/index.html`. Development
reloads use that prepared HTML without contacting Are.na; restart `yarn dev` to refresh data.
Preview serves the existing build without contacting Are.na, including at startup.
No browser data fetching, API endpoint, database, or data cache is needed. The page works
without JavaScript; JavaScript only sorts existing anchors and remembers the chosen sort.

## Collection and status

`build/collection.ts` uses `channels.paginateContents`, 100 items per page in channel order.
All pages must succeed before the build can finish. If Are.na fails or the set is incomplete,
the build fails and Netlify keeps the previous successful deployment online.

Nested channels, text notes that aren't URLs, and unsafe URLs are skipped. Duplicate URLs
in distinct blocks are preserved. Domain A–Z is the default, ignoring a leading `www.`;
Z–A and “default” (Are.na channel order) are also available. Equal-domain links retain their source order.

Status dots use the Are.na block type, not a live uptime measurement:

- **Green / up:** Link block; URL from `source.url`.
- **Red / down:** Text block; URL from `content.plain`, including failed imports.
- **Gray / unknown:** other blocks with a source URL, including Embeds.

Dots include hover and screen reader labels. Source titles and URLs are escaped in the
HTML. Are.na changes become visible on the next successful build.

## Daily and manual rebuilds

The `rebuild` Netlify scheduled function runs daily at **10:00 UTC** (6 a.m. in New York
during daylight saving time; 5 a.m. in winter). Its only job is to POST to a private build
hook. The website itself is entirely static. Netlify runs schedules only for the published
production deploy, not locally or in deploy previews.

One-time Netlify setup:

1. In **Project configuration → Build & deploy → Build hooks**, add a hook for `master`.
2. Save its URL as `NETLIFY_BUILD_HOOK_URL`, scoped to **Functions**, in the **Production**
   environment. Keep it secret; do not put it in source control or browser code.
3. Publish this version of the site so the scheduled function becomes active.

To rebuild manually, use **Trigger deploy → Deploy site** in the
[Netlify deploy dashboard](https://app.netlify.com/sites/damonzucconi-links/deploys).
Or copy `.env.example` to `.env.local`, set the same hook URL, and run:

```sh
yarn rebuild
```

This requests a build of the remote `master` branch; it does not upload local changes.
The command confirms that Netlify accepted the request. Check the deploy dashboard for
build completion. Missing configuration, network errors, and rejected hook requests fail
explicitly. The hook URL is never logged or included in the generated site.

Netlify's [build hook documentation](https://docs.netlify.com/build/configure-builds/build-hooks/)
and [scheduled function documentation](https://docs.netlify.com/build/functions/scheduled-functions/)
cover the hosting behavior.
