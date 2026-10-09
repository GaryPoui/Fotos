import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Media } from "../../shared/types";
import { mediaUrl } from "../lib";

export function Coverflow({ items, index, onSelect, onOpen, onPlay }: {
  items: Media[];
  index: number;
  onSelect: (offset: number) => void;
  onOpen: (id: string) => void;
  onPlay: () => void;
}) {
  return (
    <div className="coverflow-track">
      {items.map((item, position) => {
        let offset = (position - index + items.length) % items.length;
        if (offset > items.length / 2) offset -= items.length;
        if (Math.abs(offset) > 3) return null;
        return <CoverflowCard key={item.id} item={item} offset={offset}
          onSelect={() => onSelect(offset)} onOpen={() => onOpen(item.id)} onPlay={onPlay} />;
      })}
    </div>
  );
}

function CoverflowCard({ item, offset, onSelect, onOpen, onPlay }: {
  item: Media;
  offset: number;
  onSelect: () => void;
  onOpen: () => void;
  onPlay: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const active = offset === 0;
  const hidden = Math.abs(offset) > 2;
  useEffect(() => {
    if (!active) video.current?.pause();
  }, [active]);
  return (
    <div className={"coverflow-card" + (active ? " is-active" : "")}
      data-side={offset < 0 ? "left" : offset > 0 ? "right" : "center"}
      aria-hidden={hidden || undefined}
      style={{ "--offset": offset, "--depth": Math.abs(offset), "--tilt": offset === 0 ? 0 : offset < 0 ? 30 : -30,
        zIndex: 5 - Math.abs(offset), opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : undefined } as CSSProperties}>
      {failed ? (
        <div className="media-failed">
          <p>No pudimos abrir este archivo.</p>
          <button className="button secondary" tabIndex={active ? 0 : -1} onClick={() => setFailed(false)}>Reintentar</button>
        </div>
      ) : item.kind === "photo" ? (
        <img src={mediaUrl(item.id, true)} alt={active ? item.title : ""} draggable={false}
          onError={() => setFailed(true)} />
      ) : (
        <video ref={video} src={mediaUrl(item.id)} controls={active} tabIndex={active ? 0 : -1}
          playsInline preload="metadata" onPlay={onPlay} onError={() => setFailed(true)} />
      )}
      {!failed && (item.kind === "photo" || !active) && (
        <button className="coverflow-select" tabIndex={hidden ? -1 : 0}
          aria-label={(active ? "Ver " : "Ir a ") + item.title}
          onClick={active ? onOpen : onSelect} />
      )}
      <span className="coverflow-shade" aria-hidden="true" />
    </div>
  );
}
