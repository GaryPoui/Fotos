import { openAsBlob } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request, Response } from "express";
import { parseVideoParts, partKeys, byteRange } from "./video-parts.js";

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
  const base =
    origin.origin +
    (bridgeToken ? "/functions/v1/rincon-storage" : "") +
    "/storage/v1";
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
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(120_000)])
          : AbortSignal.timeout(120_000),
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
      const parts = parseVideoParts(key);
      if (parts) {
        const blob = await openAsBlob(path, { type: mime });
        if (
          blob.size !== parts.size ||
          mime !== "video/" + parts.root.split(".")[1]
        )
          throw new Error("Video inválido.");
        const keys = partKeys(parts);
        for (let i = 0; i < keys.length; i++) {
          const response = await checked("/object/" + objectPath(keys[i]), {
            method: "POST",
            headers: { "Content-Type": mime, "x-upsert": "false" },
            body: blob.slice(
              i * parts.partBytes,
              Math.min((i + 1) * parts.partBytes, blob.size),
              mime,
            ),
          });
          await response.body?.cancel();
        }
        return;
      }
      const response = await checked("/object/" + objectPath(key), {
        method: "POST",
        headers: { "Content-Type": mime, "x-upsert": "false" },
        body: await openAsBlob(path, { type: mime }),
      });
      await response.body?.cancel();
    },
    async remove(keys) {
      if (!keys.length) return;
      keys = [
        ...new Set(
          keys.flatMap((key) => {
            const parts = parseVideoParts(key);
            return parts ? partKeys(parts) : [key];
          }),
        ),
      ];
      for (let i = 0; i < keys.length; i += 20) {
        const response = await checked("/object/" + bucketPath, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: keys.slice(i, i + 20) }),
        });
        await response.body?.cancel();
      }
    },
    async serve(key, req, res) {
      const parts = parseVideoParts(key);
      if (parts) {
        const range = byteRange(
          req.method === "HEAD" ? undefined : req.headers.range,
          parts.size,
        );
        res.setHeader("Accept-Ranges", "bytes");
        if (!range) {
          res.status(416).setHeader("Content-Range", "bytes */" + parts.size);
          res.end();
          return;
        }
        if (req.method === "HEAD") {
          res.setHeader("Content-Length", parts.size);
          res.end();
          return;
        }
        const controller = new AbortController();
        const abort = () => controller.abort();
        res.once("close", abort);
        const keys = partKeys(parts);
        async function fetchPart(index: number) {
          const size = Math.min(
            parts!.partBytes,
            parts!.size - index * parts!.partBytes,
          );
          const start = Math.max(0, range!.start - index * parts!.partBytes);
          const end = Math.min(size - 1, range!.end - index * parts!.partBytes);
          const response = await request(
            "/object/authenticated/" + objectPath(keys[index]),
            {
              headers: { Range: `bytes=${start}-${end}` },
              signal: controller.signal,
            },
          );
          const length = end - start + 1;
          if (
            response.status !== 206 ||
            !response.body ||
            response.headers.get("content-range") !==
              `bytes ${start}-${end}/${size}` ||
            (response.headers.has("content-length") &&
              Number(response.headers.get("content-length")) !== length)
          ) {
            await response.body?.cancel();
            throw new Error("No pudimos abrir el video. Intentá de nuevo.");
          }
          return { response, length };
        }
        try {
          const firstIndex = Math.floor(range.start / parts.partBytes),
            lastIndex = Math.floor(range.end / parts.partBytes);
          const first = await fetchPart(firstIndex);
          res.status(range.partial ? 206 : 200);
          res.setHeader("Content-Length", range.end - range.start + 1);
          if (range.partial)
            res.setHeader(
              "Content-Range",
              `bytes ${range.start}-${range.end}/${parts.size}`,
            );
          async function* chunks() {
            for (let index = firstIndex; index <= lastIndex; index++) {
              const { response, length } =
                index === firstIndex ? first : await fetchPart(index);
              let received = 0;
              for await (const chunk of Readable.fromWeb(
                response.body as never,
              )) {
                received += chunk.length;
                if (received > length)
                  throw new Error("El video está incompleto.");
                yield chunk;
              }
              if (received !== length)
                throw new Error("El video está incompleto.");
            }
          }
          await pipeline(Readable.from(chunks()), res);
        } catch {
          if (!res.headersSent && !res.destroyed) {
            res.removeHeader("Content-Length");
            res.removeHeader("Content-Range");
            res
              .status(502)
              .json({ error: "No pudimos abrir el video. Intentá de nuevo." });
          } else if (!res.destroyed) res.destroy();
        } finally {
          controller.abort();
          res.off("close", abort);
        }
        return;
      }
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
