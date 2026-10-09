import {
  Heart,
  Sparkles,
  CalendarHeart,
  ArrowUpRight,
  ImagePlus,
} from "lucide-react";
import type { Media, Settings } from "../../shared/types";
import { mediaUrl, formatDate } from "../lib";
import { daysTogether } from "../moments";
export function MemoryHome({
  items,
  settings,
  today,
  onOpen,
  onPersonalize,
}: {
  items: Media[];
  settings: Settings;
  today: string;
  onOpen: (id: string) => void;
  onPersonalize: () => void;
}) {
  const photos = items.filter((i) => i.kind === "photo");
  const cover =
    photos.find((i) => i.id === settings.coverId) ||
    photos.find((i) => i.favorite) ||
    photos[0];
  const featured =
    items.find((i) => i.id === settings.featuredId) ||
    items.find((i) => i.favorite) ||
    items[0];
  const days = daysTogether(settings.since, today);
  return (
    <section className="memory-home" aria-label="Nuestra historia">
      <div className="home-intro">
        <span className="eyebrow">
          <Sparkles size={14} />
          {settings.names}
        </span>
        <h1>
          Los días pasan.
          <br />
          <em>Lo nuestro queda.</em>
        </h1>
        <p>Un lugar para volver a todo eso que nos hace sonreír.</p>
        {days !== null ? (
          <div
            className="days-together"
            aria-label={days.toLocaleString("es-AR") + " días juntos"}
          >
            <CalendarHeart size={22} />
            <div>
              <strong>{days.toLocaleString("es-AR")} días juntos</strong>
              <small>Y tantos momentos por venir.</small>
            </div>
          </div>
        ) : (
          <button className="button secondary" onClick={onPersonalize}>
            <CalendarHeart size={18} />
            ¿Desde cuándo empieza lo nuestro?
          </button>
        )}
      </div>
      {cover ? (
        <button
          className="home-cover"
          aria-label="Ver nuestra foto de portada"
          onClick={() => onOpen(cover.id)}
        >
          <img src={mediaUrl(cover.id, true)} alt={cover.title} />
          <span className="cover-caption">
            <Heart size={16} />
            <span>
              Nuestra foto, nuestra historia<small>{cover.title}</small>
            </span>
          </span>
        </button>
      ) : (
        <button className="home-cover home-cover-empty" onClick={onPersonalize}>
          <ImagePlus size={34} />
          <span>
            Un lugar para nuestra foto favorita
            <small>Elegí una foto del álbum para la portada.</small>
          </span>
        </button>
      )}
      {featured && (
        <button
          className="featured-memory"
          aria-label={"Revivir " + featured.title}
          onClick={() => onOpen(featured.id)}
        >
          {featured.kind === "photo" ? (
            <img src={mediaUrl(featured.id, true)} alt="" />
          ) : (
            <span className="featured-symbol">
              <Heart />
            </span>
          )}
          <span>
            <small>UN RECUERDO PARA VOLVER</small>
            <strong>{featured.title}</strong>
            <span>{formatDate(featured.date)}</span>
          </span>
          <ArrowUpRight size={20} />
        </button>
      )}
    </section>
  );
}
