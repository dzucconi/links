import type { Config } from "@netlify/functions";
import { triggerBuild } from "../../scripts/trigger-build.ts";

export default async () => {
  await triggerBuild(process.env.NETLIFY_BUILD_HOOK_URL);
};

// Daily at 10:00 UTC. Netlify runs schedules only on the published production deploy.
export const config: Config = { schedule: "0 10 * * *" };
