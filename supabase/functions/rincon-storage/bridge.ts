export interface BridgeConfig {
  projectUrl: string;
  serviceKey: string;
  tokenHash: string;
}

export function createStorageBridge(config: BridgeConfig, fetcher: typeof fetch = fetch) {
  if (!/^[a-f0-9]{64}$/.test(config.tokenHash)) throw new Error("Configure a SHA-256 token verifier.");
  const bucket = "rincon-render";
  const validKey = (key: string) => /^[a-f0-9-]{36}\.(?:thumb\.webp|jpg|png|webp|gif|avif|mp4|webm|mp3|wav|ogg|m4a)$/.test(key);
  const error = (status: number) => new Response(JSON.stringify({ error: "Operación no disponible." }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  return async (req: Request): Promise<Response> => {
    const token = req.headers.get("X-Rincon-Storage-Token") || "";
    if (!/^[a-f0-9]{64}$/.test(token)) return error(401);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
    const expected = config.tokenHash.match(/../g)!.map(byte => parseInt(byte, 16));
    let difference = 0;
    for (let i = 0; i < 32; i++) difference |= digest[i] ^ expected[i];
    if (difference) return error(401);
    const pathname = new URL(req.url).pathname;
    const marker = pathname.indexOf("/storage/v1/");
    if (marker < 0) return error(404);
    const path = pathname.slice(marker + "/storage/v1".length);
    let body: BodyInit | null = null;
    let allowed = false;
    if (path === "/bucket/" + bucket && req.method === "GET") allowed = true;
    if (path.startsWith("/object/authenticated/" + bucket + "/") && ["GET", "HEAD"].includes(req.method))
      allowed = validKey(decodeURIComponent(path.slice(("/object/authenticated/" + bucket + "/").length)));
    if (path.startsWith("/object/" + bucket + "/") && req.method === "POST") {
      allowed = validKey(decodeURIComponent(path.slice(("/object/" + bucket + "/").length)));
      if (Number(req.headers.get("Content-Length") || 0) > 50_000_000) return error(413);
      body = req.body;
    }
    if (path === "/object/" + bucket && req.method === "DELETE") {
      const raw = await req.text();
      if (raw.length > 2048) return error(413);
      try {
        const input = JSON.parse(raw);
        allowed = Array.isArray(input.prefixes) && input.prefixes.length <= 20 && input.prefixes.every((key: unknown) => typeof key === "string" && validKey(key));
        body = JSON.stringify({ prefixes: input.prefixes });
      } catch { return error(400); }
    }
    if (!allowed) return error(404);
    const headers = new Headers({ apikey: config.serviceKey, Authorization: "Bearer " + config.serviceKey });
    for (const name of ["Range", "Content-Type"])
      if (req.headers.has(name)) headers.set(name, req.headers.get(name)!);
    if (req.method === "POST") headers.set("x-upsert", "false");
    try {
      const upstream = await fetcher(config.projectUrl + "/storage/v1" + path, {
        method: req.method, headers, body, redirect: "error", signal: AbortSignal.timeout(110_000),
        // Node's test fetch needs duplex; Deno ignores this compatible option.
        ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
      });
      if (!upstream.ok && upstream.status !== 416) {
        await upstream.body?.cancel();
        return error(upstream.status === 404 ? 404 : 502);
      }
      const responseHeaders = new Headers({ "Cache-Control": "no-store" });
      for (const name of ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"])
        if (upstream.headers.has(name)) responseHeaders.set(name, upstream.headers.get(name)!);
      return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
    } catch { return error(502); }
  };
}
