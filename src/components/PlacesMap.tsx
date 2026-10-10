import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  MapPin,
  Plus,
  LocateFixed,
  Expand,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  LoaderCircle,
} from "lucide-react";
import { api } from "../lib";
import type { Place, PlaceCandidate, PlaceCategory } from "../../shared/types";
import { mapsLink, placeCategories } from "../../shared/places";
import { CategoryIcon, PlaceCanvas } from "./PlaceCanvas";

export default function PlacesMap({
  places,
  onChanged,
}: {
  places: Place[];
  onChanged: (message: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<PlaceCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Place | "new" | null>(null);
  const [candidate, setCandidate] = useState<PlaceCandidate | null>(null);
  const [name, setName] = useState(""),
    [address, setAddress] = useState(""),
    [category, setCategory] = useState<PlaceCategory>("cafe"),
    [note, setNote] = useState("");
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [searchMessage, setSearchMessage] = useState("");
  const [tileError, setTileError] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false);
  const [position, setPosition] = useState<{
      lat: number;
      lng: number;
      accuracy: number;
    } | null>(null),
    [locating, setLocating] = useState(false),
    [locationMessage, setLocationMessage] = useState("");
  const [viewRequest, setViewRequest] = useState<{
    kind: "all" | "position" | "selected" | "candidate";
    nonce: number;
  }>({ kind: "all", nonce: 0 });
  const mounted = useRef(true),
    searchGeneration = useRef(0),
    locationGeneration = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      searchGeneration.current++;
      locationGeneration.current++;
    };
  }, []);
  const visible = places.filter(
    (place) => filter === "all" || place.category === filter,
  );
  const selected = places.find((place) => place.id === selectedId);
  const view = (kind: typeof viewRequest.kind) =>
    setViewRequest((previous) => ({ kind, nonce: previous.nonce + 1 }));
  const closeEditor = () => {
    searchGeneration.current++;
    setSearching(false);
    setEditing(null);
    setCandidate(null);
    setResults([]);
    setQuery("");
    setError("");
    setSearchMessage("");
  };
  const start = (place: Place | "new") => {
    closeEditor();
    setEditing(place);
    setName(place === "new" ? "" : place.name);
    setAddress(place === "new" ? "" : place.address);
    setCategory(place === "new" ? "cafe" : place.category);
    setNote(place === "new" ? "" : place.note);
    setCandidate(place === "new" ? null : place);
    setDeleteConfirm(false);
    if (place !== "new") view("candidate");
  };
  const choose = (point: PlaceCandidate) => {
    setCandidate(point);
    setAddress(point.address);
    if (!name || name === candidate?.name) setName(point.name);
    setResults([]);
    setSearchMessage(
      point.approximate
        ? "El enlace muestra un punto aproximado. Revisalo y corregilo tocando el mapa."
        : "Punto elegido. Podés ajustarlo tocando el mapa antes de guardar.",
    );
    view("candidate");
  };
  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (searching) return;
    const generation = ++searchGeneration.current;
    setSearching(true);
    setError("");
    setSearchMessage("");
    setResults([]);
    try {
      const response = await api<{ results: PlaceCandidate[] }>(
        "/places/resolve",
        "POST",
        { query },
      );
      if (!mounted.current || generation !== searchGeneration.current) return;
      setResults(response.results);
      setSearchMessage(
        response.results.length
          ? "Elegí el resultado que corresponde y revisá el punto."
          : "No encontramos resultados. Probá con calle, número y ciudad, o elegí el punto tocando el mapa.",
      );
    } catch (error) {
      if (mounted.current && generation === searchGeneration.current)
        setError((error as Error).message);
    } finally {
      if (mounted.current && generation === searchGeneration.current)
        setSearching(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!candidate || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = {
        name,
        address,
        category,
        note,
        lat: candidate.lat,
        lng: candidate.lng,
      };
      await api(
        editing === "new" ? "/places" : "/places/" + (editing as Place).id,
        editing === "new" ? "POST" : "PATCH",
        body,
      );
      if (mounted.current) {
        closeEditor();
        setFilter("all");
      }
      await onChanged("Lugar guardado en nuestro mapa");
      if (mounted.current) view("all");
    } catch (error) {
      if (mounted.current) setError((error as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const remove = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/places/" + selected.id, "DELETE");
      if (mounted.current) {
        setSelectedId(null);
        setDeleteConfirm(false);
      }
      await onChanged("Lugar quitado del mapa");
    } catch (error) {
      if (mounted.current) setError((error as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const locate = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      setLocationMessage(
        "Este navegador no permite ver la ubicación. Podés seguir usando el mapa.",
      );
      return;
    }
    const generation = ++locationGeneration.current;
    setLocating(true);
    setLocationMessage("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (!mounted.current || generation !== locationGeneration.current)
          return;
        setPosition({
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        setLocating(false);
        setLocationMessage(
          "Tu ubicación es temporal y no se guarda. Precisión aproximada: " +
            Math.round(result.coords.accuracy) +
            " m.",
        );
        view("position");
      },
      (error) => {
        if (!mounted.current || generation !== locationGeneration.current)
          return;
        setLocating(false);
        setLocationMessage(
          error.code === 1
            ? "No se permitió la ubicación. Podés habilitarla en tu navegador o seguir buscando lugares."
            : "No pudimos obtener tu ubicación. Volvé a intentar cuando tengas señal.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };
  const select = (id: string) => {
    setSelectedId(id);
    setDeleteConfirm(false);
    setError("");
    view("selected");
  };
  const canvas = (
    <PlaceCanvas
      places={visible}
      selectedId={selectedId}
      candidate={candidate}
      position={position}
      viewRequest={viewRequest}
      picking={!!editing && !busy}
      onPick={(lat, lng) => {
        setCandidate({ name: name || "Lugar elegido", address, lat, lng });
        setSearchMessage(
          "Punto ajustado en el mapa. Revisá los datos antes de guardar.",
        );
      }}
      onSelect={select}
      onTileError={() => setTileError(true)}
    />
  );
  return (
    <section className="places-page">
      <header className="places-heading">
        <div>
          <span className="eyebrow">
            <MapPin size={14} /> Lugares de nuestra historia
          </span>
          <h1>
            Nuestro <em>mapa.</em>
          </h1>
          <p>Las salidas que guardamos y los planes que nos esperan.</p>
        </div>
        <button
          className="button primary"
          onClick={() => start("new")}
          disabled={busy}
        >
          <Plus size={18} /> Agregar lugar
        </button>
      </header>
      <div className="places-tools">
        <button
          className="button secondary"
          onClick={locate}
          disabled={locating}
        >
          {locating ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <LocateFixed size={17} />
          )}{" "}
          Mi ubicación
        </button>
        <button className="button secondary" onClick={() => view("all")}>
          <Expand size={17} /> Ver todos
        </button>
      </div>
      {locationMessage && (
        <p className="places-message" role="status">
          {locationMessage}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {editing && (
        <section
          className="place-editor"
          aria-label={
            editing === "new"
              ? "Agregar lugar al mapa"
              : "Editar lugar del mapa"
          }
        >
          <div className="place-editor-heading">
            <h2>
              {editing === "new" ? "Un nuevo lugar" : "Editar este lugar"}
            </h2>
            <button
              className="icon-button"
              aria-label="Cerrar editor de lugar"
              onClick={closeEditor}
              disabled={busy}
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={search} className="place-search">
            <label htmlFor="place-search">
              Dirección o enlace de Google Maps
            </label>
            <div>
              <input
                id="place-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Calle, número y ciudad, o enlace de Maps"
                minLength={3}
                maxLength={2048}
                required
                disabled={busy}
              />
              <button className="button secondary" disabled={searching || busy}>
                {searching ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <Search size={18} />
                )}{" "}
                Buscar
              </button>
            </div>
            <small>
              Buscá una dirección o elegí el punto tocando el mapa. Búsqueda:
              Photon.
            </small>
          </form>
          {searchMessage && (
            <p className="places-message" role="status">
              {searchMessage}
            </p>
          )}
          {results.length > 0 && (
            <ul className="place-search-results">
              {results.map((point, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => choose(point)}
                    disabled={busy}
                  >
                    <MapPin size={18} />
                    <span>
                      <strong>{point.name}</strong>
                      <small>
                        {point.address ||
                          point.lat.toFixed(5) + ", " + point.lng.toFixed(5)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="map-pick-hint">
            Tocá el mapa para elegir o ajustar el punto.
          </p>
          {canvas}
          <form onSubmit={save} className="place-fields">
            <label>
              Nombre del lugar
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                disabled={busy}
              />
            </label>
            <label>
              Categoría
              <select
                aria-label="Categoría"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PlaceCategory)
                }
                disabled={busy}
              >
                {placeCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="place-wide">
              Dirección guardada
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={400}
                disabled={busy}
              />
            </label>
            <label className="place-wide">
              Nota sobre este lugar
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Lo que hace especial a este lugar…"
                disabled={busy}
              />
            </label>
            <p className="place-wide places-message">
              {candidate
                ? "Punto a guardar: " +
                  candidate.lat.toFixed(5) +
                  ", " +
                  candidate.lng.toFixed(5)
                : "Falta elegir un resultado o tocar el mapa para marcar el lugar."}
            </p>
            <div className="place-wide place-actions">
              <button
                className="button secondary"
                type="button"
                onClick={closeEditor}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                className="button primary"
                disabled={!candidate || busy || searching}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <MapPin size={17} />
                )}{" "}
                Guardar lugar
              </button>
            </div>
          </form>
        </section>
      )}
      <div
        className="place-filters"
        role="group"
        aria-label="Filtrar lugares por categoría"
      >
        <button
          aria-pressed={filter === "all"}
          onClick={() => {
            setFilter("all");
            setSelectedId(null);
          }}
        >
          Todos <span>{places.length}</span>
        </button>
        {placeCategories.map((item) => (
          <button
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => {
              setFilter(item.id);
              setSelectedId(null);
              setDeleteConfirm(false);
            }}
          >
            <CategoryIcon category={item.id} />
            {item.label}
          </button>
        ))}
      </div>
      {tileError && (
        <p className="places-message" role="status">
          No pudimos cargar una parte del mapa. Revisá la conexión; tus lugares
          siguen disponibles en la lista.
        </p>
      )}
      {!editing && canvas}
      {selected && !editing && (
        <section className="place-detail" aria-label="Detalle del lugar">
          <div className="place-detail-heading">
            <CategoryIcon category={selected.category} size={22} />
            <div>
              <h2>{selected.name}</h2>
              <small>
                {
                  placeCategories.find((item) => item.id === selected.category)
                    ?.label
                }
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar detalle del lugar"
              onClick={() => {
                setSelectedId(null);
                setDeleteConfirm(false);
              }}
            >
              <X size={18} />
            </button>
          </div>
          {selected.address && <p>{selected.address}</p>}
          {selected.note && <p className="place-note">{selected.note}</p>}
          <div className="place-actions">
            <a
              className="button secondary"
              href={mapsLink(selected.lat, selected.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={17} /> Abrir en Maps
            </a>
            <button
              className="button secondary"
              onClick={() => start(selected)}
              disabled={busy}
            >
              <Pencil size={17} /> Editar lugar
            </button>
            <button
              className="icon-button"
              aria-label="Quitar lugar"
              onClick={() => setDeleteConfirm(true)}
              disabled={busy}
            >
              <Trash2 size={18} />
            </button>
          </div>
          {deleteConfirm && (
            <div
              className="place-delete"
              role="group"
              aria-label="Confirmar quitar lugar"
            >
              <p>¿Quitar “{selected.name}” del mapa?</p>
              <div className="place-actions">
                <button
                  className="button secondary"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={busy}
                >
                  Conservar lugar
                </button>
                <button
                  className="button danger"
                  onClick={remove}
                  disabled={busy}
                >
                  Confirmar quitar
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <div className="places-list-heading">
        <h2>
          Nuestros lugares <span className="count">{visible.length}</span>
        </h2>
        <small>Elegí uno para verlo en el mapa.</small>
      </div>
      {visible.length ? (
        <ul className="places-list">
          {visible.map((place) => (
            <li key={place.id}>
              <button
                onClick={() => select(place.id)}
                aria-label={"Ver en mapa: " + place.name}
                aria-pressed={selectedId === place.id}
              >
                <span
                  className="place-list-icon"
                  style={{
                    color: placeCategories.find(
                      (item) => item.id === place.category,
                    )?.color,
                  }}
                >
                  <CategoryIcon category={place.category} size={22} />
                </span>
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {
                      placeCategories.find((item) => item.id === place.category)
                        ?.label
                    }
                    {place.address ? " · " + place.address : ""}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="places-empty">
          <MapPin size={30} />
          <h3>
            {places.length
              ? "Todavía no hay lugares en esta categoría"
              : "Nuestra historia también tiene lugares"}
          </h3>
          <p>
            Guardemos ese café, nuestra primera salida o el próximo lugar al que
            queremos ir.
          </p>
          <button className="button secondary" onClick={() => start("new")}>
            Agregar nuestro primer lugar
          </button>
        </div>
      )}
    </section>
  );
}
