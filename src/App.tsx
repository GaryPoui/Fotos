import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Heart,
  Images,
  Music2,
  Mail,
  Plus,
  Settings2,
  LogOut,
  Sparkles,
  LockKeyhole,
  ArrowRight,
  Cloud,
  LoaderCircle,
} from "lucide-react";
import type { Library, Media, Note, Settings } from "../shared/types";
import { api, bytes } from "./lib";
import { Gallery } from "./components/Gallery";
import { UploadDialog } from "./components/UploadDialog";
import { Music } from "./components/Music";
import { Player } from "./components/Player";
import { Notes } from "./components/Notes";
import { NoteDialog } from "./components/NoteDialog";
import { Dialog } from "./components/Dialog";
type Page = "memories" | "music" | "words";
export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [library, setLibrary] = useState<Library | null>(null);
  const [page, setPage] = useState<Page>("memories");
  const [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [uploadType, setUploadType] = useState<"memories" | "music" | null>(
    null,
  );
  const [noteEdit, setNoteEdit] = useState<Note | "new" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [playRequest, setPlayRequest] = useState(0);
  const refresh = useCallback(async () => {
    const data = await api<Library>("/library");
    setLibrary(data);
  }, []);
  const notify = (message: string) => {
    setToast(message);
  };
  useEffect(() => {
    api<{ authenticated: boolean }>("/session")
      .then((v) => setAuthenticated(v.authenticated))
      .catch((e) => {
        setError(e.message);
        setAuthenticated(false);
      });
  }, []);
  useEffect(() => {
    if (authenticated) refresh().catch((e) => setError(e.message));
  }, [authenticated, refresh]);
  useEffect(() => {
    const handler = () => {
      setAuthenticated(false);
      setLibrary(null);
      setSelectedTrack(null);
      setUploadType(null);
      setNoteEdit(null);
      setSettingsOpen(false);
      setError("La sesión terminó. Volvé a ingresar.");
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const changed = async (message: string) => {
    try {
      await refresh();
    } catch (e) {
      setError("El cambio se guardó, pero no pudimos actualizar la vista. Recargá la página cuando vuelva la conexión. " + (e as Error).message);
    }
    notify(message);
  };
  const tracks = library?.media.filter((m) => m.kind === "audio") || [];
  useEffect(() => {
    document.title = library?.settings.title || "Nuestro rincón";
  }, [library?.settings.title]);
  const onPlay = (track: Media) => {
    setSelectedTrack(track.id);
    setPlayRequest((n) => n + 1);
  };
  if (authenticated === null)
    return (
      <div className="loading-screen">
        <Heart className="brand-heart" />
        <p>Abriendo nuestro rincón…</p>
      </div>
    );
  if (!authenticated)
    return (
      <Login
        initialError={error}
        onLogin={() => {
          setError("");
          setAuthenticated(true);
        }}
      />
    );
  return (
    <div className={"app-shell " + (selectedTrack ? "has-player" : "")}>
      <header className="topbar">
        <a
          href="#recuerdos"
          className="brand"
          onClick={() => setPage("memories")}
        >
          <span className="brand-mark">
            <Heart size={20} />
          </span>
          <span>
            {library?.settings.title || "nuestro rincón"}
            <small>un poquito de nosotros</small>
          </span>
        </a>
        <div className="top-actions">
          <span className="private-label">
            <LockKeyhole size={13} /> Sólo nosotros
          </span>
          <button
            className="icon-button"
            aria-label="Personalizar nuestro rincón"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={async () => {
              try {
                await api("/logout", "POST");
                setAuthenticated(false);
                setLibrary(null);
                setSelectedTrack(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>
      <main id="contenido">
        {error && (
          <div role="alert" className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>Cerrar</button>
          </div>
        )}
        {!library ? (
          <div className="loading-screen">
            <LoaderCircle className="spin" />
            <p>Cargando nuestros recuerdos…</p>
            <button
              className="button secondary"
              onClick={() => refresh().catch((e) => setError(e.message))}
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <>
            <section className={"intro intro-" + page}>
              <div>
                <span className="eyebrow">
                  <Sparkles size={14} /> {library.settings.names}
                </span>
                <h1>
                  {page === "memories" ? (
                    <>
                      Los días pasan.
                      <br />
                      <em>Lo nuestro queda.</em>
                    </>
                  ) : page === "music" ? (
                    <>
                      Hay canciones
                      <br />
                      <em>que suenan a Ailu.</em>
                    </>
                  ) : (
                    <>
                      Lo que sentimos,
                      <br />
                      <em>en palabras.</em>
                    </>
                  )}
                </h1>
                <p>
                  {page === "memories"
                    ? "Fotos, pequeños instantes y todo eso que nos hace sonreír."
                    : page === "music"
                      ? "La banda sonora de nuestra historia. Dale play a un recuerdo."
                      : "Cartas para leer despacito y frases para guardar cerquita."}
                </p>
              </div>
              <div className="intro-art" aria-hidden="true">
                <div className="paper sky">
                  <Cloud />
                  <span>Ailu</span>
                </div>
                <div className="paper blush">
                  <Heart />
                  <span>Tomy</span>
                </div>
                <span className="art-spark">✧</span>
              </div>
            </section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {page === "memories"
                    ? "Nuestro pequeño álbum"
                    : page === "music"
                      ? "En repeat, con Ailu"
                      : "De Tomy, para Ailu"}
                </span>
                <h2>
                  {page === "memories"
                    ? "Nuestros momentos"
                    : page === "music"
                      ? "Nuestra música"
                      : "Frases y cartas"}{" "}
                  <span className="count">
                    {page === "memories"
                      ? library.media.filter((m) => m.kind !== "audio").length
                      : page === "music"
                        ? tracks.length
                        : library.notes.length}
                  </span>
                </h2>
              </div>
              <button
                className="button primary add-button"
                onClick={() =>
                  page === "words" ? setNoteEdit("new") : setUploadType(page)
                }
              >
                <Plus size={18} />
                <span>
                  {page === "words"
                    ? "Escribir"
                    : page === "music"
                      ? "Subir canción"
                      : "Subir recuerdos"}
                </span>
              </button>
            </div>
            {page === "memories" && (
              <Gallery
                items={library.media.filter((m) => m.kind !== "audio")}
                onUpload={() => setUploadType("memories")}
                onChanged={changed}
                onError={setError}
              />
            )}
            {page === "music" && (
              <Music
                tracks={tracks}
                selectedId={selectedTrack}
                onPlay={onPlay}
                onUpload={() => setUploadType("music")}
                onChanged={changed}
                onError={setError}
              />
            )}
            {page === "words" && (
              <Notes
                notes={library.notes}
                onNew={() => setNoteEdit("new")}
                onEdit={setNoteEdit}
                onChanged={changed}
                onError={setError}
              />
            )}
            <footer className="page-footer">
              <Heart size={12} />
              <span>
                {library.settings.since
                  ? "Juntos desde " +
                    new Date(
                      library.settings.since + "T12:00:00",
                    ).toLocaleDateString("es-AR")
                  : "Hecho de pequeños momentos, guardado con amor."}
              </span>
              <small>
                {bytes(library.storage.used)} de {bytes(library.storage.limit)}
              </small>
            </footer>
          </>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {(
          [
            { id: "memories", label: "Recuerdos", icon: Images },
            { id: "music", label: "Música", icon: Music2 },
            { id: "words", label: "Palabras", icon: Mail },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={page === id ? "page" : undefined}
            className={page === id ? "active" : ""}
            onClick={() => setPage(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <Player
        tracks={tracks}
        selectedId={selectedTrack}
        playRequest={playRequest}
        onSelect={setSelectedTrack}
      />
      {toast && (
        <div className="toast" role="status">
          <Heart size={16} />
          {toast}
        </div>
      )}
      {uploadType && library && (
        <UploadDialog
          type={uploadType}
          maxFile={library.storage.maxFile}
          onClose={() => setUploadType(null)}
          onChanged={changed}
          albums={[
            ...new Set(library.media.map((m) => m.album).filter(Boolean)),
          ]}
        />
      )}
      {noteEdit && (
        <NoteDialog
          note={noteEdit === "new" ? undefined : noteEdit}
          onClose={() => setNoteEdit(null)}
          onChanged={changed}
        />
      )}
      {settingsOpen && library && (
        <SettingsDialog
          settings={library.settings}
          onClose={() => setSettingsOpen(false)}
          onChanged={changed}
        />
      )}
    </div>
  );
}
function Login({
  initialError,
  onLogin,
}: {
  initialError: string;
  onLogin: () => void;
}) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/login", "POST", { password });
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-decoration" aria-hidden="true">
        <Cloud />
        <Heart />
      </div>
      <section className="login-card">
        <span className="brand-mark large">
          <Heart size={29} />
        </span>
        <span className="eyebrow">Un espacio sólo nuestro</span>
        <h1>
          Ailu, Tomy y<br />
          <em>todo lo vivido.</em>
        </h1>
        <p>
          Un rincón para volver a encontrarnos en nuestras fotos, canciones y
          palabras.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="password">Nuestra contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-describedby="password-hints"
            required
            value={password}
            maxLength={256}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="La llave de nuestros recuerdos"
          />
          <div className="password-hints" id="password-hints">
            <strong>Las pistas de nuestra llave</strong>
            <p>Escribila toda de corrido, en minúsculas y sin espacios.</p>
            <ol>
              <li>Los primeros dígitos son un número muy importante para los dos y de un pilotito que se parece un poquito a mí.</li>
              <li>La segunda palabra es el lugar donde nos conocimos y nos comimos.</li>
              <li>La tercera es mi forma favorita de llamarte, es de tu color favorito y, si mirás para arriba, lo ves.</li>
            </ol>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full-width" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={19} />
            ) : (
              <Heart size={18} />
            )}{" "}
            {busy ? "Abriendo…" : "Entrar a nuestro rincón"}{" "}
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>
        <small>
          <LockKeyhole size={13} /> Lo que hay acá, queda entre nosotros.
        </small>
      </section>
      <span className="login-bottom">
        nuestro rincón · hecho de Ailu y Tomy
      </span>
    </div>
  );
}
function SettingsDialog({
  settings,
  onClose,
  onChanged,
}: {
  settings: Settings;
  onClose: () => void;
  onChanged: (m: string) => Promise<void>;
}) {
  const [value, setValue] = useState(settings),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title="Nuestro toque personal" onClose={onClose} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/settings", "PATCH", value);
            await onChanged("Nuestro rincón, un poquito más nuestro.");
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nuestros nombres
          <input
            value={value.names}
            onChange={(e) => setValue({ ...value, names: e.target.value })}
            required
            maxLength={100}
          />
        </label>
        <label>
          Nombre del espacio
          <input
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
            required
            maxLength={80}
          />
        </label>
        <label>
          Juntos desde
          <input
            type="date"
            value={value.since}
            onChange={(e) => setValue({ ...value, since: e.target.value })}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={busy}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Dialog>
  );
}
