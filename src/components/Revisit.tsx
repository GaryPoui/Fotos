import { CalendarHeart, ArrowRight, Images, Play, Heart } from "lucide-react";
import type { Media } from "../../shared/types";
import { mediaUrl, formatDate } from "../lib";
import { albumGroups, onThisDay } from "../moments";
export function Revisit({
  items,
  today,
  album,
  onAlbum,
  onOpen,
  onDay,
}: {
  items: Media[];
  today: string;
  album: string;
  onAlbum: (name: string) => void;
  onOpen: (id: string) => void;
  onDay: () => void;
}) {
  const memories = onThisDay(items, today),
    albums = albumGroups(items);
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
          </div>
          <div className="album-cards">
            {albums.map((group) => {
              const cover = group.media.find((i) => i.kind === "photo");
              return (
                <button
                  key={group.name}
                  aria-label={"Ver álbum " + group.name}
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
                    <strong>{group.name}</strong>
                    <small>
                      {group.media.length}{" "}
                      {group.media.length === 1 ? "momento" : "momentos"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
