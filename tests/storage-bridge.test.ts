import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { createStorageBridge } from "../supabase/functions/rincon-storage/bridge";

const token = "a".repeat(64);
const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png";
const config = { projectUrl: "https://example.supabase.co", serviceKey: "internal-service-key", tokenHash: createHash("sha256").update(token).digest("hex") };
const base = "https://example.supabase.co/functions/v1/rincon-storage/storage/v1";
const auth = { "X-Rincon-Storage-Token": token };
describe("Scoped Storage bridge", () => {
  it("requires a strong token and refuses other buckets or administrative paths", async () => {
    let calls = 0;
    const handler = createStorageBridge(config, async () => { calls++; return new Response(); });
    expect((await handler(new Request(base + "/bucket/rincon-render"))).status).toBe(401);
    expect((await handler(new Request(base + "/bucket/rincon-render", { headers: { "X-Rincon-Storage-Token": "b".repeat(64) } }))).status).toBe(401);
    for (const path of ["/bucket", "/bucket/rincon", "/object/authenticated/rincon/" + key, "/object/rincon-render/../../secret"])
      expect((await handler(new Request(base + path, { headers: auth }))).status).toBe(404);
    expect(calls).toBe(0);
  });
  it("streams allowed uploads and private ranges without exporting the service key", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const handler = createStorageBridge(config, async (url, init) => {
      calls.push({ url: String(url), init: init! });
      return new Response("bytes", { status: 206, headers: { "Content-Range": "bytes 0-4/100" } });
    });
    const result = await handler(new Request(base + "/object/authenticated/rincon-render/" + key, { headers: { ...auth, Range: "bytes=0-4" } }));
    expect(result.status).toBe(206);
    expect(result.headers.get("Content-Range")).toBe("bytes 0-4/100");
    expect(await result.text()).toBe("bytes");
    expect(new Headers(calls[0].init.headers).get("Authorization")).toBe("Bearer internal-service-key");
    expect([...result.headers.values()].join()).not.toContain(config.serviceKey);
    const upload = new Request(base + "/object/rincon-render/" + key, { method: "POST", headers: { ...auth, "Content-Type": "image/png" }, body: "synthetic" });
    expect((await handler(upload)).status).toBe(206);
    expect(new Headers(calls[1].init.headers).get("x-upsert")).toBe("false");
  });
  it("bounds deletion keys and hides provider errors", async () => {
    let calls = 0;
    const handler = createStorageBridge(config, async () => { calls++; return new Response("secret provider detail", { status: 500 }); });
    const invalid = await handler(new Request(base + "/object/rincon-render", { method: "DELETE", headers: auth, body: JSON.stringify({ prefixes: ["another-bucket/path"] }) }));
    expect(invalid.status).toBe(404); expect(calls).toBe(0);
    const valid = await handler(new Request(base + "/object/rincon-render", { method: "DELETE", headers: auth, body: JSON.stringify({ prefixes: [key] }) }));
    expect(valid.status).toBe(502); expect(await valid.text()).not.toContain("secret provider detail");
    expect(calls).toBe(1);
  });
});
