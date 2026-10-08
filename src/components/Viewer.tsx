import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Play,
  Pause,
  Pencil,
  Trash2,
  Expand,
} from "lucide-react";
import type { Media } from "../../shared/types";
import { formatDate, mediaUrl } from "../lib";
import { Dialog } from "./Dialog";
export function Viewer({
  items,
  initialId,
  onClose,
  onEdit,
  onDelete,
  onFavorite,
  inline = false,
  onOpen,
}: {
  items: Media[];
  initialId: string;
  onClose: () => void;
  onEdit: (i: Media) => void;
  onDelete: (i: Media) => void;
  onFavorite: (i: Media) => Promise<void>;
  inline?: boolean;
  onOpen?: (id: string) => void;
}) {
  const [index, setIndex] = useState(
      Math.max(
        0,
        items.findIndex((i) => i.id === initialId),
      ),
    ),
    [auto, setAuto] = useState(false),
    [hidden, setHidden] = useState(document.hidden),
    [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const touch = useRef<number | null>(null);
  const item = items[index % items.length];
  const step = (delta: number) => {
    setIndex((n) => (n + delta + items.length) % items.length);
    setFailed(false);
  };
  useEffect(() => {
    const listener = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", listener);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => {
      setReduced(mq.matches);
      if (mq.matches) setAuto(false);
    };
    mq.addEventListener("change", motion);
    return () => {
      document.removeEventListener("visibilitychange", listener);
      mq.removeEventListener("change", motion);
    };
  }, []);
  useEffect(() => {
    if (!auto || hidden || reduced || items.length < 2) return;
    const t = setInterval(() => {
      setIndex((n) => (n + 1) % items.length);
      setFailed(false);
    }, 5000);
    return () => clearInterval(t);
  }, [auto, hidden, reduced, items.length]);
  useEffect(() => {
    if (inline) return;
    const listener = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLVideoElement
      )
        return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex(
          (n) =>
            (n + (e.key === "ArrowRight" ? 1 : -1) + items.length) %
            items.length,
        );
        setFailed(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [inline, items.length]);
  if (!item) return null;
  const content = (
    <div className={"viewer " + (inline ? "inline-viewer" : "")}>
      <div
        className="viewer-stage"
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touch.current !== null) {
            const delta = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(delta) > 60) {
              step(delta < 0 ? 1 : -1);
              setAuto(false);
            }
          }
          touch.current = null;
        }}
      >
        {failed ? (
          <div className="media-failed">
            <p>No pudimos abrir este archivo.</p>
            <button
              className="button secondary"
              onClick={() => setFailed(false)}
            >
              Reintentar
            </button>
          </div>
        ) : item.kind === "photo" ? (
          <img
            key={item.id}
            src={mediaUrl(item.id, inline)}
            alt={item.title}
            onError={() => setFailed(true)}
          />
        ) : (
          <video
            key={item.id}
            src={mediaUrl(item.id)}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setAuto(false)}
            onError={() => setFailed(true)}
          />
        )}
        {items.length > 1 && (
          <>
            <button
              className="viewer-arrow previous"
              aria-label="Recuerdo anterior"
              onClick={() => {
                step(-1);
                setAuto(false);
              }}
            >
              <ChevronLeft />
            </button>
            <button
              className="viewer-arrow next"
              aria-label="Recuerdo siguiente"
              onClick={() => {
                step(1);
                setAuto(false);
              }}
            >
              <ChevronRight />
            </button>
          </>
        )}
        {inline && (
          <button
            className="viewer-expand"
            aria-label="Ampliar recuerdo"
            onClick={() => {
              setAuto(false);
              onOpen?.(item.id);
            }}
          >
            <Expand size={19} />
          </button>
        )}
        <span className="viewer-counter">
          {(index % items.length) + 1} / {items.length}
        </span>
      </div>
      <div className="viewer-info">
        <div>
          <h3>{item.title}</h3>
          <p>
            {formatDate(item.date, true)}
            {item.album && " · " + item.album}
          </p>
          {item.tags.length > 0 && (
            <div className="tags">
              {item.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="viewer-actions">
          <button
            className={"icon-button " + (item.favorite ? "is-favorite" : "")}
            aria-label="Favorito"
            aria-pressed={item.favorite}
            onClick={() => void onFavorite(item)}
          >
            <Heart size={20} fill={item.favorite ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-button"
            aria-label="Editar recuerdo"
            onClick={() => {
              setAuto(false);
              onEdit(item);
            }}
          >
            <Pencil size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Eliminar recuerdo"
            onClick={() => {
              setAuto(false);
              onDelete(item);
            }}
          >
            <Trash2 size={19} />
          </button>
        </div>
      </div>
      {items.length > 1 && (
        <div className="slideshow-bar">
          <span>
            {reduced
              ? "Movimiento reducido activado"
              : "Cada instante merece su tiempo"}
          </span>
          <button
            className="button secondary small"
            disabled={reduced}
            aria-pressed={auto}
            onClick={() => setAuto(!auto)}
          >
            {auto ? <Pause size={16} /> : <Play size={16} />}
            {auto ? "Pausar" : "Presentación"}
          </button>
        </div>
      )}
    </div>
  );
  return inline ? (
    content
  ) : (
    <Dialog title="Un momento nuestro" onClose={onClose} wide>
      {content}
    </Dialog>
  );
}
