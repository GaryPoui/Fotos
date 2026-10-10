import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarHeart, ArrowRight, Images, Play, Heart, ChevronLeft, ChevronRight, Pencil,
} from "lucide-react";
import type { Media, AlbumCustomization } from "../../shared/types";
import { albumTitle, albumCover } from "../../shared/albums";
import { cloudEnabled } from "../cloud/config";
import { mediaUrl, formatDate } from "../lib";
import { albumGroups, onThisDay } from "../moments";
export function Revisit({
  items,
  today,
  album,
  onAlbum,
  onOpen,
  onDay,
  preferences = [],
  onEditAlbum,
}: {
  items: Media[];
  today: string;
  album: string;
  onAlbum: (name: string) => void;
  onOpen: (id: string) => void;
  onDay: () => void;
  preferences?: AlbumCustomization[];
  onEditAlbum: (name: string) => void;
}) {
  const memories = onThisDay(items, today),
    albums = albumGroups(items);
  const albumStrip = useRef<HTMLDivElement>(null);
  const albumStripId = useId();
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const updateAlbumEdges = () => {
    const strip = albumStrip.current;
    if (!strip) return;
    setCanPrevious(strip.scrollLeft > 1);
    setCanNext(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
  };
  useEffect(() => {
    const strip = albumStrip.current;
    if (!strip) return;
    updateAlbumEdges();
    const observer = new ResizeObserver(updateAlbumEdges);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [albums.length]);
  const moveAlbums = (direction: number) => {
    const strip = albumStrip.current;
    if (!strip || !strip.firstElementChild) return;
    const step =
      strip.firstElementChild.getBoundingClientRect().width +
      parseFloat(getComputedStyle(strip).columnGap);
    const visible = Math.max(1, Math.floor(strip.clientWidth / step));
    strip.scrollBy({
      left: direction * step * visible,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant" : "smooth",
    });
  };
  return (
    <div className="revisit">
      <section className="on-this-day" aria-label="Un día como hoy">
        <div className="revisit-heading">
          <div>
            <span className="eyebrow">
              <CalendarHeart size={15} />
              Volver a sentirlo
            </span>
            <h3>Un día como hoy</h3>
          </div>
          <span className="calendar-stamp">
            {new Date(today + "T12:00:00").toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        {memories.length ? (
          <>
            <div className="day-memories">
              {memories.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  aria-label={"Volver a " + item.title}
                  onClick={() => onOpen(item.id)}
                >
                  {item.kind === "photo" ? (
                    <img src={mediaUrl(item.id, true)} alt="" loading="lazy" />
                  ) : (
                    <span className="day-symbol">
                      <Play size={24} />
                    </span>
                  )}
                  <span>
                    <strong>{item.title}</strong>
                    <small>{formatDate(item.date)}</small>
                  </span>
                </button>
              ))}
            </div>
            <button className="button secondary" onClick={onDay}>
              Ver todos los recuerdos de este día <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <p className="form-help">
            Todavía no hay recuerdos de otros años en esta fecha. Cuando llegue
            su día, van a volver a encontrarnos acá.
          </p>
        )}
      </section>
      {albums.length > 0 && (
        <section aria-label="Nuestros álbumes">
          <div className="revisit-heading">
            <div>
              <span className="eyebrow">
                <Images size={15} />
                Historias para recorrer
              </span>
              <h3>Nuestros álbumes</h3>
            </div>
            <div className="album-navigation" aria-label="Recorrer álbumes">
              <button
                className="icon-button" aria-label="Álbumes anteriores"
                aria-controls={albumStripId} disabled={!canPrevious}
                onClick={() => moveAlbums(-1)}
              ><ChevronLeft size={20} /></button>
              <button
                className="icon-button" aria-label="Álbumes siguientes"
                aria-controls={albumStripId} disabled={!canNext}
                onClick={() => moveAlbums(1)}
              ><ChevronRight size={20} /></button>
            </div>
          </div>
          <div
            className="album-cards" id={albumStripId} ref={albumStrip}
            onScroll={updateAlbumEdges}
          >
            {albums.map((group) => {
              const cover = albumCover(group.name, group.media, preferences);
              const title = albumTitle(group.name, preferences);
              return (
                <article key={group.name} className="album-card">
                <button
                  className="album-open"
                  aria-label={"Ver álbum " + title}
                  aria-pressed={album === group.name}
                  onClick={() =>
                    onAlbum(album === group.name ? "" : group.name)
                  }
                >
                  {cover ? (
                    <img src={mediaUrl(cover.id, true)} alt="" loading="lazy" />
                  ) : (
                    <span className="album-symbol">
                      <Heart size={28} />
                    </span>
                  )}
                  <span>
                    <strong>{title}</strong>
                    <small>
                      {group.media.length}{" "}
                      {group.media.length === 1 ? "momento" : "momentos"}
                    </small>
                  </span>
                </button>
                {!cloudEnabled && <button className="album-edit" aria-label={"Editar álbum " + title} onClick={() => onEditAlbum(group.name)}><Pencil size={15} /><span>Editar</span></button>}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
