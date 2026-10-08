import { useState } from "react";
import { Music2, Play, Trash2, Disc3, Search, Pencil } from "lucide-react";
import type { Media } from "../../shared/types";
import { api } from "../lib";
import { Confirm, Dialog } from "./Dialog";
export function Music({
  tracks,
  selectedId,
  onPlay,
  onUpload,
  onChanged,
  onError,
}: {
  tracks: Media[];
  selectedId: string | null;
  onPlay: (m: Media) => void;
  onUpload: () => void;
  onChanged: (m: string) => Promise<void>;
  onError: (e: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [deleting, setDeleting] = useState<Media | null>(null),
    [editing, setEditing] = useState<Media | null>(null);
  const filtered = tracks.filter((t) =>
    (t.title + " " + t.artist).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="music-banner">
        <div className="record" aria-hidden="true">
          <span>
            <HeartShape />
          </span>
        </div>
        <div>
          <span className="eyebrow">Nuestra banda sonora</span>
          <h3>
            Algunas canciones
            <br />
            son un abrazo.
          </h3>
          <p>La música acompaña a Ailu y Tomy en nuestro rincón.</p>
        </div>
      </div>
      {!!tracks.length && (
        <div className="searchbox">
          <Search size={18} />
          <input
            aria-label="Buscar canciones"
            placeholder="Buscar canción o artista…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      {!tracks.length ? (
        <div className="empty-state compact">
          <Music2 size={35} />
          <h3>¿Cuál es nuestra canción?</h3>
          <p>Subí un audio para empezar nuestra playlist.</p>
          <button className="button secondary" onClick={onUpload}>
            Agregar la primera canción
          </button>
          <small>MP3, WAV, OGG o M4A · sin reproducción automática</small>
        </div>
      ) : (
        <div className="track-list">
          {filtered.map((track, i) => (
            <article
              className={
                "track-row " + (selectedId === track.id ? "current" : "")
              }
              key={track.id}
            >
              <span className="track-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <button
                className="track-play"
                aria-label={"Reproducir " + track.title}
                onClick={() => onPlay(track)}
              >
                {selectedId === track.id ? (
                  <Disc3 size={22} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <div className="track-details">
                <h3>{track.title}</h3>
                <p>{track.artist || "Una canción nuestra"}</p>
              </div>
              <button
                className="icon-button"
                aria-label={"Editar canción " + track.title}
                onClick={() => setEditing(track)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={"Eliminar canción " + track.title}
                onClick={() => setDeleting(track)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
          {!filtered.length && (
            <p className="muted">No hay canciones con ese nombre.</p>
          )}
        </div>
      )}
      {deleting && (
        <Confirm
          title="¿Eliminar esta canción?"
          body={
            "Se eliminará “" +
            deleting.title +
            "” de nuestra playlist y del servidor."
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api("/media/" + deleting.id, "DELETE");
              setDeleting(null);
              await onChanged("Canción eliminada.");
            } catch (e) {
              onError((e as Error).message);
            }
          }}
        />
      )}
      {editing && (
        <TrackEdit
          track={editing}
          onClose={() => setEditing(null)}
          onChanged={onChanged}
        />
      )}
    </>
  );
}
function HeartShape() {
  return <span>♡</span>;
}
function TrackEdit({
  track,
  onClose,
  onChanged,
}: {
  track: Media;
  onClose: () => void;
  onChanged: (m: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(track.title),
    [artist, setArtist] = useState(track.artist),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog title="Nuestra canción" onClose={onClose} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/media/" + track.id, "PATCH", { title, artist });
            await onChanged("Canción actualizada.");
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Título
          <input
            value={title}
            maxLength={150}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Artista
          <input
            value={artist}
            maxLength={100}
            onChange={(e) => setArtist(e.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={busy}>
          Guardar canción
        </button>
      </form>
    </Dialog>
  );
}
