import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Coffee,
  Utensils,
  ShoppingBag,
  Compass,
  Heart,
  Trees,
  MapPin,
} from "lucide-react";
import type { Place, PlaceCandidate, PlaceCategory } from "../../shared/types";
import { placeCategories } from "../../shared/places";

export const placeIcons = {
  cafe: Coffee,
  restaurant: Utensils,
  shopping: ShoppingBag,
  visit: Compass,
  important: Heart,
  park: Trees,
  other: MapPin,
};
export function CategoryIcon({
  category,
  size = 18,
}: {
  category: PlaceCategory;
  size?: number;
}) {
  const Icon = placeIcons[category];
  return <Icon size={size} aria-hidden="true" />;
}
type Position = { lat: number; lng: number; accuracy: number };
export function PlaceCanvas({
  places,
  selectedId,
  candidate,
  position,
  viewRequest,
  picking,
  onPick,
  onSelect,
  onTileError,
}: {
  places: Place[];
  selectedId: string | null;
  candidate: PlaceCandidate | null;
  position: Position | null;
  viewRequest: {
    kind: "all" | "position" | "selected" | "candidate";
    nonce: number;
  };
  picking: boolean;
  onPick: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
  onTileError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const callbacks = useRef({ onPick, onSelect, onTileError, picking });
  callbacks.current = { onPick, onSelect, onTileError, picking };
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([-34.6037, -58.3816], 12);
    map.current = instance;
    layer.current = L.layerGroup().addTo(instance);
    L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    )
      .on("tileerror", () => callbacks.current.onTileError())
      .addTo(instance);
    instance.zoomControl.setPosition("topright");
    instance.zoomControl
      .getContainer()
      ?.querySelector(".leaflet-control-zoom-in")
      ?.setAttribute("aria-label", "Acercar mapa");
    instance.zoomControl
      .getContainer()
      ?.querySelector(".leaflet-control-zoom-out")
      ?.setAttribute("aria-label", "Alejar mapa");
    instance.on("click", (event: L.LeafletMouseEvent) => {
      if (callbacks.current.picking)
        callbacks.current.onPick(event.latlng.lat, event.latlng.lng);
    });
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    for (const place of places) {
      const category = placeCategories.find(
        (item) => item.id === place.category,
      )!;
      const element = document.createElement("span");
      element.className =
        "place-pin" + (place.id === selectedId ? " selected" : "");
      element.style.color = category.color;
      element.innerHTML = renderToStaticMarkup(
        <CategoryIcon category={place.category} size={20} />,
      );
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          html: element,
          className: "place-marker",
          iconSize: [44, 44],
          iconAnchor: [22, 40],
        }),
        title: place.name,
        keyboard: true,
      }).addTo(layer.current);
      const tooltip = document.createElement("span");
      tooltip.textContent = place.name + " · " + category.label;
      marker.bindTooltip(tooltip);
      const markerElement = marker.getElement();
      markerElement?.setAttribute(
        "aria-label",
        "Ver lugar: " + place.name + " · " + category.label,
      );
      markerElement?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          callbacks.current.onSelect(place.id);
        }
      });
      marker.on("click", () => callbacks.current.onSelect(place.id));
    }
    if (candidate) {
      const element = document.createElement("span");
      element.className = "place-pin candidate";
      element.innerHTML = renderToStaticMarkup(
        <MapPin size={20} aria-hidden="true" />,
      );
      L.marker([candidate.lat, candidate.lng], {
        icon: L.divIcon({
          html: element,
          className: "place-marker",
          iconSize: [44, 44],
          iconAnchor: [22, 40],
        }),
        keyboard: false,
      })
        .addTo(layer.current)
        .bindTooltip("Punto a guardar");
    }
    if (position) {
      L.circle([position.lat, position.lng], {
        radius: Math.min(position.accuracy, 5000),
        color: "#6197bb",
        fillOpacity: 0.1,
        weight: 1,
        interactive: false,
      }).addTo(layer.current);
      L.circleMarker([position.lat, position.lng], {
        radius: 8,
        color: "#fff",
        fillColor: "#287bbb",
        fillOpacity: 1,
        weight: 3,
      })
        .addTo(layer.current)
        .bindTooltip("Tu ubicación actual");
    }
  }, [places, selectedId, candidate, position]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const selected = places.find((item) => item.id === selectedId);
    const point =
      viewRequest.kind === "position"
        ? position
        : viewRequest.kind === "candidate"
          ? candidate
          : viewRequest.kind === "selected"
            ? selected
            : null;
    if (point) instance.setView([point.lat, point.lng], 16, { animate: false });
    else if (viewRequest.kind === "all" && places.length)
      instance.fitBounds(
        L.latLngBounds(
          places.map((item) => [item.lat, item.lng] as [number, number]),
        ),
        { padding: [38, 38], maxZoom: 16, animate: false },
      );
    // Only explicit view requests recenter; editing/filtering doesn't interrupt map navigation.
  }, [viewRequest]);
  return (
    <div
      ref={container}
      className={"places-canvas" + (picking ? " picking" : "")}
      role="region"
      aria-label="Mapa de nuestros lugares"
    />
  );
}
