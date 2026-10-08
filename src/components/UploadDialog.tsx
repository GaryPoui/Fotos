import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  UploadCloud,
  Check,
  X,
  FileImage,
  Music2,
  LoaderCircle,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { bytes, today, upload } from "../lib";
import { prepareImage } from "../prepare-image";
import { cloudEnabled } from "../cloud/config";
import { loadDraft, saveDraft, type UploadItem as Item } from "../upload-queue";
export function UploadDialog({
  type,
  maxFile,
  albums,
  onClose,
  onChanged,
}: {
  type: "memories" | "music";
  maxFile: number;
  albums: string[];
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [title, setTitle] = useState(""),
    [date, setDate] = useState(today()),
    [album, setAlbum] = useState(""),
    [tags, setTags] = useState(""),
    [artist, setArtist] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false),
    [restored, setRestored] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const draft = (list = items) => ({
    type,
    items: list,
    title,
    date,
    album,
    tags,
    artist,
  });
  const signature = items
    .map((i) => [i.id, i.file.name, i.file.size, i.status === "done"].join(":"))
    .join("|");
  useEffect(() => {
    let active = true;
    loadDraft(type)
      .then((value) => {
        if (!active) return;
        if (value?.items.length) {
          setItems(value.items);
          setTitle(value.title);
          setDate(value.date);
          setAlbum(value.album);
          setTags(value.tags);
          setArtist(value.artist);
          setRestored(true);
        }
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setError(
            "Este navegador no permite conservar la tanda. Mantené esta ventana abierta hasta terminar.",
          );
          setReady(true);
        }
      });
    return () => {
      active = false;
      controller.current?.abort();
    };
  }, [type]);
  useEffect(() => {
    if (ready)
      void saveDraft(draft()).catch(() =>
        setError(
          "No pudimos conservar la tanda en este dispositivo. Mantené la ventana abierta hasta terminar.",
        ),
      );
  }, [ready, signature, title, date, album, tags, artist]);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener("online", changed);
    window.addEventListener("offline", changed);
    return () => {
      window.removeEventListener("online", changed);
      window.removeEventListener("offline", changed);
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const addFiles = (files: FileList | null) => {
    if (!files || busy) return;
    const added = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: file.size > maxFile ? ("error" as const) : ("pending" as const),
      progress: 0,
      error: file.size > maxFile ? "Supera " + bytes(maxFile) : undefined,
    }));
    setItems((old) => [...old, ...added].slice(0, 20));
    if (items.length + added.length > 20)
      setError("Podés subir hasta 20 archivos por tanda.");
  };
  const change = (index: number, patch: Partial<Item>) =>
    setItems((old) =>
      old.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      setError("Primero elegí al menos un archivo.");
      return;
    }
    setBusy(true);
    controller.current = new AbortController();
    setError("");
    let succeeded = 0,
      failed = 0;
    const tagList = [
      ...new Set(
        tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (tagList.length > 10 || tagList.some((t) => t.length > 30)) {
      setError("Usá hasta 10 etiquetas de 30 caracteres.");
      setBusy(false);
      return;
    }
    const remaining = [...items];
    let paused = false;
    const run = async () => {
      for (let i = 0; i < items.length; i++) {
        if (controller.current?.signal.aborted) {
          paused = true;
          break;
        }
        if (items[i].status === "done") continue;
        if (items[i].file.size > maxFile) {
          failed++;
          continue;
        }
        change(i, { status: "uploading", error: undefined, progress: 0 });
        try {
          change(i, { status: "preparing" });
          const prepared =
            type === "memories"
              ? await prepareImage(items[i].file, maxFile, (message) =>
                  change(i, { error: message }),
                )
              : items[i].file;
          remaining[i] = { ...remaining[i], file: prepared };
          change(i, { file: prepared, status: "uploading", error: undefined });
          await saveDraft(draft(remaining)).catch(() => {});
          await upload(
            prepared,
            {
              title:
                items.length === 1 && title.trim()
                  ? title.trim()
                  : items[i].file.name.replace(/\.[^.]+$/, "").slice(0, 150),
              date,
              album,
              tags: JSON.stringify(tagList),
              artist,
            },
            (n) => change(i, { progress: n }),
            { id: items[i].id, signal: controller.current!.signal },
          );
          change(i, { status: "done", progress: 100 });
          remaining[i] = { ...remaining[i], status: "done" };
          await saveDraft(draft(remaining)).catch(() => {});
          succeeded++;
        } catch (e) {
          const aborted = (e as Error).name === "AbortError";
          change(i, {
            status: "error",
            error: aborted
              ? "Subida pausada. Podés retomarla."
              : (e as Error).message,
          });
          failed++;
          if (aborted) {
            paused = true;
            break;
          }
        }
      }
    };
    try {
      if (navigator.locks)
        await navigator.locks.request(
          "rincon-upload-" + type,
          { ifAvailable: true },
          async (lock) => {
            if (!lock)
              throw new Error(
                "Hay una tanda subiendo en otra pestaña. Retomala desde allí.",
              );
            await run();
          },
        );
      else await run();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      return;
    }
    if (succeeded) {
      try {
        await onChanged(
          succeeded === 1
            ? "Un recuerdo más para nosotros."
            : succeeded + " archivos guardados con amor.",
        );
      } catch (e) {
        setError((e as Error).message);
        failed++;
      }
    }
    setBusy(false);
    if (!failed && !paused) onClose();
    else
      setError(
        (paused ? "Tanda pausada. " : "") +
          "Algunos archivos no se guardaron. Los que tienen ✓ ya están seguros; podés reintentar los demás.",
      );
  };
  return (
    <Dialog
      title={
        type === "music" ? "Una canción para nosotros" : "Guardar un momento"
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {restored && (
          <p role="status">
            Recuperamos tu tanda pendiente. Podés retomarla sin volver a elegir
            los archivos.
          </p>
        )}
        {!online && (
          <p role="status" className="form-error">
            Sin conexión. Tu tanda espera acá; retomá cuando vuelva internet.
          </p>
        )}
        <p className="form-help">
          Los pendientes se conservan temporalmente en este dispositivo. Al
          terminar o cerrar sesión se borran de aquí.
        </p>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <UploadCloud size={32} />
          <strong>
            {type === "music"
              ? "Nuestra próxima canción favorita"
              : "Los recuerdos empiezan acá"}
          </strong>
          <p>Elegí archivos o arrastralos hasta acá.</p>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            Elegir {type === "music" ? "canciones" : "fotos y videos"}
          </button>
          <input
            ref={input}
            type="file"
            aria-label={
              type === "music" ? "Archivos de música" : "Fotos y videos"
            }
            className="sr-only"
            multiple
            accept={
              type === "music"
                ? ".mp3,.wav,.ogg,.opus,.m4a"
                : ".jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,.mp4,.webm"
            }
            disabled={busy}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <small>Hasta {bytes(maxFile)} por archivo · 20 por tanda</small>
          {type === "memories" && (
            <small>
              HEIC de iPhone: se convierte a JPEG acá, sin enviarlo a otros
              sitios. Conservá el original; se guarda el JPEG. HEIC hasta 20 MB
              y 32 megapíxeles.
            </small>
          )}
        </div>
        {items.length > 0 && (
          <ul className="upload-list">
            {items.map((item, i) => (
              <li key={i} className={item.status}>
                <span className="file-icon">
                  {item.status === "done" ? (
                    <Check size={18} />
                  ) : type === "music" ? (
                    <Music2 size={18} />
                  ) : (
                    <FileImage size={18} />
                  )}
                </span>
                <div>
                  <strong>{item.file.name}</strong>
                  <small>
                    {item.error ||
                      (item.status === "preparing"
                        ? "Preparando foto…"
                        : item.status === "uploading"
                          ? item.progress === 100
                            ? "Procesando…"
                            : item.progress + "%"
                          : item.status === "done"
                            ? "Guardado"
                            : bytes(item.file.size))}
                  </small>
                  {item.status === "uploading" && (
                    <progress
                      value={item.progress}
                      max={100}
                      aria-label={"Subiendo " + item.file.name}
                    />
                  )}
                </div>
                {!busy && item.status !== "done" && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={"Quitar " + item.file.name}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        if (cloudEnabled)
                          await (
                            await import("../cloud/client")
                          ).cloudDiscard(item.file, item.id);
                        const next = items.filter((_, j) => j !== i);
                        await saveDraft(draft(next));
                        setItems(next);
                      } catch (e) {
                        setError(
                          "No pudimos quitar el pendiente. " +
                            (e as Error).message,
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <X size={17} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {items.length === 1 && (
          <label>
            Título
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="Un nombre para este momento"
              disabled={busy}
            />
          </label>
        )}
        {type === "memories" ? (
          <>
            <div className="form-row">
              <label>
                Fecha del recuerdo
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                Álbum
                <input
                  aria-label="Álbum"
                  list="albums"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  maxLength={80}
                  placeholder="Por ejemplo, Viajes"
                  disabled={busy}
                />
                <span className="album-suggestions">
                  {["Viajes", "Salidas", "Aniversarios"].map((name) => (
                    <button
                      key={name}
                      className="album-suggestion"
                      type="button"
                      disabled={busy}
                      onClick={() => setAlbum(name)}
                    >
                      {name}
                    </button>
                  ))}
                </span>
                <datalist id="albums">
                  {albums.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>
            </div>
            <label>
              Etiquetas
              <input
                aria-label="Etiquetas"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="playa, vacaciones, juntos"
                disabled={busy}
              />
              <small>Separadas por comas.</small>
            </label>
          </>
        ) : (
          <label>
            Artista
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={100}
              placeholder="¿Quién la canta?"
              disabled={busy}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="button primary full-width"
          disabled={busy || !ready || !online || !items.length}
        >
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <UploadCloud size={18} />
          )}
          {busy ? "Guardando nuestros recuerdos…" : "Guardar en nuestro rincón"}
        </button>
        {busy && (
          <button
            type="button"
            className="button secondary full-width"
            onClick={() => controller.current?.abort()}
          >
            Pausar subida
          </button>
        )}
      </form>
    </Dialog>
  );
}
