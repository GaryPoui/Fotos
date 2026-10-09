import { createStorageBridge } from "./bridge.ts";

// Replace this verifier at deploy time. The raw random token lives only in Render.
const tokenHash = "DEPLOYMENT_TOKEN_SHA256";
Deno.serve(createStorageBridge({
  projectUrl: Deno.env.get("SUPABASE_URL")!,
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  tokenHash,
}));
