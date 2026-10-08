import { useState } from "react";
import { Heart, LoaderCircle, Mail, Quote } from "lucide-react";
import type { Note } from "../../shared/types";
import { api, today } from "../lib";
import { Dialog } from "./Dialog";
export function NoteDialog({
  note,
  onClose,
  onChanged,
}: {
  note?: Note;
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
}) {
  const [type, setType] = useState<"quote" | "letter">(note?.type || "letter"),
    [title, setTitle] = useState(note?.title || ""),
    [body, setBody] = useState(note?.body || ""),
    [author, setAuthor] = useState(note?.author || ""),
    [date, setDate] = useState(note?.date || today()),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={note ? "Volver a nuestras palabras" : "Dejá un pedacito de vos"}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api(
              note ? "/notes/" + note.id : "/notes",
              note ? "PATCH" : "POST",
              { type, title, body, author, date },
            );
            await onChanged(
              note
                ? "Palabras actualizadas."
                : "Tus palabras ya tienen su lugar.",
            );
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="note-type-switch">
          <button
            className={type === "letter" ? "active" : ""}
            type="button"
            onClick={() => setType("letter")}
          >
            <Mail size={18} /> Una carta
          </button>
          <button
            className={type === "quote" ? "active" : ""}
            type="button"
            onClick={() => setType("quote")}
          >
            <Quote size={18} /> Una frase
          </button>
        </div>
        <label>
          Título
          <input
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Por todas las veces que…"
          />
        </label>
        <label>
          {type === "letter" ? "Tu carta" : "Tu frase"}
          <textarea
            aria-label={type === "letter" ? "Tu carta" : "Tu frase"}
            required
            maxLength={30000}
            rows={type === "letter" ? 8 : 4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              type === "letter"
                ? "A veces me faltan palabras, pero hoy quiero decirte…"
                : "Eso que siempre nos decimos…"
            }
          />
          <small>
            {body.length.toLocaleString("es-AR")} / 30.000 caracteres
          </small>
        </label>
        <div className="form-row">
          <label>
            De parte de
            <input
              maxLength={100}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={busy}>
          {busy ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <Heart size={18} />
          )}
          {busy ? "Guardando…" : "Guardar estas palabras"}
        </button>
      </form>
    </Dialog>
  );
}
