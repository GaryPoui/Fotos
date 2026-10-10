import { useState } from "react";
import { Check, Image } from "lucide-react";
import type { AlbumCustomization, Media } from "../../shared/types";
import { albumTitle } from "../../shared/albums";
import { api, mediaUrl } from "../lib";
import { Dialog } from "./Dialog";
export function AlbumDialog({
  album,
  items,
  preferences,
  onClose,
  onChanged,
}: {
  album: string;
  items: Media[];
  preferences: AlbumCustomization[];
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
}) {
  const photos = items.filter(
    (item) => item.album === album && item.kind === "photo",
  );
  const savedCover = preferences.find(
    (entry) => entry.album === album,
  )?.coverId;
  const [title, setTitle] = useState(albumTitle(album, preferences));
  const [coverId, setCoverId] = useState(
    photos.some((photo) => photo.id === savedCover) ? savedCover || "" : "",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const preview = photos.find((photo) => photo.id === coverId) || photos[0];
  return (
    <Dialog title="Editar álbum" onClose={onClose} busy={busy}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setBusy(true);
          try {
            await api("/albums", "PATCH", {
              album,
              title,
              coverId: coverId || null,
            });
            onClose();
            await onChanged("Álbum actualizado.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="album-preview">
          {preview ? (
            <img
              src={mediaUrl(preview.id, true)}
              alt="Vista previa de la portada"
            />
          ) : (
            <Image size={36} aria-hidden="true" />
          )}
          <strong>{title.trim() || "Nuestro álbum"}</strong>
          <small>
            {items.filter((item) => item.album === album).length} recuerdos
          </small>
        </div>
        <label>
          Nombre del álbum
          <input
            required
            maxLength={80}
            value={title}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <fieldset className="album-cover-picker" disabled={busy}>
          <legend>Foto de portada</legend>
          <label className="album-cover-auto">
            <input
              type="radio"
              name="album-cover"
              value=""
              checked={!coverId}
              onChange={() => setCoverId("")}
            />
            Portada automática
          </label>
          {photos.length ? (
            <div className="album-cover-options">
              {photos.map((photo) => (
                <label
                  key={photo.id}
                  className={coverId === photo.id ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="album-cover"
                    aria-label={"Usar como portada: " + photo.title}
                    checked={coverId === photo.id}
                    onChange={() => setCoverId(photo.id)}
                  />
                  <img src={mediaUrl(photo.id, true)} alt="" loading="lazy" />
                  <span>{photo.title}</span>
                  {coverId === photo.id && (
                    <Check
                      className="cover-check"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="form-help">
              Este álbum todavía no tiene fotos. Subí una para elegirla como
              portada.
            </p>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar álbum"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
