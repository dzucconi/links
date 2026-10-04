export async function triggerBuild(hook: string | undefined, fetcher: typeof fetch = fetch): Promise<void> {
  if (!hook) throw new Error("Set NETLIFY_BUILD_HOOK_URL to enable rebuilds.");
  let url: URL;
  try { url = new URL(hook); } catch {
    throw new Error("NETLIFY_BUILD_HOOK_URL must be a Netlify build hook URL.");
  }
  if (url.origin !== "https://api.netlify.com" || !/^\/build_hooks\/[a-zA-Z0-9_-]+$/.test(url.pathname) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error("NETLIFY_BUILD_HOOK_URL must be a Netlify build hook URL.");
  }
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      signal: AbortSignal.timeout(15_000), redirect: "error",
    });
  } catch {
    // Don't include the private hook URL in logs or error messages.
    throw new Error("Couldn't reach the Netlify build hook.");
  }
  if (!response.ok) throw new Error(`Netlify build hook failed: HTTP ${response.status}`);
}
