import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import multer from "multer";
import { parseCookie as parse, stringifySetCookie } from "cookie";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync, existsSync, renameSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { z, ZodError } from "zod";
import { openDb } from "./db.js";
import { inspectFile, thumbnail } from "./files.js";
import type { Media, Note, Settings } from "../shared/types.js";

const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const today = () => new Date().toISOString().slice(0, 10);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Fecha inválida",
  );
const mediaInput = z
  .object({
    title: z.string().trim().min(1).max(150),
    date,
    album: z.string().trim().max(80).default(""),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    artist: z.string().trim().max(100).default(""),
    favorite: z.boolean().default(false),
  })
  .strict();
const noteInput = z
  .object({
    type: z.enum(["quote", "letter"]),
    title: z.string().trim().min(1).max(150),
    body: z.string().trim().min(1).max(30000),
    author: z.string().trim().max(100).default(""),
    date,
    favorite: z.boolean().default(false),
  })
  .strict();
const settingsInput = z
  .object({
    names: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(80),
    since: z.union([date, z.literal("")]),
  })
  .strict();
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
type MediaRow = Omit<Media, "tags" | "favorite"> & {
  filename: string;
  tags: string;
  favorite: number;
};
type NoteRow = Omit<Note, "favorite"> & { favorite: number };
function publicMedia(row: MediaRow): Media {
  const { filename: _private, ...rest } = row;
  return {
    ...rest,
    tags: JSON.parse(row.tags),
    favorite: Boolean(row.favorite),
  };
}
function publicNote(row: NoteRow): Note {
  return { ...row, favorite: Boolean(row.favorite) };
}
export interface AppOptions {
  dataDir: string;
  password: string;
  production?: boolean;
  origin?: string;
  trustProxy?: number;
  maxFileBytes?: number;
  maxStorageBytes?: number;
}
export async function createApp(options: AppOptions) {
  if (
    !options.password ||
    options.password.length < 12 ||
    options.password.length > 256
  )
    throw new Error("APP_PASSWORD debe tener entre 12 y 256 caracteres.");
  if (
    options.production &&
    (!options.origin || !options.origin.startsWith("https://"))
  )
    throw new Error("APP_ORIGIN debe ser la URL HTTPS en producción.");
  const dir = resolve(options.dataDir);
  const mediaDir = join(dir, "media"),
    tmpDir = join(dir, "tmp");
  mkdirSync(mediaDir, { recursive: true });
  mkdirSync(tmpDir, { recursive: true });
  const db = openDb(dir);
  let salt = (
    db.prepare("SELECT value FROM meta WHERE key='salt'").get() as
      { value: string } | undefined
  )?.value;
  if (!salt) {
    salt = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO meta VALUES (?,?)").run("salt", salt);
  }
  const passwordHash = await new Promise<Buffer>((res, rej) =>
    scryptCallback(
      options.password,
      salt!,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (err, key) => (err ? rej(err) : res(key)),
    ),
  );
  const version = hash(passwordHash);
  db.prepare("DELETE FROM sessions WHERE expires < ? OR version != ?").run(
    Date.now(),
    version,
  );
  const maxFile = options.maxFileBytes ?? 200 * 1024 * 1024,
    maxStorage = options.maxStorageBytes ?? 1024 * 1024 * 1024;
  const used = () =>
    (
      db.prepare("SELECT COALESCE(SUM(size),0) AS bytes FROM media").get() as {
        bytes: number;
      }
    ).bytes;
  const app = express();
  app.disable("x-powered-by");
  if (options.trustProxy) app.set("trust proxy", options.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "blob:", "data:"],
          "media-src": ["'self'", "blob:"],
        },
      },
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "128kb" }));
  app.use("/api", (req, _res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("X-Requested-With") !== "NuestroRincon")
        return next(new ApiError(403, "Solicitud no permitida."));
      const origin = req.get("Origin");
      if (origin) {
        const expected =
          options.origin || req.protocol + "://" + req.get("host");
        if (origin !== expected)
          return next(new ApiError(403, "Origen no permitido."));
      }
    }
    next();
  });
  const tokenOf = (req: Request) => parse(req.headers.cookie || "").rincon;
  const authenticated = (req: Request) => {
    const token = tokenOf(req);
    return (
      token &&
      token.length <= 128 &&
      Boolean(
        db
          .prepare(
            "SELECT token FROM sessions WHERE token=? AND expires>? AND version=?",
          )
          .get(hash(token), Date.now(), version),
      )
    );
  };
  const auth = (req: Request, _res: Response, next: NextFunction) =>
    authenticated(req)
      ? next()
      : next(new ApiError(401, "Ingresá para abrir nuestro rincón."));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/session", (req, res) =>
    res.json({ authenticated: Boolean(authenticated(req)) }),
  );
  const attempts = new Map<string, { count: number; until: number }>();
  let hashing = false;
  app.post("/api/login", async (req, res) => {
    const ip = req.ip || "unknown",
      now = Date.now();
    for (const [key, val] of attempts)
      if (val.until < now) attempts.delete(key);
    const previous = attempts.get(ip);
    if (previous && previous.count >= 8)
      throw new ApiError(
        429,
        "Demasiados intentos. Volvé a probar en 15 minutos.",
      );
    attempts.set(ip, {
      count: (previous?.count || 0) + 1,
      until: previous?.until || now + 15 * 60_000,
    });
    const input = z
      .object({ password: z.string().min(1).max(256) })
      .parse(req.body);
    if (hashing)
      throw new ApiError(
        429,
        "Estamos verificando otro acceso. Volvé a intentar en unos segundos.",
      );
    hashing = true;
    let candidate: Buffer;
    try {
      candidate = await new Promise<Buffer>((res, rej) =>
        scryptCallback(
          input.password,
          salt!,
          64,
          { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
          (err, key) => (err ? rej(err) : res(key)),
        ),
      );
    } finally {
      hashing = false;
    }
    if (!timingSafeEqual(candidate, passwordHash))
      throw new ApiError(401, "La contraseña no coincide. Probá de nuevo.");
    attempts.delete(ip);
    const old = tokenOf(req);
    if (old) db.prepare("DELETE FROM sessions WHERE token=?").run(hash(old));
    db.prepare("DELETE FROM sessions WHERE expires < ?").run(now);
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      hash(token),
      now + 7 * 86400_000,
      version,
    );
    res.setHeader(
      "Set-Cookie",
      stringifySetCookie({
        name: "rincon",
        value: token,
        httpOnly: true,
        sameSite: "strict",
        secure: Boolean(options.production),
        path: "/",
        maxAge: 7 * 86400,
      }),
    );
    res.json({ authenticated: true });
  });
  app.post("/api/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(hash(tokenOf(req)!));
    res.setHeader(
      "Set-Cookie",
      stringifySetCookie({
        name: "rincon",
        value: "",
        httpOnly: true,
        sameSite: "strict",
        secure: Boolean(options.production),
        path: "/",
        maxAge: 0,
      }),
    );
    res.status(204).end();
  });
  app.use("/api", auth);
  const getSettings = (): Settings => {
    const row = db
      .prepare("SELECT value FROM meta WHERE key='settings'")
      .get() as { value: string } | undefined;
    return row
      ? JSON.parse(row.value)
      : { names: "Ailu y Tomy", title: "Nuestro rincón", since: "" };
  };
  const mediaRows = () =>
    (
      db
        .prepare("SELECT * FROM media ORDER BY date DESC, createdAt DESC")
        .all() as unknown as MediaRow[]
    ).map(publicMedia);
  const noteRows = () =>
    (
      db
        .prepare("SELECT * FROM notes ORDER BY date DESC, createdAt DESC")
        .all() as unknown as NoteRow[]
    ).map(publicNote);
  app.get("/api/library", (_req, res) =>
    res.json({
      media: mediaRows(),
      notes: noteRows(),
      settings: getSettings(),
      storage: { used: used(), limit: maxStorage, maxFile },
    }),
  );
  app.get("/api/settings", (_req, res) => res.json(getSettings()));
  app.patch("/api/settings", (req, res) => {
    const settings = settingsInput.parse(req.body);
    db.prepare(
      "INSERT INTO meta VALUES ('settings',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ).run(JSON.stringify(settings));
    res.json(settings);
  });
  app.get("/api/media", (_req, res) => res.json(mediaRows()));
  const upload = multer({
    dest: tmpDir,
    limits: {
      fileSize: maxFile,
      files: 1,
      fields: 8,
      parts: 9,
      fieldSize: 4096,
    },
  }).single("file");
  app.post("/api/media", upload, async (req, res) => {
    if (!req.file) throw new ApiError(400, "Elegí un archivo.");
    const tempPath = req.file.path;
    let target = "",
      thumb = "";
    try {
      const input = mediaInput.parse({
        title:
          req.body.title ||
          req.file.originalname.replace(/\.[^.]+$/, "").slice(0, 150),
        date: req.body.date || today(),
        album: req.body.album || "",
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        artist: req.body.artist || "",
      });
      let detected;
      try {
        detected = await inspectFile(tempPath, req.file.originalname);
      } catch {
        throw new ApiError(
          400,
          "No pudimos leer ese formato. Usá una foto, video o audio compatible.",
        );
      }
      if (used() + req.file.size > maxStorage)
        throw new ApiError(
          413,
          "El espacio está lleno. Borrá algún archivo o ampliá el almacenamiento.",
        );
      const id = randomUUID(),
        filename = id + "." + detected.ext;
      if (detected.kind === "photo") {
        thumb = join(mediaDir, id + ".thumb.webp");
        try {
          await thumbnail(tempPath, mediaDir, id);
        } catch {
          throw new ApiError(
            400,
            "La imagen está dañada o es demasiado grande para procesarla.",
          );
        }
      }
      // Check again after asynchronous thumbnail generation; insert has no awaits.
      if (used() + req.file.size > maxStorage)
        throw new ApiError(413, "El espacio está lleno.");
      target = join(mediaDir, filename);
      renameSync(tempPath, target);
      db.prepare(
        "INSERT INTO media (id,kind,filename,mime,size,title,date,album,tags,artist,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        detected.kind,
        filename,
        detected.mime,
        req.file.size,
        input.title,
        input.date,
        input.album,
        JSON.stringify(input.tags),
        input.artist,
        new Date().toISOString(),
      );
      target = "";
      thumb = ""; // committed, retain files
      res
        .status(201)
        .json(
          publicMedia(
            db
              .prepare("SELECT * FROM media WHERE id=?")
              .get(id) as unknown as MediaRow,
          ),
        );
    } finally {
      for (const path of [tempPath, target, thumb])
        if (path && existsSync(path)) unlinkSync(path);
    }
  });
  const findMedia = (id: string) => {
    const row = db
      .prepare("SELECT * FROM media WHERE id=?")
      .get(id) as unknown as MediaRow | undefined;
    if (!row) throw new ApiError(404, "Este recuerdo ya no está.");
    return row;
  };
  app.patch("/api/media/:id", (req, res) => {
    const row = findMedia(String(req.params.id));
    const current = publicMedia(row);
    const { title, date, album, tags, favorite, artist } = current;
    const input = mediaInput.parse({
      title,
      date,
      album,
      tags,
      favorite,
      artist,
      ...req.body,
    });
    db.prepare(
      "UPDATE media SET title=?,date=?,album=?,tags=?,favorite=?,artist=? WHERE id=?",
    ).run(
      input.title,
      input.date,
      input.album,
      JSON.stringify(input.tags),
      Number(input.favorite),
      input.artist,
      row.id,
    );
    res.json(publicMedia(findMedia(row.id)));
  });
  app.delete("/api/media/:id", (req, res) => {
    const row = findMedia(String(req.params.id));
    for (const path of [
      join(mediaDir, row.filename),
      join(mediaDir, row.id + ".thumb.webp"),
    ])
      if (existsSync(path)) unlinkSync(path);
    db.prepare("DELETE FROM media WHERE id=?").run(row.id);
    res.status(204).end();
  });
  app.get("/api/files/:id", (req, res, next) => {
    const row = findMedia(String(req.params.id));
    const isThumb = req.query.thumb === "1" && row.kind === "photo";
    const path = join(
      mediaDir,
      isThumb ? row.id + ".thumb.webp" : row.filename,
    );
    if (!existsSync(path))
      throw new ApiError(
        404,
        "No encontramos el archivo. Revisá el respaldo del servidor.",
      );
    res.set("Content-Type", isThumb ? "image/webp" : row.mime);
    res.set("Content-Disposition", "inline");
    res.sendFile(path, { cacheControl: false }, (err) => {
      if (err && !res.headersSent) next(err);
    });
  });
  app.get("/api/notes", (_req, res) => res.json(noteRows()));
  const findNote = (id: string) => {
    const row = db
      .prepare("SELECT * FROM notes WHERE id=?")
      .get(id) as unknown as NoteRow | undefined;
    if (!row) throw new ApiError(404, "Este escrito ya no está.");
    return row;
  };
  app.post("/api/notes", (req, res) => {
    const input = noteInput.parse(req.body),
      id = randomUUID();
    db.prepare("INSERT INTO notes VALUES (?,?,?,?,?,?,?,?)").run(
      id,
      input.type,
      input.title,
      input.body,
      input.author,
      input.date,
      Number(input.favorite),
      new Date().toISOString(),
    );
    res.status(201).json(publicNote(findNote(id)));
  });
  app.patch("/api/notes/:id", (req, res) => {
    const row = findNote(String(req.params.id));
    const { type, title, body, author, date, favorite } = publicNote(row);
    const input = noteInput.parse({
      type,
      title,
      body,
      author,
      date,
      favorite,
      ...req.body,
    });
    db.prepare(
      "UPDATE notes SET type=?,title=?,body=?,author=?,date=?,favorite=? WHERE id=?",
    ).run(
      input.type,
      input.title,
      input.body,
      input.author,
      input.date,
      Number(input.favorite),
      row.id,
    );
    res.json(publicNote(findNote(row.id)));
  });
  app.delete("/api/notes/:id", (req, res) => {
    const row = findNote(String(req.params.id));
    db.prepare("DELETE FROM notes WHERE id=?").run(row.id);
    res.status(204).end();
  });
  app.use("/api", (_req, _res, next) =>
    next(new ApiError(404, "Ruta no encontrada.")),
  );
  const dist = resolve("dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) => res.sendFile(join(dist, "index.html")));
  }
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (res.headersSent) {
        _next(error);
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 416
      ) {
        res.status(416).json({ error: "Rango del archivo inválido." });
        return;
      }
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (error instanceof ZodError || error instanceof SyntaxError) {
        res
          .status(400)
          .json({
            error:
              "Revisá los campos: hay datos vacíos, inválidos o demasiado largos.",
          });
        return;
      }
      if (error instanceof multer.MulterError) {
        res
          .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
          .json({
            error:
              error.code === "LIMIT_FILE_SIZE"
                ? "El archivo supera el tamaño permitido."
                : "Subí un solo archivo por vez, con los campos indicados.",
          });
        return;
      }
      console.error(
        "Error de servidor:",
        error instanceof Error ? error.message : "unknown",
      );
      res
        .status(500)
        .json({ error: "No pudimos guardar el cambio. Intentá otra vez." });
    },
  );
  let closed = false;
  return {
    app,
    db,
    close: () => {
      if (!closed) {
        closed = true;
        db.close();
      }
    },
  };
}
