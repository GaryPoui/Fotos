import { openAsBlob } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request, Response } from "express";

export interface ObjectStorage {
  verify(): Promise<void>;
  put(key: string, path: string, mime: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  serve(key: string, req: Request, res: Response): Promise<void>;
}
export function cloudStorage(
  url: string,
  secret: string,
  bucket = "recuerdos",
  bridgeToken?: string,
): ObjectStorage {
  const origin = new URL(url);
  if (origin.protocol !== "https:" && origin.hostname !== "127.0.0.1")
    throw new Error("SUPABASE_URL debe usar HTTPS.");
  const base = origin.origin + (bridgeToken ? "/functions/v1/rincon-storage" : "") + "/storage/v1";
  const bucketPath = encodeURIComponent(bucket);
  const objectPath = (key: string) =>
    bucketPath + "/" + encodeURIComponent(key);
  const headers: Record<string, string> = bridgeToken
    ? { apikey: secret, "X-Rincon-Storage-Token": bridgeToken }
    : { apikey: secret, Authorization: "Bearer " + secret };
  async function request(path: string, init: RequestInit = {}) {
    try {
      return await fetch(base + path, {
        ...init,
        headers: { ...headers, ...init.headers },
        redirect: "error",
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      throw new Error("El almacenamiento remoto no está disponible.");
    }
  }
  async function checked(path: string, init?: RequestInit) {
    const response = await request(path, init);
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("El almacenamiento remoto rechazó la operación.");
    }
    return response;
  }
  return {
    async verify() {
      const info = (await (await checked("/bucket/" + bucketPath)).json()) as {
        public?: boolean;
      };
      if (info.public !== false)
        throw new Error("El bucket de recuerdos debe ser privado.");
    },
    async put(key, path, mime) {
      const response = await checked("/object/" + objectPath(key), {
        method: "POST",
        headers: { "Content-Type": mime, "x-upsert": "false" },
        body: await openAsBlob(path, { type: mime }),
      });
      await response.body?.cancel();
    },
    async remove(keys) {
      if (!keys.length) return;
      const response = await checked("/object/" + bucketPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: keys }),
      });
      await response.body?.cancel();
    },
    async serve(key, req, res) {
      const response = await request(
        "/object/authenticated/" + objectPath(key),
        {
          method: req.method === "HEAD" ? "HEAD" : "GET",
          headers: req.headers.range ? { Range: req.headers.range } : {},
        },
      );
      if (![200, 206, 416].includes(response.status)) {
        await response.body?.cancel();
        res
          .status(response.status === 404 ? 404 : 502)
          .json({ error: "No pudimos abrir el archivo. Intentá de nuevo." });
        return;
      }
      res.status(response.status);
      for (const name of ["content-length", "content-range", "accept-ranges"])
        if (response.headers.has(name))
          res.setHeader(name, response.headers.get(name)!);
      if (!response.body || req.method === "HEAD") {
        await response.body?.cancel();
        res.end();
        return;
      }
      await pipeline(Readable.fromWeb(response.body as never), res);
    },
  };
}
