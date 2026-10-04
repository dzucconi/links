import { triggerBuild } from "./trigger-build.ts";

try {
  await triggerBuild(process.env.NETLIFY_BUILD_HOOK_URL);
  console.log("Rebuild requested. Follow progress in the Netlify deploy dashboard.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Couldn't request a rebuild.");
  process.exitCode = 1;
}
